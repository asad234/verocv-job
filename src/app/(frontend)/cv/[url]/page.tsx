"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CVData } from "@/utils/types";
import Image from "next/image";

import LivePdfPreview from "@/components/CV/PdfViewer/livePdfViewer";

// Type guard to validate template
function isTemplate(
  t: any
): t is "minimalist" | "modern" | "classic" | "ats" | "konsult" {
  return ["minimalist", "modern", "classic", "ats", "konsult"].includes(t);
}

const MyCVPage = () => {
  const { url } = useParams<{ url: string }>();
  const router = useRouter();

  const [cvDataDigital, setCvDataDigital] = useState<CVData | null>(null);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<"ok" | "notFound" | "error">("ok");

  useEffect(() => {
    if (!url) return;

    const controller = new AbortController();

    const fetchCV = async () => {
      try {
        setLoading(true);

        const res = await fetch(
          `/api/cv/public-cv/${encodeURIComponent(url)}`,
          {
            signal: controller.signal,
            cache: "force-cache",
          }
        );

        if (res.status === 404) {
          setState("notFound");
          return;
        }

        if (!res.ok) throw new Error("Fetch error");

        const data = await res.json();
        setCvDataDigital(data);
        setState("ok");
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error(err);
          setState("error");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchCV();
    return () => controller.abort();
  }, [url]);

  const Placeholder = ({
    title,
    message,
  }: {
    title: string;
    message: string;
  }) => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50 p-6">
      <div className="max-w-xl w-full text-center bg-white/90 backdrop-blur-sm border border-blue-200 rounded-3xl p-12">
        <div className="mb-6 flex justify-center">
          <Image
            src="/logo/logovero.svg"
            alt="VeroCV Logo"
            width={280}
            height={280}
            priority
          />
        </div>
        <h2 className="text-2xl font-semibold text-red-600 mb-4">{title}</h2>
        <p className="text-lg text-slate-700 mb-8">{message}</p>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition"
        >
          Gå till startsidan
        </button>
      </div>
      <footer className="mt-12 text-sm text-slate-500 text-center">
        © {new Date().getFullYear()} VeroCV. All rights reserved.
      </footer>
    </div>
  );

  if (loading)
    return (
      <Placeholder
        title="Laddar CV..."
        message="Var god vänta medan vi hämtar informationen."
      />
    );
  if (state === "error")
    return (
      <Placeholder
        title="Ett fel uppstod"
        message="Kunde inte hämta CV. Försök igen senare."
      />
    );
  if (state === "notFound")
    return (
      <Placeholder
        title="Inget CV hittades"
        message="CV:t finns inte eller är inte offentligt."
      />
    );

  // Ensure template is valid, fallback to "modern"
  const template = cvDataDigital?.template && isTemplate(cvDataDigital.template)
    ? cvDataDigital.template
    : "modern";

  return (
    <>
      {cvDataDigital && (
        <div className="fixed inset-0 w-full h-full">
          <LivePdfPreview
            cvData={cvDataDigital}
            visibility={cvDataDigital.visibility}
            template={template}
            showToolbar={false}
            fullScreen={true}
            portfolioItems={(cvDataDigital.portfolioItems ?? []) as any}
            accentColor={cvDataDigital.accentColor}
            headingFontId={cvDataDigital.headingFontId}
            bodyFontId={cvDataDigital.bodyFontId}
          />
        </div>
      )}

      {/* Floating overlay logo */}
      <a
        href="https://verocv.se"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-[9999] flex flex-col items-center group"
      >
        <Image
          src="/logo/logovero.svg"
          alt="VeroCV Logo"
          width={120}
          height={120}
          className="opacity-40 group-hover:opacity-90 shadow-xl transition"
          priority
        />
        <span className="mt-1 text-xs text-gray-800 bg-white/90 px-2 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition">
          Powered by VeroCV
        </span>
      </a>
    </>
  );
};

export default MyCVPage;
