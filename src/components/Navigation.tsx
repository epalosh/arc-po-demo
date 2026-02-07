'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { EntitySelector } from './EntitySelector'

const primaryNavItems = [
  { href: '/', label: 'Dashboard' },
]

const dashboardMenuItem = { href: '/', label: 'Dashboard' }

const plannerMenuItems = [
  { href: '/production-schedule', label: 'Production Schedule' },
  { href: '/parts', label: 'Inventory' },
  { href: '/boats', label: 'Boat Types' },
]

const buyerMenuItems = [
  { href: '/generate', label: 'Generate POs' },
  { href: '/purchase-orders', label: 'Purchase Orders' },
  { href: '/suppliers', label: 'Suppliers' },
  { href: '/supplier-parts', label: 'Supplier Parts' },
]

const otherMenuItems = [
  { href: '/diagnostics', label: 'Diagnostics' },
]

export function Navigation() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  // Disable entity selector on configure-po page
  const isEntitySelectorDisabled = pathname?.includes('/configure-po') || false
  
  return (
    <nav className="border-b border-black bg-white relative">
      <div className="px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
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
            
            <div className="border-l border-gray-300 h-8"></div>
            <EntitySelector disabled={isEntitySelectorDisabled} />
          </div>
          
          {/* Centered Logo */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <Link href="/" className="font-mono text-xl font-bold text-black">
              Arc Demo: POs
            </Link>
          </div>
          
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className={`font-mono text-sm transition-colors ${
                pathname === '/'
                  ? 'text-black font-bold border-b-2 border-black' 
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              Return to Dashboard
            </Link>
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
          <div className="absolute left-6 top-16 mt-2 w-72 bg-white border-2 border-black shadow-lg z-50">
            {/* Dashboard Link */}
            <Link
              href={dashboardMenuItem.href}
              onClick={() => setIsMenuOpen(false)}
              className={`block px-6 py-3 font-mono text-sm border-b-2 border-black transition-colors ${
                pathname === dashboardMenuItem.href
                  ? 'bg-black text-white font-bold' 
                  : 'text-black hover:bg-gray-50'
              }`}
            >
              {dashboardMenuItem.label}
            </Link>
            
            {/* Planner Section */}
            <div className="border-b-2 border-black">
              <div className="px-6 py-3 bg-[#0a1929] border-b border-gray-700">
                <div className="font-mono text-xs font-bold text-white">
                  PLANNER
                </div>
              </div>
              {plannerMenuItems.map((item, index) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`block px-6 py-3 font-mono text-sm transition-colors ${
                      index < plannerMenuItems.length - 1 ? 'border-b border-gray-200' : ''
                    } ${
                      isActive 
                        ? 'bg-black text-white font-bold' 
                        : 'text-black hover:bg-gray-50'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>
            
            {/* Buyer Section */}
            <div className="border-b-2 border-black">
              <div className="px-6 py-3 bg-[#0a1929] border-b border-gray-700">
                <div className="font-mono text-xs font-bold text-white">
                  BUYER
                </div>
              </div>
              {buyerMenuItems.map((item, index) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`block px-6 py-3 font-mono text-sm transition-colors ${
                      index < buyerMenuItems.length - 1 ? 'border-b border-gray-200' : ''
                    } ${
                      isActive 
                        ? 'bg-black text-white font-bold' 
                        : 'text-black hover:bg-gray-50'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>
            
            {/* Other Section */}
            {otherMenuItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-6 py-3 font-mono text-sm transition-colors ${
                    isActive 
                      ? 'bg-black text-white font-bold' 
                      : 'text-black hover:bg-gray-50'
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
