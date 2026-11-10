import type React from "react"
import { Inter } from "next/font/google"
import { Providers } from "./providers"
import "../app/(frontend)/globals.css"
import { Toaster } from "sonner"
import type { Metadata } from "next"
import { CookiesBanner } from "@/utils/cookiesBanner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "VeroCV",
  description: "Enkla, jobbspecifika CV och personliga brev",
  icons: {
    icon: "/favicon.svg",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="sv-SE">
      <head>
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* CV font picker — heading fonts */}
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Montserrat:wght@400;700&family=Cormorant+Garamond:wght@400;700&family=Raleway:wght@400;700&family=Josefin+Sans:wght@400;700&family=DM+Serif+Display&family=Outfit:wght@400;700&family=EB+Garamond:wght@400;700&family=Libre+Baskerville:wght@400;700&family=Space+Grotesk:wght@400;700&display=swap"
          rel="stylesheet"
        />

        {/* CV font picker — body fonts */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Lato:wght@400;700&family=Open+Sans:wght@400;700&family=Source+Sans+3:wght@400;700&family=Nunito:wght@400;700&family=DM+Sans:wght@400;700&family=Jost:wght@400;700&family=PT+Sans:wght@400;700&family=Merriweather:wght@400;700&family=Crimson+Pro:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>

        <Toaster
          position="bottom-right"
          richColors
          closeButton
          expand={false}
        />

        <CookiesBanner />
      </body>
    </html>
  )
}
