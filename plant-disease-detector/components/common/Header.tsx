// Componente Header de la aplicación

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Leaf, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Inicio' },
  { href: '/analyze', label: 'Analizar' },
  { href: '/guide', label: 'Guía' },
  { href: '/history', label: 'Historial' },
];

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <Leaf className="h-8 w-8 text-green-600" />
          <span className="hidden font-bold sm:inline-block text-xl">
            Plant Disease Detector
          </span>
          <span className="font-bold sm:hidden text-lg">PlantDetector</span>
        </Link>

        {/* Navegación Desktop */}
        <nav className="hidden md:flex items-center space-x-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                pathname === item.href
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Botón CTA Desktop */}
        <div className="hidden md:flex items-center space-x-4">
          <Button asChild variant="default" className="bg-green-600 hover:bg-green-700">
            <Link href="/analyze">Comenzar Análisis</Link>
          </Button>
        </div>

        {/* Menú Mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </Button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="container py-4 flex flex-col space-y-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'bg-green-100 text-green-700'
                    : 'text-muted-foreground hover:bg-accent'
                )}
              >
                {item.label}
              </Link>
            ))}
            <Button
              asChild
              className="mt-2 bg-green-600 hover:bg-green-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Link href="/analyze">Comenzar Análisis</Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
