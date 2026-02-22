"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Button } from "@/app/primitives/Button.primitive";
import { Moon, Sun, Monitor } from "lucide-react";


export function GlobalThemeSwitcherWidget() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    // useEffect only runs on the client, so now we can safely show the UI
    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" className="w-9 h-9 opacity-0">
                <Sun className="h-4 w-4" />
            </Button>
        );
    }

    const toggleTheme = () => {
        if (theme === "light") setTheme("dark");
        else if (theme === "dark") setTheme("system");
        else setTheme("light");
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="w-9 h-9 relative overflow-hidden text-app-dark-blue/70 dark:text-white/70 hover:text-app-dark-blue dark:text-white"
            title={`Current theme: ${theme}`}
        >
            {theme === "light" && <Sun className="h-4 w-4" />}
            {theme === "dark" && <Moon className="h-4 w-4" />}
            {theme === "system" && <Monitor className="h-4 w-4" />}
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}
