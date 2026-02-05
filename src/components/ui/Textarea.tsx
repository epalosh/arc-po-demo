interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Textarea({ label, error, className = '', ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="font-mono text-sm text-black">
          {label}
        </label>
      )}
      <textarea
        className={`px-3 py-2 border border-black bg-white text-black font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none ${className}`}
        {...props}
      />
      {error && (
        <span className="font-mono text-xs text-red-600">{error}</span>
      )}
    </div>
  )
}
