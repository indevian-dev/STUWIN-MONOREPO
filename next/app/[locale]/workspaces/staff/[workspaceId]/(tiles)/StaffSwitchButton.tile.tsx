"use client";

import { useState } from 'react';

export interface StaffSwitchButtonTileProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  'aria-label'?: string;
}

export function StaffSwitchButtonTile({ 
  checked, 
  onChange, 
  disabled = false,
  'aria-label': ariaLabel 
}: StaffSwitchButtonTileProps) {
  const [isChecked, setIsChecked] = useState(checked);

  const handleChange = () => {
    if (disabled) return;
    setIsChecked(!isChecked);
    onChange();
  };

  return (
    <label className={`flex items-center ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
      <div className="relative">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={handleChange}
          disabled={disabled}
          aria-label={ariaLabel}
          className="sr-only"
        />
        <div className="block bg-gray-600 w-14 h-8 rounded-app-full"></div>
        <div
          className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-app-full transition transform ${isChecked ? 'translate-x-6' : ''
            }`}
        ></div>
      </div>
    </label>
  );
};
