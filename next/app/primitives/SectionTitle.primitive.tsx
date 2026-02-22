import * as React from "react"

interface SectionTitleProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
    /** Main heading text */
    title: React.ReactNode
    /** Optional subtitle / description below the title */
    description?: React.ReactNode
    /** Optional right-side action slot (buttons, links, etc.) */
    action?: React.ReactNode
    /** Icon shown to the left of the title */
    icon?: React.ReactNode
}

/**
 * Reusable section header with app-bright-green/10 background pill on the title.
 * Use this anywhere you need a consistent `<h2>` section heading inside a Card.
 *
 * @example
 * <SectionTitle title="Media Library" icon={<PiFilePdf />} action={<Button>Upload</Button>} />
 */
const SectionTitle = React.forwardRef<HTMLDivElement, SectionTitleProps>(
    ({ className, title, description, action, icon, ...props }, ref) => (
        <div
            ref={ref}
            className={["flex items-start justify-between gap-4 mb-6", className].filter(Boolean).join(" ")}
            {...props}
        >
            <div className="flex-1 min-w-0">
                {/* Title row */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-app
          bg-app-bright-green/10 dark:bg-app-bright-green/10 mb-1">
                    {icon && (
                        <span className="text-app-bright-green text-lg leading-none shrink-0">
                            {icon}
                        </span>
                    )}
                    <h2 className="text-base font-bold tracking-tight text-app-dark-blue dark:text-white truncate">
                        {title}
                    </h2>
                </div>

                {/* Optional description */}
                {description && (
                    <p className="text-sm text-app-dark-blue/50 dark:text-white/50 mt-1 pl-1">
                        {description}
                    </p>
                )}
            </div>

            {/* Right-side actions */}
            {action && (
                <div className="shrink-0 flex items-center gap-2">
                    {action}
                </div>
            )}
        </div>
    )
)
SectionTitle.displayName = "SectionTitle"

export { SectionTitle }
