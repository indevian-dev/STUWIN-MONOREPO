import * as React from "react";

/**
 * WorkspacePageTitleTile
 *
 * Shared page-level title block used at the top of every workspace page.
 * Features a left accent bar in app-bright-green and an optional green-tinted badge.
 *
 * @example
 * <WorkspacePageTitleTile
 *   title="Subjects"
 *   subtitle="Manage your curriculum subjects"
 *   icon={<PiBookOpen />}
 *   action={<Button>Add Subject</Button>}
 * />
 */
export function WorkspacePageTitleTile({
    title,
    subtitle,
    icon,
    action,
    className,
}) {
    return (
        <div
            className={["flex items-center justify-between gap-4 bg-white/80 dark:bg-white/5 border-black/10 dark:border-white/10 rounded-app p-4", className].filter(Boolean).join(" ")}
        >
            {/* Left: accent bar + text */}
            <div className="flex items-center gap-3 min-w-0">
                {/* Green accent bar */}

                <div className="min-w-0 grid grid-cols-1">
                    {/* Title with green/10 pill */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-app bg-app-bright-green/10">
                        <div className="w-4 h-4 rounded-app-full bg-app-bright-green shrink-0" />

                        {icon && (
                            <span className="text-app-bright-green shrink-0 text-lg leading-none">
                                {icon}
                            </span>
                        )}
                        <h1 className="text-xl font-bold text-app-dark-blue dark:text-white truncate">
                            {title}
                        </h1>
                    </div>

                    {/* Subtitle */}
                    {subtitle && (
                        <p className="text-sm text-app-dark-blue/40 dark:text-white/40 mt-1 pl-1">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>

            {/* Right: action slot */}
            {action && (
                <div className="shrink-0 flex items-center gap-2">{action}</div>
            )}
        </div>
    );
}
