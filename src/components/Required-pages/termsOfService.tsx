"use client"
import { useSession } from "next-auth/react"
import type React from "react"
import { useState, useEffect } from "react"
import { useAuthTranslation } from "@/hooks/useAuthTranslation"
import Link from "next/link"

type Language = "en" | "sv"

interface TermsTranslations {
  en: {
    signIn: string
    dashboard: string
    termsTitle: string
    termsSubtitle: string
    lastUpdated: string
    getStarted: string
    sections: {
      introduction: {
        title: string
        content: string[]
      }
      eligibility: {
        title: string
        content: string[]
      }
      services: {
        title: string
        content: string[]
      }
      userResponsibilities: {
        title: string
        content: string[]
      }
      intellectualProperty: {
        title: string
        content: string[]
      }
      payment: {
        title: string
        content: string[]
        subsections: {
          freemium: string
          subscription: string
          oneTime: string
          billing: string
          cancellation: string
          refunds: string
        }
      }
      cookies: {
        title: string
        content: string[]
      }
      aiTransparency: {
        title: string
        content: string[]
      }
      liability: {
        title: string
        content: string[]
      }
      termination: {
        title: string
        content: string[]
      }
      governingLaw: {
        title: string
        content: string[]
      }
      gdprCompliance: {
        title: string
        lastUpdated: string
        intro: string
        ourCommitmentsTitle: string
        ourCommitments: string[]
        yourRightsTitle: string
        yourRightsIntro: string
        yourRights: string[]
      }
      contact: {
        title: string
        content: string[]
      }

    }
    contact: string
    about: string
    terms: string
    copyright: string
    allRights: string
  }
  sv: {
    signIn: string
    dashboard: string
    termsTitle: string
    termsSubtitle: string
    getStarted: string
    lastUpdated: string
    sections: {
      introduction: {
        title: string
        content: string[]
      }
      eligibility: {
        title: string
        content: string[]
      }
      services: {
        title: string
        content: string[]
      }
      userResponsibilities: {
        title: string
        content: string[]
      }
      intellectualProperty: {
        title: string
        content: string[]
      }
      payment: {
        title: string
        content: string[]
        subsections: {
          freemium: string
          subscription: string
          oneTime: string
          billing: string
          cancellation: string
          refunds: string
        }
      }
      cookies: {
        title: string
        content: string[]
      }
      aiTransparency: {
        title: string
        content: string[]
      }
      liability: {
        title: string
        content: string[]
      }
      termination: {
        title: string
        content: string[]
      }
      governingLaw: {
        title: string
        content: string[]
      }
      gdprCompliance: {
        title: string
        lastUpdated: string
        intro: string
        ourCommitmentsTitle: string
        ourCommitments: string[]
        yourRightsTitle: string
        yourRightsIntro: string
        yourRights: string[]
      }
      contact: {
        title: string
        content: string[]
      }
    }
    contact: string
    about: string
    terms: string
    copyright: string
    allRights: string
  }
}

const translations: TermsTranslations = {
  sv: {
    signIn: "Logga In",
    dashboard: "Dashboard",
    getStarted: "Kom igång",
    termsTitle: "Användarvillkor",
    termsSubtitle: "Användaravtal för VeroCV",
    lastUpdated: "Senast uppdaterad: Oktober 2025",
    sections: {
      introduction: {
        title: "1. Introduktion",
        content: [
          'Välkommen till VeroCV.se ("VeroCV", "vi", "vårt" eller "oss"). Dessa Användarvillkor ("Villkor") reglerar din åtkomst till och användning av vår webbplats, våra tjänster och verktyg för att skapa CV:n och personliga brev ("Tjänsterna").',
          "Genom att använda våra Tjänster godkänner du dessa Villkor. Om du inte godkänner dem, använd inte våra Tjänster."
        ]
      },
      eligibility: {
        title: "2. Behörighet",
        content: [
          "Du måste vara minst 13 år gammal för att använda våra Tjänster.",
          "Om du är under 18 år bör du ha tillstånd från en förälder eller vårdnadshavare innan du använder våra Tjänster.",
          "Genom att använda VeroCV bekräftar du att du har rättslig kapacitet att ingå detta avtal, eller att du har erhållit ett sådant tillstånd."
        ]
      },
      services: {
        title: "3. Tillhandahållna Tjänster",
        content: [
          "VeroCV erbjuder verktyg som hjälper användare att skapa jobbspecifika CV:n och personliga brev.",
          "Innehållet genereras baserat på den information du lämnar och AI-stödda förslag.",
          "Du ansvarar själv för att granska, redigera och säkerställa riktigheten i dina dokument.",
          "I framtiden kommer VeroCV även att erbjuda möjligheten att ansöka om jobb direkt via plattformen samt få jobbförslag anpassade efter din profil och dina preferenser."
        ]
      },
      userResponsibilities: {
        title: "4. Användarens Ansvar",
        content: [
          "Du åtar dig att lämna korrekt och laglig information vid användning av våra Tjänster.",
          "Du ansvarar för att hålla dina kontouppgifter konfidentiella.",
          "Du får inte missbruka Tjänsterna, inklusive försök att störa eller få obehörig åtkomst.",
          "Du ansvarar själv för riktigheten och fullständigheten i eventuella jobbansökningar som skickas via plattformen."
        ]
      },
      intellectualProperty: {
        title: "5. Immateriella Rättigheter",
        content: [
          "All programvara, design, mallar, och AI-modeller som används av VeroCV är VeroCV:s exklusiva egendom och skyddas av immaterialrättsliga lagar.",
          "Du behåller fullt ägande av de CV:n, personliga brev och andra dokument du skapar genom våra Tjänster. VeroCV gör inga äganderättsanspråk på ditt personliga innehåll.",
          "Genom att använda våra Tjänster ger du VeroCV en begränsad, icke-exklusiv licens att behandla, lagra och visa ditt innehåll enbart i syfte att tillhandahålla Tjänsterna, inklusive jobbansökningar och jobbförslag.",
          "VeroCV kommer inte att använda dina personliga dokument för marknadsföring, vidareförsäljning eller AI-träning utan ditt uttryckliga samtycke."
        ]
      },
      payment: {
        title: "6. Betalning och Prenumerationer",
        content: [],
        subsections: {
          freemium: "Freemium-åtkomst: VeroCV erbjuder en gratis nivå med begränsade funktioner så att användare kan prova plattformen innan de väljer betalda tjänster.",
          subscription: "Prenumerationstjänster: Vi erbjuder prenumerationsplaner som ger tillgång till fler funktioner och förmåner. Prenumerationer debiteras återkommande (t.ex. månadsvis eller årsvis) tills de avslutas.",
          oneTime: "Engångsbetalningar: Vissa premiumfunktioner kan vara tillgängliga för gratisanvändare genom engångsbetalning.",
          billing: "Fakturering och förnyelse: Genom att köpa en prenumeration godkänner du att vi debiterar din valda betalningsmetod i början av varje faktureringsperiod. Prenumerationer förnyas automatiskt om de inte avbryts före förnyelsedatumet.",
          cancellation: "Avslut: Du kan när som helst avsluta din prenumeration via kontoinställningarna. Tillgång till premiumfunktioner kvarstår till slutet av den aktuella faktureringsperioden.",
          refunds: "Återbetalningar: Återbetalningar ges endast i den utsträckning som krävs enligt tillämplig konsumentskyddslagstiftning."
        }
      },
      cookies: {
        title: "7. Cookies och Integritet",
        content: [
          "Vi använder nödvändiga cookies för att webbplatsen ska fungera samt analyscookies med ditt samtycke.",
          "Vår hantering av personuppgifter regleras av vår Integritetspolicy och Cookiepolicy."
        ]
      },
      aiTransparency: {
        title: "8. AI-transparens",
        content: [
          "Våra Tjänster använder AI för att generera förslag till CV:n och personliga brev.",
          "Användare informeras när AI används och har alltid full kontroll över det slutliga innehållet.",
          "AI-resultaten är endast förslag och bör granskas innan de används."
        ]
      },
      liability: {
        title: "9. Ansvarsbegränsning",
        content: [
          'VeroCV tillhandahåller sina Tjänster "i befintligt skick" och garanterar inte att genererade dokument eller jobbansökningar leder till anställning eller intervjuer.',
          "I den utsträckning lagen tillåter ansvarar VeroCV inte för indirekta, tillfälliga eller följdskador som uppstår vid användning av våra Tjänster."
        ]
      },
      termination: {
        title: "10. Avslut av Användning",
        content: [
          "Vi kan tillfälligt stänga av eller avsluta din åtkomst om du bryter mot dessa Villkor eller missbrukar Tjänsterna.",
          "Du kan när som helst välja att sluta använda våra Tjänster."
        ]
      },
      governingLaw: {
        title: "11. Tillämplig Lag",
        content: [
          "Dessa Villkor regleras av svensk lag och tillämpliga EU-förordningar.",
          "Eventuella tvister ska avgöras i svensk domstol."
        ]
      },
      gdprCompliance: {
        title: "12. GDPR-efterlevnad",
        lastUpdated: "Senast uppdaterad: Oktober 2025",
        intro: "På VeroCV är vi helt engagerade i att följa den allmänna dataskyddsförordningen (GDPR) och den svenska dataskyddslagen. Att skydda dina personuppgifter och säkerställa transparens i hur de används är centralt för vår verksamhet.",
        ourCommitmentsTitle: "Våra åtaganden",
        ourCommitments: [
          "Vi samlar endast in och behandlar personuppgifter som är nödvändiga för att tillhandahålla och förbättra våra tjänster.",
          "Vi använder funktionella cookies som är strikt nödvändiga för webbplatsens drift.",
          "Vi använder även analyscookies, men endast med ditt uttryckliga samtycke. Dessa hjälper oss att förstå hur vår webbplats används så att vi kan förbättra prestanda och användarupplevelse.",
          "Vi använder inte cookies eller personuppgifter för annonsering, profilering eller försäljning till tredje part.",
          "Vi tillämpar lämpliga tekniska och organisatoriska åtgärder för att skydda dina uppgifter.",
          "Vi säkerställer att alla tjänsteleverantörer som behandlar uppgifter för vår räkning (t.ex. hosting, analys) gör det enligt strikta sekretess- och säkerhetsavtal."
        ],
        yourRightsTitle: "Dina rättigheter enligt GDPR",
        yourRightsIntro: "Som användare har du rätt att:",
        yourRights: [
          "Få tillgång till de personuppgifter vi har om dig",
          "Begära rättelse av felaktiga eller ofullständiga uppgifter",
          "Begära radering av dina uppgifter (rätten att bli glömd)",
          "Begränsa eller invända mot vissa typer av behandling",
          "Återkalla ditt samtycke för analyscookies när som helst",
          "Få dina uppgifter i ett portabelt format (dataportabilitet)",
          "Lämna in ett klagomål till Integritetsskyddsmyndigheten (IMY)"
        ]
      },
      contact: {
        title: "13. Kontakta Oss",
        content: [
          "Om du har frågor om dessa Villkor, vänligen kontakta oss:",
          "📧 info@verocv.se",
          "📍 VeroCV, Stockholm, Sverige"
        ]
      }
    },
    contact: "Kontakt",
    about: "Om Oss",
    terms: "Villkor & Integritet",
    copyright: "© 2025 VeroCV.",
    allRights: "Alla rättigheter förbehållna."
  },
  en: {
    signIn: "Sign In",
    dashboard: "Dashboard",
    getStarted: "Get Started",
    termsTitle: "Terms and Conditions",
    termsSubtitle: "User Agreement for VeroCV",
    lastUpdated: "Last updated: October 2025",
    sections: {
      introduction: {
        title: "1. Introduction",
        content: [
          'Welcome to VeroCV.se ("VeroCV", "we", "our", or "us"). These Terms and Conditions ("Terms") govern your access to and use of our website, services, and tools for creating CVs and cover letters (the "Services").',
          "By using our Services, you agree to these Terms. If you do not agree, please do not use our Services."
        ]
      },
      eligibility: {
        title: "2. Eligibility",
        content: [
          "You must be at least 13 years old to use our Services.",
          "If you are under 18, you should have permission from a parent or legal guardian before using our Services.",
          "By using VeroCV, you confirm that you have the legal capacity to enter into this agreement or that you have obtained such permission."
        ]
      },
      services: {
        title: "3. Services Provided",
        content: [
          "VeroCV provides tools to help users create job-specific CVs and cover letters.",
          "The content generated is based on the information you provide and AI-assisted suggestions.",
          "You remain responsible for reviewing, editing, and ensuring the accuracy of your documents.",
          "In future, VeroCV will also allow users to apply for jobs directly through the platform and receive job suggestions tailored to their profile and preferences."
        ]
      },
      userResponsibilities: {
        title: "4. User Responsibilities",
        content: [
          "You agree to provide accurate and lawful information when using our Services.",
          "You are responsible for maintaining the confidentiality of your account credentials.",
          "You may not misuse the Services, including attempting to disrupt or gain unauthorized access.",
          "You are solely responsible for the accuracy and completeness of any job applications you submit through the platform."
        ]
      },
      intellectualProperty: {
        title: "5. Intellectual Property",
        content: [
          "All software, design, templates, and AI models used by VeroCV are the exclusive property of VeroCV and protected by intellectual property laws.",
          "You retain full ownership of the CVs, cover letters, and other documents you create using our Services. VeroCV does not claim ownership of your personal content.",
          "By using our Services, you grant VeroCV a limited, non-exclusive license to process, store, and display your content solely for the purpose of providing the Services, including job applications and job suggestions.",
          "VeroCV will not use your personal documents for marketing, resale, or AI training without your explicit consent."
        ]
      },
      payment: {
        title: "6. Payment and Subscriptions",
        content: [],
        subsections: {
          freemium: "Freemium Access: VeroCV offers a free tier with limited features so users can try the platform before committing to paid services.",
          subscription: "Subscription Services: We provide subscription plans that unlock additional features and benefits. Subscriptions are billed on a recurring basis (e.g., monthly or annually) until cancelled.",
          oneTime: "One-Time Payments: Certain premium features may be available for freemium users through a one-time payment option.",
          billing: "Billing and Renewal: By purchasing a subscription, you authorize us to charge your chosen payment method at the start of each billing cycle. Subscriptions automatically renew unless cancelled before the renewal date.",
          cancellation: "Cancellation: You may cancel your subscription at any time through your account settings. Access to premium features will remain until the end of the current billing period.",
          refunds: "Refunds: Refunds are provided only where required by applicable consumer protection laws."
        }
      },
      cookies: {
        title: "7. Cookies and Privacy",
        content: [
          "We use functional cookies necessary for the operation of the site and analytics cookies with your consent.",
          "Our use of personal data is governed by our Privacy Policy and Cookie Policy."
        ]
      },
      aiTransparency: {
        title: "8. AI Transparency",
        content: [
          "Our Services use AI to generate suggestions for CVs and cover letters.",
          "Users are informed when AI is used and remain in full control of the final content.",
          "AI outputs are suggestions only and should be reviewed before use."
        ]
      },
      liability: {
        title: "9. Limitation of Liability",
        content: [
          'VeroCV provides its Services "as is" and does not guarantee that generated documents or job applications will result in employment or interviews.',
          "To the maximum extent permitted by law, VeroCV is not liable for indirect, incidental, or consequential damages arising from the use of our Services."
        ]
      },
      termination: {
        title: "10. Termination",
        content: [
          "We may suspend or terminate your access if you violate these Terms or misuse the Services.",
          "You may stop using the Services at any time."
        ]
      },
      governingLaw: {
        title: "11. Governing Law",
        content: [
          "These Terms are governed by the laws of Sweden and applicable EU regulations.",
          "Any disputes shall be resolved in Swedish courts."
        ]
      },
      gdprCompliance: {
        title: "12. GDPR Compliance",
        lastUpdated: "Last updated: October 2025",
        intro: "At VeroCV, we are fully committed to complying with the General Data Protection Regulation (GDPR) and the Swedish Data Protection Act. Protecting your personal data and ensuring transparency in how it is used are central to our mission.",
        ourCommitmentsTitle: "Our Commitments",
        ourCommitments: [
          "We only collect and process personal data that is necessary to provide and improve our services.",
          "We use functional cookies that are strictly necessary for the operation of our website.",
          "We also use analytics cookies, but only with your explicit consent. These help us understand how our site is used so we can improve performance and user experience.",
          "We do not use cookies or personal data for advertising, profiling, or selling to third parties.",
          "We apply appropriate technical and organizational measures to safeguard your data.",
          "We ensure that any service providers processing data on our behalf (e.g., hosting, analytics) do so under strict confidentiality and security agreements."
        ],
        yourRightsTitle: "Your Rights Under GDPR",
        yourRightsIntro: "As a user, you have the right to:",
        yourRights: [
          "Access the personal data we hold about you",
          "Request correction of inaccurate or incomplete data",
          "Request deletion of your data (right to be forgotten)",
          "Restrict or object to certain types of processing",
          "Withdraw your consent for analytics cookies at any time",
          "Receive your data in a portable format (data portability)",
          "Lodge a complaint with the Swedish Authority for Privacy Protection (IMY)"
        ]
      },
      contact: {
        title: "13. Contact Us",
        content: [
          "If you have questions about these Terms, please contact us:",
          "📧 info@verocv.se",
          "📍 VeroCV, Stockholm, Sweden"
        ]
      }
    },
    contact: "Contact",
    about: "About",
    terms: "Terms & Privacy",
    copyright: "© 2025 VeroCV.",
    allRights: "All rights reserved."
  }
}

const TermsPage: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false)
  const { language, setLanguage } = useAuthTranslation('sv')
  const { data: session, status } = useSession()

  const t = translations[language]

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 relative overflow-hidden">
      {/* Header */}
      <header className="relative z-10 backdrop-blur-sm bg-white/80 border-b border-blue-200/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <Link href="/" className="group cursor-pointer">
              <div className="relative px-6 py-3">
                <img
                  src="/logo/logovero.svg"
                  className="h-16 w-auto mr-3 object-contain relative z-10"
                  style={{ marginTop: '-8px', marginBottom: '-8px' }}
                  alt="VeroCV Logo"
                />
              </div>
            </Link>

            <div className="flex items-center space-x-4">
              {/* Language Selector */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleLanguageChange("en")}
                  className={`p-2 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${language === "en"
                    ? "border-[rgb(5,22,80)] bg-blue-50"
                    : "border-gray-200 bg-white hover:border-[rgb(176,197,222)]"
                    }`}
                  title="Switch to English"
                >
                  <svg className="w-6 h-4" viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
                    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
                    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4" />
                    <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
                    <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
                  </svg>
                </button>

                <button
                  onClick={() => handleLanguageChange("sv")}
                  className={`p-2 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${language === "sv"
                    ? "border-[rgb(5,22,80)] bg-blue-50"
                    : "border-gray-200 bg-white hover:border-[rgb(176,197,222)]"
                    }`}
                  title="Switch to Swedish"
                >
                  <svg className="w-6 h-4" viewBox="0 0 16 10" xmlns="http://www.w3.org/2000/svg">
                    <rect width="16" height="10" fill="#006AA7" />
                    <rect x="0" y="4" width="16" height="2" fill="#FECC00" />
                    <rect x="5" y="0" width="2" height="10" fill="#FECC00" />
                  </svg>
                </button>
              </div>

              {/* Get Started Button - Always visible when not logged in */}
              {!session && status !== "loading" && (
                <Link
                  href="/register"
                  className="inline-flex px-3 py-1.5 sm:px-5 sm:py-2 md:px-6 md:py-2.5 rounded-full border-2 font-medium text-xs sm:text-sm md:text-base transition-all duration-300 hover:shadow-md"
                  style={{
                    borderColor: 'rgb(5, 22, 80)',
                    color: 'rgb(5, 22, 80)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgb(5, 22, 80)';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'rgb(5, 22, 80)';
                  }}
                >
                  {t.getStarted}
                </Link>
              )}

              {/* Auth Button */}
              {status === "loading" ? (
                <button
                  disabled
                  className="px-8 py-3 rounded-full bg-gray-400 text-white font-medium transition-all duration-300"
                >
                  Loading...
                </button>
              ) : session ? (
                <Link
                  href="/dashboard"
                  className="px-8 py-3 rounded-full text-white font-medium transition-all duration-300 hover:shadow-lg"
                  style={{ backgroundColor: 'rgb(5, 22, 80)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(15, 32, 90)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(5, 22, 80)'}
                >
                  {t.dashboard}
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="px-8 py-3 rounded-full text-white font-medium transition-all duration-300 hover:shadow-lg"
                  style={{ backgroundColor: 'rgb(5, 22, 80)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(15, 32, 90)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(5, 22, 80)'}
                >
                  {t.signIn}
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 lg:px-8 py-24">
        {/* Hero Section */}
        <div
          className={`text-center mb-16 transform transition-all duration-1000 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
        >
          <h1 className="text-5xl md:text-6xl font-light text-slate-900 mb-4 leading-tight tracking-tight">
            {t.termsTitle}
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-4">{t.termsSubtitle}</p>
          <p className="text-sm text-slate-500">{t.lastUpdated}</p>
          <div className="w-24 h-0.5 mx-auto mt-8" style={{ backgroundColor: 'rgb(5, 22, 80)' }}></div>
        </div>

        {/* Introduction */}
        <div
          className={`mb-12 transform transition-all duration-1000 delay-100 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
        >
          <div className="backdrop-blur-sm bg-white/90 rounded-2xl p-10 border border-blue-200/40 shadow-sm hover:shadow-md transition-all duration-500">
            <h2 className="text-2xl font-medium text-slate-900 mb-6 flex items-center">
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm font-bold text-white"
                style={{ backgroundColor: 'rgb(176, 196, 222)' }}
              >
                1
              </span>
              {t.sections.introduction.title.split(". ")[1]}
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              {t.sections.introduction.content.map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>

        {/* Eligibility */}
        <div
          className={`mb-12 transform transition-all duration-1000 delay-200 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
        >
          <div className="backdrop-blur-sm bg-white/90 rounded-2xl p-10 border border-blue-200/40 shadow-sm hover:shadow-md transition-all duration-500">
            <h2 className="text-2xl font-medium text-slate-900 mb-6 flex items-center">
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm font-bold text-white"
                style={{ backgroundColor: 'rgb(156, 177, 202)' }}
              >
                2
              </span>
              {t.sections.eligibility.title.split(". ")[1]}
            </h2>
            <ul className="space-y-3 text-slate-700 leading-relaxed">
              {t.sections.eligibility.content.map((item, idx) => (
                <li key={idx} className="flex items-start">
                  <span style={{ color: 'rgb(5, 22, 80)' }} className="mr-3 mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Services Provided */}
        <div
          className={`mb-12 transform transition-all duration-1000 delay-300 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
        >
          <div className="backdrop-blur-sm bg-white/90 rounded-2xl p-10 border border-blue-200/40 shadow-sm hover:shadow-md transition-all duration-500">
            <h2 className="text-2xl font-medium text-slate-900 mb-6 flex items-center">
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm font-bold text-white"
                style={{ backgroundColor: 'rgb(176, 196, 222)' }}
              >
                3
              </span>
              {t.sections.services.title.split(". ")[1]}
            </h2>
            <ul className="space-y-3 text-slate-700 leading-relaxed">
              {t.sections.services.content.map((item, idx) => (
                <li key={idx} className="flex items-start">
                  <span style={{ color: 'rgb(5, 22, 80)' }} className="mr-3 mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* User Responsibilities */}
        <div
          className={`mb-12 transform transition-all duration-1000 delay-400 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
        >
          <div className="backdrop-blur-sm bg-white/90 rounded-2xl p-10 border border-blue-200/40 shadow-sm hover:shadow-md transition-all duration-500">
            <h2 className="text-2xl font-medium text-slate-900 mb-6 flex items-center">
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm font-bold text-white"
                style={{ backgroundColor: 'rgb(156, 177, 202)' }}
              >
                4
              </span>
              {t.sections.userResponsibilities.title.split(". ")[1]}
            </h2>
            <ul className="space-y-3 text-slate-700 leading-relaxed">
              {t.sections.userResponsibilities.content.map((item, idx) => (
                <li key={idx} className="flex items-start">
                  <span style={{ color: 'rgb(5, 22, 80)' }} className="mr-3 mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Intellectual Property */}
        <div
          className={`mb-12 transform transition-all duration-1000 delay-500 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
        >
          <div className="backdrop-blur-sm bg-white/90 rounded-2xl p-10 border border-blue-200/40 shadow-sm hover:shadow-md transition-all duration-500">
            <h2 className="text-2xl font-medium text-slate-900 mb-6 flex items-center">
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm font-bold text-white"
                style={{ backgroundColor: 'rgb(176, 196, 222)' }}
              >
                5
              </span>
              {t.sections.intellectualProperty.title.split(". ")[1]}
            </h2>
            <ul className="space-y-3 text-slate-700 leading-relaxed">
              {t.sections.intellectualProperty.content.map((item, idx) => (
                <li key={idx} className="flex items-start">
                  <span style={{ color: 'rgb(5, 22, 80)' }} className="mr-3 mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Payment and Subscriptions */}
        <div
          className={`mb-12 transform transition-all duration-1000 delay-600 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
        >
          <div className="backdrop-blur-sm bg-white/90 rounded-2xl p-10 border border-blue-200/40 shadow-sm hover:shadow-md transition-all duration-500">
            <h2 className="text-2xl font-medium text-slate-900 mb-6 flex items-center">
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm font-bold text-white"
                style={{ backgroundColor: 'rgb(156, 177, 202)' }}
              >
                6
              </span>
              {t.sections.payment.title.split(". ")[1]}
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <div className="pl-4 border-l-2" style={{ borderColor: 'rgb(176, 196, 222)' }}>
                <p className="font-medium mb-2">{t.sections.payment.subsections.freemium.split(":")[0]}:</p>
                <p>{t.sections.payment.subsections.freemium.split(":").slice(1).join(":")}</p>
              </div>
              <div className="pl-4 border-l-2" style={{ borderColor: 'rgb(176, 196, 222)' }}>
                <p className="font-medium mb-2">{t.sections.payment.subsections.subscription.split(":")[0]}:</p>
                <p>{t.sections.payment.subsections.subscription.split(":").slice(1).join(":")}</p>
              </div>
              <div className="pl-4 border-l-2" style={{ borderColor: 'rgb(176, 196, 222)' }}>
                <p className="font-medium mb-2">{t.sections.payment.subsections.oneTime.split(":")[0]}:</p>
                <p>{t.sections.payment.subsections.oneTime.split(":").slice(1).join(":")}</p>
              </div>
              <div className="pl-4 border-l-2" style={{ borderColor: 'rgb(176, 196, 222)' }}>
                <p className="font-medium mb-2">{t.sections.payment.subsections.billing.split(":")[0]}:</p>
                <p>{t.sections.payment.subsections.billing.split(":").slice(1).join(":")}</p>
              </div>
              <div className="pl-4 border-l-2" style={{ borderColor: 'rgb(176, 196, 222)' }}>
                <p className="font-medium mb-2">{t.sections.payment.subsections.cancellation.split(":")[0]}:</p>
                <p>{t.sections.payment.subsections.cancellation.split(":").slice(1).join(":")}</p>
              </div>
              <div className="pl-4 border-l-2" style={{ borderColor: 'rgb(176, 196, 222)' }}>
                <p className="font-medium mb-2">{t.sections.payment.subsections.refunds.split(":")[0]}:</p>
                <p>{t.sections.payment.subsections.refunds.split(":").slice(1).join(":")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Cookies and Privacy */}
        <div
          className={`mb-12 transform transition-all duration-1000 delay-700 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
        >
          <div className="backdrop-blur-sm bg-white/90 rounded-2xl p-10 border border-blue-200/40 shadow-sm hover:shadow-md transition-all duration-500">
            <h2 className="text-2xl font-medium text-slate-900 mb-6 flex items-center">
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm font-bold text-white"
                style={{ backgroundColor: 'rgb(176, 196, 222)' }}
              >
                7
              </span>
              {t.sections.cookies.title.split(". ")[1]}
            </h2>
            <ul className="space-y-3 text-slate-700 leading-relaxed">
              {t.sections.cookies.content.map((item, idx) => (
                <li key={idx} className="flex items-start">
                  <span style={{ color: 'rgb(5, 22, 80)' }} className="mr-3 mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* AI Transparency */}
        <div
          className={`mb-12 transform transition-all duration-1000 delay-800 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
        >
          <div className="backdrop-blur-sm bg-white/90 rounded-2xl p-10 border border-blue-200/40 shadow-sm hover:shadow-md transition-all duration-500">
            <h2 className="text-2xl font-medium text-slate-900 mb-6 flex items-center">
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm font-bold text-white"
                style={{ backgroundColor: 'rgb(156, 177, 202)' }}
              >
                8
              </span>
              {t.sections.aiTransparency.title.split(". ")[1]}
            </h2>
            <ul className="space-y-3 text-slate-700 leading-relaxed">
              {t.sections.aiTransparency.content.map((item, idx) => (
                <li key={idx} className="flex items-start">
                  <span style={{ color: 'rgb(5, 22, 80)' }} className="mr-3 mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Limitation of Liability */}
        <div
          className={`mb-12 transform transition-all duration-1000 delay-900 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
        >
          <div className="backdrop-blur-sm bg-white/90 rounded-2xl p-10 border border-blue-200/40 shadow-sm hover:shadow-md transition-all duration-500">
            <h2 className="text-2xl font-medium text-slate-900 mb-6 flex items-center">
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm font-bold text-white"
                style={{ backgroundColor: 'rgb(176, 196, 222)' }}
              >
                9
              </span>
              {t.sections.liability.title.split(". ")[1]}
            </h2>
            <ul className="space-y-3 text-slate-700 leading-relaxed">
              {t.sections.liability.content.map((item, idx) => (
                <li key={idx} className="flex items-start">
                  <span style={{ color: 'rgb(5, 22, 80)' }} className="mr-3 mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Termination */}
        <div
          className={`mb-12 transform transition-all duration-1000 delay-1000 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
        >
          <div className="backdrop-blur-sm bg-white/90 rounded-2xl p-10 border border-blue-200/40 shadow-sm hover:shadow-md transition-all duration-500">
            <h2 className="text-2xl font-medium text-slate-900 mb-6 flex items-center">
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm font-bold text-white"
                style={{ backgroundColor: 'rgb(156, 177, 202)' }}
              >
                10
              </span>
              {t.sections.termination.title.split(". ")[1]}
            </h2>
            <ul className="space-y-3 text-slate-700 leading-relaxed">
              {t.sections.termination.content.map((item, idx) => (
                <li key={idx} className="flex items-start">
                  <span style={{ color: 'rgb(5, 22, 80)' }} className="mr-3 mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Governing Law */}
        <div
          className={`mb-12 transform transition-all duration-1000 delay-1100 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
        >
          <div className="backdrop-blur-sm bg-white/90 rounded-2xl p-10 border border-blue-200/40 shadow-sm hover:shadow-md transition-all duration-500">
            <h2 className="text-2xl font-medium text-slate-900 mb-6 flex items-center">
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm font-bold text-white"
                style={{ backgroundColor: 'rgb(176, 196, 222)' }}
              >
                11
              </span>
              {t.sections.governingLaw.title.split(". ")[1]}
            </h2>
            <ul className="space-y-3 text-slate-700 leading-relaxed">
              {t.sections.governingLaw.content.map((item, idx) => (
                <li key={idx} className="flex items-start">
                  <span style={{ color: 'rgb(5, 22, 80)' }} className="mr-3 mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* GDPR Compliance */}
        <div
          className={`mb-12 transform transition-all duration-1000 delay-1100 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
        >
          <div className="backdrop-blur-sm bg-white/90 rounded-2xl p-10 border border-blue-200/40 shadow-sm hover:shadow-md transition-all duration-500">
            <h2 className="text-2xl font-medium text-slate-900 mb-6 flex items-center">
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm font-bold text-white"
                style={{ backgroundColor: 'rgb(156, 177, 202)' }}
              >
                12
              </span>
              {t.sections.gdprCompliance.title.split(". ")[1]}
            </h2>
            <div className="space-y-6 text-slate-700 leading-relaxed">
              <p className="text-sm text-slate-500">{t.sections.gdprCompliance.lastUpdated}</p>
              <p>{t.sections.gdprCompliance.intro}</p>

              <div>
                <h3 className="text-lg font-medium text-slate-900 mb-3">{t.sections.gdprCompliance.ourCommitmentsTitle}</h3>
                <ul className="space-y-3">
                  {t.sections.gdprCompliance.ourCommitments.map((item, idx) => (
                    <li key={idx} className="flex items-start">
                      <span style={{ color: 'rgb(5, 22, 80)' }} className="mr-3 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-slate-900 mb-3">{t.sections.gdprCompliance.yourRightsTitle}</h3>
                <p className="mb-3">{t.sections.gdprCompliance.yourRightsIntro}</p>
                <ul className="space-y-3">
                  {t.sections.gdprCompliance.yourRights.map((item, idx) => (
                    <li key={idx} className="flex items-start">
                      <span style={{ color: 'rgb(5, 22, 80)' }} className="mr-3 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div
          className={`mb-12 transform transition-all duration-1000 delay-1200 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
        >
          <div className="backdrop-blur-sm bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-10 border border-blue-200/40 shadow-sm hover:shadow-md transition-all duration-500">
            <h2 className="text-2xl font-medium text-slate-900 mb-6 flex items-center">
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm font-bold text-white"
                style={{ backgroundColor: 'rgb(176, 196, 222)' }}
              >
                13
              </span>
              {t.sections.contact.title.split(". ")[1]}
            </h2>
            <div className="space-y-3 text-slate-700 leading-relaxed">
              <p>{t.sections.contact.content[0]}</p>
              <div className="flex flex-col space-y-2 mt-4">
                <a
                  href="mailto:info@verocv.se"
                  className="transition-colors duration-300 flex items-center"
                  style={{ color: 'rgb(5, 22, 80)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'rgb(176, 196, 222)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgb(5, 22, 80)'}
                >
                  <span className="mr-2">📧</span>
                  info@verocv.se
                </a>
                <p className="flex items-center">
                  <span className="mr-2">📍</span>
                  VeroCV, Stockholm, {language === "sv" ? "Sverige" : "Sweden"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 backdrop-blur-sm bg-white/60 border-t border-blue-200/30 py-12 mt-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-8 md:space-y-0">
            <nav className="flex flex-wrap justify-center md:justify-start space-x-8 text-sm">
              <Link
                href="/contact"
                className="text-slate-600 transition-colors duration-300 relative group"
                onMouseEnter={(e) => e.currentTarget.style.color = 'rgb(176, 196, 222)'}
                onMouseLeave={(e) => e.currentTarget.style.color = ''}
              >
                {t.contact}
                <span
                  className="absolute -bottom-1 left-0 w-0 h-px group-hover:w-full transition-all duration-300"
                  style={{ backgroundColor: 'rgb(5, 22, 80)' }}
                ></span>
              </Link>
              <Link
                href="/about"
                className="text-slate-600 transition-colors duration-300 relative group"
                onMouseEnter={(e) => e.currentTarget.style.color = 'rgb(176, 196, 222)'}
                onMouseLeave={(e) => e.currentTarget.style.color = ''}
              >
                {t.about}
                <span
                  className="absolute -bottom-1 left-0 w-0 h-px group-hover:w-full transition-all duration-300"
                  style={{ backgroundColor: 'rgb(5, 22, 80)' }}
                ></span>
              </Link>
              <Link
                href="/terms"
                className="text-slate-600 transition-colors duration-300 relative group"
                onMouseEnter={(e) => e.currentTarget.style.color = 'rgb(176, 196, 222)'}
                onMouseLeave={(e) => e.currentTarget.style.color = ''}
              >
                {t.terms}
                <span
                  className="absolute -bottom-1 left-0 w-0 h-px group-hover:w-full transition-all duration-300"
                  style={{ backgroundColor: 'rgb(5, 22, 80)' }}
                ></span>
              </Link>
            </nav>

            <div className="text-sm text-slate-500">
              <span>{t.copyright}</span>
              <span className="ml-4">{t.allRights}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default TermsPage
