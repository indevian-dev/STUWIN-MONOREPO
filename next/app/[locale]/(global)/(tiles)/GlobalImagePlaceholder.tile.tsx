import * as React from "react";
import { PiImageBroken } from "react-icons/pi";

interface GlobalImagePlaceholderTileProps
    extends React.HTMLAttributes<HTMLDivElement> {
    /** Show the shimmer animation (loading state). Default: true */
    shimmer?: boolean;
    /** Show a broken-image icon + label (error state). Default: false */
    error?: boolean;
    /** Label shown in error state */
    errorLabel?: string;
    /** Aspect ratio class, e.g. "aspect-video", "aspect-square". Default: "aspect-video" */
    aspect?: string;
}

/**
 * Placeholder tile for images that are loading or failed to load.
 *
 * **Loading (shimmer):**
 * ```tsx
 * <GlobalImagePlaceholderTile shimmer />
 * ```
 *
 * **Error (broken image):**
 * ```tsx
 * <GlobalImagePlaceholderTile error errorLabel="Cover not found" />
 * ```
 *
 * **Custom aspect ratio:**
 * ```tsx
 * <GlobalImagePlaceholderTile aspect="aspect-square" />
 * ```
 */
export function GlobalImagePlaceholderTile({
    shimmer = true,
    error = false,
    errorLabel = "No image",
    aspect = "aspect-video",
    className,
    ...props
}: GlobalImagePlaceholderTileProps) {
    return (
        <div
            className={["relative w-full overflow-hidden rounded-app", // Base placeholder background
                "bg-black/5 dark:bg-white/5", // Shimmer animation when loading
                shimmer && !error && "img-placeholder", aspect, className].filter(Boolean).join(" ")}
            {...props}
        >
            {/* Error state: broken image icon + label */}
            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <PiImageBroken className="text-3xl text-app-dark-blue/20 dark:text-white/20" />
                    <span className="text-xs font-semibold text-app-dark-blue/30 dark:text-white/30">
                        {errorLabel}
                    </span>
                </div>
            )}
        </div>
    );
}
