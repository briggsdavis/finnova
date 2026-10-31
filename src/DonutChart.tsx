import { useEffect, useRef, useState } from "react"
import { ChartTooltip } from "./ChartBar"
export const chartColors = [
  "#4285f4",
  "#ea4335",
  "#fbbc04",
  "#34a853",
  "#ff6d01",
  "#46bdc6",
  "#ab47bc",
  "#5c6bc0",
  "#ec7098",
  "#8cb342",
  "#8d6e63",
]
export function DonutChart({
  items,
  label,
}: {
  items: { name: string; value: number }[]
  label: string
}) {
  const [hover, setHover] = useState<{ name: string; value: number; x: number; y: number } | null>(
    null,
  )
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(500)
  useEffect(() => {
    if (!ref.current) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  const total = items.reduce((a, b) => a + Math.max(0, b.value), 0)
  let offset = 0
  const segments = items
    .filter((i) => i.value > 0)
    .map((item, i) => {
      const start = offset
      offset += item.value / total
      return {
        ...item,
        start,
        end: offset,
        angle: ((start + offset) / 2) * Math.PI * 2 - Math.PI / 2,
        color: chartColors[i % chartColors.length],
      }
    })
  const radius = Math.min(width * 0.255, 155),
    cx = width / 2
  const left = segments
      .filter((s) => Math.cos(s.angle) < 0)
      .sort((a, b) => Math.sin(a.angle) - Math.sin(b.angle)),
    right = segments
      .filter((s) => Math.cos(s.angle) >= 0)
      .sort((a, b) => Math.sin(a.angle) - Math.sin(b.angle))
  const height = Math.max(radius * 2 + 64, Math.max(left.length, right.length) * 42 + 32, 240),
    cy = height / 2
  const labels = new Map<string, number>()
  ;[left, right].forEach((side) => {
    const ys = side.map((s) => cy + Math.sin(s.angle) * radius)
    for (let i = 0; i < ys.length; i++)
      ys[i] = Math.max(24 + i * 40, ys[i], i ? ys[i - 1] + 40 : 24)
    const overflow = (ys.at(-1) || 0) - (height - 25)
    if (overflow > 0) for (let i = 0; i < ys.length; i++) ys[i] -= overflow
    side.forEach((s, i) => labels.set(s.name, ys[i]))
  })
  const point = (angle: number, r: number) => [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]
  const maxChars = Math.max(7, Math.floor((width / 2 - radius + 12) / 5.4))
  return (
    <div ref={ref} className="w-full bg-white">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="block w-full overflow-visible"
        role="img"
        aria-label={`${label}. ${items.map((i) => `${i.name}: ${i.value.toLocaleString("en-IE")} euros`).join("; ")}`}
      >
        <defs>
          <mask id={`wipe-${label.replace(/\W/g, "")}`}>
            <circle cx={cx} cy={cy} r={radius + 1} fill="white" />
          </mask>
        </defs>
        <g className="donut-enter">
          {segments.map((s) => {
            const [x1, y1] = point(s.start * Math.PI * 2 - Math.PI / 2, radius),
              [x2, y2] = point(s.end * Math.PI * 2 - Math.PI / 2, radius)
            return (
              <path
                key={s.name}
                tabIndex={0}
                aria-label={`${s.name}: €${s.value.toLocaleString("en-IE")}`}
                className="cursor-pointer transition-[filter] duration-150 hover:brightness-110 focus:brightness-110 focus-visible:outline-none"
                onMouseMove={(e) =>
                  setHover({ name: s.name, value: s.value, x: e.clientX, y: e.clientY })
                }
                onMouseLeave={() => setHover(null)}
                onFocus={(e) => {
                  const r = e.currentTarget.getBoundingClientRect()
                  setHover({ name: s.name, value: s.value, x: r.left + r.width / 2, y: r.top })
                }}
                onBlur={() => setHover(null)}
                fill={s.color}
                d={
                  s.end - s.start > 0.99999
                    ? `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx - 0.001} ${cy - radius} Z`
                    : `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${s.end - s.start > 0.5 ? 1 : 0} 1 ${x2} ${y2} Z`
                }
              ></path>
            )
          })}
          <circle cx={cx} cy={cy} r={radius * 0.5} fill="white" />
        </g>
        {segments.map((s) => {
          const isLeft = Math.cos(s.angle) < 0
          const [x, y] = point(s.angle, radius * 0.96)
          const ly = labels.get(s.name)!
          const edge = isLeft ? 4 : width - 4
          const elbow = isLeft ? cx - radius - 9 : cx + radius + 9
          const name = s.name.length > maxChars ? s.name.slice(0, maxChars - 1) + "…" : s.name
          return (
            <g key={s.name}>
              <path
                d={`M ${x} ${y} L ${elbow} ${ly} L ${edge} ${ly}`}
                fill="none"
                stroke="#a5a5a5"
                strokeWidth="1"
              />
              <circle cx={x} cy={y} r="2" fill="#a5a5a5" />
              <text
                x={edge}
                y={ly - 5}
                textAnchor={isLeft ? "start" : "end"}
                fontSize="11"
                fill="#333"
                fontWeight="500"
              >
                {name}
                <title>{s.name}</title>
              </text>
              <text
                x={edge}
                y={ly + 13}
                textAnchor={isLeft ? "start" : "end"}
                fontSize="10"
                fill="#888"
              >
                {((s.value / total) * 100).toFixed(1)}%
              </text>
            </g>
          )
        })}
        {!total && (
          <>
            <circle
              cx={cx}
              cy={cy}
              r={radius * 0.75}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth={radius * 0.5}
            />
            <text x={cx} y={cy} textAnchor="middle" fill="#888" fontSize="12">
              No data
            </text>
          </>
        )}
      </svg>
      {hover && (
        <ChartTooltip
          text={`${hover.name}: ${new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(hover.value)}`}
          x={hover.x}
          y={hover.y}
        />
      )}
    </div>
  )
}
