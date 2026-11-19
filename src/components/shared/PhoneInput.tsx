"use client"
// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/shared/PhoneInput.tsx   (NEW)
// A phone field that only accepts digits (and one "+" as the first character).
// Letters, spaces and other signs can't be typed or pasted. Opens the number keypad on phones.
// invalid → red border + pink background (set it when a save was refused).
// ══════════════════════════════════════════════════════════════════════

import type React from "react"
import { sanitizePhone } from "@/utils/phone"

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  value: string
  onChange: (value: string) => void
  /** Show the field as wrong: red border, pink background */
  invalid?: boolean
}

const INVALID_CLS = "!border-red-400 !bg-red-50 focus:!ring-red-200 focus:!border-red-400"

export default function PhoneInput({ value, onChange, invalid, className, ...rest }: Props) {
  return (
    <input
      {...rest}
      className={invalid ? `${className ?? ""} ${INVALID_CLS}` : className}
      aria-invalid={invalid || undefined}
      type="tel"
      pattern="\+?[0-9]*"
      inputMode="numeric"
      autoComplete={rest.autoComplete ?? "tel"}
      value={value}
      // Stop anything that isn't a digit (or a first "+") before it even appears.
      onBeforeInput={(e) => {
        const typed = (e.nativeEvent as InputEvent).data
        if (!typed) return
        const el = e.currentTarget
        const atStart = (el.selectionStart ?? 0) === 0 && !el.value.startsWith("+")
        // One typed character: only a digit (or "+" first). Pasted text is cleaned in onChange.
        if (typed.length === 1 && !/\d/.test(typed) && !(typed === "+" && atStart)) e.preventDefault()
      }}
      onChange={(e) => onChange(sanitizePhone(e.target.value))}
    />
  )
}
