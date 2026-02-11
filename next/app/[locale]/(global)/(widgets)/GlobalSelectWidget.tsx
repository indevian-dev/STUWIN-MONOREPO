"use client"

import {
    useState,
    useEffect,
    useRef
} from "react";
import { SelectOption } from '@/types';

interface GlobalSelectWidgetProps<T = string> {
    options: SelectOption<T>[];
    value?: T | T[];
    onChange: (value: T | T[]) => void;
    placeholder?: string;
    isMulti?: boolean;
    disabled?: boolean;
    error?: string;
    label?: string;
    required?: boolean;
}

export function GlobalSelectWidget<T = string>({
    options,
    placeholder = "Select...",
    isMulti = false,
    onChange,
    value,
    disabled = false,
    error,
    label,
    required = false
}: GlobalSelectWidgetProps<T>) {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [selected, setSelected] = useState<T | T[]>(isMulti ? (value || []) : (value || "" as T))
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        setSelected(isMulti ? (value || []) : (value || "" as T))
    }, [value, isMulti])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const filteredOptions = options.filter((option) =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleSelect = (option: SelectOption<T>) => {
        if (isMulti) {
            const selectedArray = (Array.isArray(selected) ? selected : []) as T[];
            const newValue = selectedArray.some(item => item === option.value)
                ? selectedArray.filter((item) => item !== option.value)
                : [...selectedArray, option.value];
            setSelected(newValue);
            onChange(newValue);
        } else {
            // For single selection, just set the new value directly
            setSelected(option.value);
            onChange(option.value);
            setIsOpen(false);
        }
    };


    const getDisplayValue = () => {
        if (!selected || (Array.isArray(selected) && selected.length === 0)) {
            return placeholder
        }

        if (isMulti && Array.isArray(selected)) {
            return selected
                .map((val: T) => options.find((option) => option.value === val)?.label)
                .filter(Boolean)
                .join(", ")
        }

        const selectedOption = options.find((option) => option.value === selected)
        return selectedOption?.label || placeholder
    }

    const isSelected = (optionValue: T): boolean => {
        if (isMulti && Array.isArray(selected)) {
            return selected.some(item => item === optionValue);
        }
        return selected === optionValue;
    }

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <div
                className="w-full px-4 py-2 border rounded bg-white cursor-pointer flex justify-between items-center"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="truncate">
                    {getDisplayValue()}
                </div>
                <svg
                    className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </div>

            {isOpen && (
                <div key={`dropdown-${String(value)}`} className="absolute w-full mt-1 bg-white border rounded shadow-lg z-10 max-h-60 overflow-auto">
                    <input
                        type="text"
                        className="w-full px-4 py-2 border-b"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                    />

                    {filteredOptions.map((option) => (
                        <div
                            key={String(option.value)}
                            className={`px-4 py-2 cursor-pointer hover:bg-dark/5 flex items-center gap-2
                    ${isMulti
                                    ? isSelected(option.value) ? "bg-dark/10" : ""
                                    : selected === option.value ? "bg-brand text-white" : ""
                                }`}
                            onClick={() => handleSelect(option)}
                        >
                            {isMulti && (
                                <div className="w-4 h-4 border rounded flex items-center justify-center">
                                    {isSelected(option.value) && (
                                        <div className="w-2 h-2 bg-brand rounded" />
                                    )}
                                </div>
                            )}
                            {option.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default GlobalSelectWidget;