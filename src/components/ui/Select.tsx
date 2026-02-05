interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export function Select({ label, error, options, className = '', ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="font-mono text-sm text-black">
          {label}
        </label>
      )}
      <select
        className={`px-3 py-2 border border-black bg-white text-black font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black ${className}`}
        {...props}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <span className="font-mono text-xs text-red-600">{error}</span>
      )}
    </div>
  )
}
