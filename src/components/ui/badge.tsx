import * as React from "react"
import { cn } from "@/lib/utils"

const Badge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "secondary" | "destructive" | "outline" | "lime"
  }
>(({ className, variant = "default", ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        {
          "bg-primary/15 text-primary border border-primary/25": variant === "default",
          "bg-secondary text-secondary-foreground border border-border": variant === "secondary",
          "bg-destructive/10 text-destructive border border-destructive/25": variant === "destructive",
          "border border-border text-muted-foreground": variant === "outline",
          "bg-accent/15 text-accent border border-accent/25": variant === "lime",
        },
        className
      )}
      {...props}
    />
  )
})
Badge.displayName = "Badge"

export { Badge }
