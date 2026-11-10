"use client"
import type React from "react"
import { useState, useRef, useEffect } from "react"
import {
  MessageSquare,
  AlertTriangle,
  Send,
  Bot,
  User,
  Settings,
  Save,
  X,
  CheckCircle,
  Upload,
  FileImage,
} from "lucide-react"
import UnderDevelopmentBanner from "@/components/Common/underDevelopment"
import { useDashboardTranslations } from "@/hooks/useDashboardTranslation"

interface ChatMessage {
  id: string
  content: string
  sender: "user" | "bot"
  timestamp: Date
}

interface AIConfig {
  provider: string
  apiKey: string
  modelName: string
  endpoint?: string
  isConfigured: boolean
}

interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
}

interface IssueFormData {
  issueType: string
  title: string
  details: string
  email: string
}

const HelpAndSupport = () => {
  const { t, language } = useDashboardTranslations()

  const [activeSection, setActiveSection] = useState<string>("contact")
  const [message, setMessage] = useState<string>("")
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      content:
        language === "sv"
          ? "Hej! Jag är din AI-assistent. Hur kan jag hjälpa dig idag?"
          : "Hello! I'm your AI assistant. How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [showAIConfig, setShowAIConfig] = useState<boolean>(false)
  const [aiConfig, setAIConfig] = useState<AIConfig>({
    provider: "openai",
    apiKey: "",
    modelName: "gpt-4",
    endpoint: "",
    isConfigured: false,
  })

  // Contact form state
  const [contactForm, setContactForm] = useState<ContactFormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [isSubmittingContact, setIsSubmittingContact] = useState<boolean>(false)
  const [contactSubmissionStatus, setContactSubmissionStatus] = useState<{
    type: "success" | "error" | null
    message: string
  }>({ type: null, message: "" })

  // Issue form state
  const [issueForm, setIssueForm] = useState<IssueFormData>({
    issueType: "",
    title: "",
    details: "",
    email: "",
  })
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isSubmittingIssue, setIsSubmittingIssue] = useState<boolean>(false)
  const [issueSubmissionStatus, setIssueSubmissionStatus] = useState<{
    type: "success" | "error" | null
    message: string
    issueId?: string
  }>({ type: null, message: "" })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  const handleContactFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setContactForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleIssueFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setIssueForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    // Validate files
    const validFiles = files.filter((file) => {
      const isValidType = ["image/png", "image/jpeg", "image/gif", "image/webp"].includes(file.type)
      const isValidSize = file.size <= 5 * 1024 * 1024 // 5MB
      if (!isValidType) {
        alert(
          language === "sv"
            ? `${file.name} är inte ett stödt bildformat`
            : `${file.name} is not a supported image format`,
        )
        return false
      }
      if (!isValidSize) {
        alert(language === "sv" ? `${file.name} överskrider 5MB-gränsen` : `${file.name} exceeds 5MB limit`)
        return false
      }
      return true
    })
    setSelectedFiles((prev) => [...prev, ...validFiles])
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleContactFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingContact(true)
    setContactSubmissionStatus({ type: null, message: "" })

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contactForm),
      })

      const result = await response.json()

      if (response.ok) {
        setContactSubmissionStatus({
          type: "success",
          message:
            language === "sv"
              ? "Ditt meddelande har skickats framgångsrikt! Vi återkommer inom 24 timmar."
              : "Your message has been sent successfully! We'll get back to you within 24 hours.",
        })
        // Reset form
        setContactForm({
          name: "",
          email: "",
          subject: "",
          message: "",
        })
      } else {
        setContactSubmissionStatus({
          type: "error",
          message:
            result.error ||
            (language === "sv"
              ? "Misslyckades att skicka meddelande. Försök igen."
              : "Failed to send message. Please try again."),
        })
      }
    } catch (error) {
      setContactSubmissionStatus({
        type: "error",
        message:
          language === "sv"
            ? "Nätverksfel. Kontrollera din anslutning och försök igen."
            : "Network error. Please check your connection and try again.",
      })
    } finally {
      setIsSubmittingContact(false)
    }
  }

  const handleIssueFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingIssue(true)
    setIssueSubmissionStatus({ type: null, message: "" })

    try {
      const formData = new FormData()
      formData.append("issueType", issueForm.issueType)
      formData.append("title", issueForm.title)
      formData.append("details", issueForm.details)
      formData.append("email", issueForm.email)

      // Add files to form data
      selectedFiles.forEach((file) => {
        formData.append("files", file)
      })

      const response = await fetch("/api/issue", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        setIssueSubmissionStatus({
          type: "success",
          message:
            language === "sv"
              ? `Din problemrapport har skickats framgångsrikt! Problem-ID: ${result.issueId}. Vi undersöker och återkommer snart.`
              : `Your issue report has been submitted successfully! Issue ID: ${result.issueId}. We'll investigate and get back to you soon.`,
          issueId: result.issueId,
        })
        // Reset form
        setIssueForm({
          issueType: "",
          title: "",
          details: "",
          email: "",
        })
        setSelectedFiles([])
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      } else {
        setIssueSubmissionStatus({
          type: "error",
          message:
            result.error ||
            (language === "sv"
              ? "Misslyckades att skicka problemrapport. Försök igen."
              : "Failed to submit issue report. Please try again."),
        })
      }
    } catch (error) {
      setIssueSubmissionStatus({
        type: "error",
        message:
          language === "sv"
            ? "Nätverksfel. Kontrollera din anslutning och försök igen."
            : "Network error. Please check your connection and try again.",
      })
    } finally {
      setIsSubmittingIssue(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    // Add user message to chat
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: message,
      sender: "user",
      timestamp: new Date(),
    }

    setChatMessages((prev) => [...prev, userMessage])
    setMessage("")
    setIsLoading(true)

    try {
      if (aiConfig.isConfigured) {
        // Simulate a response
        await new Promise((resolve) => setTimeout(resolve, 1000))
        const botResponse =
          language === "sv"
            ? `Detta är ett simulerat svar. I produktion skulle detta komma från din konfigurerade AI-leverantör (${aiConfig.provider}).`
            : `This is a simulated response. In production, this would come from your configured AI provider (${aiConfig.provider}).`

        const botMessage: ChatMessage = {
          id: Date.now().toString(),
          content: botResponse,
          sender: "bot",
          timestamp: new Date(),
        }
        setChatMessages((prev) => [...prev, botMessage])
      } else {
        // If AI is not configured, show a message prompting setup
        await new Promise((resolve) => setTimeout(resolve, 1000))
        const botMessage: ChatMessage = {
          id: Date.now().toString(),
          content:
            language === "sv"
              ? "Det verkar som att du inte har konfigurerat din AI-assistent än. Klicka på inställningsikonen för att ansluta din AI-tjänst."
              : "It looks like you haven't configured your AI assistant yet. Click the settings icon to connect your AI service.",
          sender: "bot",
          timestamp: new Date(),
        }
        setChatMessages((prev) => [...prev, botMessage])
      }
    } catch (error) {
      // Handle errors
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        content:
          language === "sv"
            ? "Ursäkta, det uppstod ett fel vid anslutning till AI-tjänsten. Kontrollera din konfiguration."
            : "Sorry, there was an error connecting to the AI service. Please check your configuration.",
        sender: "bot",
        timestamp: new Date(),
      }
      setChatMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveAIConfig = () => {
    // Validate the configuration
    if (!aiConfig.apiKey) {
      alert(language === "sv" ? "API-nyckel krävs" : "API Key is required")
      return
    }

    setAIConfig((prev) => ({ ...prev, isConfigured: true }))
    setShowAIConfig(false)

    // Add a confirmation message to the chat
    const configMessage: ChatMessage = {
      id: Date.now().toString(),
      content:
        language === "sv"
          ? `AI-assistent konfigurerad framgångsrikt! Jag använder nu ${aiConfig.provider} med ${aiConfig.modelName}-modellen.`
          : `AI assistant configured successfully! I'm now using ${aiConfig.provider} with the ${aiConfig.modelName} model.`,
      sender: "bot",
      timestamp: new Date(),
    }
    setChatMessages((prev) => [...prev, configMessage])
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
        {language === "sv" ? "Hjälp och Support" : "Help and Support"}
      </h1>

      {/* Navigation Tabs */}
      <div className="flex justify-center mb-8 border-b">
        <button
          className={`flex items-center px-6 py-3 font-medium ${activeSection === "contact"
              ? "border-b-2"
              : "text-gray-600 hover:opacity-80"
            }`}
          style={
            activeSection === "contact"
              ? {
                color: 'rgb(5, 22, 80)',
                borderColor: 'rgb(5, 22, 80)',
              }
              : {}
          }
          onClick={() => setActiveSection("contact")}
        >
          <MessageSquare className="mr-2 h-5 w-5" />
          {language === "sv" ? "Kontakta Support" : "Contact Support"}
        </button>
        <button
          className={`flex items-center px-6 py-3 font-medium ${activeSection === "chatbot"
              ? "border-b-2"
              : "text-gray-600 hover:opacity-80"
            }`}
          style={
            activeSection === "chatbot"
              ? {
                color: 'rgb(5, 22, 80)',
                borderColor: 'rgb(5, 22, 80)',
              }
              : {}
          }
          onClick={() => setActiveSection("chatbot")}
        >
          <Bot className="mr-2 h-5 w-5" />
          {language === "sv" ? "AI Chatbot" : "AI Chatbot"}
        </button>
        <button
          className={`flex items-center px-6 py-3 font-medium ${activeSection === "report"
              ? "border-b-2"
              : "text-gray-600 hover:opacity-80"
            }`}
          style={
            activeSection === "report"
              ? {
                color: 'rgb(5, 22, 80)',
                borderColor: 'rgb(5, 22, 80)',
              }
              : {}
          }
          onClick={() => setActiveSection("report")}
        >
          <AlertTriangle className="mr-2 h-5 w-5" />
          {language === "sv" ? "Rapportera Problem" : "Report an Issue"}
        </button>
      </div>

      {/* Contact Support Section */}
      {activeSection === "contact" && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">
            {language === "sv" ? "Kontakta Vårt Supportteam" : "Contact Our Support Team"}
          </h2>
          <p className="mb-6 text-gray-600">
            {language === "sv"
              ? "Vårt team är tillgängligt måndag till fredag, 9-17 CET. Vi svarar vanligtvis inom 24 timmar."
              : "Our team is available Monday through Friday, 9am-5pm EST. We typically respond within 24 hours."}
          </p>

          {/* Success/Error Messages */}
          {contactSubmissionStatus.type && (
            <div
              className={`mb-6 p-4 rounded-md border ${contactSubmissionStatus.type === "success"
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-red-50 border-red-200 text-red-800"
                }`}
            >
              <div className="flex items-center">
                {contactSubmissionStatus.type === "success" && <CheckCircle className="h-5 w-5 mr-2" />}
                {contactSubmissionStatus.type === "error" && <AlertTriangle className="h-5 w-5 mr-2" />}
                <span>{contactSubmissionStatus.message}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleContactFormSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                {language === "sv" ? "Ditt Namn *" : "Your Name *"}
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={contactForm.name}
                onChange={handleContactFormChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none"
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.5)'
                  e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = ''
                  e.currentTarget.style.borderColor = ''
                }}
                placeholder={language === "sv" ? "Anna Andersson" : "John Doe"}
                required
                disabled={isSubmittingContact}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                {language === "sv" ? "E-postadress *" : "Email Address *"}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={contactForm.email}
                onChange={handleContactFormChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none"
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.5)'
                  e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = ''
                  e.currentTarget.style.borderColor = ''
                }}
                placeholder={language === "sv" ? "anna@exempel.se" : "johndoe@example.com"}
                required
                disabled={isSubmittingContact}
              />
            </div>
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                {language === "sv" ? "Ämne *" : "Subject *"}
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={contactForm.subject}
                onChange={handleContactFormChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none"
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.5)'
                  e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = ''
                  e.currentTarget.style.borderColor = ''
                }}
                placeholder={language === "sv" ? "Faktureringsfråga" : "Billing Question"}
                required
                disabled={isSubmittingContact}
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                {language === "sv" ? "Meddelande *" : "Message *"}
              </label>
              <textarea
                id="message"
                name="message"
                rows={5}
                value={contactForm.message}
                onChange={handleContactFormChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none"
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.5)'
                  e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = ''
                  e.currentTarget.style.borderColor = ''
                }}
                placeholder={
                  language === "sv" ? "Beskriv ditt problem i detalj..." : "Please describe your issue in detail..."
                }
                required
                disabled={isSubmittingContact}
              ></textarea>
            </div>
            <button
              type="submit"
              className="text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:cursor-not-allowed"
              style={{
                backgroundColor: isSubmittingContact ? 'rgba(5, 22, 80, 0.5)' : 'rgb(5, 22, 80)'
              }}
              onMouseEnter={(e) => {
                if (!isSubmittingContact) {
                  e.currentTarget.style.backgroundColor = 'rgb(15, 32, 90)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmittingContact) {
                  e.currentTarget.style.backgroundColor = 'rgb(5, 22, 80)'
                }
              }}
              disabled={isSubmittingContact}
            >
              {isSubmittingContact
                ? language === "sv"
                  ? "Skickar..."
                  : "Sending..."
                : language === "sv"
                  ? "Skicka Meddelande"
                  : "Send Message"}
            </button>
          </form>

          <div
            className="mt-8 p-4 rounded-md border"
            style={{
              backgroundColor: 'rgba(176, 196, 222, 0.1)',
              borderColor: 'rgba(176, 196, 222, 0.3)'
            }}
          >
            <h3
              className="font-semibold"
              style={{ color: 'rgb(5, 22, 80)' }}
            >
              {language === "sv" ? "Andra Sätt att Nå Oss" : "Other Ways to Reach Us"}
            </h3>
            <p
              className="mt-2"
              style={{ color: 'rgb(5, 22, 80)' }}
            >
              {language === "sv" ? "E-post: info@verocv.se" : "Email: info@verocv.se"}
            </p>
          </div>
        </div>
      )}

      {/* AI Chatbot Section */}
      {activeSection === "chatbot" && (
        <div className="bg-gray-50 rounded-lg p-6">
          <UnderDevelopmentBanner />
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-800">
              {language === "sv" ? "AI Support Assistent" : "AI Support Assistant"}
            </h2>
            <button
              onClick={() => setShowAIConfig(!showAIConfig)}
              className="flex items-center text-gray-600 transition-colors"
              style={{
                '--hover-color': 'rgb(5, 22, 80)',
              } as React.CSSProperties}
              onMouseEnter={(e) => e.currentTarget.style.color = 'rgb(5, 22, 80)'}
              onMouseLeave={(e) => e.currentTarget.style.color = ''}
              aria-label="Configure AI"
            >
              <Settings className="h-5 w-5 mr-1" />
              <span className="text-sm">{language === "sv" ? "Konfigurera AI" : "Configure AI"}</span>
            </button>
          </div>

          {/* AI Configuration Modal */}
          {showAIConfig && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    {language === "sv" ? "Konfigurera AI-Assistent" : "Configure AI Assistant"}
                  </h3>
                  <button onClick={() => setShowAIConfig(false)} className="text-gray-500 hover:text-gray-700">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === "sv" ? "Leverantör" : "Provider"}
                    </label>
                    <select
                      value={aiConfig.provider}
                      onChange={(e) => setAIConfig((prev) => ({ ...prev, provider: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none"
                      onFocus={(e) => {
                        e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.5)'
                        e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.boxShadow = ''
                        e.currentTarget.style.borderColor = ''
                      }}
                    >
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                      <option value="google">Google</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === "sv" ? "Modellnamn" : "Model Name"}
                    </label>
                    <input
                      type="text"
                      value={aiConfig.modelName}
                      onChange={(e) => setAIConfig((prev) => ({ ...prev, modelName: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none"
                      onFocus={(e) => {
                        e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.5)'
                        e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.boxShadow = ''
                        e.currentTarget.style.borderColor = ''
                      }}
                      placeholder="gpt-4"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === "sv" ? "API-nyckel" : "API Key"}
                    </label>
                    <input
                      type="password"
                      value={aiConfig.apiKey}
                      onChange={(e) => setAIConfig((prev) => ({ ...prev, apiKey: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none"
                      onFocus={(e) => {
                        e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.5)'
                        e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.boxShadow = ''
                        e.currentTarget.style.borderColor = ''
                      }}
                      placeholder={language === "sv" ? "Ange din API-nyckel" : "Enter your API key"}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === "sv" ? "Endpoint (valfritt)" : "Endpoint (optional)"}
                    </label>
                    <input
                      type="text"
                      value={aiConfig.endpoint || ""}
                      onChange={(e) => setAIConfig((prev) => ({ ...prev, endpoint: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none"
                      onFocus={(e) => {
                        e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.5)'
                        e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.boxShadow = ''
                        e.currentTarget.style.borderColor = ''
                      }}
                      placeholder={language === "sv" ? "Anpassad endpoint-URL" : "Custom endpoint URL"}
                    />
                  </div>
                  <button
                    onClick={handleSaveAIConfig}
                    className="w-full text-white py-2 px-4 rounded-md transition-colors"
                    style={{ backgroundColor: 'rgb(5, 22, 80)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(15, 32, 90)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(5, 22, 80)'}
                  >
                    <Save className="inline h-4 w-4 mr-2" />
                    {language === "sv" ? "Spara Konfiguration" : "Save Configuration"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <p className="mb-6 text-gray-600">
            {aiConfig.isConfigured
              ? language === "sv"
                ? `Din AI-assistent är konfigurerad och redo att hjälpa. Använder ${aiConfig.provider} med ${aiConfig.modelName}-modellen.`
                : `Your AI assistant is configured and ready to help. Using ${aiConfig.provider} with the ${aiConfig.modelName} model.`
              : language === "sv"
                ? "Anslut din AI-assistent för att komma igång. Klicka på Konfigurera AI-knappen för att ställa in din integration."
                : "Connect your AI assistant to get started. Click the Configure AI button to set up your integration."}
          </p>

          {/* Chat Container */}
          <div className="border border-gray-200 rounded-lg bg-white overflow-hidden flex flex-col h-[500px]">
            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] px-4 py-3 rounded-lg ${msg.sender === "user"
                          ? "text-white rounded-br-none"
                          : "bg-gray-100 text-gray-800 rounded-bl-none"
                        }`}
                      style={msg.sender === "user" ? { backgroundColor: 'rgb(5, 22, 80)' } : {}}
                    >
                      <div className="flex items-center mb-1">
                        {msg.sender === "bot" ? <Bot className="h-4 w-4 mr-1" /> : <User className="h-4 w-4 mr-1" />}
                        <span className="text-xs opacity-75">
                          {msg.sender === "bot"
                            ? language === "sv"
                              ? "AI-Assistent"
                              : "AI Assistant"
                            : language === "sv"
                              ? "Du"
                              : "You"}{" "}
                          • {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p>{msg.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] px-4 py-3 rounded-lg bg-gray-100 text-gray-800 rounded-bl-none">
                      <div className="flex items-center mb-1">
                        <Bot className="h-4 w-4 mr-1" />
                        <span className="text-xs opacity-75">
                          {language === "sv" ? "AI-Assistent" : "AI Assistant"} •{" "}
                          {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="flex space-x-1">
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Chat Input */}
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-1 p-3 border border-gray-300 rounded-md focus:outline-none"
                  onFocus={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.5)'
                    e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.boxShadow = ''
                    e.currentTarget.style.borderColor = ''
                  }}
                  placeholder={
                    aiConfig.isConfigured
                      ? language === "sv"
                        ? "Skriv ditt meddelande här..."
                        : "Type your message here..."
                      : language === "sv"
                        ? "Konfigurera din AI-assistent för att börja chatta..."
                        : "Configure your AI assistant to start chatting..."
                  }
                  disabled={isLoading || !aiConfig.isConfigured}
                />
                <button
                  type="submit"
                  className="text-white p-3 rounded-md transition-colors"
                  style={{
                    backgroundColor: (isLoading || !message.trim() || !aiConfig.isConfigured)
                      ? 'rgba(5, 22, 80, 0.5)'
                      : 'rgb(5, 22, 80)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading && message.trim() && aiConfig.isConfigured) {
                      e.currentTarget.style.backgroundColor = 'rgb(15, 32, 90)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading && message.trim() && aiConfig.isConfigured) {
                      e.currentTarget.style.backgroundColor = 'rgb(5, 22, 80)'
                    }
                  }}
                  disabled={isLoading || !message.trim() || !aiConfig.isConfigured}
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
            </div>
          </div>

          <div
            className="mt-8 p-4 rounded-md border"
            style={{
              backgroundColor: 'rgba(176, 196, 222, 0.1)',
              borderColor: 'rgba(176, 196, 222, 0.3)'
            }}
          >
            <h3
              className="font-semibold"
              style={{ color: 'rgb(5, 22, 80)' }}
            >
              {language === "sv" ? "Populära Frågor" : "Popular Questions"}
            </h3>
            <div className="mt-2 space-y-2">
              <button
                className="hover:underline block transition-colors"
                style={{ color: 'rgb(5, 22, 80)' }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                onClick={() => {
                  setMessage(language === "sv" ? "Hur återställer jag mitt lösenord?" : "How do I reset my password?")
                }}
                disabled={!aiConfig.isConfigured}
              >
                {language === "sv" ? "Hur återställer jag mitt lösenord?" : "How do I reset my password?"}
              </button>
              <button
                className="hover:underline block transition-colors"
                style={{ color: 'rgb(5, 22, 80)' }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                onClick={() => {
                  setMessage(
                    language === "sv"
                      ? "Vilka betalningsmetoder accepterar ni?"
                      : "What payment methods do you accept?",
                  )
                }}
                disabled={!aiConfig.isConfigured}
              >
                {language === "sv" ? "Vilka betalningsmetoder accepterar ni?" : "What payment methods do you accept?"}
              </button>
              <button
                className="hover:underline block transition-colors"
                style={{ color: 'rgb(5, 22, 80)' }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                onClick={() => {
                  setMessage(
                    language === "sv" ? "Hur kan jag avbryta min prenumeration?" : "How can I cancel my subscription?",
                  )
                }}
                disabled={!aiConfig.isConfigured}
              >
                {language === "sv" ? "Hur kan jag avbryta min prenumeration?" : "How can I cancel my subscription?"}
              </button>
              <button
                className="hover:underline block transition-colors"
                style={{ color: 'rgb(5, 22, 80)' }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                onClick={() => {
                  setMessage(language === "sv" ? "Är mina data säkra?" : "Is my data secure?")
                }}
                disabled={!aiConfig.isConfigured}
              >
                {language === "sv" ? "Är mina data säkra?" : "Is my data secure?"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report an Issue Section */}
      {activeSection === "report" && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">
            {language === "sv" ? "Rapportera Problem" : "Report an Issue"}
          </h2>
          <p className="mb-6 text-gray-600">
            {language === "sv"
              ? "Hittat en bugg eller upplever problem? Låt oss veta så fixar vi det så snart som möjligt."
              : "Found a bug or experiencing a problem? Let us know and we'll fix it as soon as possible."}
          </p>

          {/* Success/Error Messages */}
          {issueSubmissionStatus.type && (
            <div
              className={`mb-6 p-4 rounded-md border ${issueSubmissionStatus.type === "success"
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-red-50 border-red-200 text-red-800"
                }`}
            >
              <div className="flex items-center">
                {issueSubmissionStatus.type === "success" && <CheckCircle className="h-5 w-5 mr-2" />}
                {issueSubmissionStatus.type === "error" && <AlertTriangle className="h-5 w-5 mr-2" />}
                <span>{issueSubmissionStatus.message}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleIssueFormSubmit} className="space-y-4">
            <div>
              <label htmlFor="issueType" className="block text-sm font-medium text-gray-700 mb-1">
                {language === "sv" ? "Problemtyp *" : "Issue Type *"}
              </label>
              <select
                id="issueType"
                name="issueType"
                value={issueForm.issueType}
                onChange={handleIssueFormChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none"
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.5)'
                  e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = ''
                  e.currentTarget.style.borderColor = ''
                }}
                required
                disabled={isSubmittingIssue}
              >
                <option value="">{language === "sv" ? "Välj en problemtyp" : "Select an issue type"}</option>
                <option value="bug">{language === "sv" ? "Buggrapport" : "Bug Report"}</option>
                <option value="feature">{language === "sv" ? "Funktionsförfrågan" : "Feature Request"}</option>
                <option value="account">{language === "sv" ? "Kontoproblem" : "Account Problem"}</option>
                <option value="billing">{language === "sv" ? "Faktureringsproblem" : "Billing Issue"}</option>
                <option value="other">{language === "sv" ? "Annat" : "Other"}</option>
              </select>
            </div>
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                {language === "sv" ? "Problemtitel *" : "Issue Title *"}
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={issueForm.title}
                onChange={handleIssueFormChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none"
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.5)'
                  e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = ''
                  e.currentTarget.style.borderColor = ''
                }}
                placeholder={language === "sv" ? "Beskriv problemet kort" : "Briefly describe the issue"}
                required
                disabled={isSubmittingIssue}
              />
            </div>
            <div>
              <label htmlFor="details" className="block text-sm font-medium text-gray-700 mb-1">
                {language === "sv" ? "Problemdetaljer *" : "Issue Details *"}
              </label>
              <textarea
                id="details"
                name="details"
                rows={5}
                value={issueForm.details}
                onChange={handleIssueFormChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none"
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.5)'
                  e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = ''
                  e.currentTarget.style.borderColor = ''
                }}
                placeholder={
                  language === "sv"
                    ? "Ange så mycket detaljer som möjligt inklusive steg för att återskapa problemet..."
                    : "Please provide as much detail as possible including steps to reproduce the issue..."
                }
                required
                disabled={isSubmittingIssue}
              ></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === "sv" ? "Ladda upp Skärmdumpar (valfritt)" : "Upload Screenshots (optional)"}
              </label>
              <div
                className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors"
                style={{
                  borderColor: 'rgb(209, 213, 219)',
                  '--hover-border': 'rgb(176, 196, 222)',
                } as React.CSSProperties}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgb(209, 213, 219)'}
              >
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium transition-colors"
                      style={{ color: 'rgb(5, 22, 80)' }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                      <span>{language === "sv" ? "Ladda upp filer" : "Upload files"}</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        multiple
                        accept="image/*"
                        onChange={handleFileSelect}
                        ref={fileInputRef}
                        disabled={isSubmittingIssue}
                      />
                    </label>
                    <p className="pl-1">{language === "sv" ? "eller dra och släpp" : "or drag and drop"}</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    {language === "sv"
                      ? "PNG, JPG, GIF, WebP upp till 5MB vardera"
                      : "PNG, JPG, GIF, WebP up to 5MB each"}
                  </p>
                </div>
              </div>
              {/* Selected Files Display */}
              {selectedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">
                    {language === "sv" ? "Valda Filer:" : "Selected Files:"}
                  </h4>
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-3 rounded-md border">
                      <div className="flex items-center">
                        <FileImage
                          className="h-5 w-5 mr-2"
                          style={{ color: 'rgb(5, 22, 80)' }}
                        />
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <span className="text-xs text-gray-500 ml-2">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700"
                        disabled={isSubmittingIssue}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                {language === "sv" ? "Din E-post *" : "Your Email *"}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={issueForm.email}
                onChange={handleIssueFormChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none"
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.5)'
                  e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = ''
                  e.currentTarget.style.borderColor = ''
                }}
                placeholder={
                  language === "sv" ? "Vi kontaktar dig med uppdateringar" : "We'll contact you with updates"
                }
                required
                disabled={isSubmittingIssue}
              />
            </div>
            <button
              type="submit"
              className="text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:cursor-not-allowed"
              style={{
                backgroundColor: isSubmittingIssue ? 'rgba(5, 22, 80, 0.5)' : 'rgb(5, 22, 80)'
              }}
              onMouseEnter={(e) => {
                if (!isSubmittingIssue) {
                  e.currentTarget.style.backgroundColor = 'rgb(15, 32, 90)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmittingIssue) {
                  e.currentTarget.style.backgroundColor = 'rgb(5, 22, 80)'
                }
              }}
              disabled={isSubmittingIssue}
            >
              {isSubmittingIssue
                ? language === "sv"
                  ? "Skickar..."
                  : "Submitting..."
                : language === "sv"
                  ? "Skicka Rapport"
                  : "Submit Report"}
            </button>
          </form>

          <div className="mt-8 p-4 bg-yellow-50 rounded-md border border-yellow-100">
            <h3 className="font-semibold text-yellow-800">
              {language === "sv" ? "Brådskande Problem" : "Urgent Issues"}
            </h3>
            <p className="text-yellow-700 mt-2">
              {language === "sv" ? (
                <>
                  För brådskande problem som kräver omedelbar uppmärksamhet, vänligen
                  <span className="underline cursor-pointer ml-1" onClick={() => setActiveSection("contact")}>
                    kontakta vårt supportteam
                  </span>{" "}
                  direkt.
                </>
              ) : (
                <>
                  For urgent issues that require immediate attention, please
                  <span className="underline cursor-pointer ml-1" onClick={() => setActiveSection("contact")}>
                    contact our support team
                  </span>{" "}
                  directly.
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default HelpAndSupport
