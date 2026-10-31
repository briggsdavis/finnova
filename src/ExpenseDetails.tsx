import { useState } from "react"
import { isEventDepartment, type LedgerRow } from "./mockData"
export const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}
export function ExpenseDetails({
  row,
  onSave,
}: {
  row: LedgerRow
  onSave: (patch: Partial<LedgerRow>) => void
}) {
  const [error, setError] = useState("")
  return (
    <div className="w-full bg-white">
      <form
        id={`expense-form-${row._id}`}
        className="grid gap-4 py-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault()
          const f = new FormData(e.currentTarget)
          try {
            onSave({
              description: String(f.get("description")).trim(),
              recipient: String(f.get("recipient")).trim(),
              date: String(f.get("date")),
            })
            setError("Saved")
          } catch {
            setError("Unable to save. Browser storage may be full.")
          }
        }}
      >
        {[
          ["description", "Description", row.description || ""],
          ["recipient", "Expense recipient", row.recipient || ""],
          ["date", "Date", row.date || today()],
        ].map(([name, label, value]) => (
          <label
            key={name}
            className={name === "description" ? "block text-xs sm:col-span-2" : "block text-xs"}
          >
            {label}
            {name === "description" ? (
              <textarea
                name={name}
                defaultValue={value}
                required
                rows={3}
                className="mt-1 block w-full resize-y rounded-md border border-slate-300 bg-white p-3 text-sm outline-[#486a9e]"
              />
            ) : (
              <input
                name={name}
                defaultValue={value}
                required={name !== "recipient"}
                type={name === "date" ? "date" : "text"}
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white p-2 outline-[#486a9e]"
              />
            )}
          </label>
        ))}
      </form>
      <label className="block text-xs">
        Invoices / receipts (PDF or images, maximum 5)
        <input
          aria-label="Upload invoices or receipts"
          type="file"
          multiple
          accept="application/pdf,image/*"
          className="my-3 block w-full text-xs text-slate-500 file:mr-3 file:cursor-pointer file:rounded-lg file:border file:border-blue-200 file:bg-blue-50 file:px-4 file:py-3 file:text-sm file:font-semibold file:text-[#203b69] hover:file:bg-blue-100"
          onChange={async (e) => {
            const files = Array.from(e.target.files || [])
            e.target.value = ""
            if (files.length + (row.attachments?.length || 0) > 5) {
              setError("Maximum 5 files per expense.")
              return
            }
            if (files.some((f) => f.type !== "application/pdf" && !f.type.startsWith("image/"))) {
              setError("Choose PDF or image files.")
              return
            }
            try {
              const attachments = await Promise.all(
                files.map(
                  (f) =>
                    new Promise<{ name: string; data: string }>((resolve, reject) => {
                      const reader = new FileReader()
                      reader.onload = () => resolve({ name: f.name, data: String(reader.result) })
                      reader.onerror = reject
                      reader.readAsDataURL(f)
                    }),
                ),
              )
              onSave({ attachments: [...(row.attachments || []), ...attachments] })
              setError("Files saved")
            } catch {
              setError("Unable to save files. Browser storage may be full.")
            }
          }}
        />
      </label>
      {row.attachments?.map((f, i) => (
        <div key={i} className="my-2 flex gap-3 text-xs">
          <a className="text-blue-800 underline" href={f.data} download={f.name}>
            {f.name}
          </a>
          <button
            aria-label={`Remove ${f.name}`}
            onClick={() => onSave({ attachments: row.attachments?.filter((_, n) => n !== i) })}
          >
            Remove
          </button>
        </div>
      ))}
      {error && <output className="block py-2 text-xs">{error}</output>}
      <div className="mt-4 border-t border-slate-200 pt-4">
        <button
          type="submit"
          form={`expense-form-${row._id}`}
          className="rounded-lg bg-[#203b69] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2d4f85]"
        >
          Save details
        </button>
      </div>
    </div>
  )
}
function FAQ({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-slate-200">
      <button
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left text-sm font-semibold"
      >
        {question}
        <span className={`text-lg transition-transform duration-300 ${open ? "rotate-45" : ""}`}>
          +
        </span>
      </button>
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out motion-reduce:transition-none ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
        inert={!open}
      >
        <div className="overflow-hidden">
          <p className="pb-5 text-sm leading-6 text-slate-600">{answer}</p>
        </div>
      </div>
    </div>
  )
}
export function Tutorial({ role }: { role: string }) {
  const board = role === "president" || role === "admin",
    events = isEventDepartment(role)
  const common = [
    [
      "What information does an expense need?",
      "Enter a title, description, amount, and date. The date starts as today and can be edited. The recipient and receipts are optional.",
    ],
    [
      "How do I edit an expense?",
      "Edit the outlined title, amount, and status directly in the row. Select Details to edit the description, recipient, and date underneath, then save details.",
    ],
    [
      "How do I attach invoices or receipts?",
      "Expand Details and choose up to five PDF or image files. Download or remove attachments from the same area.",
    ],
    [
      "What happens if spending exceeds the budget?",
      "A warning appears when department expenses exceed the board-assigned budget. You can still save the expense.",
    ],
    [
      "How do I delete an expense?",
      "Select the red trash can and confirm deletion. The expense and its attachments will be permanently removed.",
    ],
    [
      "Which years are available in History?",
      "History includes 2024/25 and 2025/26. Choose a year to see its cost breakdown.",
    ],
    [
      "Where is my work saved?",
      "Changes and attachments are saved in this browser on this device. Export report downloads financial figures, but does not include uploaded receipts.",
    ],
  ]
  const faqs = board
    ? [
        [
          "How do I allocate funding?",
          "Open Budget allocations and enter the institutional allocation for each department. Finance has a zero initial allocation. Changes save automatically.",
        ],
        [
          "How do event departments use their allocation?",
          "Their heads distribute the department budget between events in Budget Allocation. Event allocations cannot exceed available department funding.",
        ],
        [
          "How do non-event departments record costs?",
          "Marketing, Partnerships, Consulting, Finance, Data and AI, and HR use Expenses directly. They have no event creation or event budget allocation page.",
        ],
        [
          "How do I review a department?",
          "Expand its name in the sidebar and open Dashboard, History, an event, or Expenses. Expense Details contains descriptions, recipients, dates, and receipts.",
        ],
        [
          "How do I manage access?",
          "Use Access to assign department heads, sub-heads, and members. Only the President can appoint Institutional Board members.",
        ],
        [
          "What access does Finance have?",
          "Finance retains the association-wide Overview and Progress reports, as well as its own department Expenses tab.",
        ],
        ...common.slice(3),
      ]
    : events
      ? [
          [
            "How do I create or rename an event?",
            "Open Budget Allocation, select Add event, and enter a unique name. Use Edit beside an existing event to rename it.",
          ],
          [
            "How do I distribute my department budget?",
            "Budget Allocation displays board-assigned funds and the unassigned balance. Enter an allocation beside each event within the remaining funds.",
          ],
          [
            "Can I delete an event?",
            "Use Delete in Budget Allocation. Events with expenses cannot be deleted. For events without expenses, confirm before all their information is removed.",
          ],
          [
            "Where do I record event expenses?",
            "Choose the event in the sidebar, select a phase if applicable, and choose Add expense.",
          ],
          ...common,
        ]
      : [
          [
            "Where do I record department expenses?",
            "Open Expenses in the sidebar and choose Add expense. Your department records costs directly, without creating events.",
          ],
          [
            "Who sets my department budget?",
            "The Institutional Board assigns your department funding. Your Dashboard shows the allocation, total spending, and remaining balance.",
          ],
          [
            "Why is there no Budget Allocation page?",
            "Your department does not distribute funds between events. All expenses count directly toward its assigned department budget.",
          ],
          ...(role === "finance"
            ? [
                [
                  "How do I access association reporting?",
                  "Use Overview and Progress for association-wide figures. Expand Finance in the department list and choose Expenses for your own department.",
                ],
              ]
            : []),
          ...common,
        ]
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 p-5">
        <h2 className="mb-4 font-bold">
          {board ? "Institutional Board" : events ? "Event department head" : "Department head"}{" "}
          tutorial
        </h2>
        <div
          aria-label="Tutorial video placeholder"
          className="flex aspect-video flex-col items-center justify-center gap-3 rounded-xl bg-slate-100 text-slate-600"
        >
          <span className="text-4xl">▶</span>
          <p>Tutorial video coming soon</p>
        </div>
      </section>
      <section className="rounded-xl border border-slate-200 p-5">
        <h2 className="mb-2 font-bold">Frequently asked questions</h2>
        {faqs.map(([question, answer]) => (
          <FAQ key={question} question={question} answer={answer} />
        ))}
      </section>
    </div>
  )
}
