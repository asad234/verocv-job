import CVListModern from "@/components/Dashboard/LandingPage/LandingTest"

export const metadata = {
  title: "VeroCv – Enkla, jobbanpassade CV:n och personliga brev",
  description:
    "Att skapa ett övertygande, jobbanpassat CV ska vara enkelt. På VeroCv gör vi skrivandet av personliga brev exakt och snabbt, vilket gör din jobbansökningsprocess smidig.",
  keywords: [
    "Verocv",
    "CV builder",
    "resume generator",
    "cover letter maker",
    "job application tool",
    "modern CV",
    "professional CV templates",
  ],
  authors: [{ name: "VeroCv", url: "https://verocv.se" }],
  openGraph: {
    title: "Verocv – Skapa ett jobbanpassat CV enkelt",
    description:
      "Build your perfect CV and cover letter tailored for the job. Verocv offers fast, modern tools for a seamless job application experience.",
    url: "https://verocv.se",
    siteName: "Verocv",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "VeroCv – CVs & Cover Letters Made Effortless",
    description:
      "Effortless CV creation, precise cover letters, and a smooth job application process with Verocv.",
  },
}

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <CVListModern />
      </main>
    </div>
  )
}
