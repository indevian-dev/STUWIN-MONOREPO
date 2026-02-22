import * as React from "react"

const GlobalCardWidget = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={["rounded-app border border-black/10 dark:border-white/10 bg-white dark:bg-black/5 dark:bg-white/5 backdrop-blur-md text-app-dark-blue dark:text-white shadow-app-widget", className].filter(Boolean).join(" ")}
        {...props}
    />
))
GlobalCardWidget.displayName = "Card"

const GlobalCardHeaderWidget = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={["flex flex-col space-y-1.5 p-app-widget border-b border-black/10 dark:border-white/10/50", className].filter(Boolean).join(" ")}
        {...props}
    />
))
GlobalCardHeaderWidget.displayName = "CardHeader"

const GlobalCardTitleWidget = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={["font-semibold leading-none tracking-tight", className].filter(Boolean).join(" ")}
        {...props}
    />
))
GlobalCardTitleWidget.displayName = "CardTitle"

const GlobalCardDescriptionWidget = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={["text-sm text-app-dark-blue/70 dark:text-white/70", className].filter(Boolean).join(" ")}
        {...props}
    />
))
GlobalCardDescriptionWidget.displayName = "CardDescription"

const GlobalCardContentWidget = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={["p-app-widget pt-0", className].filter(Boolean).join(" ")} {...props} />
))
GlobalCardContentWidget.displayName = "CardContent"

const GlobalCardFooterWidget = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={["flex items-center p-app-widget pt-0", className].filter(Boolean).join(" ")}
        {...props}
    />
))
GlobalCardFooterWidget.displayName = "CardFooter"

export {
    GlobalCardWidget,
    GlobalCardHeaderWidget,
    GlobalCardFooterWidget,
    GlobalCardTitleWidget,
    GlobalCardDescriptionWidget,
    GlobalCardContentWidget,
}
