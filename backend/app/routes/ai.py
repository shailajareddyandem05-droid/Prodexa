import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List

from app.config.groq_client import groq
from app.config.firebase import db
from app.middleware.auth import get_current_user

try:
    from duckduckgo_search import DDGS
except ImportError:
    DDGS = None

router = APIRouter()

SYSTEM_PROMPTS = {
    "standard": (
        "You are Pai, a premium AI productivity assistant (ChatGPT style). "
        "Be concise, helpful, and highly clear and readable. "
        "Use bullet points when listing items. Structure your answers in clean Markdown."
    ),
    "research": (
        "You are a meticulous Research AI (Perplexity style). "
        "Provide highly structured, factual, and analytical answers. "
        "IMPORTANT: You will be provided with live web search results. "
        "You MUST read them and use them to construct your answer. "
        "You MUST explicitly cite the sources provided using markdown links or [1], [2] annotations. "
        "Format everything beautifully using tables and lists where applicable."
    ),
    "creative": (
        "You are an inspiring, warm, and highly visual Creative AI (Gemini style). "
        "Feel free to use creative language, encouraging tone, and emojis. "
        "Propose out-of-the-box ideas and format your responses with engaging sections and bullet points."
    )
}


# ── Models ──────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = None
    chatId: Optional[str] = None
    mode: Optional[str] = "standard"
    save: Optional[bool] = True


class SummarizeRequest(BaseModel):
    notes: List[dict]


class GenerateTaskRequest(BaseModel):
    prompt: str


class EmailActionsRequest(BaseModel):
    action: str
    emailBody: str
    emailSubject: Optional[str] = "No subject"
    emailSender: Optional[str] = "someone"


class NoteActionRequest(BaseModel):
    action: str  # "expand", "summarize", "fix_grammar", "auto_tag", "auto_title"
    content: str


# ── Background Tasks ──

def _generate_title_async(uid: str, chat_id: str, first_message: str):
    """Generate a 3-4 word title for the chat using Groq."""
    try:
        completion = groq.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a title generator. Respond with EXACTLY a 3-5 word title for the following message. No formatting, no quotes. Just the raw words."},
                {"role": "user", "content": first_message},
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.4,
            max_tokens=20,
        )
        title = completion.choices[0].message.content.strip().replace('"', '')
        db.collection("users").document(uid).collection("ai_chats").document(chat_id).update({"title": title})
    except Exception as e:
        print(f"Title generation failed: {e}")


# ── Routes ──────────────────────────────────────────────

@router.get("/chats")
async def get_chats(user: dict = Depends(get_current_user)):
    """GET /api/ai/chats — Get chat history metadata."""
    chats_ref = db.collection("users").document(user["uid"]).collection("ai_chats").order_by("updatedAt", direction="DESCENDING")
    docs = chats_ref.stream()
    chats = []
    for doc in docs:
        data = doc.to_dict()
        chats.append({
            "id": doc.id,
            "title": data.get("title", "New Chat"),
            "mode": data.get("mode", "standard"),
            "updatedAt": data.get("updatedAt"),
            # Exclude full messages to keep payload small
        })
    return {"chats": chats}


@router.get("/chats/{chat_id}")
async def get_chat(chat_id: str, user: dict = Depends(get_current_user)):
    """GET /api/ai/chats/:id — Get a full chat thread."""
    doc = db.collection("users").document(user["uid"]).collection("ai_chats").document(chat_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Chat not found")
    data = doc.to_dict()
    data["id"] = doc.id
    return data


@router.delete("/chats/{chat_id}")
async def delete_chat(chat_id: str, user: dict = Depends(get_current_user)):
    """DELETE /api/ai/chats/:id — Delete a chat."""
    db.collection("users").document(user["uid"]).collection("ai_chats").document(chat_id).delete()
    return {"success": True}


@router.post("/chat")
async def ai_chat(body: ChatRequest, background_tasks: BackgroundTasks, user: dict = Depends(get_current_user)):
    """POST /api/ai/chat — Pai chatbot with modes and history."""
    mode = body.mode if body.mode in SYSTEM_PROMPTS else "standard"
    sys_prompt = SYSTEM_PROMPTS[mode]
    messages = [{"role": "system", "content": sys_prompt}]

    now = datetime.now(timezone.utc).isoformat()
    uid = user["uid"]
    chats_ref = db.collection("users").document(uid).collection("ai_chats")

    # Load existing history if chatId provided
    chat_doc = None
    existing_messages = []
    if body.chatId:
        chat_doc = chats_ref.document(body.chatId).get()
        if chat_doc.exists:
            existing_messages = chat_doc.to_dict().get("messages", [])
            for msg in existing_messages:
                # pass full history to AI
                messages.append({"role": "assistant" if msg["role"] == "ai" else "user", "content": msg["content"]})
    elif body.history:
        for msg in body.history:
            role = "assistant" if msg.role == "ai" else "user"
            messages.append({"role": role, "content": msg.content})

    messages.append({"role": "user", "content": body.message})

    # Optional: Research Mode (DuckDuckGo Search)
    if mode == "research" and DDGS:
        try:
            results = DDGS().text(body.message, max_results=3)
            if results:
                sources_text = "\n".join([f"Source: {r.get('title')} ({r.get('href')})\nSnippet: {r.get('body')}" for r in results])
                messages.append({
                    "role": "system", 
                    "content": f"Here are live search results to use for your answer. Base your answer heavily on these and cite them:\n{sources_text}"
                })
        except Exception as e:
            print(f"DDGS Search Error: {e}")

    # Generate response
    try:
        completion = groq.chat.completions.create(
            messages=messages,
            model="llama-3.3-70b-versatile",
            temperature=0.7 if mode == "creative" else 0.4,
            max_tokens=1500,
        )
        ai_response = completion.choices[0].message.content or "I could not generate a response."
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

    # Save to Firestore
    if getattr(body, 'save', True):
        new_user_msg = {"role": "user", "content": body.message, "timestamp": now}
        new_ai_msg = {"role": "ai", "content": ai_response, "timestamp": datetime.now(timezone.utc).isoformat()}
        
        if body.chatId and chat_doc and chat_doc.exists:
            chat_id = body.chatId
            chats_ref.document(chat_id).update({
                "updatedAt": now,
                "messages": existing_messages + [new_user_msg, new_ai_msg]
            })
        else:
            # Create new chat
            _, new_doc = chats_ref.add({
                "title": "New Chat",
                "mode": mode,
                "createdAt": now,
                "updatedAt": now,
                "messages": body.history_dicts + [new_user_msg, new_ai_msg] if getattr(body, 'history_dicts', None) else [new_user_msg, new_ai_msg]
            })
            chat_id = new_doc.id
            background_tasks.add_task(_generate_title_async, uid, chat_id, body.message)
    else:
        chat_id = body.chatId or "ephemeral"

    return {"response": ai_response, "chatId": chat_id}


@router.post("/summarize")
async def ai_summarize(body: SummarizeRequest, user: dict = Depends(get_current_user)):
    """POST /api/ai/summarize — Summarize notes."""
    if not body.notes:
        raise HTTPException(status_code=400, detail="Notes array is required")

    notes_text = "\n".join(f"- {n.get('title', '')}: {n.get('content', '')}" for n in body.notes)

    try:
        completion = groq.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a note summarization assistant. Provide a concise, structured summary of the given notes. Include key points, action items, and themes.",
                },
                {
                    "role": "user",
                    "content": f"Please summarize these notes:\n\n{notes_text}",
                },
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.3,
            max_tokens=512,
        )
        summary = completion.choices[0].message.content or "Could not generate summary."
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")


@router.post("/generate-task")
async def ai_generate_task(body: GenerateTaskRequest, user: dict = Depends(get_current_user)):
    """POST /api/ai/generate-task — Generate task from prompt."""
    try:
        completion = groq.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": (
                        'You are a task generation assistant. Given a user\'s description, generate a structured task.\n'
                        'Respond in JSON format with fields: title (string), due (string like "Today", "Tomorrow", or a date), '
                        'priority ("high", "medium", or "low").\n'
                        "Return ONLY valid JSON, no markdown or extra text."
                    ),
                },
                {"role": "user", "content": body.prompt},
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.5,
            max_tokens=256,
        )
        content = completion.choices[0].message.content or "{}"

        try:
            cleaned = content.replace("```json\n", "").replace("```\n", "").replace("```", "").strip()
            task = json.loads(cleaned)
            return {
                "title": task.get("title", body.prompt),
                "due": task.get("due", "Tomorrow"),
                "priority": task.get("priority", "medium"),
                "source": "ai",
            }
        except json.JSONDecodeError:
            return {
                "title": body.prompt,
                "due": "Tomorrow",
                "priority": "medium",
                "source": "ai",
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")


@router.post("/email-actions")
async def ai_email_actions(body: EmailActionsRequest, user: dict = Depends(get_current_user)):
    """POST /api/ai/email-actions — Draft reply, extract tasks, summarize email."""
    action_map = {
        "draft-reply": {
            "system": "You are an email assistant. Draft a professional, concise reply to the given email. Keep it friendly and to the point.",
            "user": f"Draft a reply to this email from {body.emailSender}:\nSubject: {body.emailSubject}\n\n{body.emailBody}",
        },
        "extract-tasks": {
            "system": (
                "You are a task extraction assistant. Extract actionable tasks from the given email. "
                "Return ONLY a valid JSON array of objects with fields: "
                "title (string - a short actionable task title), "
                "due (string - 'Today', 'Tomorrow', or a date like '2026-03-28'), "
                "priority ('high', 'medium', or 'low'). "
                "If no actionable tasks exist, return an empty array []. "
                "Return ONLY valid JSON, no markdown, no extra text."
            ),
            "user": f"Extract tasks from this email:\nSubject: {body.emailSubject}\n\n{body.emailBody}",
        },
        "summarize": {
            "system": "You are an email summarization assistant. Provide a brief 2-3 sentence summary of the email.",
            "user": f"Summarize this email:\nSubject: {body.emailSubject}\n\n{body.emailBody}",
        },
        "add-to-calendar": {
            "system": "You are a calendar assistant. Extract any dates, times, or meetings mentioned in the email. Return them as structured events.",
            "user": f"Extract calendar events from this email:\nSubject: {body.emailSubject}\n\n{body.emailBody}",
        },
    }

    if body.action not in action_map:
        raise HTTPException(
            status_code=400,
            detail="Invalid action. Use: draft-reply, extract-tasks, summarize, add-to-calendar",
        )

    prompts = action_map[body.action]

    try:
        completion = groq.chat.completions.create(
            messages=[
                {"role": "system", "content": prompts["system"]},
                {"role": "user", "content": prompts["user"]},
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.5,
            max_tokens=512,
        )
        result = completion.choices[0].message.content or "Could not process email."

        # For extract-tasks, parse the JSON response
        if body.action == "extract-tasks":
            try:
                cleaned = result.replace("```json\n", "").replace("```\n", "").replace("```", "").strip()
                tasks = json.loads(cleaned)
                if isinstance(tasks, list):
                    return {"action": body.action, "tasks": tasks}
            except json.JSONDecodeError:
                pass
            return {"action": body.action, "tasks": [], "result": result}

        return {"action": body.action, "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")


@router.post("/note-actions")
async def ai_note_actions(body: NoteActionRequest, user: dict = Depends(get_current_user)):
    """POST /api/ai/note-actions — Perform inline AI modifications on notes."""
    action = body.action
    content = body.content

    if not content:
        raise HTTPException(status_code=400, detail="Content is required")

    system_prompts = {
        "expand": "You are a creative writer. Expand upon the following text, adding relevant details, examples, and depth. Keep the original intent intact. Reply ONLY with the expanded text.",
        "summarize": "You are a precise editor. Summarize the following text into key bullet points and high-level takeaways. Reply ONLY with the summary.",
        "fix_grammar": "You are an expert copy editor. Fix any grammatical, spelling, and phrasing errors in the following text to make it professional and clear. Do not change the underlying meaning, and maintain the original tone. Reply ONLY with the corrected text.",
        "auto_tag": "You are an organizer. Suggest exactly ONE concise category or tag (max 2 words) for the following text. Reply ONLY with the tag name, no quotes.",
        "auto_title": "You are a title generator. Generate a catchy, 3 to 5 word title for the following text. Reply ONLY with the title string, no quotes."
    }

    sys_prompt = system_prompts.get(action)
    if not sys_prompt:
        raise HTTPException(status_code=400, detail="Invalid action")

    try:
        completion = groq.chat.completions.create(
            messages=[
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": f"Text to process: \n\n{content}"}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.7 if action in ["expand", "auto_title"] else 0.3,
            max_tokens=2000,
        )
        result = completion.choices[0].message.content.strip()
        
        # Clean up quotes if groq accidentally includes them for title/tag
        if action in ["auto_tag", "auto_title"] and result.startswith('"') and result.endswith('"'):
            result = result[1:-1]
            
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")


class MagicTasksRequest(BaseModel):
    prompt: str


class BreakdownTaskRequest(BaseModel):
    parentTitle: str


@router.post("/magic-tasks")
async def ai_magic_tasks(body: MagicTasksRequest, user: dict = Depends(get_current_user)):
    """POST /api/ai/magic-tasks — Generate multiple tasks from a natural language prompt."""
    sys_prompt = (
        "You are an intelligent task manager. Analyze the user's prompt and extract a list of tasks. "
        "Calculate dates relative to 'Today'. "
        "Respond ONLY with a valid JSON array of objects. "
        "Each object must have exactly these keys: "
        "'title' (string, concise actionable label), "
        "'due' (string, e.g. 'Today', 'Tomorrow', 'Monday', 'Mar 15', or 'No date'), "
        "'priority' (string, exact value 'high', 'medium', or 'low')."
    )

    try:
        completion = groq.chat.completions.create(
            messages=[
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": body.prompt}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.3,
            max_tokens=2000,
        )
        result = completion.choices[0].message.content.strip()
        cleaned = result.replace("```json\n", "").replace("```\n", "").replace("```", "").strip()
        tasks = json.loads(cleaned)
        if not isinstance(tasks, list):
            tasks = [tasks]
        return {"tasks": tasks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI parsing error: {str(e)}")


@router.post("/breakdown-task")
async def ai_breakdown_task(body: BreakdownTaskRequest, user: dict = Depends(get_current_user)):
    """POST /api/ai/breakdown-task — Break down a large task into smaller subtasks."""
    sys_prompt = (
        "You are an expert project manager. Break down the user's complex overarching task into 3-5 bite-sized, actionable subtasks. "
        "Respond ONLY with a valid JSON array of objects. "
        "Each object must have: "
        "'title' (string, concise actionable label starting with a verb), "
        "'due' (string, 'Today', 'Tomorrow', or 'No date'), "
        "'priority' (string, 'high', 'medium', or 'low')."
    )

    try:
        completion = groq.chat.completions.create(
            messages=[
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": f"Task to break down: {body.parentTitle}"}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.5,
            max_tokens=2000,
        )
        result = completion.choices[0].message.content.strip()
        cleaned = result.replace("```json\n", "").replace("```\n", "").replace("```", "").strip()
        tasks = json.loads(cleaned)
        if not isinstance(tasks, list):
            tasks = [tasks]
        return {"tasks": tasks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI breakdown error: {str(e)}")


class DumpOrganizeRequest(BaseModel):
    text: str


class HandleLaterPlanRequest(BaseModel):
    items: List[dict]


@router.post("/dump/organize")
async def ai_dump_organize(body: DumpOrganizeRequest, user: dict = Depends(get_current_user)):
    """POST /api/ai/dump/organize — Organize brain dump text into structured items."""
    sys_prompt = (
        "You are an expert personal productivity assistant. Parse the user's chaotic brain dump text into individual items. "
        "For each distinct thought, task, or idea, extract it and categorize it as exactly one of: 'task', 'idea', or 'note'. "
        "Return ONLY a valid JSON array of objects, with each object having keys: 'text' (string, the extracted item capitalised cleanly) and 'type' (string, 'task', 'idea', or 'note')."
    )

    try:
        completion = groq.chat.completions.create(
            messages=[
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": body.text}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.3,
            max_tokens=2000,
        )
        result = completion.choices[0].message.content.strip()
        cleaned = result.replace("```json\n", "").replace("```\n", "").replace("```", "").strip()
        items = json.loads(cleaned)
        if not isinstance(items, list):
             items = [items]
        return {"items": items}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI brain dump error: {str(e)}")


@router.post("/handle-later/plan")
async def ai_handle_later_plan(body: HandleLaterPlanRequest, user: dict = Depends(get_current_user)):
    """POST /api/ai/handle-later/plan — Auto-schedule a list of parked items."""
    sys_prompt = (
        "You are an AI calendar assistant. I will provide a JSON array of 'parked' items. "
        f"Today's date is {datetime.now(timezone.utc).isoformat()[:10]}. "
        "Analyze the urgency of each item's 'text' and 'note', and return the array with a new 'scheduledFor' key added to each object. "
        "The 'scheduledFor' value MUST be a strict YYYY-MM-DD string date. Prioritize logically (urgent administrative tasks next 1-3 days, ideas/someday next 1-2 weeks). "
        "Return ONLY the valid JSON array of objects."
    )

    try:
        completion = groq.chat.completions.create(
            messages=[
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": json.dumps(body.items)}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.4,
            max_tokens=3000,
        )
        result = completion.choices[0].message.content.strip()
        cleaned = result.replace("```json\n", "").replace("```\n", "").replace("```", "").strip()
        planned_items = json.loads(cleaned)
        if not isinstance(planned_items, list):
             planned_items = [planned_items]
        return {"items": planned_items}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI auto-pilot error: {str(e)}")

class HabitBreakdownRequest(BaseModel):
    goal: str

class HabitInsightsRequest(BaseModel):
    habitData: List[dict]

@router.post("/habits/breakdown")
async def ai_habits_breakdown(body: HabitBreakdownRequest, user: dict = Depends(get_current_user)):
    """POST /api/ai/habits/breakdown — AI breakdown of a broad goal into habits."""
    sys_prompt = (
        "You are an elite behavior architect. The user will give you a broad goal. "
        "Break it down into 3-5 specific, atomic, daily habits they should track. "
        "Return ONLY a valid JSON array of strings, where each string is a concise habit name (max 5 words). "
        "Example output: [\"Drink 2L of water\", \"Do 50 pushups\", \"Read 10 pages\"]"
    )

    try:
        completion = groq.chat.completions.create(
            messages=[
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": body.goal}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.5,
            max_tokens=1000,
        )
        result = completion.choices[0].message.content.strip()
        cleaned = result.replace("```json\n", "").replace("```\n", "").replace("```", "").strip()
        habits = json.loads(cleaned)
        if not isinstance(habits, list):
             habits = [habits]
        return {"habits": habits}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI habit breakdown error: {str(e)}")


@router.post("/habits/insights")
async def ai_habits_insights(body: HabitInsightsRequest, user: dict = Depends(get_current_user)):
    """POST /api/ai/habits/insights — AI performance review of habit streaks."""
    sys_prompt = (
        "You are an analytical, slightly tough-love AI Habit Coach. "
        "The user is tracking habits. I will provide their habit data as a JSON array (names + history map). "
        f"Today is {datetime.now(timezone.utc).isoformat()[:10]}. "
        "Analyze their streaks, identify what they are doing well, and explicitly call out what they are neglecting. "
        "Provide a 2-3 sentence personalized, highly motivational performance review. "
        "Return ONLY a valid JSON object with the key 'insight' containing your string."
    )

    try:
        completion = groq.chat.completions.create(
            messages=[
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": json.dumps(body.habitData)}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.4,
            max_tokens=2000,
        )
        result = completion.choices[0].message.content.strip()
        cleaned = result.replace("```json\n", "").replace("```\n", "").replace("```", "").strip()
        insight_obj = json.loads(cleaned)
        return {"insight": insight_obj.get("insight", "Keep tracking your habits to get personalized insights!")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI habit insights error: {str(e)}")

class ExpenseParseRequest(BaseModel):
    text: str

class ExpenseInsightsRequest(BaseModel):
    expenseData: List[dict]

@router.post("/expenses/parse")
async def ai_expense_parse(body: ExpenseParseRequest, user: dict = Depends(get_current_user)):
    """POST /api/ai/expenses/parse — AI smart parser for natural language expense logs."""
    sys_prompt = (
        "You are an expert financial receipt parser. The user will type a natural language sentence describing a purchase. "
        "Extract the exact amount, a concise 2-4 word name for the expense, and map it to exactly ONE of these categories: "
        "'Food', 'Transport', 'Books', 'Entertainment', 'Groceries', 'Rent', 'Utilities', or 'Other'. "
        "Return ONLY a valid JSON object with the keys: 'name' (string), 'amount' (number), 'category' (string). "
        "If you cannot determine an amount, return amount as 0."
    )

    try:
        completion = groq.chat.completions.create(
            messages=[
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": body.text}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.3,
            max_tokens=500,
        )
        result = completion.choices[0].message.content.strip()
        cleaned = result.replace("```json\n", "").replace("```\n", "").replace("```", "").strip()
        parsed_expense = json.loads(cleaned)
        return {"expense": parsed_expense}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI expense parse error: {str(e)}")


@router.post("/expenses/insights")
async def ai_expense_insights(body: ExpenseInsightsRequest, user: dict = Depends(get_current_user)):
    """POST /api/ai/expenses/insights — AI financial advisor snippet."""
    sys_prompt = (
        "You are a slightly strict, no-nonsense financial advisor. "
        "I will provide your client's expense data as a JSON array (including name, amount, category, date). "
        "Analyze their total spending, identify their highest category, and give them a personalized, 2-3 sentence "
        "budgeting critique or piece of advice. Keep it punchy and actionable. "
        "Return ONLY a valid JSON object with the key 'insight' containing your string."
    )

    try:
        completion = groq.chat.completions.create(
            messages=[
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": json.dumps(body.expenseData)}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.5,
            max_tokens=1500,
        )
        result = completion.choices[0].message.content.strip()
        cleaned = result.replace("```json\n", "").replace("```\n", "").replace("```", "").strip()
        insight_obj = json.loads(cleaned)
        return {"insight": insight_obj.get("insight", "Log more expenses to get a detailed spending review.")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI expense insights error: {str(e)}")


class TimetableParseRequest(BaseModel):
    text: str

class GpaInsightsRequest(BaseModel):
    transcript: List[dict]

@router.post("/timetable/parse")
async def ai_timetable_parse(body: TimetableParseRequest, user: dict = Depends(get_current_user)):
    """POST /api/ai/timetable/parse — Extracts schedule blocks from natural language."""
    sys_prompt = (
        "You are an expert schedule parser. The user provides a natural language description of a class entry. "
        "Extract the 'subject' name, 'room' (or empty string), array of 'days' (capitalized full names like 'Monday', 'Tuesday'), "
        "and 'startTime' and 'endTime' in strict 'HH:MM' 24-hour string format (e.g. 10 am is '10:00', 2 pm is '14:00'). "
        "If they say a class is 2 hours long, calculate the end time. "
        "Return ONLY a valid JSON object with keys: 'subject', 'room', 'days' (array of strings), 'startTime' (string), 'endTime' (string)."
    )

    try:
        completion = groq.chat.completions.create(
            messages=[
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": body.text}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.2,
            max_tokens=500,
        )
        result = completion.choices[0].message.content.strip()
        cleaned = result.replace("```json\n", "").replace("```\n", "").replace("```", "").strip()
        parsed_schedule = json.loads(cleaned)
        return {"schedule": parsed_schedule}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI timetable parse error: {str(e)}")


@router.post("/gpa/insights")
async def ai_gpa_insights(body: GpaInsightsRequest, user: dict = Depends(get_current_user)):
    """POST /api/ai/gpa/insights — AI academic advisor snippet."""
    sys_prompt = (
        "You are a highly motivating but rigorous academic advisor. "
        "I will provide your student's entire transcript history as a JSON string (semesters, courses, grades, credits). "
        "Analyze their performance trend, spot their weakest points (if any), and provide a 2-3 sentence personalized, "
        "highly encouraging study recommendation or critique. Keep it punchy. "
        "Return ONLY a valid JSON object with the key 'insight' containing your text."
    )

    try:
        completion = groq.chat.completions.create(
            messages=[
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": json.dumps(body.transcript)}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.6,
            max_tokens=1500,
        )
        result = completion.choices[0].message.content.strip()
        cleaned = result.replace("```json\n", "").replace("```\n", "").replace("```", "").strip()
        insight_obj = json.loads(cleaned)
        return {"insight": insight_obj.get("insight", "Log more semesters to get a detailed academic review.")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI academic insights error: {str(e)}")


