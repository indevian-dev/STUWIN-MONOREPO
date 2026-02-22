import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

const sectionVariants = cva(
    "relative w-full",
    {
        variants: {
            padding: {
                none: "",
                sm: "py-8 lg:py-12",
                default: "py-16 lg:py-24",
                lg: "py-24 lg:py-32",
                hero: "pt-12 pb-12 lg:pt-12 lg:pb-12",
            },
            layout: {
                full: "max-w-full",
                centered: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
            },
        },
        defaultVariants: {
            padding: "default",
            layout: "centered",
        },
    }
)

export interface SectionProps
    extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof sectionVariants> { }

const Section = React.forwardRef<HTMLElement, SectionProps>(
    ({ className, padding, layout, ...props }, ref) => (
        <section
            ref={ref}
            className={[sectionVariants({ padding, layout }), className].filter(Boolean).join(" ")}
            {...props}
        />
    )
)
Section.displayName = "Section"

export { Section, sectionVariants }
