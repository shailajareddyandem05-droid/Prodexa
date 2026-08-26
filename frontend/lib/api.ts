import { firebaseAuth } from './firebase';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function getAuthHeaders(): Promise<Record<string, string>> {
    const user = firebaseAuth.currentUser;
    if (!user) return {};

    try {
        const token = await user.getIdToken();
        return { Authorization: `Bearer ${token}` };
    } catch {
        return {};
    }
}

async function apiFetch(
    endpoint: string,
    options: RequestInit = {}
): Promise<any> {
    const authHeaders = await getAuthHeaders();

    const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
            ...options.headers,
        },
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(errorData.detail || errorData.error || `HTTP ${res.status}`);
    }

    return res.json();
}

// ---- Auth ----
export const api = {
    auth: {
        verify: () => apiFetch('/auth/verify', { method: 'POST' }),
    },

    // ---- Tasks ----
    tasks: {
        list: () => apiFetch('/tasks'),
        create: (data: { title: string; due?: string; priority?: string; source?: string; parentId?: string }) =>
            apiFetch('/tasks', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: string, data: any) =>
            apiFetch(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
        delete: (id: string) => apiFetch(`/tasks/${id}`, { method: 'DELETE' }),
    },

    // ---- Notes ----
    notes: {
        list: () => apiFetch('/notes'),
        create: (data: { title: string; content?: string; group?: string }) =>
            apiFetch('/notes', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: string, data: any) =>
            apiFetch(`/notes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
        delete: (id: string) => apiFetch(`/notes/${id}`, { method: 'DELETE' }),
    },

    // ---- Calendar ----
    calendar: {
        list: () => apiFetch('/calendar'),
        create: (data: { title: string; day: number; month?: number; year?: number; type?: string }) =>
            apiFetch('/calendar', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: string, data: any) =>
            apiFetch(`/calendar/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
        delete: (id: string) => apiFetch(`/calendar/${id}`, { method: 'DELETE' }),
    },

    // ---- Mood ----
    mood: {
        get: () => apiFetch('/mood'),
        log: (data: { mood: string; stress: number }) =>
            apiFetch('/mood', { method: 'POST', body: JSON.stringify(data) }),
    },

    // ---- Dashboard ----
    dashboard: {
        stats: () => apiFetch('/dashboard/stats'),
        routine: () => apiFetch('/dashboard/routine'),
        toggleRoutine: (id: string, done: boolean) =>
            apiFetch(`/dashboard/routine/${id}`, { method: 'PATCH', body: JSON.stringify({ done }) }),
        weekProgress: () => apiFetch('/dashboard/week-progress'),
    },

    // ---- Contact ----
    contact: {
        submit: (data: { name: string; email: string; subject?: string; message: string }) =>
            apiFetch('/contact', { method: 'POST', body: JSON.stringify(data) }),
    },

    // ---- AI ----
    ai: {
        chat: (message: string, history?: any[], mode: string = "standard", chatId?: string, save: boolean = true) =>
            apiFetch('/ai/chat', { method: 'POST', body: JSON.stringify({ message, history, mode, chatId, save }) }),
        getChats: () => apiFetch('/ai/chats'),
        getChat: (id: string) => apiFetch(`/ai/chats/${id}`),
        deleteChat: (id: string) => apiFetch(`/ai/chats/${id}`, { method: 'DELETE' }),
        summarize: (notes: any[]) =>
            apiFetch('/ai/summarize', { method: 'POST', body: JSON.stringify({ notes }) }),
        generateTask: (prompt: string) =>
            apiFetch('/ai/generate-task', { method: 'POST', body: JSON.stringify({ prompt }) }),
        magicTasks: (prompt: string) =>
            apiFetch('/ai/magic-tasks', { method: 'POST', body: JSON.stringify({ prompt }) }),
        breakdownTask: (parentTitle: string) =>
            apiFetch('/ai/breakdown-task', { method: 'POST', body: JSON.stringify({ parentTitle }) }),
        emailAction: (data: { action: string; emailBody: string; emailSubject?: string; emailSender?: string }) =>
            apiFetch('/ai/email-actions', { method: 'POST', body: JSON.stringify(data) }),
        noteAction: (action: string, content: string) =>
            apiFetch('/ai/note-actions', { method: 'POST', body: JSON.stringify({ action, content }) }),
        dumpOrganize: (text: string) =>
            apiFetch('/ai/dump/organize', { method: 'POST', body: JSON.stringify({ text }) }),
        handleLaterPlan: (items: any[]) =>
            apiFetch('/ai/handle-later/plan', { method: 'POST', body: JSON.stringify({ items }) }),
        habitBreakdown: (goal: string) =>
            apiFetch('/ai/habits/breakdown', { method: 'POST', body: JSON.stringify({ goal }) }),
        habitInsights: (habitData: any[]) =>
            apiFetch('/ai/habits/insights', { method: 'POST', body: JSON.stringify({ habitData }) }),
        expenseParse: (text: string) =>
            apiFetch('/ai/expenses/parse', { method: 'POST', body: JSON.stringify({ text }) }),
        expenseInsights: (expenseData: any[]) =>
            apiFetch('/ai/expenses/insights', { method: 'POST', body: JSON.stringify({ expenseData }) }),
        timetableParse: (text: string) =>
            apiFetch('/ai/timetable/parse', { method: 'POST', body: JSON.stringify({ text }) }),
        gpaInsights: (transcript: any[]) =>
            apiFetch('/ai/gpa/insights', { method: 'POST', body: JSON.stringify({ transcript }) }),
    },

    // ---- Google Integration ----
    google: {
        getAuthUrl: () => apiFetch('/google/auth-url'),
        getStatus: () => apiFetch('/google/status'),
        disconnect: () => apiFetch('/google/disconnect', { method: 'POST' }),
        calendarEvents: () => apiFetch('/google/calendar/events'),
        gmailMessages: () => apiFetch('/google/gmail/messages'),
        gmailMessage: (id: string) => apiFetch(`/google/gmail/message/${id}`),
        driveFiles: () => apiFetch('/google/drive/files'),
        driveFile: (id: string) => apiFetch(`/google/drive/file/${id}`),
        exportNoteToDrive: (data: { title: string; content: string; folderId?: string }) => 
            apiFetch('/google/drive/export-note', { method: 'POST', body: JSON.stringify(data) }),
        exportGroupToDrive: (data: { groupName: string; notes: { title: string; content: string }[] }) =>
            apiFetch('/google/drive/export-group', { method: 'POST', body: JSON.stringify(data) }),
    },

    // ---- Razorpay ----
    razorpay: {
        createOrder: (amount: number) => 
            apiFetch('/razorpay/create-order', { method: 'POST', body: JSON.stringify({ amount }) }),
        verifyPayment: (data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
            apiFetch('/razorpay/verify-payment', { method: 'POST', body: JSON.stringify(data) }),
    },
};

export default api;
