import * as React from "react"

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> { }

const GlobalInputWidget = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={["flex h-10 w-full rounded-app border border-black/10 dark:border-white/10 bg-white dark:bg-black/5 dark:bg-white/5 backdrop-blur-md px-3 py-2 text-sm text-app-dark-blue dark:text-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-app-dark-blue/70 dark:text-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app disabled:cursor-not-allowed disabled:opacity-50", className].filter(Boolean).join(" ")}
                ref={ref}
                {...props}
            />
        )
    }
)
GlobalInputWidget.displayName = "Input"

export { GlobalInputWidget }
