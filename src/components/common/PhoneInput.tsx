import React from "react";
import { toast } from "react-hot-toast";

export function sanitizePhone(val: string): string {
  if (!val) return "";
  let digits = val.replace(/\D/g, "");
  // If user typed/pasted country code +91 or 91 prefix making it > 10 digits, strip the leading 91
  if (digits.length > 10 && digits.startsWith("91")) {
    digits = digits.slice(2);
  }
  return digits.slice(0, 10);
}

export interface PhoneInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  id?: string;
  inputClassName?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  name = "phone",
  disabled = false,
  required = false,
  placeholder = "XXXXX XXXXX",
  className = "",
  inputClassName = "",
  onBlur,
  id,
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const sanitized = sanitizePhone(rawVal);
    
    // Create synthetic event with sanitized 10-digit numeric value
    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        name: e.target.name || name,
        value: sanitized,
      },
    };
    onChange(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <div
      className={`flex items-center rounded-lg border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-yellow-400 focus-within:border-transparent transition-all ${
        disabled ? "bg-gray-100 border-gray-200 cursor-not-allowed" : "bg-white"
      } ${className}`}
    >
      <span className="px-3 py-2.5 bg-gray-100 border-r border-gray-300 text-gray-700 text-sm font-semibold flex items-center shrink-0 select-none font-mono">
        +91
      </span>
      <input
        type="tel"
        id={id}
        name={name}
        value={value}
        onChange={handleInputChange}
        onBlur={onBlur}
        disabled={disabled}
        placeholder={placeholder}
        maxLength={10}
        minLength={10}
        pattern="[0-9]{10}"
        onInvalid={(e) => {
          e.preventDefault();
          toast.error("Phone number must be exactly 10 digits");
        }}
        className={`w-full px-3.5 py-2.5 outline-none text-sm text-gray-900 bg-transparent disabled:cursor-not-allowed disabled:text-gray-600 font-mono tracking-wider placeholder:font-sans placeholder:tracking-normal ${inputClassName}`}
        required={required}
      />
    </div>
  );
};
