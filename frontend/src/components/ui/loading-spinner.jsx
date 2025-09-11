import * as React from "react"
import { cn } from "../../lib/utils"

const LoadingSpinner = React.forwardRef(({ className, size = "default", ...props }, ref) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    default: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12"
  }

  return (
    <div
      ref={ref}
      className={cn(
        "animate-spin rounded-full border-2 border-current border-t-transparent",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
})

LoadingSpinner.displayName = "LoadingSpinner"

export { LoadingSpinner }