"use client"

import { useEffect, useRef } from "react"
import { useTheme } from "next-themes"

interface Node {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  pulsePhase: number
}

export function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const isDark = resolvedTheme === "dark"

    let animationId: number
    let nodes: Node[] = []
    const CONNECTION_DIST = 180
    const NODE_COUNT = 70

    function resize() {
      if (!canvas) return
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    function initNodes() {
      if (!canvas) return
      nodes = []
      for (let i = 0; i < NODE_COUNT; i++) {
        nodes.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          radius: Math.random() * 1.8 + 0.8,
          pulsePhase: Math.random() * Math.PI * 2,
        })
      }
    }

    function draw(time: number) {
      if (!canvas || !ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const lineColor = isDark ? "255, 255, 255" : "0, 0, 0"
      const nodeColor = isDark ? "255, 255, 255" : "0, 0, 0"

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < CONNECTION_DIST) {
            const opacity = (1 - dist / CONNECTION_DIST) * 0.15
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.strokeStyle = `rgba(${lineColor}, ${opacity})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      // Draw nodes
      for (const node of nodes) {
        const pulse = Math.sin(time * 0.0015 + node.pulsePhase) * 0.5 + 0.5
        const glowRadius = node.radius + pulse * 2

        // Outer glow
        const gradient = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, glowRadius * 3
        )
        gradient.addColorStop(0, `rgba(${nodeColor}, ${0.25 + pulse * 0.2})`)
        gradient.addColorStop(0.5, `rgba(${nodeColor}, ${0.06 + pulse * 0.06})`)
        gradient.addColorStop(1, `rgba(${nodeColor}, 0)`)
        ctx.beginPath()
        ctx.arc(node.x, node.y, glowRadius * 3, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()

        // Core dot
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${nodeColor}, ${0.5 + pulse * 0.3})`
        ctx.fill()
      }

      // Update positions
      for (const node of nodes) {
        node.x += node.vx
        node.y += node.vy
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1
      }

      animationId = requestAnimationFrame(draw)
    }

    resize()
    initNodes()
    animationId = requestAnimationFrame(draw)

    const handleResize = () => {
      resize()
      initNodes()
    }
    window.addEventListener("resize", handleResize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener("resize", handleResize)
    }
  }, [resolvedTheme])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 bg-background"
    />
  )
}
