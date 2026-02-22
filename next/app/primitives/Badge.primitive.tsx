import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

const badgeVariants = cva(
    "inline-flex items-center rounded-app-full border border-black/10 dark:border-white/10 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-app-primary focus:ring-offset-2",
    {
        variants: {
            variant: {
                default:
                    "border-transparent bg-app-bright-green text-[#0f172b] hover:bg-app-bright-green/80 shadow-sm",
                secondary:
                    "border-transparent bg-black/5 dark:bg-white/5 backdrop-blur-md text-app-dark-blue dark:text-white hover:bg-black/5 dark:bg-white/5 backdrop-blur-md/80",
                destructive:
                    "border-transparent bg-app-bright-green-danger text-white hover:bg-app-bright-green-danger/80",
                outline: "text-app-dark-blue dark:text-white",
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

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={[badgeVariants({ variant }), className].filter(Boolean).join(" ")} {...props} />
    )
}

export { Badge, badgeVariants }
