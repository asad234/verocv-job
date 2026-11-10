"use client"

import { XCircle, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"

interface MissingField {
    field: string
    label: string
}

interface CategoryIssues {
    category: string
    icon: string
    items: { name: string; missing: MissingField[] }[]
}

interface MissingFieldsModalProps {
    issues: CategoryIssues[]
    onClose: () => void
    onAccept: () => void
}

export function MissingFieldsModal({ issues, onClose, onAccept }: MissingFieldsModalProps) {
    const [expanded, setExpanded] = useState<string | null>(issues[0]?.category ?? null)

    const totalIssues = issues.reduce((sum, c) =>
        sum + c.items.reduce((s, i) => s + i.missing.length, 0), 0
    )

    return (
        <div style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 9999, padding: "1rem",
        }}>
            <div style={{
                background: "var(--color-background-primary)",
                borderRadius: "var(--border-radius-lg)",
                border: "0.5px solid var(--color-border-tertiary)",
                width: "100%", maxWidth: 520,
                maxHeight: "80vh", display: "flex", flexDirection: "column",
            }}>

                {/* Header */}
                <div style={{
                    padding: "1.25rem 1.5rem",
                    borderBottom: "0.5px solid var(--color-border-tertiary)",
                    display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                            background: "var(--color-background-warning)",
                            borderRadius: "var(--border-radius-md)",
                            width: 36, height: 36,
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <AlertTriangle style={{ width: 18, height: 18, color: "var(--color-text-warning)" }} />
                        </div>
                        <div>
                            <p style={{ fontWeight: 500, fontSize: 15, margin: 0, color: "var(--color-text-primary)" }}>
                                Some fields need attention
                            </p>
                            <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>
                                {totalIssues} missing {totalIssues === 1 ? "field" : "fields"} across {issues.length} {issues.length === 1 ? "section" : "sections"}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "var(--color-text-secondary)", padding: 4,
                    }}>
                        <XCircle style={{ width: 20, height: 20 }} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ overflowY: "auto", flex: 1, padding: "0.75rem 1.5rem" }}>
                    {issues.map((category) => (
                        <div key={category.category} style={{ marginBottom: 8 }}>
                            <button
                                onClick={() => setExpanded(expanded === category.category ? null : category.category)}
                                style={{
                                    width: "100%", display: "flex", alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "0.6rem 0.75rem",
                                    background: "var(--color-background-secondary)",
                                    border: "0.5px solid var(--color-border-tertiary)",
                                    borderRadius: "var(--border-radius-md)",
                                    cursor: "pointer",
                                }}
                            >
                                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ fontSize: 16 }}>{category.icon}</span>
                                    <span style={{ fontWeight: 500, fontSize: 14, color: "var(--color-text-primary)" }}>
                                        {category.category}
                                    </span>
                                    <span style={{
                                        fontSize: 11, fontWeight: 500,
                                        background: "var(--color-background-warning)",
                                        color: "var(--color-text-warning)",
                                        padding: "2px 8px",
                                        borderRadius: "var(--border-radius-md)",
                                    }}>
                                        {category.items.reduce((s, i) => s + i.missing.length, 0)} missing
                                    </span>
                                </span>
                                {expanded === category.category
                                    ? <ChevronUp style={{ width: 16, height: 16, color: "var(--color-text-secondary)" }} />
                                    : <ChevronDown style={{ width: 16, height: 16, color: "var(--color-text-secondary)" }} />
                                }
                            </button>

                            {expanded === category.category && (
                                <div style={{
                                    border: "0.5px solid var(--color-border-tertiary)",
                                    borderTop: "none",
                                    borderRadius: "0 0 var(--border-radius-md) var(--border-radius-md)",
                                    overflow: "hidden",
                                }}>
                                    {category.items.map((item, idx) => (
                                        <div key={idx} style={{
                                            padding: "0.6rem 0.75rem",
                                            borderBottom: idx < category.items.length - 1
                                                ? "0.5px solid var(--color-border-tertiary)" : "none",
                                        }}>
                                            <p style={{ fontWeight: 500, fontSize: 13, margin: "0 0 4px", color: "var(--color-text-primary)" }}>
                                                {item.name}
                                            </p>
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                                {item.missing.map((f) => (
                                                    <span key={f.field} style={{
                                                        fontSize: 11,
                                                        background: "var(--color-background-danger)",
                                                        color: "var(--color-text-danger)",
                                                        padding: "2px 8px",
                                                        borderRadius: "var(--border-radius-md)",
                                                    }}>
                                                        {f.label}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div style={{
                    padding: "1rem 1.5rem",
                    borderTop: "0.5px solid var(--color-border-tertiary)",
                    display: "flex", gap: 8, justifyContent: "flex-end",
                }}>
                    <button onClick={onClose} style={{
                        padding: "0.5rem 1rem", borderRadius: "var(--border-radius-md)",
                        border: "0.5px solid var(--color-border-secondary)",
                        background: "none", cursor: "pointer", fontSize: 14,
                        color: "var(--color-text-primary)",
                    }}>
                        Review manually
                    </button>
                    <button onClick={onAccept} style={{
                        padding: "0.5rem 1rem", borderRadius: "var(--border-radius-md)",
                        border: "none", cursor: "pointer", fontSize: 14,
                        background: "rgb(5, 22, 80)", color: "white", fontWeight: 500,
                    }}>
                        Accept anyway
                    </button>
                </div>
            </div>
        </div>
    )
}