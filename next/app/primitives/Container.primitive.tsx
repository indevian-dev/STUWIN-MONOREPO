import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

const containerVariants = cva(
    "mx-auto w-full transition-all duration-300",
    {
        variants: {
            variant: {
                full: "max-w-full px-4 md:px-8 lg:px-16", // Standard centered container for public pages
                '7xl': "max-w-7xl px-4 md:px-8 lg:px-16", // Accommodates left navigation
            },
        },
        defaultVariants: {
            variant: "full",
        },
    }
)

export interface ContainerProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> { }

/**
 * Centered container that constraints max-width and provides standard horizontal padding.
 * variant="7xl" will give space for a left-sided navigation bar on desktop.
 */
const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
    ({ className, variant, ...props }, ref) => (
        <div
            ref={ref}
            className={[containerVariants({ variant }), className].filter(Boolean).join(" ")}
            {...props}
        />
    )
)
Container.displayName = "Container"

export { Container, containerVariants }
