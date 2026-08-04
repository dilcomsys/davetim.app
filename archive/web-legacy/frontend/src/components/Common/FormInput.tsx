import React, { useState, useCallback } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { debounce, ValidationResult } from '../../utils/validation';

interface FormInputProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'date' | 'time' | 'number';
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  validate?: (value: string) => ValidationResult;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  autoComplete?: string;
  maxLength?: number;
  icon?: React.ReactNode;
  formatValue?: (value: string) => string;
}

/**
 * Reusable Form Input Component with Real-time Validation
 */
export const FormInput: React.FC<FormInputProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  disabled = false,
  error: externalError,
  helperText,
  validate,
  validateOnChange = false,
  validateOnBlur = true,
  autoComplete,
  maxLength,
  icon,
  formatValue,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [internalError, setInternalError] = useState<string | undefined>();
  const [touched, setTouched] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Use external error if provided, otherwise use internal error
  const displayError = externalError || internalError;

  // Debounced validation for onChange
  const debouncedValidate = useCallback(
    debounce((val: string) => {
      if (validate) {
        setIsValidating(true);
        const result = validate(val);
        setInternalError(result.isValid ? undefined : result.error);
        setIsValidating(false);
      }
    }, 500),
    [validate]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;

    // Apply value formatting if provided
    if (formatValue) {
      newValue = formatValue(newValue);
    }

    onChange(newValue);

    // Validate on change if enabled
    if (validateOnChange && validate && touched) {
      debouncedValidate(newValue);
    }
  };

  const handleBlur = () => {
    setTouched(true);

    // Validate on blur if enabled
    if (validateOnBlur && validate) {
      const result = validate(value);
      setInternalError(result.isValid ? undefined : result.error);
    }

    if (onBlur) {
      onBlur();
    }
  };

  const inputType = type === 'password' && showPassword ? 'text' : type;
  const hasError = touched && !!displayError;
  const isValid = touched && !displayError && value.trim() !== '';

  return (
    <div className="w-full">
      {/* Label */}
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Input Container */}
      <div className="relative">
        {/* Icon */}
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}

        {/* Input */}
        <input
          id={name}
          name={name}
          type={inputType}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          maxLength={maxLength}
          className={`
            w-full px-4 py-3 rounded-lg border transition-all duration-200
            ${icon ? 'pl-10' : ''}
            ${type === 'password' ? 'pr-10' : ''}
            ${hasError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
            ${isValid ? 'border-green-500 focus:ring-green-500 focus:border-green-500' : ''}
            ${!hasError && !isValid ? 'border-gray-300 focus:ring-primary-500 focus:border-primary-500' : ''}
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            focus:ring-2 focus:outline-none
            placeholder-gray-400
          `}
        />

        {/* Password Toggle */}
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        )}

        {/* Validation Icons */}
        {type !== 'password' && (
          <>
            {hasError && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500">
                <AlertCircle className="h-5 w-5" />
              </div>
            )}
            {isValid && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                <CheckCircle className="h-5 w-5" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Helper Text / Error Message */}
      {(helperText || displayError) && (
        <div className="mt-1.5 text-sm flex items-start gap-1">
          {hasError ? (
            <>
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span className="text-red-600">{displayError}</span>
            </>
          ) : (
            <span className="text-gray-500">{helperText}</span>
          )}
        </div>
      )}

      {/* Character Count (if maxLength is set) */}
      {maxLength && value.length > maxLength * 0.8 && (
        <div className="mt-1 text-xs text-right text-gray-500">
          {value.length} / {maxLength}
        </div>
      )}
    </div>
  );
};

export default FormInput;

