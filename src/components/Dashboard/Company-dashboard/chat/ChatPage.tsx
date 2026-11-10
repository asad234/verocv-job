"use client"

// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Chat/ChatPage.tsx   (NEW)
// WHAT IT DOES:   The chat page — same component for employees, managers and
//                 admins (the server decides who you can talk to).
//
//   <ChatPage language="sv" />                      normal
//   <ChatPage language="en" startWithUserId="30" /> opens the chat with user 30
//   …or add ?chat=30 to the page URL.
//
// New messages arrive by polling (every 3 s in an open chat, 10 s for the list),
// paused while the tab is hidden. Everyone's chat status (Available, In a
// meeting, Not at the office…) refreshes with the list; set your own with the
// status chip next to the title (components/Chat/Presence.tsx).
// ══════════════════════════════════════════════════════════════════════

import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import type React from "react"
import { Icon } from "@iconify/react"
import {
  CHAT_MAX_LENGTH,
  chatApi,
  notifyChatUnreadChanged,
  type ChatConversation,
  type ChatMessage,
  type ChatPerson,
  type ChatRelation,
  type ChatRole,
} from "@/utils/chat"
import { isUnavailable, PresenceDot, presenceLabel, presenceLine, PresencePicker } from "./Presence"


const NAVY = "rgb(5,22,80)"
type Lang = "en" | "sv"

/* ─── Texts ─── */
const TX = {
  en: {
    title: "Chats",
    newChat: "New chat",
    search: "Search chats",
    searchPeople: "Search people",
    noChats: "No chats yet",
    noChatsHint: "Start a conversation with your team.",
    noMatches: "No chats match your search.",
    noContacts: "There's nobody you can message yet.",
    noContactsHint: "Chats open up once you're connected — for example when an employee accepts a manager's invitation.",
    pick: "Select a chat",
    pickHint: "Choose a conversation on the left, or start a new one.",
    back: "Back",
    you: "You",
    write: "Write a message…",
    send: "Send",
    sending: "Sending…",
    sent: "Sent",
    seen: "Seen",
    failed: "Not sent",
    retry: "Retry",
    remove: "Remove",
    loadEarlier: "Load earlier messages",
    newMessages: "New messages",
    today: "Today",
    yesterday: "Yesterday",
    readOnly: (n: string) => `You're no longer connected with ${n}, so you can't reply. The conversation stays here.`,
    firstMessage: (n: string) => `This is the start of your conversation with ${n}.`,
    loadFailed: "Couldn't load chats.",
    tryAgain: "Try again",
    enterHint: "Enter to send · Shift+Enter for a new line",
    tooLong: (n: number) => `${n} characters too long`,
    awayNotice: (n: string, status: string) => `${n} is ${status.toLowerCase()} — they'll see your message later.`,
    relation: {
      manager: "Your manager",
      employee: "Your employee",
      colleague: "Colleague",
      admin: "Company admin",
      covering: (v?: string) => (v ? `Covering for ${v}` : "Covering"),
      team_manager: "Manager",
      team_employee: (v?: string) => (v ? `Employee · ${v}` : "Employee"),
    },
    role: { employee: "Employee", manager: "Manager", admin: "Admin" },
    groups: { manager: "Your managers", employee: "Your employees", colleague: "Colleagues", admin: "Company admin", covering: "Covering", team_manager: "Managers", team_employee: "Employees" },
  },
  sv: {
    title: "Chattar",
    newChat: "Ny chatt",
    search: "Sök chattar",
    searchPeople: "Sök personer",
    noChats: "Inga chattar än",
    noChatsHint: "Starta en konversation med ditt team.",
    noMatches: "Inga chattar matchar din sökning.",
    noContacts: "Det finns ingen du kan skriva till än.",
    noContactsHint: "Chattar öppnas när ni är kopplade — t.ex. när en medarbetare accepterar en chefs inbjudan.",
    pick: "Välj en chatt",
    pickHint: "Välj en konversation till vänster, eller starta en ny.",
    back: "Tillbaka",
    you: "Du",
    write: "Skriv ett meddelande…",
    send: "Skicka",
    sending: "Skickar…",
    sent: "Skickat",
    seen: "Sett",
    failed: "Inte skickat",
    retry: "Försök igen",
    remove: "Ta bort",
    loadEarlier: "Visa tidigare meddelanden",
    newMessages: "Nya meddelanden",
    today: "Idag",
    yesterday: "Igår",
    readOnly: (n: string) => `Du är inte längre kopplad till ${n}, så du kan inte svara. Konversationen finns kvar här.`,
    firstMessage: (n: string) => `Här börjar din konversation med ${n}.`,
    loadFailed: "Kunde inte ladda chattar.",
    tryAgain: "Försök igen",
    enterHint: "Enter skickar · Shift+Enter ny rad",
    tooLong: (n: number) => `${n} tecken för långt`,
    awayNotice: (n: string, status: string) => `${n} är ${status.toLowerCase()} — meddelandet väntar tills hen är tillbaka.`,
    relation: {
      manager: "Din chef",
      employee: "Din medarbetare",
      colleague: "Kollega",
      admin: "Företagsadmin",
      covering: (v?: string) => (v ? `Ersätter ${v}` : "Ersätter"),
      team_manager: "Chef",
      team_employee: (v?: string) => (v ? `Medarbetare · ${v}` : "Medarbetare"),
    },
    role: { employee: "Medarbetare", manager: "Chef", admin: "Admin" },
    groups: { manager: "Dina chefer", employee: "Dina medarbetare", colleague: "Kollegor", admin: "Företagsadmin", covering: "Du ersätter", team_manager: "Chefer", team_employee: "Medarbetare" },
  },
}
type Tx = (typeof TX)["en"]

const relationLabel = (tx: Tx, p: Pick<ChatPerson, "relation" | "via" | "role">) => {
  const r = p.relation
  if (!r) return tx.role[p.role]
  const v = tx.relation[r]
  return typeof v === "function" ? v(p.via) : v
}

const ROLE_COLOR: Record<ChatRole, { bg: string; fg: string }> = {
  manager: { bg: "rgb(224,231,255)", fg: NAVY },
  employee: { bg: "rgb(204,251,241)", fg: "rgb(15,118,110)" },
  admin: { bg: "rgb(237,233,254)", fg: "rgb(91,33,182)" },
}

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "?"

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()

function Avatar({
  person,
  size = 40,
  showPresence = true,
  language = "en",
}: {
  person: Pick<ChatPerson, "name" | "role" | "presence">
  size?: number
  showPresence?: boolean
  language?: Lang
}) {
  const c = ROLE_COLOR[person.role] ?? ROLE_COLOR.employee
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <div
        className="w-full h-full rounded-full flex items-center justify-center font-semibold select-none"
        style={{ backgroundColor: c.bg, color: c.fg, fontSize: size * 0.36 }}
        aria-hidden
      >
        {initials(person.name)}
      </div>
      {showPresence && person.presence && (
        <PresenceDot presence={person.presence} size={Math.max(10, Math.round(size * 0.3))} overlay language={language} />
      )}
    </div>
  )
}

/* ─── Time helpers ─── */
const locale = (l: Lang) => (l === "sv" ? "sv-SE" : "en-GB")
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()
function dayLabel(iso: string, l: Lang, tx: Tx) {
  const d = new Date(iso)
  const now = new Date()
  const y = new Date(now)
  y.setDate(now.getDate() - 1)
  if (sameDay(d, now)) return tx.today
  if (sameDay(d, y)) return tx.yesterday
  return d.toLocaleDateString(locale(l), {
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(d.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
  })
}
const timeOf = (iso: string, l: Lang) => new Date(iso).toLocaleTimeString(locale(l), { hour: "2-digit", minute: "2-digit" })
function listTime(iso: string, l: Lang, tx: Tx) {
  const d = new Date(iso)
  const now = new Date()
  if (sameDay(d, now)) return timeOf(iso, l)
  const diff = (now.getTime() - d.getTime()) / 864e5
  if (diff < 2 && dayLabel(iso, l, tx) === tx.yesterday) return tx.yesterday
  if (diff < 7) return d.toLocaleDateString(locale(l), { weekday: "short" })
  return d.toLocaleDateString(locale(l), { day: "numeric", month: "short" })
}

/* Links in messages become clickable (http/https only). */
function Linkified({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s<>"']+)/g)
  return (
    <>
      {parts.map((p, i) =>
        /^https?:\/\//.test(p) ? (
          <a key={i} href={p} target="_blank" rel="noopener noreferrer nofollow" className="underline underline-offset-2 break-all">
            {p}
          </a>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  )
}

type Pending = { tempId: string; body: string; createdAt: string; status: "sending" | "failed" }
const visible = () => typeof document === "undefined" || document.visibilityState === "visible"

/* ═════════════════════════════════════════════════════════════════════ */
export default function ChatPage({
  language = "en",
  startWithUserId,
  className = "",
}: {
  language?: Lang | string
  startWithUserId?: string | null
  className?: string
}) {
  const lang: Lang = language === "sv" ? "sv" : "en"
  const tx = TX[lang]

  const [me, setMe] = useState<string | null>(null)
  const [convs, setConvs] = useState<ChatConversation[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState(false)
  const [query, setQuery] = useState("")
  const [mode, setMode] = useState<"list" | "new">("list")
  const [contacts, setContacts] = useState<ChatPerson[] | null>(null)
  const [opening, setOpening] = useState<string | null>(null)

  const [active, setActive] = useState<ChatConversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [pending, setPending] = useState<Pending[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [threadLoading, setThreadLoading] = useState(false)
  const [otherReadAt, setOtherReadAt] = useState<string | null>(null)
  const [canSend, setCanSend] = useState(true)
  const [draft, setDraft] = useState("")
  const [showNewPill, setShowNewPill] = useState(false)

  const drafts = useRef(new Map<string, string>())
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const nearBottom = useRef(true)
  const keepScroll = useRef<{ height: number; top: number } | null>(null)
  const activeIdRef = useRef<string | null>(null)
  activeIdRef.current = active?.id ?? null

  /* ── Conversation list ── */
  const loadList = useCallback(async (quiet = false) => {
    if (!quiet) setListLoading(true)
    try {
      const { me, data } = await chatApi.conversations()
      setMe(me)
      setConvs((prev) => {
        // A chat opened but not yet written in isn't on the server list — keep it.
        const draftOnly = prev.filter((c) => !c.lastMessage && !data.some((d) => d.id === c.id))
        return [...draftOnly, ...data]
      })
      setListError(false)
    } catch {
      if (!quiet) setListError(true)
    } finally {
      if (!quiet) setListLoading(false)
    }
  }, [])

  useEffect(() => {
    loadList()
    const t = window.setInterval(() => visible() && loadList(true), 10_000)
    return () => window.clearInterval(t)
  }, [loadList])

  /* ── Open a chat ── */
  const markRead = useCallback(async (id: string) => {
    try {
      await chatApi.read(id)
      setConvs((cs) => cs.map((c) => (c.id === id ? { ...c, unread: 0 } : c)))
      notifyChatUnreadChanged()
    } catch {
      /* not critical */
    }
  }, [])

  const selectConversation = useCallback(
    async (c: ChatConversation) => {
      if (activeIdRef.current) drafts.current.set(activeIdRef.current, inputRef.current?.value ?? "")
      setActive(c)
      setMode("list")
      setMessages([])
      setPending([])
      setHasMore(false)
      setShowNewPill(false)
      setOtherReadAt(c.otherLastReadAt)
      setCanSend(c.canSend)
      setDraft(drafts.current.get(c.id) ?? "")
      setThreadLoading(true)
      nearBottom.current = true
      try {
        const res = await chatApi.messages(c.id)
        if (activeIdRef.current !== c.id) return
        setMe(res.me)
        setMessages(res.data)
        setHasMore(res.hasMore)
        setOtherReadAt(res.otherLastReadAt)
        setCanSend(res.canSend)
        if (c.unread > 0 || res.data.some((m) => m.senderId !== res.me)) markRead(c.id)
      } catch {
        /* thread shows empty; polling retries */
      } finally {
        if (activeIdRef.current === c.id) setThreadLoading(false)
      }
      window.setTimeout(() => inputRef.current?.focus(), 50)
    },
    [markRead],
  )

  const openWith = useCallback(
    async (userId: string) => {
      setOpening(userId)
      try {
        const conv = await chatApi.open(userId)
        setConvs((cs) => (cs.some((c) => c.id === conv.id) ? cs : [conv, ...cs]))
        await selectConversation(conv)
      } catch {
        /* stays on the picker */
      } finally {
        setOpening(null)
      }
    },
    [selectConversation],
  )

  // ?chat=<userId> (once) or startWithUserId (whenever it changes) → open that chat.
  const openedFor = useRef<string | null>(null)
  useEffect(() => {
    const fromUrl =
      openedFor.current === null && typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("chat") : null
    const target = startWithUserId || fromUrl
    if (target && target !== openedFor.current) {
      openedFor.current = target
      openWith(target)
    }
  }, [startWithUserId, openWith])

  /* ── Poll the open chat ── */
  const lastServerAt = messages.length ? messages[messages.length - 1]!.createdAt : null
  useEffect(() => {
    if (!active) return
    const id = active.id
    const t = window.setInterval(async () => {
      if (!visible()) return
      try {
        const res = await chatApi.messages(id, lastServerAt ? { after: lastServerAt } : {})
        if (activeIdRef.current !== id) return
        setOtherReadAt(res.otherLastReadAt)
        setCanSend(res.canSend)
        const fresh = res.data
        if (!fresh.length) return
        let added: ChatMessage[] = []
        setMessages((prev) => {
          const seen = new Set(prev.map((m) => m.id))
          added = fresh.filter((m) => !seen.has(m.id))
          return added.length ? [...prev, ...added] : prev
        })
        if (added.some((m) => m.senderId !== res.me)) {
          if (!nearBottom.current) setShowNewPill(true)
          if (document.hasFocus()) markRead(id)
        }
      } catch {
        /* next tick */
      }
    }, 3_000)
    return () => window.clearInterval(t)
  }, [active, lastServerAt, markRead])

  // Coming back to the tab with the chat open → mark read.
  useEffect(() => {
    if (!active) return
    const onFocus = () => {
      const c = convs.find((x) => x.id === active.id)
      if (c && c.unread > 0) markRead(active.id)
    }
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [active, convs, markRead])

  /* ── Scrolling ── */
  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    if (nearBottom.current) setShowNewPill(false)
  }
  const scrollToBottom = (smooth = false) => {
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" })
  }
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    if (keepScroll.current) {
      // "Load earlier" → keep what you were looking at in place.
      el.scrollTop = el.scrollHeight - keepScroll.current.height + keepScroll.current.top
      keepScroll.current = null
    } else if (nearBottom.current) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages, pending, threadLoading])

  const loadOlder = async () => {
    if (!active || !messages.length || loadingOlder) return
    setLoadingOlder(true)
    try {
      const res = await chatApi.messages(active.id, { before: messages[0]!.createdAt })
      const el = scrollRef.current
      if (el) keepScroll.current = { height: el.scrollHeight, top: el.scrollTop }
      setMessages((prev) => {
        const seen = new Set(prev.map((m) => m.id))
        return [...res.data.filter((m) => !seen.has(m.id)), ...prev]
      })
      setHasMore(res.hasMore)
    } finally {
      setLoadingOlder(false)
    }
  }

  /* ── Sending ── */
  const deliver = async (p: Pending, convId: string) => {
    try {
      const msg = await chatApi.send(convId, p.body)
      if (activeIdRef.current === convId) {
        setPending((ps) => ps.filter((x) => x.tempId !== p.tempId))
        setMessages((ms) => (ms.some((m) => m.id === msg.id) ? ms : [...ms, msg]))
      }
      setConvs((cs) => {
        const c = cs.find((x) => x.id === convId)
        if (!c) return cs
        const updated = { ...c, lastMessage: { body: msg.body, senderId: msg.senderId, at: msg.createdAt }, unread: 0 }
        return [updated, ...cs.filter((x) => x.id !== convId)]
      })
    } catch (e: any) {
      if (e?.code === "not_connected") setCanSend(false)
      setPending((ps) => ps.map((x) => (x.tempId === p.tempId ? { ...x, status: "failed" } : x)))
    }
  }

  const send = () => {
    if (!active || !canSend) return
    const body = draft.replace(/\r\n/g, "\n").trim()
    if (!body || body.length > CHAT_MAX_LENGTH) return
    const p: Pending = { tempId: `t${Date.now()}${Math.random()}`, body, createdAt: new Date().toISOString(), status: "sending" }
    setPending((ps) => [...ps, p])
    setDraft("")
    drafts.current.delete(active.id)
    nearBottom.current = true
    deliver(p, active.id)
  }

  const retry = (p: Pending) => {
    if (!active) return
    setPending((ps) => ps.map((x) => (x.tempId === p.tempId ? { ...x, status: "sending" } : x)))
    deliver({ ...p, status: "sending" }, active.id)
  }

  // Auto-grow the textarea.
  useLayoutEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 160) + "px"
  }, [draft, active])

  /* ── Derived ── */
  const filteredConvs = useMemo(() => {
    const q = fold(query.trim())
    if (!q) return convs
    return convs.filter((c) => fold(`${c.other.name} ${c.other.email} ${c.other.company ?? ""} ${c.lastMessage?.body ?? ""}`).includes(q))
  }, [convs, query])

  useEffect(() => {
    if (mode !== "new" || contacts) return
    chatApi.contacts().then(setContacts).catch(() => setContacts([]))
  }, [mode, contacts])

  const groupedContacts = useMemo(() => {
    const q = fold(query.trim())
    const list = (contacts ?? []).filter((p) => !q || fold(`${p.name} ${p.email} ${p.company ?? ""} ${p.jobTitle ?? ""}`).includes(q))
    const order: ChatRelation[] = ["manager", "admin", "employee", "covering", "colleague", "team_manager", "team_employee"]
    return order
      .map((r) => ({ relation: r, people: list.filter((p) => p.relation === r) }))
      .filter((g) => g.people.length)
  }, [contacts, query])

  // Keep the header's canSend etc. in step with list refreshes.
  const activeLive = active ? convs.find((c) => c.id === active.id) ?? active : null

  /* ── Thread rows (day separators + grouping) ── */
  type Row =
    | { kind: "day"; key: string; label: string }
    | { kind: "msg"; key: string; m: ChatMessage | Pending; mine: boolean; pending?: Pending; first: boolean; last: boolean }
  const rows: Row[] = useMemo(() => {
    const all: { m: ChatMessage | Pending; mine: boolean; pending?: Pending }[] = [
      ...messages.map((m) => ({ m, mine: m.senderId === me })),
      ...pending.map((p) => ({ m: p, mine: true, pending: p })),
    ]
    const out: Row[] = []
    let prevDay = ""
    all.forEach((x, i) => {
      const day = new Date(x.m.createdAt).toDateString()
      if (day !== prevDay) {
        out.push({ kind: "day", key: `d${day}`, label: dayLabel(x.m.createdAt, lang, tx) })
        prevDay = day
      }
      const prev = all[i - 1]
      const next = all[i + 1]
      const close = (a?: typeof x, b?: typeof x) =>
        !!a && !!b && a.mine === b.mine &&
        new Date(b.m.createdAt).toDateString() === new Date(a.m.createdAt).toDateString() &&
        Math.abs(new Date(b.m.createdAt).getTime() - new Date(a.m.createdAt).getTime()) < 5 * 60_000
      out.push({
        kind: "msg",
        key: "id" in x.m ? x.m.id : x.m.tempId,
        m: x.m,
        mine: x.mine,
        pending: x.pending,
        first: !close(prev, x),
        last: !close(x, next),
      })
    })
    return out
  }, [messages, pending, me, lang, tx])

  const lastMineId = useMemo(() => [...messages].reverse().find((m) => m.senderId === me)?.id ?? null, [messages, me])
  const tooLongBy = draft.trim().length - CHAT_MAX_LENGTH

  /* ═══ Render ═══ */
  return (
    <div
      className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex h-[calc(100dvh-9rem)] min-h-[480px] ${className}`}
    >
      {/* ── LEFT: list / new chat ── */}
      <aside className={`${active ? "hidden md:flex" : "flex"} w-full md:w-80 lg:w-96 flex-col border-r border-gray-100 flex-shrink-0`}>
        <div className="px-4 pt-4 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            {mode === "new" ? (
              <button onClick={() => { setMode("list"); setQuery("") }} className="flex items-center gap-1.5 text-sm font-semibold text-gray-800 -ml-1 px-1 py-1 rounded-lg hover:bg-gray-50">
                <Icon icon="tabler:arrow-left" className="w-4 h-4" />
                {tx.newChat}
              </button>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <h1 className="text-lg font-bold text-gray-900">{tx.title}</h1>
                <PresencePicker language={lang} compact />
              </div>
            )}
            {mode === "list" && (
              <button
                onClick={() => { setMode("new"); setQuery("") }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-lg hover:shadow-md transition-all"
                style={{ backgroundColor: NAVY }}
              >
                <Icon icon="tabler:edit" className="w-3.5 h-3.5" />
                {tx.newChat}
              </button>
            )}
          </div>
          <div className="relative">
            <Icon icon="tabler:search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={mode === "new" ? tx.searchPeople : tx.search}
              aria-label={mode === "new" ? tx.searchPeople : tx.search}
              className="w-full pl-9 pr-8 py-2 text-sm rounded-xl bg-gray-50 border border-gray-100 outline-none focus:bg-white focus:border-blue-200 focus:ring-2 focus:ring-blue-100"
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600" aria-label="Clear">
                <Icon icon="tabler:x" className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {mode === "list" ? (
            listLoading ? (
              <ul className="p-2 space-y-1" aria-busy>
                {[0, 1, 2, 3].map((i) => (
                  <li key={i} className="flex items-center gap-3 p-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-1/2 bg-gray-100 rounded animate-pulse" />
                      <div className="h-3 w-3/4 bg-gray-100 rounded animate-pulse" />
                    </div>
                  </li>
                ))}
              </ul>
            ) : listError ? (
              <div className="p-6 text-center">
                <p className="text-sm text-gray-600">{tx.loadFailed}</p>
                <button onClick={() => loadList()} className="mt-2 text-sm font-semibold underline" style={{ color: NAVY }}>{tx.tryAgain}</button>
              </div>
            ) : filteredConvs.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center bg-gray-50 mb-3">
                  <Icon icon="tabler:messages" className="w-6 h-6 text-gray-400" />
                </div>
                {query ? (
                  <p className="text-sm text-gray-500">{tx.noMatches}</p>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-gray-800">{tx.noChats}</p>
                    <p className="text-xs text-gray-500 mt-1">{tx.noChatsHint}</p>
                    <button onClick={() => setMode("new")} className="mt-4 text-sm font-semibold px-4 py-2 rounded-xl text-white" style={{ backgroundColor: NAVY }}>
                      {tx.newChat}
                    </button>
                  </>
                )}
              </div>
            ) : (
              <ul className="p-2 space-y-0.5">
                {filteredConvs.map((c) => {
                  const isActive = active?.id === c.id
                  const mineLast = c.lastMessage?.senderId === me
                  return (
                    <li key={c.id}>
                      <button
                        onClick={() => selectConversation(c)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${isActive ? "bg-blue-50/70" : "hover:bg-gray-50"}`}
                        aria-current={isActive || undefined}
                      >
                        <Avatar person={c.other} language={lang} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className={`truncate text-sm ${c.unread ? "font-bold text-gray-900" : "font-semibold text-gray-800"}`}>{c.other.name}</span>
                            {c.lastMessage && <span className={`text-[11px] flex-shrink-0 ${c.unread ? "font-semibold" : "text-gray-400"}`} style={c.unread ? { color: NAVY } : undefined}>{listTime(c.lastMessage.at, lang, tx)}</span>}
                          </div>
                          <div className="flex items-center justify-between gap-2 mt-0.5">
                            <span className={`truncate text-xs ${c.unread ? "text-gray-800 font-medium" : "text-gray-500"}`}>
                              {c.lastMessage ? `${mineLast ? `${tx.you}: ` : ""}${c.lastMessage.body}` : relationLabel(tx, c.other)}
                            </span>
                            {c.unread > 0 && (
                              <span className="min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold text-white flex items-center justify-center flex-shrink-0" style={{ backgroundColor: NAVY }}>
                                {c.unread > 99 ? "99+" : c.unread}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )
          ) : contacts === null ? (
            <div className="p-6 flex justify-center"><Icon icon="tabler:loader-2" className="w-5 h-5 animate-spin text-gray-400" /></div>
          ) : groupedContacts.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-semibold text-gray-800">{query ? tx.noMatches : tx.noContacts}</p>
              {!query && <p className="text-xs text-gray-500 mt-1">{tx.noContactsHint}</p>}
            </div>
          ) : (
            <div className="p-2">
              {groupedContacts.map((g) => (
                <div key={g.relation} className="mb-2">
                  <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">{tx.groups[g.relation]}</p>
                  <ul className="space-y-0.5">
                    {g.people.map((p) => (
                      <li key={p.id}>
                        <button
                          onClick={() => openWith(p.id)}
                          disabled={!!opening}
                          className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left hover:bg-gray-50 disabled:opacity-60"
                        >
                          <Avatar person={p} size={36} language={lang} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                            <p className="text-xs text-gray-500 truncate">
                              {[relationLabel(tx, p), p.jobTitle, p.company].filter(Boolean).join(" · ")}
                            </p>
                            {p.presence && (
                              <p className="text-[11px] truncate" style={{ color: p.presence.status === "available" ? "rgb(21,128,61)" : "rgb(107,114,128)" }}>
                                {presenceLine(p.presence, lang)}
                              </p>
                            )}
                          </div>
                          {opening === p.id ? (
                            <Icon icon="tabler:loader-2" className="w-4 h-4 animate-spin text-gray-400" />
                          ) : (
                            <Icon icon="tabler:message-circle" className="w-4 h-4 text-gray-300" />
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* ── RIGHT: thread ── */}
      <section className={`${active ? "flex" : "hidden md:flex"} flex-1 min-w-0 flex-col bg-gray-50/40`}>
        {!activeLive ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4" style={{ backgroundColor: "rgb(239,246,255)" }}>
              <Icon icon="tabler:messages" className="w-8 h-8" style={{ color: NAVY }} />
            </div>
            <p className="text-base font-semibold text-gray-800">{tx.pick}</p>
            <p className="text-sm text-gray-500 mt-1 max-w-xs">{tx.pickHint}</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
              <button onClick={() => setActive(null)} className="md:hidden p-1.5 -ml-1.5 rounded-lg text-gray-500 hover:bg-gray-100" aria-label={tx.back}>
                <Icon icon="tabler:arrow-left" className="w-5 h-5" />
              </button>
              <Avatar person={activeLive.other} size={38} language={lang} />
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{activeLive.other.name}</p>
                {activeLive.other.presence && (
                  <p className="text-xs font-medium truncate flex items-center gap-1.5" style={{ color: activeLive.other.presence.status === "available" ? "rgb(21,128,61)" : "rgb(75,85,99)" }}>
                    {presenceLine(activeLive.other.presence, lang)}
                  </p>
                )}
                <p className="text-xs text-gray-500 truncate">
                  {[relationLabel(tx, activeLive.other), activeLive.other.jobTitle, activeLive.other.company].filter(Boolean).join(" · ")}
                </p>
              </div>
              {activeLive.other.email && (
                <a href={`mailto:${activeLive.other.email}`} className="ml-auto p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100" title={activeLive.other.email} aria-label={activeLive.other.email}>
                  <Icon icon="tabler:mail" className="w-4 h-4" />
                </a>
              )}
            </header>

            {/* Messages */}
            <div className="relative flex-1 min-h-0">
              <div ref={scrollRef} onScroll={onScroll} className="h-full overflow-y-auto px-3 sm:px-6 py-4" aria-live="polite">
                {threadLoading ? (
                  <div className="h-full flex items-center justify-center"><Icon icon="tabler:loader-2" className="w-5 h-5 animate-spin text-gray-400" /></div>
                ) : (
                  <>
                    {hasMore && (
                      <div className="flex justify-center mb-3">
                        <button onClick={loadOlder} disabled={loadingOlder} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-60">
                          {loadingOlder ? <Icon icon="tabler:loader-2" className="w-3.5 h-3.5 animate-spin inline" /> : tx.loadEarlier}
                        </button>
                      </div>
                    )}
                    {!hasMore && (
                      <div className="flex flex-col items-center text-center py-6">
                        <Avatar person={activeLive.other} size={56} showPresence={false} />
                        <p className="mt-2 text-sm font-semibold text-gray-800">{activeLive.other.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{tx.firstMessage(activeLive.other.name.split(" ")[0] || activeLive.other.name)}</p>
                      </div>
                    )}
                    {rows.map((r) =>
                      r.kind === "day" ? (
                        <div key={r.key} className="flex items-center gap-3 my-4">
                          <div className="flex-1 h-px bg-gray-200" />
                          <span className="text-[11px] font-semibold text-gray-400 first-letter:uppercase">{r.label}</span>
                          <div className="flex-1 h-px bg-gray-200" />
                        </div>
                      ) : (
                        <div key={r.key} className={`flex ${r.mine ? "justify-end" : "justify-start"} ${r.first ? "mt-3" : "mt-0.5"}`}>
                          <div className={`max-w-[80%] sm:max-w-[70%] flex flex-col ${r.mine ? "items-end" : "items-start"}`}>
                            <div
                              className={`px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm ${r.mine ? "text-white" : "bg-white text-gray-800 border border-gray-100"
                                } ${r.mine
                                  ? `rounded-2xl ${r.first ? "" : "rounded-tr-md"} ${r.last ? "" : "rounded-br-md"}`
                                  : `rounded-2xl ${r.first ? "" : "rounded-tl-md"} ${r.last ? "" : "rounded-bl-md"}`
                                } ${r.pending?.status === "sending" ? "opacity-70" : ""} ${r.pending?.status === "failed" ? "ring-2 ring-red-300" : ""}`}
                              style={r.mine ? { backgroundColor: NAVY } : undefined}
                              title={new Date(r.m.createdAt).toLocaleString(locale(lang))}
                            >
                              <Linkified text={r.m.body} />
                            </div>
                            {r.pending ? (
                              r.pending.status === "failed" ? (
                                <p className="mt-1 text-[11px] text-red-600 flex items-center gap-2">
                                  <Icon icon="tabler:alert-circle" className="w-3.5 h-3.5" />
                                  {tx.failed}
                                  <button onClick={() => retry(r.pending!)} className="font-semibold underline">{tx.retry}</button>
                                  <button onClick={() => setPending((ps) => ps.filter((x) => x.tempId !== r.pending!.tempId))} className="text-gray-500 underline">{tx.remove}</button>
                                </p>
                              ) : r.last ? (
                                <p className="mt-1 text-[11px] text-gray-400">{tx.sending}</p>
                              ) : null
                            ) : r.last ? (
                              <p className="mt-1 text-[11px] text-gray-400">
                                {timeOf(r.m.createdAt, lang)}
                                {r.mine && "id" in r.m && r.m.id === lastMineId && pending.length === 0 && (
                                  <>
                                    {" · "}
                                    {otherReadAt && otherReadAt >= r.m.createdAt ? (
                                      <span className="inline-flex items-center gap-0.5" style={{ color: NAVY }}>
                                        <Icon icon="tabler:checks" className="w-3.5 h-3.5" />{tx.seen}
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-0.5"><Icon icon="tabler:check" className="w-3.5 h-3.5" />{tx.sent}</span>
                                    )}
                                  </>
                                )}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      ),
                    )}
                  </>
                )}
              </div>
              {showNewPill && (
                <button
                  onClick={() => { scrollToBottom(true); setShowNewPill(false) }}
                  className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white shadow-lg"
                  style={{ backgroundColor: NAVY }}
                >
                  <Icon icon="tabler:arrow-down" className="w-3.5 h-3.5" />{tx.newMessages}
                </button>
              )}
            </div>

            {/* Busy / in a meeting / away… → heads-up above the composer */}
            {canSend && isUnavailable(activeLive.other.presence) && (
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-600 flex items-center gap-2">
                <PresenceDot presence={activeLive.other.presence} size={10} language={lang} />
                <span className="truncate">
                  {tx.awayNotice(activeLive.other.name.split(" ")[0] || activeLive.other.name, presenceLabel(activeLive.other.presence!.status, lang))}
                  {activeLive.other.presence?.message ? ` “${activeLive.other.presence.message}”` : ""}
                </span>
              </div>
            )}

            {/* Composer */}
            {canSend ? (
              <form
                onSubmit={(e) => { e.preventDefault(); send() }}
                className="px-3 sm:px-4 py-3 bg-white border-t border-gray-100"
              >
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    value={draft}
                    rows={1}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                        e.preventDefault()
                        send()
                      }
                    }}
                    placeholder={tx.write}
                    aria-label={tx.write}
                    className="flex-1 resize-none px-4 py-2.5 text-sm rounded-2xl bg-gray-50 border border-gray-200 outline-none focus:bg-white focus:border-blue-200 focus:ring-2 focus:ring-blue-100 max-h-40"
                  />
                  <button
                    type="submit"
                    disabled={!draft.trim() || tooLongBy > 0}
                    className="h-10 w-10 rounded-full flex items-center justify-center text-white flex-shrink-0 transition-all disabled:opacity-40 hover:shadow-md"
                    style={{ backgroundColor: NAVY }}
                    aria-label={tx.send}
                    title={tx.send}
                  >
                    <Icon icon="tabler:send" className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex justify-between mt-1.5 px-1">
                  <span className="hidden sm:inline text-[11px] text-gray-400">{tx.enterHint}</span>
                  {tooLongBy > 0 ? (
                    <span className="text-[11px] font-semibold text-red-600 ml-auto">{tx.tooLong(tooLongBy)}</span>
                  ) : draft.length > CHAT_MAX_LENGTH - 500 ? (
                    <span className="text-[11px] text-gray-400 ml-auto">{CHAT_MAX_LENGTH - draft.trim().length}</span>
                  ) : null}
                </div>
              </form>
            ) : (
              <div className="px-4 py-3 bg-amber-50 border-t border-amber-100 text-sm text-amber-800 flex items-start gap-2">
                <Icon icon="tabler:lock" className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {tx.readOnly(activeLive.other.name)}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
