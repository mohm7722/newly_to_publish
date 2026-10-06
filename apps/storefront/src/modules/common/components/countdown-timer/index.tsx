"use client"

import React, { useEffect, useMemo, useState } from "react"

type CountdownTimerProps = {
  initialHours?: number
  initialMinutes?: number
  initialSeconds?: number
}

const pad = (num: number) => String(num).padStart(2, "0")

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  initialHours = 23,
  initialMinutes = 45,
  initialSeconds = 12,
}) => {
  const initialTotal = useMemo(
    () => Math.max(1, initialHours * 3600 + initialMinutes * 60 + initialSeconds),
    [initialHours, initialMinutes, initialSeconds]
  )

  const [secondsLeft, setSecondsLeft] = useState<number>(initialTotal)

  useEffect(() => {
    setSecondsLeft(initialTotal)
  }, [initialTotal])

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) return initialTotal // loop fake countdown
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [initialTotal])

  const hours = Math.floor(secondsLeft / 3600)
  const minutes = Math.floor((secondsLeft % 3600) / 60)
  const seconds = secondsLeft % 60

  return (
    <div className="bg-white bg-opacity-20 rounded-lg p-2.5 backdrop-blur-sm">
      <div className="flex items-center space-x-3 space-x-reverse text-center">
        <div className="bg-white bg-opacity-30 rounded-lg p-2 min-w-[48px]">
          <div className="text-sm font-bold">{pad(hours)}</div>
          <div className="text-[11px]">ساعة</div>
        </div>
        <div className="text-lg">:</div>
        <div className="bg-white bg-opacity-30 rounded-lg p-2 min-w-[48px]">
          <div className="text-sm font-bold">{pad(minutes)}</div>
          <div className="text-[11px]">دقيقة</div>
        </div>
        <div className="text-lg">:</div>
        <div className="bg-white bg-opacity-30 rounded-lg p-2 min-w-[48px]">
          <div className="text-sm font-bold">{pad(seconds)}</div>
          <div className="text-[11px]">ثانية</div>
        </div>
      </div>
    </div>
  )
}

export default CountdownTimer
