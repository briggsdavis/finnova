import { useState, type HTMLAttributes } from "react"
import { createPortal } from "react-dom"
export function ChartTooltip({ text, x, y }: { text: string; x: number; y: number }) {
  return createPortal(
    <div
      role="tooltip"
      className="pointer-events-none fixed z-[100] max-w-[240px] rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white shadow-lg"
      style={{
        left: Math.max(8, Math.min(x + 12, window.innerWidth - 248)),
        top: Math.max(8, Math.min(y + 14, window.innerHeight - 60)),
      }}
    >
      {text}
    </div>,
    document.body,
  )
}
export function ChartBar({ title, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null)
  return (
    <>
      <div
        {...props}
        tabIndex={0}
        aria-label={props["aria-label"] || title}
        className={`${className || ""} cursor-pointer transition-[filter] duration-150 hover:brightness-110 focus:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500`}
        onMouseMove={(e) => setHover({ x: e.clientX, y: e.clientY })}
        onMouseLeave={() => setHover(null)}
        onFocus={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          setHover({ x: r.left, y: r.top })
        }}
        onBlur={() => setHover(null)}
      />
      {hover && title && <ChartTooltip text={title} {...hover} />}
    </>
  )
}
