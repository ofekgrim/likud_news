'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getUser, logout, type AuthUser } from '@/lib/auth';

const PAGE_NAMES: Record<string, string> = {
  '/dashboard': 'לוח בקרה',
  '/articles': 'כתבות',
  '/articles/new': 'כתבה חדשה',
  '/media': 'מדיה',
  '/categories': 'קטגוריות',
  '/members': 'חברי כנסת',
  '/ticker': 'טיקר',
  '/contact': 'הודעות',
  '/push': 'התראות',
  '/users': 'משתמשים',
};

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  const pageName = PAGE_NAMES[pathname] || (pathname.includes('/articles/') && pathname.includes('/edit') ? 'עריכת כתבה' : '');

  return (
    <header className="h-14 border-b border-gray-200 bg-white px-4 md:px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="md:hidden"
          aria-label="פתח תפריט"
        >
          <Menu className="h-5 w-5" />
        </Button>
        {pageName && (
          <h2 className="text-sm font-medium text-gray-600">{pageName}</h2>
        )}
      </div>
      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-[#0099DB] flex items-center justify-center text-white text-xs font-bold">
              {user.name.charAt(0)}
            </div>
            <span className="text-sm text-gray-600 hidden sm:inline">
              {user.name}
            </span>
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={logout} className="text-gray-500 hover:text-gray-700">
          <LogOut className="h-4 w-4 ml-1" />
          <span className="hidden sm:inline">יציאה</span>
        </Button>
      </div>
    </header>
  );
}
