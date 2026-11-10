"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Icon } from "@iconify/react"
import clsx from "clsx"
import { useManagerTranslations } from "@/utils/Managertranslations"

/* ─── Constants ─── */
const NAVY = "rgb(5,22,80)"

/* ─── Types ─── */
interface ChatMessage { id: string; content: string; sender: "user" | "bot"; timestamp: Date }
interface AIConfig { provider: string; apiKey: string; modelName: string; endpoint: string; isConfigured: boolean }
interface ContactForm { name: string; email: string; subject: string; message: string }
interface IssueForm { issueType: string; title: string; details: string; email: string }

/* ─── Shared input focus helpers ─── */
const fo = {
  onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.boxShadow = "0 0 0 2px rgba(176,196,222,0.5)"
    e.currentTarget.style.borderColor = "rgb(176,196,222)"
  },
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.boxShadow = ""
    e.currentTarget.style.borderColor = ""
  },
}
const inputCls = "w-full p-3 text-sm border border-gray-200 rounded-xl bg-white outline-none transition-all"

/* ─── Submit button ─── */
const SubmitBtn: React.FC<{ label: string; loading: boolean; loadingLabel: string; icon?: string }> = ({ label, loading, loadingLabel, icon = "tabler:send" }) => (
  <button type="submit" disabled={loading}
    className="flex items-center gap-2 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:shadow-md disabled:cursor-not-allowed"
    style={{ backgroundColor: loading ? "rgba(5,22,80,0.5)" : NAVY }}
    onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = "rgb(15,32,90)" }}
    onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = NAVY }}>
    <Icon icon={loading ? "tabler:loader-2" : icon} className={clsx("w-4 h-4", loading && "animate-spin")} />
    {loading ? loadingLabel : label}
  </button>
)

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function ManagerHelpSupport() {
  const { language } = useManagerTranslations()
  const isEn = language === "en"

  const [tab, setTab] = useState<"contact" | "chatbot" | "report">("contact")

  /* ── Contact form ── */
  const [contact, setContact] = useState<ContactForm>({ name: "", email: "", subject: "", message: "" })
  const [contactLoading, setContactLoading] = useState(false)
  const [contactStatus, setContactStatus] = useState<{ type: "success" | "error" | null; msg: string }>({ type: null, msg: "" })

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setContactLoading(true); setContactStatus({ type: null, msg: "" })
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(contact) })
      const data = await res.json()
      if (res.ok) {
        setContactStatus({ type: "success", msg: isEn ? "Message sent! We'll get back to you within 24 hours." : "Meddelandet skickades! Vi återkommer inom 24 timmar." })
        setContact({ name: "", email: "", subject: "", message: "" })
      } else {
        setContactStatus({ type: "error", msg: data.error || (isEn ? "Failed to send. Try again." : "Misslyckades. Försök igen.") })
      }
    } catch {
      setContactStatus({ type: "error", msg: isEn ? "Network error. Check your connection." : "Nätverksfel. Kontrollera anslutningen." })
    } finally { setContactLoading(false) }
  }

  /* ── AI chatbot ── */
  const [chatMsg, setChatMsg] = useState("")
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([{
    id: "1", sender: "bot", timestamp: new Date(),
    content: isEn ? "Hello! I'm your AI assistant. How can I help you today?" : "Hej! Jag är din AI-assistent. Hur kan jag hjälpa dig idag?",
  }])
  const [chatLoading, setChatLoading] = useState(false)
  const [showAIConfig, setShowAIConfig] = useState(false)
  const [aiConfig, setAIConfig] = useState<AIConfig>({ provider: "openai", apiKey: "", modelName: "gpt-4", endpoint: "", isConfigured: false })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [chatHistory])

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatMsg.trim()) return
    const userMsg: ChatMessage = { id: Date.now().toString(), content: chatMsg, sender: "user", timestamp: new Date() }
    setChatHistory(p => [...p, userMsg]); setChatMsg(""); setChatLoading(true)
    await new Promise(r => setTimeout(r, 1000))
    const botMsg: ChatMessage = {
      id: (Date.now() + 1).toString(), sender: "bot", timestamp: new Date(),
      content: aiConfig.isConfigured
        ? (isEn ? `Simulated response from ${aiConfig.provider} (${aiConfig.modelName}).` : `Simulerat svar från ${aiConfig.provider} (${aiConfig.modelName}).`)
        : (isEn ? "Configure your AI assistant first by clicking the settings icon." : "Konfigurera din AI-assistent via inställningsikonen."),
    }
    setChatHistory(p => [...p, botMsg]); setChatLoading(false)
  }

  const handleSaveAI = () => {
    if (!aiConfig.apiKey) { alert(isEn ? "API key is required." : "API-nyckel krävs."); return }
    setAIConfig(p => ({ ...p, isConfigured: true })); setShowAIConfig(false)
    setChatHistory(p => [...p, {
      id: Date.now().toString(), sender: "bot", timestamp: new Date(),
      content: isEn ? `Configured! Using ${aiConfig.provider} — ${aiConfig.modelName}.` : `Konfigurerad! Använder ${aiConfig.provider} — ${aiConfig.modelName}.`
    }])
  }

  /* ── Issue form ── */
  const [issue, setIssue] = useState<IssueForm>({ issueType: "", title: "", details: "", email: "" })
  const [files, setFiles] = useState<File[]>([])
  const [issueLoading, setIssueLoading] = useState(false)
  const [issueStatus, setIssueStatus] = useState<{ type: "success" | "error" | null; msg: string }>({ type: null, msg: "" })
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valid = Array.from(e.target.files ?? []).filter(f => {
      if (!["image/png", "image/jpeg", "image/gif", "image/webp"].includes(f.type)) { alert(`${f.name}: ${isEn ? "unsupported format" : "format stöds ej"}`); return false }
      if (f.size > 5 * 1024 * 1024) { alert(`${f.name}: ${isEn ? "exceeds 5 MB" : "överstiger 5 MB"}`); return false }
      return true
    })
    setFiles(p => [...p, ...valid])
  }

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIssueLoading(true); setIssueStatus({ type: null, msg: "" })
    try {
      const fd = new FormData()
      Object.entries(issue).forEach(([k, v]) => fd.append(k, v))
      files.forEach(f => fd.append("files", f))
      const res = await fetch("/api/issue", { method: "POST", body: fd })
      const data = await res.json()
      if (res.ok) {
        setIssueStatus({ type: "success", msg: isEn ? `Report submitted! Issue ID: ${data.issueId}.` : `Rapport skickad! Problem-ID: ${data.issueId}.` })
        setIssue({ issueType: "", title: "", details: "", email: "" }); setFiles([])
        if (fileRef.current) fileRef.current.value = ""
      } else {
        setIssueStatus({ type: "error", msg: data.error || (isEn ? "Failed to submit." : "Misslyckades.") })
      }
    } catch {
      setIssueStatus({ type: "error", msg: isEn ? "Network error." : "Nätverksfel." })
    } finally { setIssueLoading(false) }
  }

  /* ── Tabs config ── */
  const tabs = [
    { id: "contact", label: isEn ? "Contact Support" : "Kontakta Support", icon: "tabler:message" },
    { id: "chatbot", label: isEn ? "AI Chatbot" : "AI Chatbot", icon: "tabler:robot" },
    { id: "report", label: isEn ? "Report an Issue" : "Rapportera Problem", icon: "tabler:alert-triangle" },
  ] as const

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">

        {/* Page header */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ backgroundColor: NAVY }}>
            <Icon icon="tabler:lifebuoy" className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{isEn ? "Help & Support" : "Hjälp och Support"}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {isEn ? "Get help, chat with AI, or report an issue." : "Få hjälp, chatta med AI eller rapportera ett problem."}
          </p>
        </div>

        {/* Tab bar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 overflow-hidden">
          <div className="flex border-b border-gray-100">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={clsx(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium transition-all border-b-2",
                  tab === t.id ? "border-blue-800 text-blue-900 bg-blue-50/30" : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                )}>
                <Icon icon={t.icon} className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── CONTACT TAB ── */}
        {tab === "contact" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-1">{isEn ? "Contact Our Support Team" : "Kontakta Vårt Supportteam"}</h2>
            <p className="text-sm text-gray-500 mb-6">
              {isEn ? "Available Mon–Fri, 9am–5pm CET. We typically reply within 24 hours." : "Tillgängliga mån–fre, 09–17 CET. Vi svarar vanligtvis inom 24 timmar."}
            </p>

            {contactStatus.type && (
              <div className={clsx("mb-5 flex items-start gap-3 p-4 rounded-xl border text-sm font-medium",
                contactStatus.type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800")}>
                <Icon icon={contactStatus.type === "success" ? "tabler:circle-check-filled" : "tabler:alert-circle"} className="w-5 h-5 flex-shrink-0 mt-0.5" />
                {contactStatus.msg}
              </div>
            )}

            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{isEn ? "Your name" : "Ditt namn"} *</label>
                  <input type="text" value={contact.name} onChange={e => setContact(p => ({ ...p, name: e.target.value }))}
                    className={inputCls} placeholder={isEn ? "Anna Svensson" : "Anna Svensson"} required disabled={contactLoading} {...fo} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{isEn ? "Email address" : "E-postadress"} *</label>
                  <input type="email" value={contact.email} onChange={e => setContact(p => ({ ...p, email: e.target.value }))}
                    className={inputCls} placeholder="anna@company.se" required disabled={contactLoading} {...fo} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{isEn ? "Subject" : "Ämne"} *</label>
                <input type="text" value={contact.subject} onChange={e => setContact(p => ({ ...p, subject: e.target.value }))}
                  className={inputCls} placeholder={isEn ? "e.g. Employee schedule issue" : "t.ex. Problem med medarbetarschema"} required disabled={contactLoading} {...fo} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{isEn ? "Message" : "Meddelande"} *</label>
                <textarea value={contact.message} onChange={e => setContact(p => ({ ...p, message: e.target.value }))}
                  rows={5} className={clsx(inputCls, "resize-none")} required disabled={contactLoading}
                  placeholder={isEn ? "Describe your issue in detail…" : "Beskriv ditt problem i detalj…"} {...fo} />
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <SubmitBtn label={isEn ? "Send Message" : "Skicka Meddelande"} loading={contactLoading} loadingLabel={isEn ? "Sending…" : "Skickar…"} icon="tabler:send" />
              </div>
            </form>

            {/* Other contact */}
            <div className="mt-6 p-4 rounded-xl border" style={{ backgroundColor: "rgba(176,196,222,0.08)", borderColor: "rgba(176,196,222,0.35)" }}>
              <p className="text-sm font-semibold" style={{ color: NAVY }}>{isEn ? "Other ways to reach us" : "Andra sätt att nå oss"}</p>
              <p className="text-sm mt-1" style={{ color: NAVY }}>
                {isEn ? "Email:" : "E-post:"} <a href="mailto:info@verocv.se" className="underline">info@verocv.se</a>
              </p>
            </div>
          </div>
        )}

        {/* ── CHATBOT TAB ── */}
        {tab === "chatbot" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">

            {/* Under development banner */}
            <div className="mb-4 flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium">
              <Icon icon="tabler:tools" className="w-4 h-4 flex-shrink-0" />
              {isEn ? "This feature is under development." : "Denna funktion är under utveckling."}
            </div>

            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{isEn ? "AI Support Assistant" : "AI-supportassistent"}</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {aiConfig.isConfigured
                    ? (isEn ? `Using ${aiConfig.provider} — ${aiConfig.modelName}` : `Använder ${aiConfig.provider} — ${aiConfig.modelName}`)
                    : (isEn ? "Not configured — click the settings icon to connect." : "Ej konfigurerad — klicka på inställningsikonen.")}
                </p>
              </div>
              <button onClick={() => setShowAIConfig(v => !v)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
                <Icon icon="tabler:settings" className="w-4 h-4" />
                {isEn ? "Configure AI" : "Konfigurera AI"}
              </button>
            </div>

            {/* AI Config modal */}
            {showAIConfig && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-base font-bold text-gray-900">{isEn ? "Configure AI Assistant" : "Konfigurera AI-assistent"}</h3>
                    <button onClick={() => setShowAIConfig(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
                      <Icon icon="tabler:x" className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{isEn ? "Provider" : "Leverantör"}</label>
                      <select value={aiConfig.provider} onChange={e => setAIConfig(p => ({ ...p, provider: e.target.value }))} className={inputCls} {...fo}>
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic</option>
                        <option value="google">Google</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{isEn ? "Model name" : "Modellnamn"}</label>
                      <input type="text" value={aiConfig.modelName} onChange={e => setAIConfig(p => ({ ...p, modelName: e.target.value }))} className={inputCls} placeholder="gpt-4" {...fo} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{isEn ? "API key" : "API-nyckel"} *</label>
                      <input type="password" value={aiConfig.apiKey} onChange={e => setAIConfig(p => ({ ...p, apiKey: e.target.value }))} className={inputCls} placeholder={isEn ? "Enter your API key" : "Ange din API-nyckel"} {...fo} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{isEn ? "Endpoint (optional)" : "Endpoint (valfritt)"}</label>
                      <input type="text" value={aiConfig.endpoint} onChange={e => setAIConfig(p => ({ ...p, endpoint: e.target.value }))} className={inputCls} placeholder="https://…" {...fo} />
                    </div>
                    <button onClick={handleSaveAI}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-md"
                      style={{ backgroundColor: NAVY }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgb(15,32,90)"}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = NAVY}>
                      <Icon icon="tabler:device-floppy" className="w-4 h-4" />
                      {isEn ? "Save Configuration" : "Spara konfiguration"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Chat window */}
            <div className="border border-gray-200 rounded-2xl overflow-hidden flex flex-col h-[480px]">
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {chatHistory.map(msg => (
                  <div key={msg.id} className={clsx("flex", msg.sender === "user" ? "justify-end" : "justify-start")}>
                    <div className={clsx("max-w-[80%] px-4 py-3 rounded-2xl text-sm",
                      msg.sender === "user" ? "text-white rounded-br-none" : "bg-gray-100 text-gray-800 rounded-bl-none")}
                      style={msg.sender === "user" ? { backgroundColor: NAVY } : {}}>
                      <div className="flex items-center gap-1.5 mb-1 text-xs opacity-70">
                        <Icon icon={msg.sender === "bot" ? "tabler:robot" : "tabler:user"} className="w-3.5 h-3.5" />
                        {msg.sender === "bot" ? (isEn ? "AI Assistant" : "AI-assistent") : (isEn ? "You" : "Du")}
                        {" · "}{msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <p>{msg.content}</p>
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="px-4 py-3 rounded-2xl rounded-bl-none bg-gray-100">
                      <div className="flex gap-1">
                        {[0, 150, 300].map(d => <div key={d} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="border-t border-gray-100 p-4 bg-gray-50">
                <form onSubmit={handleSendChat} className="flex gap-2">
                  <input type="text" value={chatMsg} onChange={e => setChatMsg(e.target.value)}
                    disabled={chatLoading || !aiConfig.isConfigured}
                    className={clsx(inputCls, "flex-1")}
                    placeholder={aiConfig.isConfigured
                      ? (isEn ? "Type your message…" : "Skriv ditt meddelande…")
                      : (isEn ? "Configure AI to start chatting…" : "Konfigurera AI för att börja chatta…")}
                    {...fo} />
                  <button type="submit" disabled={chatLoading || !chatMsg.trim() || !aiConfig.isConfigured}
                    className="w-11 h-11 flex items-center justify-center rounded-xl text-white transition-all hover:shadow-md disabled:opacity-40"
                    style={{ backgroundColor: NAVY }}
                    onMouseEnter={e => { if (!chatLoading) e.currentTarget.style.backgroundColor = "rgb(15,32,90)" }}
                    onMouseLeave={e => { if (!chatLoading) e.currentTarget.style.backgroundColor = NAVY }}>
                    <Icon icon="tabler:send" className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>

            {/* Popular questions */}
            <div className="mt-5 p-4 rounded-xl border" style={{ backgroundColor: "rgba(176,196,222,0.08)", borderColor: "rgba(176,196,222,0.35)" }}>
              <p className="text-sm font-semibold mb-2" style={{ color: NAVY }}>{isEn ? "Popular questions" : "Populära frågor"}</p>
              <div className="space-y-1.5">
                {(isEn
                  ? ["How do I add a new employee?", "How do I export a CV as PDF?", "How do I update employee availability?", "How do I create a placement report?"]
                  : ["Hur lägger jag till en ny medarbetare?", "Hur exporterar jag ett CV som PDF?", "Hur uppdaterar jag medarbetarens tillgänglighet?", "Hur skapar jag en placeringsrapport?"]
                ).map(q => (
                  <button key={q} type="button" disabled={!aiConfig.isConfigured}
                    onClick={() => setChatMsg(q)}
                    className="block text-sm text-left hover:underline disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    style={{ color: NAVY }}>
                    → {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── REPORT TAB ── */}
        {tab === "report" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-1">{isEn ? "Report an Issue" : "Rapportera Problem"}</h2>
            <p className="text-sm text-gray-500 mb-6">
              {isEn ? "Found a bug or experiencing a problem? Let us know and we'll fix it as soon as possible." : "Hittat en bugg eller upplever problem? Låt oss veta så fixar vi det så snart möjligt."}
            </p>

            {issueStatus.type && (
              <div className={clsx("mb-5 flex items-start gap-3 p-4 rounded-xl border text-sm font-medium",
                issueStatus.type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800")}>
                <Icon icon={issueStatus.type === "success" ? "tabler:circle-check-filled" : "tabler:alert-circle"} className="w-5 h-5 flex-shrink-0 mt-0.5" />
                {issueStatus.msg}
              </div>
            )}

            <form onSubmit={handleIssueSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{isEn ? "Issue type" : "Problemtyp"} *</label>
                  <select value={issue.issueType} onChange={e => setIssue(p => ({ ...p, issueType: e.target.value }))} className={clsx(inputCls, "cursor-pointer")} required disabled={issueLoading} {...fo}>
                    <option value="">{isEn ? "Select type" : "Välj typ"}</option>
                    <option value="bug">{isEn ? "Bug Report" : "Buggrapport"}</option>
                    <option value="feature">{isEn ? "Feature Request" : "Funktionsförfrågan"}</option>
                    <option value="account">{isEn ? "Account Problem" : "Kontoproblem"}</option>
                    <option value="other">{isEn ? "Other" : "Annat"}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{isEn ? "Your email" : "Din e-post"} *</label>
                  <input type="email" value={issue.email} onChange={e => setIssue(p => ({ ...p, email: e.target.value }))}
                    className={inputCls} placeholder="you@company.se" required disabled={issueLoading} {...fo} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{isEn ? "Issue title" : "Problemtitel"} *</label>
                <input type="text" value={issue.title} onChange={e => setIssue(p => ({ ...p, title: e.target.value }))}
                  className={inputCls} placeholder={isEn ? "Brief description of the issue" : "Kort beskrivning av problemet"} required disabled={issueLoading} {...fo} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{isEn ? "Details" : "Detaljer"} *</label>
                <textarea value={issue.details} onChange={e => setIssue(p => ({ ...p, details: e.target.value }))}
                  rows={5} className={clsx(inputCls, "resize-none")} required disabled={issueLoading}
                  placeholder={isEn ? "Include steps to reproduce, expected vs actual behaviour…" : "Inkludera steg för att återskapa problemet, förväntat vs faktiskt beteende…"} {...fo} />
              </div>

              {/* File upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{isEn ? "Screenshots (optional)" : "Skärmdumpar (valfritt)"}</label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-blue-300 transition-colors cursor-pointer"
                  onClick={() => fileRef.current?.click()}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "rgb(176,196,222)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = ""}>
                  <Icon icon="tabler:upload" className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    <span className="font-medium" style={{ color: NAVY }}>{isEn ? "Click to upload" : "Klicka för att ladda upp"}</span>
                    {" "}{isEn ? "or drag and drop" : "eller dra och släpp"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF, WebP · {isEn ? "max 5 MB each" : "max 5 MB vardera"}</p>
                  <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileSelect} disabled={issueLoading} />
                </div>
                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50">
                        <Icon icon="tabler:file-image" className="w-4 h-4 flex-shrink-0" style={{ color: NAVY }} />
                        <span className="text-sm text-gray-700 flex-1 truncate">{f.name}</span>
                        <span className="text-xs text-gray-400">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                        <button type="button" onClick={() => setFiles(p => p.filter((_, j) => j !== i))} disabled={issueLoading}
                          className="w-6 h-6 flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all">
                          <Icon icon="tabler:x" className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <SubmitBtn label={isEn ? "Submit Report" : "Skicka Rapport"} loading={issueLoading} loadingLabel={isEn ? "Submitting…" : "Skickar…"} icon="tabler:send" />
              </div>
            </form>

            {/* Urgent issues note */}
            <div className="mt-6 p-4 rounded-xl border border-amber-100 bg-amber-50">
              <p className="text-sm font-semibold text-amber-800">{isEn ? "Urgent issues?" : "Brådskande problem?"}</p>
              <p className="text-sm text-amber-700 mt-1">
                {isEn ? "For critical issues, please " : "Vid kritiska problem, vänligen "}
                <button onClick={() => setTab("contact")} className="underline font-medium">{isEn ? "contact our support team" : "kontakta supportteamet"}</button>
                {isEn ? " directly." : " direkt."}
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
