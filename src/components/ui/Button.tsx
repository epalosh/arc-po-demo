interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  children: React.ReactNode
}

export function Button({ variant = 'primary', children, className = '', ...props }: ButtonProps) {
  const baseStyles = 'px-6 py-2 font-mono text-sm transition-all duration-200 border disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variantStyles = {
    primary: 'bg-black text-white border-black hover:bg-white hover:text-black',
    secondary: 'bg-white text-black border-black hover:bg-black hover:text-white',
    danger: 'bg-red-600 text-white border-red-600 hover:bg-red-700'
  }
  
  return (
    <button 
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
