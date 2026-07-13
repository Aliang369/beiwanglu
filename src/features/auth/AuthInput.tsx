import { AlertCircle } from 'lucide-react'
import { useId, type ComponentType, type ReactNode } from 'react'

interface AuthInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  type?: string
  error?: string
  icon?: ComponentType<{ className?: string }>
  rightAction?: ReactNode
  disabled?: boolean
  autoComplete?: string
}

export function AuthInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
  icon: Icon,
  rightAction,
  disabled = false,
  autoComplete,
}: AuthInputProps) {
  const errorId = useId()

  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <div
        className={`group relative flex items-center rounded-full border transition-all ${
          error
            ? 'border-error bg-error-container/25 focus-within:ring-2 focus-within:ring-error-container'
            : 'border-transparent bg-surface-container-low hover:bg-surface-container focus-within:border-primary focus-within:ring-2 focus-within:ring-primary-fixed'
        } ${disabled ? 'opacity-60' : ''}`}
      >
        {Icon ? <Icon className={`absolute left-4 size-5 transition-colors ${error ? 'text-error' : 'text-on-surface-variant group-focus-within:text-primary'}`} /> : null}
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full rounded-full border-none bg-transparent py-4 font-body-md text-body-md text-on-surface outline-none placeholder:text-on-surface-variant disabled:cursor-not-allowed ${
            Icon ? 'pl-12' : 'pl-5'
          } ${rightAction || error ? 'pr-12' : 'pr-5'}`}
          placeholder={placeholder}
          type={type}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
        />
        {error && !rightAction ? <AlertCircle className="absolute right-4 size-5 text-error" /> : null}
        {rightAction ? <div className="absolute right-3 flex items-center">{rightAction}</div> : null}
      </div>
      {error ? <span id={errorId} className="mt-2 block px-2 font-label-sm text-label-sm text-error">{error}</span> : null}
    </label>
  )
}
