"use client"
// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Dashboard/contracts/ContractDocumentView.tsx
// WHAT IT DOES:   Renders a contract as a document (parties, sections, both signatures).
//                 Shared by the employee Contracts page and ManagerContractSign.
// ══════════════════════════════════════════════════════════════════════

import type React from "react"
import clsx from "clsx"
import { Icon } from "@iconify/react"
import {
  CONTRACT_SECTION_ORDER, emptySections, defaultDocumentStyle, isSectionFilled,
  type DocumentStyle, type SectionKey,
} from "@/utils/contractsStore"
import { CONTRACT_SECTION_LABELS } from "@/utils/contractSectionLabels"
import { effectiveRunStyle, type RichRun } from "@/utils/richText"

export interface SignatureInfo {
  name: string
  signedAt: string | null
  dataUrl: string | null
  /** "bankid" = signed with BankID (no drawn signature image) */
  method?: "bankid" | "verocv"
}

export interface ContractDocumentData {
  title: string
  sections: Partial<Record<SectionKey, RichRun[]>>
  documentStyle: Partial<DocumentStyle>
  companyName: string
  orgNumber?: string
  companyAddress?: string
  contactPerson?: string
  employeeName: string
  personalNumber?: string
  employeeAddress?: string
  signingPlace?: string
  signingDate?: string | null
  employeeSignature: SignatureInfo
  employerSignature: SignatureInfo
  /** Company logo (PNG data URL) — small at the top; faint watermark once fully signed. */
  companyLogo?: string | null
}

function fmtDate(d: string | null | undefined, isEn: boolean) {
  if (!d) return ""
  return new Date(d).toLocaleDateString(isEn ? "en-GB" : "sv-SE", { day: "numeric", month: "short", year: "numeric" })
}
function fmtDateTime(d: string, isEn: boolean) {
  return new Date(d).toLocaleString(isEn ? "en-GB" : "sv-SE", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

export default function ContractDocumentView({
  data: c, isEn, id = "contract-document",
}: { data: ContractDocumentData; isEn: boolean; id?: string }) {
  const style: DocumentStyle = { ...defaultDocumentStyle, ...c.documentStyle }
  const sections = { ...emptySections, ...c.sections }
  const label = (k: SectionKey) => (isEn ? CONTRACT_SECTION_LABELS[k].en : CONTRACT_SECTION_LABELS[k].sv)
  const fullySigned = !!c.employeeSignature.signedAt && !!c.employerSignature.signedAt

  const headingStyle: React.CSSProperties = {
    fontFamily: `'${style.headingFont}'`,
    color: style.headingColor,
    fontSize: `${style.headingSize}pt`,
    fontWeight: style.headingBold ? 700 : 400,
  }
  const titleText = (sections.agreementTitle ?? []).map(r => r.text).join("") || c.title || (isEn ? "Employment Agreement" : "Anställningsavtal")
  const bodySections = CONTRACT_SECTION_ORDER.filter(k => k !== "agreementTitle" && isSectionFilled(sections[k]))

  const PartyBlock = ({ heading, lines }: { heading: string; lines: string[] }) => (
    <div className="rounded-xl bg-gray-50/80 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">{heading}</p>
      {lines.filter(Boolean).map((l, i) => (
        <p key={i} className={clsx("text-sm", i === 0 ? "font-semibold text-gray-800" : "text-gray-600")}>{l}</p>
      ))}
    </div>
  )

  const SignatureLine = ({ heading, sig, sub }: { heading: string; sig: SignatureInfo; sub: string }) => (
    <div>
      <div className="h-20 border-b border-gray-400 flex items-end justify-center">
        {sig.dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={sig.dataUrl} alt={heading} className="max-h-[76px]" />
        ) : sig.signedAt && sig.method === "bankid" ? (
          <span className="mb-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100 text-xs font-semibold text-blue-900">
            <Icon icon="tabler:shield-check" className="w-4 h-4" />
            {isEn ? "Signed with BankID" : "Signerat med BankID"}
          </span>
        ) : null}
      </div>
      <p className="text-xs font-semibold text-gray-700 mt-2">{heading}</p>
      <p className="text-xs text-gray-500">
        {sig.signedAt ? sig.name || sub : sub}
        {sig.signedAt && ` — ${isEn ? "signed" : "signerat"} ${fmtDateTime(sig.signedAt, isEn)}`}
      </p>
      {!sig.signedAt && (
        <p className="text-[11px] text-amber-600 mt-0.5 flex items-center gap-1">
          <Icon icon="tabler:clock" className="w-3 h-3" />
          {isEn ? "Not signed yet" : "Inte signerat ännu"}
        </p>
      )}
    </div>
  )

  return (
    <article id={id} className="relative isolate overflow-clip bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-10">
      {/* Watermark — once both parties have signed (same as the signed PDF).
          Drawn over the content with "multiply" so it shows through the grey boxes
          but never hides text. Sticky so it stays in view while scrolling a long contract. */}
      {fullySigned && c.companyLogo && (
        <div aria-hidden className="pointer-events-none absolute inset-0 z-20 select-none">
          <div className="sticky top-0 flex h-screen max-h-full items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.companyLogo} alt="" draggable={false}
              className="w-3/5 max-w-[440px] max-h-[60%] object-contain opacity-[0.09] mix-blend-multiply" />
          </div>
        </div>
      )}

      {fullySigned && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-green-200 bg-green-50 text-[11px] font-semibold text-green-700">
          <Icon icon="tabler:rosette-discount-check-filled" className="w-4 h-4" />
          {isEn ? "Fully signed" : "Fullständigt signerat"}
        </div>
      )}

      {c.companyLogo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={c.companyLogo} alt={c.companyName || (isEn ? "Company logo" : "Företagslogga")}
          className="relative h-10 max-w-[160px] object-contain object-left mb-4" />
      )}

      <h1 style={{ ...headingStyle, fontSize: `${style.headingSize + 6}pt`, marginBottom: 20 }} className={clsx("relative", fullySigned && "pr-40")}>
        {titleText}
      </h1>

      {/* Parties */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        <PartyBlock
          heading={isEn ? "Employer" : "Arbetsgivare"}
          lines={[
            c.companyName,
            c.orgNumber ? `${isEn ? "Org. no." : "Org.nr"} ${c.orgNumber}` : "",
            c.companyAddress ?? "",
            c.contactPerson ? `${isEn ? "Contact" : "Kontaktperson"}: ${c.contactPerson}` : "",
          ]}
        />
        <PartyBlock
          heading={isEn ? "Employee" : "Arbetstagare"}
          lines={[
            c.employeeName,
            c.personalNumber ? `${isEn ? "Personal no." : "Personnr"} ${c.personalNumber}` : "",
            c.employeeAddress ?? "",
          ]}
        />
      </div>

      {/* Sections */}
      {bodySections.length === 0 ? (
        <p className="text-sm text-gray-400">{isEn ? "This contract has no content yet." : "Kontraktet har inget innehåll ännu."}</p>
      ) : (
        bodySections.map(key => (
          <section key={key} className="mb-6" style={{ breakInside: "avoid" }}>
            <h2 style={{ ...headingStyle, marginBottom: 6 }}>{label(key)}</h2>
            <p style={{ lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
              {(sections[key] ?? []).map(run => (
                <span key={run.id} style={effectiveRunStyle(run, {
                  fontFamily: style.bodyFont,
                  color: style.bodyColor,
                  fontSize: style.bodySize,
                })}>
                  {run.text}
                </span>
              ))}
            </p>
          </section>
        ))
      )}

      {/* Signatures */}
      <div className="mt-10 pt-6 border-t border-gray-200">
        {(c.signingPlace || c.signingDate) && (
          <p className="text-xs text-gray-500 mb-6">
            {[c.signingPlace, fmtDate(c.signingDate, isEn)].filter(Boolean).join(", ")}
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <SignatureLine
            heading={isEn ? "Employer" : "Arbetsgivare"}
            sig={c.employerSignature}
            sub={c.companyName}
          />
          <SignatureLine
            heading={isEn ? "Employee" : "Arbetstagare"}
            sig={c.employeeSignature}
            sub={c.employeeName}
          />
        </div>
      </div>
    </article>
  )
}
