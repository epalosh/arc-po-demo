'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { EntitySelector } from './EntitySelector'

const primaryNavItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/production-schedule', label: 'Production Schedule' },
  { href: '/generate', label: 'Generate POs' },
]

const menuItems = [
  { href: '/parts', label: 'Parts' },
  { href: '/suppliers', label: 'Suppliers' },
  { href: '/supplier-parts', label: 'Supplier Parts' },
  { href: '/boats', label: 'Boat Types' },
  { href: '/purchase-orders', label: 'Purchase Orders' },
  { href: '/diagnostics', label: 'Diagnostics' },
]

export function Navigation() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  return (
    <nav className="border-b border-black bg-white relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-mono text-xl font-bold text-black">
              ARC PO DEMO
            </Link>
            <div className="border-l border-gray-300 h-8"></div>
            <EntitySelector />
          </div>
          
          <div className="flex items-center gap-8">
            {primaryNavItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`font-mono text-sm transition-colors ${
                    isActive 
                      ? 'text-black font-bold border-b-2 border-black' 
                      : 'text-gray-600 hover:text-black'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
            
            {/* Hamburger Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="font-mono text-sm text-black hover:bg-gray-100 p-2 transition-colors"
              aria-label="Menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Dropdown Menu */}
      {isMenuOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="absolute right-6 top-16 mt-2 w-64 bg-white border border-black shadow-lg z-50">
            {menuItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-6 py-3 font-mono text-sm border-b border-gray-200 last:border-b-0 transition-colors ${
                    isActive 
                      ? 'bg-black text-white font-bold' 
                      : 'text-black hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
        </>
      )}
    </nav>
  )
}
