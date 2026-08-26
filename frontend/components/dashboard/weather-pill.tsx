"use client"

import { useState, useEffect } from "react"
import { CloudSun, Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Loader2 } from "lucide-react"

interface WeatherData {
  temp: number
  condition: string
  city: string
}

const conditionIcons: Record<string, React.ElementType> = {
  Clear: Sun,
  Clouds: Cloud,
  Rain: CloudRain,
  Drizzle: CloudRain,
  Snow: CloudSnow,
  Thunderstorm: CloudLightning,
}

export function WeatherPill() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [time, setTime] = useState("")

  useEffect(() => {
    function updateTime() {
      setTime(new Date().toLocaleTimeString([], { 
        hour: "2-digit", 
        minute: "2-digit", 
        second: "2-digit", 
        hour12: true 
      }))
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function fetchWeather() {
      try {
        const geoRes = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(5000) })
        if (!geoRes.ok) throw new Error("geo failed")
        const geo = await geoRes.json()
        const lat = geo.latitude
        const lon = geo.longitude
        const city = geo.city || "Local"

        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`,
          { signal: AbortSignal.timeout(5000) }
        )
        if (!weatherRes.ok) throw new Error("weather failed")
        const weatherData = await weatherRes.json()
        const temp = Math.round(weatherData.current.temperature_2m)
        const code = weatherData.current.weather_code

        let condition = "Clear"
        if (code >= 1 && code <= 3) condition = "Clouds"
        else if (code >= 51 && code <= 67) condition = "Rain"
        else if (code >= 71 && code <= 77) condition = "Snow"
        else if (code >= 80 && code <= 82) condition = "Rain"
        else if (code >= 95) condition = "Thunderstorm"

        if (!cancelled) setWeather({ temp, condition, city })
      } catch {
        if (!cancelled) setWeather({ temp: 22, condition: "Clear", city: "Local" })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchWeather()

    return () => { cancelled = true }
  }, [])

  const Icon = weather ? (conditionIcons[weather.condition] || CloudSun) : CloudSun

  if (loading) {
    return (
      <div className="flex h-9 items-center gap-2 rounded-full border border-border px-3 text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span className="text-xs">Loading</span>
      </div>
    )
  }

  return (
    <div className="flex h-9 items-center gap-2 rounded-full border border-border px-3 text-foreground transition-colors hover:border-foreground">
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="text-xs font-medium">{weather?.temp}&deg;C</span>
      <div className="h-3 w-px bg-border" />
      <span className="text-xs text-muted-foreground">{time}</span>
    </div>
  )
}
