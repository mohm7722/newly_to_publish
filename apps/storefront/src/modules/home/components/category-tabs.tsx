"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"

type Category = {
  id: string
  title: string
}

type CategoryTabsProps = {
  categories: Category[]
  activeId?: string
  onSelect: (id: string) => void
}

/**
 * A minimalist, RTL-friendly horizontal categories bar with a right-side Drawer.
 * - Flat text (no pills)
 * - Active category in red + semibold
 * - Smooth horizontal scroll with mouse/touch drag
 * - Hidden scrollbar
 * - "Menu" button (ellipsis) opens an accessible Drawer with all categories
 */
export default function CategoryTabs({ categories, activeId, onSelect }: CategoryTabsProps) {
  const [open, setOpen] = useState(false)
  const scrollerRef = useRef<HTMLDivElement>(null)

  // Accessible Drawer focus trap
  const drawerRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (open) {
      previouslyFocused.current = document.activeElement as HTMLElement
      const focusFirst = () => {
        const container = drawerRef.current
        if (!container) return
        const focusables = container.querySelectorAll<HTMLElement>(
          'a,button,textarea,input,select,[tabindex]:not([tabindex="-1"])'
        )
        ;(focusables[0] || container).focus()
      }
      focusFirst()

      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setOpen(false)
        }
        if (e.key === "Tab") {
          const container = drawerRef.current
          if (!container) return
          const focusables = Array.from(
            container.querySelectorAll<HTMLElement>(
              'a,button,textarea,input,select,[tabindex]:not([tabindex="-1"])'
            )
          )
          if (focusables.length === 0) return
          const first = focusables[0]
          const last = focusables[focusables.length - 1]
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault()
            last.focus()
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }

      document.addEventListener("keydown", onKeyDown)
      return () => document.removeEventListener("keydown", onKeyDown)
    } else if (previouslyFocused.current) {
      previouslyFocused.current.focus()
    }
  }, [open])

  const handleSelect = useCallback(
    (id: string) => {
      onSelect(id)
      setOpen(false)
    },
    [onSelect]
  )

  const items = useMemo(() => categories || [], [categories])
  const drawerItems = useMemo(() => items.filter((i) => i.id !== "all"), [items])

  return (
    <div dir="rtl" className="w-full">
      <div className="flex items-center gap-3 bg-white w-full px-4 rounded-none shadow-sm border-0 py-2.5">
        {/* Menu / Drawer button */}
        <button
          type="button"
          aria-label="قائمة الفئات"
          onClick={() => setOpen(true)}
          className="p-1.5 rounded-md text-gray-700 hover:text-red-600 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="19" r="1" />
          </svg>
        </button>

        {/* Horizontal scroller */}
        <div
          ref={scrollerRef}
          className="flex-1 overflow-x-auto no-scrollbar scroll-smooth"
        >
          <div className="flex items-center gap-1.5 pr-1 select-none">
            {items.map((c) => {
              const isActive = c.id === activeId
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelect(c.id)}
                  className={
                    "transition-transform duration-150 text-sm md:text-base outline-none whitespace-nowrap shrink-0 px-2 " +
                    (isActive
                      ? "text-red-600 font-semibold hover:text-red-700 active:scale-[0.98]"
                      : "text-gray-700 hover:text-gray-900 active:scale-[0.98]")
                  }
                  aria-pressed={isActive}
                >
                  {c.title}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />

          <div
            ref={drawerRef}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-xl transform transition-transform translate-x-0 focus:outline-none"
          >
            <div className="flex items-center justify-between p-4 border-b">
              <span className="text-base font-semibold text-gray-800">كل الفئات</span>
              <button
                type="button"
                className="p-2 rounded-md text-gray-600 hover:text-red-600"
                aria-label="إغلاق"
                onClick={() => setOpen(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="p-4 overflow-y-auto h-[calc(100%-56px)]">
              <ul className="space-y-2">
                <li>
                  <button
                    type="button"
                    onClick={() => handleSelect("all")}
                    className={
                      "w-full text-right py-2 px-1 rounded-md transition-colors " +
                      (activeId === undefined || activeId === "all"
                        ? "text-red-600 font-semibold"
                        : "text-gray-800 hover:text-gray-900")
                    }
                    aria-pressed={activeId === undefined || activeId === "all"}
                  >
                    الكل
                  </button>
                </li>
                {drawerItems.map((c) => {
                  const isActive = c.id === activeId
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => handleSelect(c.id)}
                        className={
                          "w-full text-right py-2 px-1 rounded-md transition-colors " +
                          (isActive ? "text-red-600 font-semibold" : "text-gray-800 hover:text-gray-900")
                        }
                        aria-pressed={isActive}
                      >
                        {c.title}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
