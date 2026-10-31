import { Trash, PlayCircle } from "@phosphor-icons/react"
import {
  ArrowUpRight,
  ArrowRight,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronRight,
  ChevronDown,
  Download,
  Euro,
  FolderKanban,
  LayoutDashboard,
  Leaf,
  Menu,
  Plus,
  Settings2,
  ShieldCheck,
  TrendingUp,
  Wallet,
  PanelRightClose,
} from "lucide-react"
import React, { StrictMode, useState } from "react"
import { createRoot } from "react-dom/client"
import * as XLSX from "xlsx"
import { AnimatedNumber } from "./AnimatedNumber"
import { ChartBar } from "./ChartBar"
import "@fontsource-variable/manrope"
import "./index.css"
import {
  Access,
  History,
  CostPie,
  AllocationDonut,
  OverviewBreakdowns,
  EventBudgets,
} from "./components"
import { DonutChart } from "./DonutChart"
import { ExpenseDetails, Tutorial, today } from "./ExpenseDetails"
import {
  departments,
  eventNames,
  freshYear,
  mockData,
  migrateStatistics,
  phases,
  refreshDepartmentSamples,
  isEventDepartment,
  type YearData,
  type LedgerRow,
} from "./mockData"
const money = (n: number) =>
  new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n)
const cx = (...a: (string | boolean | undefined)[]) => a.filter(Boolean).join(" ")
function App() {
  const [store, setStore] = useState<Record<string, YearData>>(() => {
    try {
      const current = localStorage.getItem("finova-data-v3")
      if (current) {
        const existing = { ...mockData, ...JSON.parse(current) } as Record<string, YearData>
        if (localStorage.getItem("finova-samples-v4")) return existing
        const next = Object.fromEntries(
          Object.entries(existing).map(([y, d]) => [y, refreshDepartmentSamples(d)]),
        )
        localStorage.setItem("finova-data-v3", JSON.stringify(next))
        localStorage.setItem("finova-samples-v4", "1")
        return next
      }
      const old = localStorage.getItem("finova-data-v2")
      const initial = old ? migrateStatistics(JSON.parse(old)) : mockData
      localStorage.setItem("finova-data-v3", JSON.stringify(initial))
      return initial
    } catch {
      return mockData
    }
  })
  const [openExpenses, setOpenExpenses] = useState<string[]>([])
  const [deleting, setDeleting] = useState<LedgerRow | null>(null)
  const [adding, setAdding] = useState(false)
  const [expanded, setExpanded] = useState<string[]>([])
  const [year, setYear] = useState("2026"),
    [role, setRole] = useState("president"),
    [page, setPage] = useState("overview"),
    [dept, setDept] = useState("ventures"),
    [event, setEvent] = useState("Idea Up"),
    [phase, setPhase] = useState(phases[0]),
    [panel, setPanel] = useState(true),
    [sidebar, setSidebar] = useState(false),
    [, setSearch] = useState(""),
    [notice, setNotice] = useState(""),
    [period, setPeriod] = useState("Monthly")
  const data = store[year] || freshYear(year),
    board = role === "president" || role === "admin",
    admin = board || role === "finance",
    selected = { ...departments.find((d) => d._id === dept)!, events: eventNames(data, dept) },
    scoped =
      page === "department" ||
      page === "ledger" ||
      page === "history" ||
      page === "event-budgets" ||
      !admin
  const rows = data.rows.filter((r) => !scoped || r.departmentId === dept),
    sum = (type: string, rs = rows) =>
      rs.filter((r) => r.type === type).reduce((a, r) => a + r.amount, 0)
  const allocation = scoped
      ? data.allocations[dept] || 0
      : Object.values(data.allocations).reduce((a, b) => a + b, 0),
    revenue = sum("Revenue"),
    expenses = sum("Expense"),
    budget = allocation + revenue,
    balance = budget - expenses
  const monthly = Array.from({ length: 12 }, () => ({ revenue: 0, expenses: 0 }))
  rows.forEach((r, i) => {
    const month = (i * 7 + Math.floor(i / 6)) % 12
    monthly[month][r.type === "Revenue" ? "revenue" : "expenses"] += r.amount
  })
  const simpleDashboard =
    page === "department" &&
    ["marketing", "data-ai", "hr", "partnerships", "finance", "consulting"].includes(dept)
  const compareEvents = scoped && selected.events.length > 0
  const chartData = compareEvents
    ? selected.events.map((e) => ({
        allocation: data.eventAllocations?.[`${dept}:${e}`] || 0,
        revenue: sum(
          "Revenue",
          rows.filter((r) => r.event === e),
        ),
        expenses: sum(
          "Expense",
          rows.filter((r) => r.event === e),
        ),
      }))
    : period === "Monthly"
      ? monthly
      : Array.from({ length: 4 }, (_, i) => ({
          revenue: monthly.slice(i * 3, i * 3 + 3).reduce((a, m) => a + m.revenue, 0),
          expenses: monthly.slice(i * 3, i * 3 + 3).reduce((a, m) => a + m.expenses, 0),
        }))
  const chartMax = Math.max(
    100,
    Math.ceil(
      Math.max(
        ...chartData.flatMap((d) => [
          d.revenue,
          d.expenses,
          ...("allocation" in d ? [Number(d.allocation)] : []),
        ]),
      ) / 100,
    ) * 100,
  )
  const save = (next: YearData) => {
    const all = { ...store, [year]: next }
    try {
      localStorage.setItem("finova-data-v3", JSON.stringify(all))
    } catch {
      throw new Error("Browser storage is full. Remove attachments or export your records.")
    }
    setStore(all)
    const spent = next.rows
      .filter((r) => r.departmentId === dept && r.type === "Expense")
      .reduce((n, r) => n + r.amount, 0)
    if (spent > (next.allocations[dept] || 0))
      toast("Saved. Warning: department expenses exceed the assigned budget.")
  }
  const updateRow = (id: string, patch: Partial<LedgerRow>) =>
    save({ ...data, rows: data.rows.map((r) => (r._id === id ? { ...r, ...patch } : r)) })
  const navigate = (p: string, d?: string) => {
    setPage(p)
    if (p === "history" && !["2024", "2025"].includes(year)) setYear("2025")
    if (d) setDept(d)
    setSidebar(false)
    setSearch("")
  }
  const toast = (s: string) => {
    setNotice(s)
    setTimeout(() => setNotice(""), 3500)
  }
  const exportData = () => {
    const book = XLSX.utils.book_new()
    const sheet = XLSX.utils.json_to_sheet(
      rows.map((r) => ({
        Department: departments.find((d) => d._id === r.departmentId)?.name,
        Event: r.event,
        Phase: r.phase,
        Category: r.name,
        Type: r.type,
        "Amount (€)": r.amount,
        Status: r.status,
      })),
    )
    sheet["!cols"] = [
      { wch: 24 },
      { wch: 24 },
      { wch: 20 },
      { wch: 30 },
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
    ]
    XLSX.utils.book_append_sheet(book, sheet, "Ledger")
    XLSX.utils.book_append_sheet(
      book,
      XLSX.utils.json_to_sheet(
        departments
          .filter((d) => !scoped || d._id === dept)
          .map((d) => ({ Department: d.name, "Allocation (€)": data.allocations[d._id] || 0 })),
      ),
      "Allocations",
    )
    XLSX.writeFile(book, `Finnova-FY${year.slice(2)}-${String(Number(year) + 1).slice(2)}.xlsx`)
    toast("Excel report exported")
  }

  const navClass = (active: boolean) =>
    cx(
      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-colors",
      active ? "bg-white text-[#203b69] font-bold" : "text-[#64748b] hover:bg-white",
    )
  const Stat = ({
    title,
    value,
    icon: Icon,
    sub,
    green = false,
  }: {
    title: string
    value: string
    icon: React.ElementType
    sub: string
    green?: boolean
  }) => (
    <div
      className={cx(
        "rounded-xl border p-5",
        green
          ? "border-[#d2dced] bg-white text-[#172e52]"
          : title === "Total expenses"
            ? "border-orange-100 bg-white"
            : "border-[#e2eaf1] bg-white",
      )}
    >
      <div className="flex justify-between text-xs">
        <span className={green ? "text-[#496080]" : "text-[#708297]"}>{title}</span>
        <Icon size={17} className={green ? "text-[#203b69]" : "text-[#486a9e]"} />
      </div>
      <div
        className={cx(
          "mt-4 text-[29px] font-semibold tracking-[-1px]",
          title === "Total revenue" && "text-emerald-700",
          title === "Total expenses" && "text-blue-700",
          title === "Remaining balance" &&
            (Number(value.replace(/[^0-9.-]/g, "")) < 0 ? "text-red-600" : "text-emerald-700"),
        )}
      >
        <AnimatedNumber value={Number(value.replace(/[^0-9.-]/g, ""))} />
      </div>
      <div
        className={cx(
          "mt-3 flex items-center gap-1 text-[10px]",
          green ? "text-[#496080]" : "text-[#768aa0]",
        )}
      >
        <TrendingUp size={12} />
        {sub}
      </div>
    </div>
  )
  const title =
    page === "tutorial"
      ? "Tutorial"
      : page === "event-budgets"
        ? "Budget Allocation"
        : page === "history"
          ? "History"
          : page === "access"
            ? "Access management"
            : page === "allocations"
              ? "Budget allocations"
              : page === "yoy"
                ? "Progress"
                : page === "ledger"
                  ? isEventDepartment(dept)
                    ? event
                    : "Expenses"
                  : scoped
                    ? `${selected.name} dashboard`
                    : "Association overview"
  return (
    <div className="min-h-screen bg-white text-[#172d42]">
      <aside
        className={cx(
          "fixed inset-y-0 left-0 z-40 flex w-[232px] flex-col overflow-y-auto border-r border-[#e2edf4] bg-white px-4 pb-12 pt-8 lg:translate-x-0",
          sidebar ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <a
          href="#"
          onClick={() => navigate(admin ? "overview" : "department")}
          className="mb-10 flex items-center gap-2.5 px-3"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#040a3f] text-[#d9faff]">
            <ChartNoAxesCombined size={24} />
          </span>
          <span className="text-[27px] font-extrabold tracking-[-1.3px]">Finnova</span>
        </a>
        <div className="mb-4 px-3 text-[9px] font-bold tracking-[1.8px] text-[#8193a5]">
          WORKSPACE
        </div>
        <nav className="space-y-1">
          {admin ? (
            <>
              <button
                className={navClass(page === "overview")}
                onClick={() => navigate("overview")}
              >
                <LayoutDashboard size={17} />
                Overview
              </button>
              {board && (
                <button
                  className={navClass(page === "allocations")}
                  onClick={() => navigate("allocations")}
                >
                  <Wallet size={17} />
                  Budget allocations
                </button>
              )}
              <button className={navClass(page === "yoy")} onClick={() => navigate("yoy")}>
                <ChartNoAxesCombined size={17} />
                Progress<span className="ml-auto rounded bg-white px-1.5 text-[9px]">YoY</span>
              </button>
              <button className={navClass(page === "access")} onClick={() => navigate("access")}>
                <ShieldCheck size={17} />
                Access
              </button>
              <div className="flex justify-between px-3 pt-8 pb-2 text-[9px] font-bold tracking-[1.8px] text-[#8193a5]">
                DEPARTMENTS<span>11</span>
              </div>
              {departments.map((d) => (
                <div key={d._id}>
                  <button
                    className={navClass(scoped && dept === d._id)}
                    onClick={() =>
                      setExpanded((v) =>
                        v.includes(d._id) ? v.filter((x) => x !== d._id) : [...v, d._id],
                      )
                    }
                  >
                    <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                    {d.name}
                    <ChevronRight
                      size={13}
                      className={cx(
                        "ml-auto transition-transform",
                        expanded.includes(d._id) && "rotate-90",
                      )}
                    />
                  </button>
                  {expanded.includes(d._id) && (
                    <div className="ml-5 border-l border-slate-200 pl-2">
                      <button
                        className={navClass(page === "department" && dept === d._id)}
                        onClick={() => navigate("department", d._id)}
                      >
                        Dashboard
                      </button>
                      {isEventDepartment(d._id) && (
                        <button
                          className={navClass(page === "event-budgets" && dept === d._id)}
                          onClick={() => navigate("event-budgets", d._id)}
                        >
                          Budget Allocation
                        </button>
                      )}
                      <button
                        className={navClass(page === "history" && dept === d._id)}
                        onClick={() => navigate("history", d._id)}
                      >
                        History
                      </button>
                      {!isEventDepartment(d._id) && (
                        <button
                          className={navClass(page === "ledger" && dept === d._id)}
                          onClick={() => {
                            setEvent("Operations")
                            navigate("ledger", d._id)
                          }}
                        >
                          Expenses
                        </button>
                      )}
                      {eventNames(data, d._id).map((e) => (
                        <button
                          key={e}
                          className={navClass(page === "ledger" && dept === d._id && event === e)}
                          onClick={() => {
                            setEvent(e)
                            navigate("ledger", d._id)
                          }}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </>
          ) : (
            <>
              <button
                className={navClass(page === "department")}
                onClick={() => navigate("department")}
              >
                <LayoutDashboard size={17} />
                Dashboard
              </button>
              {isEventDepartment(dept) && (
                <button
                  className={navClass(page === "event-budgets")}
                  onClick={() => navigate("event-budgets")}
                >
                  <Wallet size={17} />
                  Budget Allocation
                </button>
              )}
              <button className={navClass(page === "history")} onClick={() => navigate("history")}>
                <CalendarDays size={17} />
                History
              </button>
              <button className={navClass(page === "access")} onClick={() => navigate("access")}>
                <ShieldCheck size={17} />
                Access
              </button>
              {!isEventDepartment(dept) && (
                <button
                  className={navClass(page === "ledger")}
                  onClick={() => {
                    setEvent("Operations")
                    navigate("ledger")
                  }}
                >
                  <FolderKanban size={17} />
                  Expenses
                </button>
              )}
              {selected.events.length > 0 && (
                <div className="px-3 pt-7 pb-2 text-[9px] tracking-widest text-[#8193a5]">
                  EVENTS
                </div>
              )}
              {selected.events.map((e) => (
                <button
                  key={e}
                  className={navClass(page === "ledger" && event === e)}
                  onClick={() => {
                    setEvent(e)
                    navigate("ledger")
                  }}
                >
                  <FolderKanban size={16} />
                  {e}
                </button>
              ))}
            </>
          )}
          <div className="mt-7 border-t border-slate-200 px-3 pt-5 pb-2 text-[9px] font-bold tracking-widest text-slate-500">
            HELP & SUPPORT
          </div>
          <button className={navClass(page === "tutorial")} onClick={() => navigate("tutorial")}>
            <PlayCircle size={17} />
            Tutorial
          </button>
        </nav>
      </aside>
      <div className="lg:ml-[232px]">
        <header className="flex min-h-[83px] flex-wrap items-center justify-between gap-3 border-b border-[#e3edf4] bg-white px-5 lg:px-9">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden"
              onClick={() => setSidebar(!sidebar)}
              aria-label="Toggle navigation"
            >
              <Menu size={20} />
            </button>
            <div className="relative flex items-center gap-2 rounded-lg border border-[#dceaf3] bg-white px-3 py-2">
              <Building2 size={15} className="text-[#203b69]" />
              <select
                aria-label="Role"
                value={role}
                onChange={(e) => {
                  const v = e.target.value
                  setRole(v)
                  if (!["president", "admin"].includes(v)) setDept(v)
                  setPage(["president", "admin", "finance"].includes(v) ? "overview" : "department")
                }}
                className="max-w-[190px] bg-transparent text-[11px] font-semibold outline-none"
              >
                <option value="president">President</option>
                <option value="admin">Institutional Board</option>
                {departments
                  .filter((d) => d._id !== "board")
                  .map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} Lead
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-[#dceaf3] bg-white px-3 py-2">
              <CalendarDays size={14} />
              <select
                aria-label="Fiscal year"
                className="bg-transparent text-xs font-semibold outline-none"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              >
                {(page === "history"
                  ? ["2024", "2025"]
                  : ["2024", "2025", "2026", "2027", "2028"]
                ).map((y) => (
                  <option key={y} value={y}>
                    FY{y.slice(2)}/{String(Number(y) + 1).slice(2)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <span className="hidden items-center gap-1.5 text-[10px] text-[#758ca1] md:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[#788c9a]" />
              All changes saved
            </span>
            <div className="border-l border-[#dbe0e3] pl-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[10px] font-bold">
                {admin ? "IB" : selected.name.slice(0, 2).toUpperCase()}
              </div>
            </div>
          </div>
        </header>
        <main
          key={`${page}-${year}-${dept}-${event}-${phase}-${period}`}
          className="page-enter mx-auto max-w-[1500px] px-5 pt-7 pb-40 lg:px-9"
        >
          <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-[27px] font-semibold tracking-[-1.1px]">{title}</h1>
                <span className="rounded-full border border-[#c6efff] bg-white px-2.5 py-1 text-[9px] font-semibold text-[#203b69]">
                  FY{year.slice(2)}/{String(Number(year) + 1).slice(2)}
                </span>
              </div>
            </div>
            <button
              onClick={exportData}
              className="flex items-center gap-2 rounded-lg border border-[#dbe7f0] bg-white px-3.5 py-2.5 text-[11px] font-semibold"
            >
              <Download size={14} />
              Export report
            </button>
          </div>
          {page !== "tutorial" &&
            page !== "event-budgets" &&
            page !== "ledger" &&
            page !== "access" &&
            page !== "history" && (
              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <Stat
                  title="Total ESADE budget"
                  value={money(allocation)}
                  icon={Building2}
                  sub="Institutional allocation"
                />
                <Stat
                  title="Total available budget"
                  value={money(budget)}
                  icon={Wallet}
                  sub="ESADE allocation + revenue"
                  green
                />
                <Stat
                  title="Total revenue"
                  value={money(revenue)}
                  icon={TrendingUp}
                  sub="Generated across the association"
                />
                <Stat
                  title="Total expenses"
                  value={money(expenses)}
                  icon={Euro}
                  sub={`${budget ? Math.round((expenses / budget) * 100) : 0}% of available budget used`}
                />
                <Stat
                  title="Remaining balance"
                  value={money(balance)}
                  icon={Leaf}
                  sub={
                    balance >= 0
                      ? "Healthy budget · within allocation"
                      : "Budget at risk · review expenses"
                  }
                />
              </div>
            )}
          {(page === "overview" || page === "department") && (
            <>
              <div
                className={cx("mb-6 grid gap-5", !simpleDashboard && "xl:grid-cols-[1.65fr_1fr]")}
              >
                {!simpleDashboard && (
                  <section className="rounded-xl border border-[#e2eaf2] bg-white p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-sm font-bold">
                          {compareEvents ? "Event performance" : "Budget performance"}
                        </h2>
                        <p className="mt-1.5 text-[10px] text-[#8e9498]">
                          {compareEvents
                            ? "Revenue and expenses by event."
                            : "Income and expenses by period."}
                        </p>
                      </div>
                      {!compareEvents && (
                        <select
                          aria-label="Chart period"
                          className="rounded-md border border-[#dee2e6] px-2 py-1.5 text-[10px]"
                          value={period}
                          onChange={(e) => setPeriod(e.target.value)}
                        >
                          <option>Monthly</option>
                          <option>Quarterly</option>
                        </select>
                      )}
                    </div>
                    <div className="mt-5 flex gap-4 text-[9px] text-[#7f868b]">
                      <span>
                        <i className="mr-1.5 inline-block h-2 w-2 rounded-sm bg-[#16a065]" />
                        Revenue
                      </span>
                      <span>
                        <i className="mr-1.5 inline-block h-2 w-2 rounded-sm bg-[#3b82f6]" />
                        Expenses
                      </span>
                      {compareEvents && (
                        <span>
                          <i className="mr-1.5 inline-block h-2 w-2 rounded-sm bg-[#203b69]" />
                          Allocated budget
                        </span>
                      )}
                    </div>
                    <div className="mt-5 flex h-[185px] gap-3">
                      <div className="flex flex-col justify-between pb-6 text-[9px] text-[#9aa1a6]">
                        {[1, 0.75, 0.5, 0.25, 0].map((n) => (
                          <span key={n}>{money(chartMax * n)}</span>
                        ))}
                      </div>
                      <div className="relative flex flex-1 items-end justify-around border-b border-[#e5eef5] pb-6">
                        {[0, 1, 2, 3].map((n) => (
                          <div
                            key={n}
                            className="absolute right-0 left-0 border-t border-dashed border-[#edf3f8]"
                            style={{ bottom: `${25 + n * 22}%` }}
                          />
                        ))}
                        {(compareEvents
                          ? [...selected.events]
                          : period === "Monthly"
                            ? [
                                "Jan",
                                "Feb",
                                "Mar",
                                "Apr",
                                "May",
                                "Jun",
                                "Jul",
                                "Aug",
                                "Sep",
                                "Oct",
                                "Nov",
                                "Dec",
                              ]
                            : ["Q1", "Q2", "Q3", "Q4"]
                        ).map((m, i) => (
                          <div
                            key={m}
                            className="relative flex h-full w-full items-end justify-center gap-1"
                          >
                            {compareEvents && (
                              <ChartBar
                                title={`Allocated budget: ${money(Number("allocation" in chartData[i] ? chartData[i].allocation : 0))}`}
                                aria-label={`${m} allocated budget: ${money(Number("allocation" in chartData[i] ? chartData[i].allocation : 0))}`}
                                className="column-enter z-10 w-[22%] max-w-5 rounded-t bg-[#203b69]"
                                style={{
                                  height: `${(Number("allocation" in chartData[i] ? chartData[i].allocation : 0) / chartMax) * 100}%`,
                                }}
                              />
                            )}
                            <ChartBar
                              title={`Revenue: ${money(chartData[i].revenue)}`}
                              className="column-enter z-10 w-[22%] max-w-5 rounded-t bg-[#16a065]"
                              style={{ height: `${(chartData[i].revenue / chartMax) * 100}%` }}
                            />
                            <ChartBar
                              title={`Expenses: ${money(chartData[i].expenses)}`}
                              className="column-enter z-10 w-[22%] max-w-5 rounded-t bg-[#3b82f6]"
                              style={{ height: `${(chartData[i].expenses / chartMax) * 100}%` }}
                            />
                            <span className="absolute -bottom-5 text-[8px] text-[#949a9e]">
                              {m}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-1.5 text-[9px] text-[#878f94]">
                      <span className="h-1 w-1 rounded-full bg-[#788995]" />
                      FY{year.slice(2)}/{String(Number(year) + 1).slice(2)} ·{" "}
                      {compareEvents
                        ? "Event comparison"
                        : `${period.toLowerCase()} financial activity`}
                    </div>
                  </section>
                )}
                <section className="rounded-xl border border-[#e2eaf2] bg-white p-5">
                  <div className="flex justify-between">
                    <div>
                      <h2 className="text-sm font-bold">Where the budget goes</h2>
                      <p className="mt-1.5 text-[10px] text-[#8e9498]">
                        {scoped ? "Expenses by cost category" : "Allocation by department type"}
                      </p>
                    </div>
                  </div>
                  {scoped ? (
                    <CostPie rows={rows} />
                  ) : (
                    <DonutChart
                      label="Allocation by department type"
                      items={["Event", "Supporting", "Client-Facing"].map((cat) => ({
                        name: cat,
                        value: departments
                          .filter((d) => d.category === cat && (!scoped || d._id === dept))
                          .reduce((a, d) => a + (data.allocations[d._id] || 0), 0),
                      }))}
                    />
                  )}
                </section>
              </div>
              {!simpleDashboard && (
                <section className="overflow-hidden rounded-xl border border-[#e2eaf2] bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-3 p-5">
                    <div>
                      <h2 className="text-sm font-bold">
                        {scoped && selected.events.length
                          ? "Event performance"
                          : "Department overview"}
                      </h2>
                      <p className="mt-1.5 text-[10px] text-[#8e9498]">
                        {scoped
                          ? "Department financial summary."
                          : "Allocation, income, and spending by department."}
                      </p>
                    </div>
                  </div>
                  <div className="overflow-auto">
                    <table className="w-full text-left text-[11px] whitespace-nowrap">
                      <thead className="border-y border-[#eaf0f5] bg-white text-[9px] font-medium text-[#8d959b]">
                        <tr>
                          {[
                            "DEPARTMENT / EVENT",
                            "ALLOCATION",
                            "REVENUE",
                            "EXPENSES",
                            "BUDGET USED",
                            "STATUS",
                            "",
                          ].map((t) => (
                            <th key={t} className="px-5 py-3 font-medium">
                              {t}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(scoped && selected.events.length
                          ? selected.events.map((e) => ({
                              id: e,
                              name: e,
                              category: "Event",
                              allocation: allocation / selected.events.length,
                              rs: rows.filter((r) => r.event === e),
                            }))
                          : departments
                              .filter((d) => !scoped || d._id === dept)
                              .map((d) => ({
                                id: d._id,
                                name: d.name,
                                category: d.category,
                                allocation: data.allocations[d._id] || 0,
                                rs: data.rows.filter((r) => r.departmentId === d._id),
                              }))
                        ).map((d) => {
                          const rev = sum("Revenue", d.rs),
                            exp = sum("Expense", d.rs),
                            pct =
                              d.allocation + rev
                                ? Math.round((exp / (d.allocation + rev)) * 100)
                                : 0
                          return (
                            <tr
                              key={d.id}
                              className="border-b border-[#edf3f8] last:border-0 hover:bg-white"
                            >
                              <td className="px-5 py-4">
                                <button
                                  className="flex items-center gap-3"
                                  onClick={() => {
                                    if (scoped && selected.events.length) {
                                      setEvent(d.name)
                                      navigate("ledger")
                                    } else navigate("department", d.id)
                                  }}
                                >
                                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[11px] font-bold text-[#203b69]">
                                    {d.name.slice(0, 2).toUpperCase()}
                                  </span>
                                  <span className="text-left">
                                    <strong className="block text-[11px] font-semibold">
                                      {d.name}
                                    </strong>
                                    <small className="mt-0.5 block text-[9px] text-[#959da3]">
                                      {d.category} department
                                    </small>
                                  </span>
                                </button>
                              </td>
                              <td className="px-5">{money(d.allocation)}</td>
                              <td className="px-5 text-emerald-700">{money(rev)}</td>
                              <td className="px-5 text-blue-700">{money(exp)}</td>
                              <td className="min-w-32 px-5">
                                <div className="flex items-center gap-2">
                                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white">
                                    <ChartBar
                                      title={`${d.name} expenses: ${money(exp)}`}
                                      className="bar-enter h-full rounded-full bg-[#25b5e1]"
                                      style={{ width: `${Math.min(pct, 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-[9px] text-[#748aa0]">{pct}%</span>
                                </div>
                              </td>
                              <td className="px-5">
                                <span
                                  className={cx(
                                    "rounded-full px-2 py-1 text-[9px]",
                                    pct > 85
                                      ? "bg-white text-[#a78b45]"
                                      : "bg-white text-[#1880a5]",
                                  )}
                                >
                                  • {pct > 100 ? "Over budget" : pct > 85 ? "At risk" : "On track"}
                                </span>
                              </td>
                              <td className="pr-5">
                                <button
                                  aria-label={`Open ${d.name}`}
                                  onClick={() => {
                                    if (scoped && selected.events.length) {
                                      setEvent(d.name)
                                      navigate("ledger")
                                    } else navigate("department", d.id)
                                  }}
                                >
                                  <ArrowUpRight size={14} className="text-[#9aa3a9]" />
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-between border-t border-[#eaf0f5] px-5 py-3 text-[9px] text-[#90989e]">
                    <span>
                      {scoped ? "Your department at a glance" : "Showing all 11 departments"}
                    </span>
                    <span>Updated just now</span>
                  </div>
                </section>
              )}
              <div className="mt-5 flex items-center gap-2 text-[10px] text-[#899299]">
                <ShieldCheck size={13} />
                Financial overview<span className="ml-auto">All amounts in EUR (€)</span>
              </div>
            </>
          )}
          {page === "allocations" && board && (
            <section className="rounded-xl border border-[#e2eaf2] bg-white p-5">
              <h2 className="mb-2 text-sm font-bold">ESADE funding allocation matrix</h2>
              <p className="mb-5 text-xs text-[#889197]">
                Edit allocations below. Your changes are saved automatically.
              </p>
              <AllocationDonut data={data} />
              <div className="overflow-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white text-[#748aa0]">
                    <tr>
                      {["Department", "Classification", "ESADE allocation (€)", "Share"].map(
                        (t) => (
                          <th className="p-3" key={t}>
                            {t}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {departments.map((d) => (
                      <tr className="border-b border-[#e9edf0]" key={d._id}>
                        <td className="p-3 font-semibold">{d.name}</td>
                        <td className="p-3 text-[#828c93]">{d.category}</td>
                        <td className="p-3">
                          <input
                            aria-label={`${d.name} allocation`}
                            type="number"
                            min="0"
                            value={data.allocations[d._id] || 0}
                            onChange={(e) =>
                              save({
                                ...data,
                                allocations: {
                                  ...data.allocations,
                                  [d._id]: Math.max(0, Number(e.target.value)),
                                },
                              })
                            }
                            className="w-32 rounded-md border border-[#d8dee3] px-3 py-2 outline-[#788c9b]"
                          />
                        </td>
                        <td className="p-3">
                          {allocation
                            ? (((data.allocations[d._id] || 0) / allocation) * 100).toFixed(1)
                            : 0}
                          %
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
          {page === "tutorial" && <Tutorial role={role} />}
          {page === "history" && <History store={store} departmentId={dept} year={year} />}
          {page === "access" && <Access key={role} role={role} departmentId={dept} />}
          {page === "overview" && <OverviewBreakdowns data={data} />}
          {page === "event-budgets" && isEventDepartment(dept) && (
            <EventBudgets
              data={data}
              departmentId={dept}
              save={save}
              editable={board || role === dept}
            />
          )}
          {page === "yoy" && admin && (
            <section className="rounded-xl border border-[#e2eaf2] bg-white p-5">
              <h2 className="mb-5 text-sm font-bold">2025 → 2026 performance comparison</h2>
              <div className="overflow-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-white text-[#848d94]">
                    <tr>
                      {[
                        "Department",
                        "2025 budget",
                        "2026 budget",
                        "Absolute change",
                        "Variance",
                        "Growth comparison",
                      ].map((t) => (
                        <th className="p-3" key={t}>
                          {t}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...departments, { _id: "total", name: "Association total" }].map((d) => {
                      const total = (y: string) => {
                        const v = store[y] || freshYear(y)
                        return (
                          (d._id === "total"
                            ? Object.values(v.allocations).reduce((a, b) => a + b, 0)
                            : v.allocations[d._id] || 0) +
                          v.rows
                            .filter(
                              (r) =>
                                r.type === "Revenue" &&
                                (d._id === "total" || r.departmentId === d._id),
                            )
                            .reduce((a, r) => a + r.amount, 0)
                        )
                      }
                      const a = total("2025"),
                        b = total("2026")
                      return (
                        <tr key={d._id} className="border-b border-[#e9edf0]">
                          <td className="p-4 font-semibold">{d.name}</td>
                          <td className="p-3">{money(a)}</td>
                          <td className="p-3">{money(b)}</td>
                          <td className="p-3">{money(b - a)}</td>
                          <td className="p-3 text-[#627684]">
                            {a ? `${(((b - a) / a) * 100).toFixed(1)}%` : "-"}
                          </td>
                          <td className="w-40 p-3">
                            <ChartBar
                              title={`2025 budget: ${money(a)}`}
                              className="bar-enter h-2 rounded bg-white"
                              style={{
                                width: `${Math.max(a, b) ? (a / Math.max(a, b)) * 100 : 0}%`,
                              }}
                            />
                            <ChartBar
                              title={`2026 budget: ${money(b)}`}
                              className="bar-enter mt-1 h-2 rounded bg-[#525f69]"
                              style={{
                                width: `${Math.max(a, b) ? (b / Math.max(a, b)) * 100 : 0}%`,
                              }}
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-[10px] text-[#838d94]">
                Total budget includes ESADE allocations and revenue. Light green: 2025 · Dark green:
                2026.
              </p>
            </section>
          )}
          {scoped && page === "department" && (
            <button
              onClick={() => {
                setEvent(selected.events[0] || "Operations")
                navigate("ledger")
              }}
              className="mt-5 flex items-center gap-2 rounded-lg bg-[#203b69] px-4 py-3 text-xs text-white"
            >
              <FolderKanban size={15} />
              Open {selected.events.length ? "event ledger" : "expense ledger"}
              <ArrowRight size={14} />
            </button>
          )}
          {page === "ledger" &&
            data.rows
              .filter((r) => r.departmentId === dept && r.type === "Expense")
              .reduce((n, r) => n + r.amount, 0) > (data.allocations[dept] || 0) && (
              <p
                role="alert"
                className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
              >
                Department expenses exceed the assigned budget. You can still record expenses.
              </p>
            )}
          {page === "ledger" &&
            (() => {
              const active = data.rows.filter(
                  (r) =>
                    r.departmentId === dept &&
                    r.event === event &&
                    (event !== "Idea Up" || r.phase === phase),
                ),
                exp = sum("Expense", active),
                rev = sum("Revenue", active)
              return (
                <>
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      {selected.events.map((e) => (
                        <button
                          key={e}
                          onClick={() => setEvent(e)}
                          className={cx(
                            "rounded-lg border px-4 py-2 text-xs",
                            event === e
                              ? "border-[#203b69] bg-[#203b69] text-white"
                              : "border-[#dae0e4] bg-white",
                          )}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                    <button
                      className="flex items-center gap-2 text-xs"
                      aria-expanded={panel}
                      aria-controls="income-statement"
                      onClick={() => setPanel(!panel)}
                    >
                      <Settings2 size={15} />
                      {panel ? "Hide income statement" : "See income statement"}
                    </button>
                  </div>
                  {event === "Idea Up" && (
                    <div className="mb-5 flex flex-wrap gap-1 border-b border-[#dceaf2]">
                      {phases.map((p) => (
                        <button
                          key={p}
                          onClick={() => setPhase(p)}
                          className={cx(
                            "border-b-2 px-4 py-3 text-xs",
                            phase === p
                              ? "border-[#203b69] font-bold text-[#203b69]"
                              : "border-transparent text-[#8b9399]",
                          )}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  )}
                  <div
                    className={cx(
                      "grid transition-[grid-template-columns,gap] duration-300 ease-in-out motion-reduce:transition-none",
                      panel
                        ? "gap-5 xl:grid-cols-[minmax(0,1fr)_280px]"
                        : "gap-0 xl:grid-cols-[minmax(0,1fr)_0px]",
                    )}
                  >
                    <section className="overflow-hidden rounded-xl border border-[#dceaf2] bg-white">
                      <div className="flex justify-between p-5">
                        <div>
                          <h2 className="text-sm font-bold">Financial ledger</h2>
                          <p className="mt-1 text-[10px] text-[#8b949a]">
                            Edit amounts, categories, and payment status.
                          </p>
                        </div>
                        <span className="text-xs text-[#8a949b]">{active.length} entries</span>
                      </div>
                      <div className="overflow-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-white text-[10px] text-[#889198]">
                            <tr>
                              {["Line item", "Type", "Amount (€)", "Status", "Details", ""].map(
                                (t) => (
                                  <th className="p-3" key={t}>
                                    {t}
                                  </th>
                                ),
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {active.map((r) => (
                              <React.Fragment key={r._id}>
                                <tr className="border-b border-[#edf4f9]">
                                  <td className="p-3">
                                    <input
                                      aria-label="Line item name"
                                      value={r.name}
                                      onChange={(e) => updateRow(r._id, { name: e.target.value })}
                                      className="w-full min-w-32 rounded-md border border-slate-300 bg-white px-3 py-2 outline-[#486a9e]"
                                    />
                                  </td>
                                  <td className="p-3">
                                    <select
                                      aria-label="Entry type"
                                      value={r.type}
                                      onChange={(e) =>
                                        updateRow(r._id, {
                                          type: e.target.value as LedgerRow["type"],
                                        })
                                      }
                                      className="bg-transparent"
                                    >
                                      <option>Expense</option>
                                      {selected.category !== "Supporting" && (
                                        <option>Revenue</option>
                                      )}
                                    </select>
                                  </td>
                                  <td className="p-3">
                                    <input
                                      aria-label={`${r.name} amount`}
                                      type="number"
                                      min="0"
                                      value={r.amount}
                                      onChange={(e) =>
                                        updateRow(r._id, {
                                          amount: Math.max(0, Number(e.target.value)),
                                        })
                                      }
                                      className="w-24 rounded border border-[#dee4e8] p-2 outline-[#486a9e]"
                                    />
                                  </td>
                                  <td className="p-3">
                                    <div className="relative inline-flex">
                                      <select
                                        aria-label="Payment status"
                                        value={r.status}
                                        onChange={(e) =>
                                          updateRow(r._id, { status: e.target.value })
                                        }
                                        className={cx(
                                          "h-8 w-[102px] appearance-none rounded-lg border py-1.5 pl-3 pr-7 text-[11px] font-medium outline-none",
                                          r.status === "Pending"
                                            ? "border-orange-200 bg-white text-orange-800"
                                            : r.status === "Received"
                                              ? "border-blue-200 bg-white text-blue-900"
                                              : "border-slate-200 bg-white text-slate-700",
                                        )}
                                      >
                                        {["Pending", "Paid", "Received"].map((s) => (
                                          <option key={s}>{s}</option>
                                        ))}
                                      </select>
                                      <ChevronDown
                                        size={12}
                                        className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-current"
                                      />
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    {r.type === "Expense" && (
                                      <button
                                        aria-expanded={openExpenses.includes(r._id)}
                                        aria-controls={`details-${r._id}`}
                                        className="flex items-center gap-1 rounded px-2 py-2 whitespace-nowrap text-blue-800 hover:bg-blue-50"
                                        onClick={() =>
                                          setOpenExpenses((v) =>
                                            v.includes(r._id)
                                              ? v.filter((id) => id !== r._id)
                                              : [...v, r._id],
                                          )
                                        }
                                      >
                                        <ChevronDown
                                          size={14}
                                          className={cx(
                                            "transition-transform",
                                            openExpenses.includes(r._id) && "rotate-180",
                                          )}
                                        />
                                        Details
                                      </button>
                                    )}
                                  </td>
                                  <td className="p-3">
                                    <button
                                      aria-label={`Delete ${r.name}`}
                                      onClick={() => setDeleting(r)}
                                    >
                                      <Trash size={17} className="text-red-600" />
                                    </button>
                                  </td>
                                </tr>
                                {r.type === "Expense" && (
                                  <tr id={`details-${r._id}`} className="bg-white">
                                    <td colSpan={6} className="p-0">
                                      <div
                                        inert={!openExpenses.includes(r._id)}
                                        className={cx(
                                          "grid bg-white transition-[grid-template-rows,opacity] duration-300 ease-in-out motion-reduce:transition-none",
                                          openExpenses.includes(r._id)
                                            ? "grid-rows-[1fr] opacity-100"
                                            : "grid-rows-[0fr] opacity-0",
                                        )}
                                      >
                                        <div className="overflow-hidden">
                                          <div className="border-b border-slate-200 px-4 pb-4">
                                            <ExpenseDetails
                                              row={r}
                                              onSave={(patch) => updateRow(r._id, patch)}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <button
                        className="m-4 flex items-center gap-2 rounded-lg border border-dashed border-[#a7dced] px-4 py-2 text-xs text-[#203b69]"
                        onClick={() => setAdding(true)}
                      >
                        <Plus size={14} />
                        Add expense
                      </button>
                      <div className="flex justify-between border-t border-[#dfedf5] bg-white p-4 text-xs">
                        <span>
                          Total expenses <strong className="ml-2">{money(exp)}</strong>
                        </span>
                        <span>
                          Revenue <strong className="ml-2">{money(rev)}</strong>
                        </span>
                      </div>
                    </section>
                    <div
                      id="income-statement"
                      inert={!panel}
                      className={cx(
                        "grid min-w-0 transition-[grid-template-rows,opacity] duration-300 ease-in-out motion-reduce:transition-none xl:block",
                        panel ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                      )}
                    >
                      <div className="h-full min-h-0 overflow-hidden">
                        <aside className="rounded-xl border border-[#dceaf2] bg-white p-5 xl:w-[280px]">
                          <div className="flex justify-between">
                            <h2 className="text-sm font-bold">Income statement</h2>
                            <button
                              aria-label="Close income statement"
                              onClick={() => setPanel(false)}
                            >
                              <PanelRightClose size={16} />
                            </button>
                          </div>
                          <div className="mt-7" />
                          {(() => {
                            const ea =
                              (isEventDepartment(dept)
                                ? data.eventAllocations?.[`${dept}:${event}`] || 0
                                : data.allocations[dept] || 0) / (event === "Idea Up" ? 6 : 1)
                            return (
                              <div className="space-y-3 text-xs">
                                <div className="flex justify-between">
                                  <span>Budget allocation</span>
                                  <strong>{money(ea)}</strong>
                                </div>
                                <div className="flex justify-between text-emerald-700">
                                  <span>Event revenue</span>
                                  <strong className="text-emerald-700">{money(rev)}</strong>
                                </div>
                                <div className="border-t border-slate-200 pt-3">
                                  {active
                                    .filter((r) => r.type === "Expense")
                                    .map((r) => (
                                      <div className="mb-2 flex justify-between" key={r._id}>
                                        <span>{r.name}</span>
                                        <span>−{money(r.amount)}</span>
                                      </div>
                                    ))}
                                </div>
                                <div
                                  className={cx(
                                    "flex justify-between border-t-2 pt-3 font-bold",
                                    ea + rev - exp >= 0 ? "text-emerald-600" : "text-red-500",
                                  )}
                                >
                                  <span>{ea + rev - exp >= 0 ? "Surplus" : "Loss"}</span>
                                  <span>{money(ea + rev - exp)}</span>
                                </div>
                              </div>
                            )
                          })()}
                          <h3 className="mt-7 mb-4 text-[10px] font-bold tracking-widest text-[#8b959d] uppercase">
                            Cost breakdown
                          </h3>
                          <CostPie rows={active} />
                        </aside>
                      </div>
                    </div>
                  </div>
                </>
              )
            })()}
          {adding && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
              <form
                className="w-full max-w-md space-y-4 rounded-xl bg-white p-6"
                onSubmit={(e) => {
                  e.preventDefault()
                  const f = new FormData(e.currentTarget)
                  save({
                    ...data,
                    rows: [
                      ...data.rows,
                      {
                        _id: crypto.randomUUID(),
                        departmentId: dept,
                        event,
                        phase: event === "Idea Up" ? phase : "Overview",
                        name: String(f.get("title")).trim(),
                        description: String(f.get("description")).trim(),
                        recipient: String(f.get("recipient")).trim(),
                        date: String(f.get("date")),
                        amount: Number(f.get("amount")),
                        type: "Expense",
                        status: "Pending",
                      },
                    ],
                  })
                  setAdding(false)
                }}
              >
                <h2 className="font-bold">Add expense</h2>
                {[
                  ["title", "Title"],
                  ["description", "Description"],
                  ["recipient", "Expense recipient"],
                  ["amount", "Amount (€)"],
                  ["date", "Date"],
                ].map(([name, label]) => (
                  <label key={name} className="block text-sm">
                    {label}
                    <input
                      name={name}
                      required={name !== "recipient"}
                      type={name === "date" ? "date" : name === "amount" ? "number" : "text"}
                      min={name === "amount" ? "0.01" : undefined}
                      step={name === "amount" ? "0.01" : undefined}
                      defaultValue={name === "date" ? today() : undefined}
                      className="mt-1 block w-full rounded border p-2"
                    />
                  </label>
                ))}
                <p className="text-xs text-slate-500">
                  Attach up to 5 PDFs or images from Expense details after saving.
                </p>
                <div className="flex gap-4">
                  <button className="rounded bg-[#203b69] px-4 py-2 text-white">
                    Save expense
                  </button>
                  <button type="button" onClick={() => setAdding(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
      {deleting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-5 pt-16 backdrop-blur-sm"
          onClick={() => setDeleting(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            aria-describedby="delete-description"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Escape") setDeleting(null)
              if (e.key === "Tab") {
                const buttons = Array.from(e.currentTarget.querySelectorAll("button"))
                if (e.shiftKey && document.activeElement === buttons[0]) {
                  e.preventDefault()
                  buttons.at(-1)?.focus()
                } else if (!e.shiftKey && document.activeElement === buttons.at(-1)) {
                  e.preventDefault()
                  buttons[0]?.focus()
                }
              }
            }}
          >
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <Trash size={24} />
            </div>
            <h2 id="delete-title" className="text-xl font-semibold text-slate-900">
              Delete expense?
            </h2>
            <p id="delete-description" className="mt-3 text-sm leading-6 text-slate-600">
              Delete <strong className="font-semibold text-slate-800">{deleting.name}</strong> and
              all its attachments? This action cannot be undone.
            </p>
            <div className="mt-7 flex justify-end gap-3">
              <button
                autoFocus
                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2"
                onClick={() => setDeleting(null)}
              >
                Cancel
              </button>
              <button
                className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                onClick={() => {
                  save({ ...data, rows: data.rows.filter((r) => r._id !== deleting._id) })
                  setDeleting(null)
                }}
              >
                <Trash size={16} />
                Delete expense
              </button>
            </div>
          </section>
        </div>
      )}
      <footer className="fixed right-0 bottom-0 left-0 z-30 flex justify-center border-t border-[#e3edf4] bg-white px-6 py-5 text-center text-[#758ca1] lg:left-[232px]">
        <a
          href="https://ennova.club"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-3 hover:text-[#203b69]"
        >
          <span className="text-sm font-medium">Made by</span>
          <span className="relative block h-[25px] w-[123px] overflow-hidden">
            <img
              src="/social-work-2.png"
              alt="Esade Student Association Ennova"
              className="absolute top-1/2 left-1/2 h-[123px] w-[123px] -translate-x-1/2 -translate-y-1/2 object-contain"
            />
          </span>
        </a>
      </footer>
      {notice && (
        <div
          role="status"
          className="fixed right-6 bottom-14 z-50 max-w-sm rounded-xl bg-[#203b69] px-5 py-4 text-xs text-white shadow-lg"
        >
          {notice}
        </div>
      )}
    </div>
  )
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
