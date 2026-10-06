"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import StoreCategoryBar from "@modules/store/components/category-bar"

type Category = { id: string; title: string; handle?: string }

export default function StickyStoreCategoryBar({
  categories,
  activeId,
}: {
  categories: Category[]
  activeId?: string
}) {
  const anchorRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)

  const [isFixed, setIsFixed] = useState(false)
  const [barHeight, setBarHeight] = useState(0)
  const [topOffset, setTopOffset] = useState(0)

  // ارتفاع احتياطي للهيدر بحسب المقاس (fallback)
  const getResponsiveFallback = () =>
    window.matchMedia("(min-width: 640px)").matches ? 104 : 96

  // يحسب أسفل الهيدر الحالي بدقة (مع الإعلان إن وجد)
  const computeTopOffset = () => {
    const selectors = [
      "[data-site-header]",
      "header.site-header",
      "header[role='banner']",
      "header",
      "[role='banner']",
      "[data-topbar]",
    ]

    let headerEl: HTMLElement | null = null
    for (const sel of selectors) {
      const el = document.querySelector(sel) as HTMLElement | null
      if (el) {
        headerEl = el
        break
      }
    }

    const fallback = getResponsiveFallback()
    if (!headerEl) return fallback

    const rect = headerEl.getBoundingClientRect()
    const styles = window.getComputedStyle(headerEl)
    const borderBottom = parseFloat(styles.borderBottomWidth || "0")
    const bottom = Math.round(rect.bottom - borderBottom)

    // لو القراءة لحظيًا صغيرة (قبل ما يصير sticky) نستخدم الاحتياطي
    if (bottom < 40) return fallback

    const HAIRLINE_FIX = 1 // يزيل شعرة 1px بين الهيدر والشريط
    return Math.max(0, bottom - HAIRLINE_FIX)
  }

  const handle = () => {
    const anchor = anchorRef.current
    const bar = barRef.current
    if (!anchor || !bar) return

    const top = computeTopOffset()
    setTopOffset(top)

    const { top: anchorTop } = anchor.getBoundingClientRect()
    setIsFixed(anchorTop <= top)

    setBarHeight(bar.getBoundingClientRect().height)
  }

  useEffect(() => {
    handle()
    window.addEventListener("scroll", handle, { passive: true })
    window.addEventListener("resize", handle)

    // راقب تغيّر الهيدر/الأعلى لتحديث الإزاحة فورًا
    const header =
      document.querySelector("[data-site-header]") ||
      document.querySelector("header")
    const mo = new MutationObserver(handle)
    if (header)
      mo.observe(header, { attributes: true, childList: true, subtree: true })

    return () => {
      window.removeEventListener("scroll", handle)
      window.removeEventListener("resize", handle)
      mo.disconnect()
    }
  }, [])

  const bar = useMemo(
    () => <StoreCategoryBar categories={categories} activeId={activeId} />,
    [categories, activeId]
  )

  // فل-بليد حقيقي يكسر أي padding للحاويات
  const fullBleedStyle: React.CSSProperties = {
    marginInline: "calc(50% - 50vw)",
    width: "100vw",
  }

  return (
    <div ref={anchorRef} className="w-full">
      {isFixed && <div style={{ height: barHeight }} />}

      <div
        ref={barRef}
        className={isFixed ? "fixed inset-x-0 z-[40] -translate-y-px" : "relative"}
        style={isFixed ? { top: topOffset } : undefined}
      >
        {/* نمنع أي سحب أفقي عند أعلى الصفحة */}
        <div
          className="overflow-x-hidden"
          style={{
            touchAction: "pan-y",
            overscrollBehaviorX: "none" as any,
            WebkitOverflowScrolling: "touch",
          }}
        >
          {/* فل-بليد في كل الحالات (ثابت/غير ثابت) وعلى كل المقاسات */}
          <div style={{ ...fullBleedStyle, maxWidth: "100vw" }}>{bar}</div>
        </div>
      </div>
    </div>
  )
}
