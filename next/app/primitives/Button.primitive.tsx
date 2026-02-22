import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { Link } from "@/i18n/routing"

// Export variants so they can be consumed by next/link or other wrappers
export const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-app-full text-sm font-bold ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "bg-app-bright-green text-app-dark-blue hover:bg-app-bright-green/90 shadow-app-widget shadow-app/20 hover:scale-[1.02] active:scale-95",
                secondary: "bg-black/5 dark:bg-white/5 backdrop-blur-md border border-black/10 dark:border-white/10 text-app-dark-blue dark:text-white hover:bg-black/10 dark:hover:bg-white/10 shadow-sm active:scale-95",
                outline: "border-2 border-black/10 dark:border-white/10 bg-transparent hover:bg-black/5 dark:bg-white/5 backdrop-blur-md text-app-dark-blue dark:text-white active:scale-95",
                ghost: "hover:bg-black/5 dark:bg-white/5 backdrop-blur-md hover:text-app-dark-blue dark:text-white text-app-dark-blue/70 dark:text-white/70",
                destructive: "bg-app-bright-green-danger text-white hover:bg-app-bright-green-danger/90 shadow-app-widget shadow-app/20 active:scale-95",
                link: "text-app-bright-green underline-offset-4 hover:underline",
                elevated: "bg-black/5 dark:bg-white/5 backdrop-blur-md border border-black/10 dark:border-white/10 text-app-dark-blue dark:text-white shadow-app-widget hover:shadow-xl hover:-translate-y-1 transition-all duration-300",
            },
            size: {
                default: "h-11 px-6 py-2",
                sm: "h-9 px-4 text-xs",
                lg: "h-14 px-10 text-base",
                xl: "h-16 px-12 text-lg",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export type ButtonProps =
    | (React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants> & { isLink?: false })
    | (React.ComponentProps<typeof Link> & VariantProps<typeof buttonVariants> & { isLink: true });

const Button = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
    (props, ref) => {
        const { className, variant, size, isLink, ...rest } = props;

        if (isLink) {
            const linkProps = rest as Omit<React.ComponentProps<typeof Link>, "className">;
            return (
                <Link
                    className={buttonVariants({ variant, size, className })}
                    ref={ref as React.Ref<HTMLAnchorElement>}
                    {...linkProps}
                />
            )
        }

        const btnProps = rest as Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className">;
        return (
            <button
                className={buttonVariants({ variant, size, className })}
                ref={ref as React.Ref<HTMLButtonElement>}
                {...btnProps}
            />
        )
    }
)
Button.displayName = "Button"

export { Button }
