import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

const badgeVariants = cva(
    "inline-flex items-center rounded-app-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-app-border focus:ring-offset-2",
    {
        variants: {
            variant: {
                default:
                    "border-transparent bg-app-bright-green text-white hover:bg-app-bright-green/80",
                secondary:
                    "border-transparent bg-black/5 dark:bg-white/5 backdrop-blur-md text-app-dark-blue dark:text-white hover:bg-black/5 dark:bg-white/5 backdrop-blur-md/80",
                destructive:
                    "border-transparent bg-app-bright-green-danger text-white hover:bg-app-bright-green-danger/80",
                success:
                    "border-transparent bg-app-bright-green-success text-white hover:bg-app-bright-green-success/80",
                warning:
                    "border-transparent bg-app-bright-green-warning text-white hover:bg-app-bright-green-warning/80",
                outline: "text-app-dark-blue dark:text-white border-black/10 dark:border-white/10",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function GlobalBadgeWidget({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={[badgeVariants({ variant }), className].filter(Boolean).join(" ")} {...props} />
    )
}

export { GlobalBadgeWidget, badgeVariants }
