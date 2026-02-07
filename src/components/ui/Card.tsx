interface CardProps {
  children: React.ReactNode
  className?: string
  title?: string
}

export function Card({ children, className = '', title }: CardProps) {
  return (
    <div className={`border border-gray-300 bg-white ${className}`} style={{ backgroundColor: '#ffffff' }}>
      {title && (
        <div className="border-b border-gray-300 px-6 py-4">
          <h3 className="font-mono text-lg font-bold text-black">{title}</h3>
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  )
}
