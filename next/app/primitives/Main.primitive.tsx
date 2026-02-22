import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

const mainVariants = cva("w-full p-0 m-0", {
    variants: {
        variant: {
            /** Default: simple full-width flex column (public pages, auth pages) */
            default: "flex min-h-screen flex-col",
            /** App: full-width <main> for workspace layouts — container is constructed by each layout */
            app: "min-h-[calc(100vh-70px)]",
        }
    },
    defaultVariants: {
        variant: "default",
    }
})

interface MainProps extends React.HTMLAttributes<HTMLElement>, VariantProps<typeof mainVariants> { }

/**
 * Simple <main> wrapper with variant-based styling.
 * Layouts are responsible for constructing their own inner template (Container, sidebar, etc.).
 */
const Main = React.forwardRef<HTMLElement, MainProps>(
    ({ className, variant, children, ...props }, ref) => (
        <main
            ref={ref}
            className={[mainVariants({ variant }), className].filter(Boolean).join(" ")}
            {...props}
        >
            {children}
        </main>
    )
)
Main.displayName = "Main"

export { Main }
export type { MainProps }
