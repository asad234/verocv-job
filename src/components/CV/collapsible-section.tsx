"use client"

import { type ReactNode, useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/utils/cn"

interface CollapsibleSectionProps {
  title: string
  icon: ReactNode
  defaultOpen?: boolean
  contentCount?: number
  children: ReactNode
  className?: string
}

export function CollapsibleSection({
  title,
  icon,
  defaultOpen = false,
  contentCount = 0,
  children,
  className,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={cn("mb-4 rounded-lg border bg-card text-card-foreground shadow-sm", className)}>
      <div onClick={() => setIsOpen(!isOpen)} className="flex cursor-pointer items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <div className="text-primary">{icon}</div>
          <h3 className="text-lg font-medium">{title}</h3>
          {!isOpen && contentCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {contentCount}
            </Badge>
          )}
        </div>
        <div>
          {isOpen ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </div>
      {isOpen && <div className="border-t p-4">{children}</div>}
    </div>
  )
}
