import * as React from "react"
import { cn } from "@/utils/cn"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    const hasErrorClasses = className?.includes("border-red-500") || className?.includes("!border-red-500")

    return (
      <input
        type={type}
        className={cn(
          // Base styles
          "flex h-10 w-full rounded-md px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          !hasErrorClasses && "border border-input bg-background",
          !hasErrorClasses && "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          // Custom classes (including error classes) come last and take precedence
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Input.displayName = "Input"

export { Input }
