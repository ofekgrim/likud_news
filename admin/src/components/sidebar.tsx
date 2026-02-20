'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Newspaper,
  Image,
  FolderOpen,
  Users,
  Radio,
  Mail,
  Bell,
  UserCog,
  X,
  PenTool,
  MessageSquare,
  Tag as TagIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navGroups = [
  {
    label: 'תוכן',
    items: [
      { href: '/dashboard', label: 'לוח בקרה', icon: LayoutDashboard },
      { href: '/articles', label: 'כתבות', icon: Newspaper },
      { href: '/media', label: 'מדיה', icon: Image },
      { href: '/categories', label: 'קטגוריות', icon: FolderOpen },
    ],
  },
  {
    label: 'ניהול',
    items: [
      { href: '/members', label: 'חברי כנסת', icon: Users },
      { href: '/authors', label: 'כתבים', icon: PenTool },
      { href: '/comments', label: 'תגובות', icon: MessageSquare },
      { href: '/tags', label: 'תגיות', icon: TagIcon },
      { href: '/ticker', label: 'טיקר', icon: Radio },
      { href: '/contact', label: 'הודעות', icon: Mail },
      { href: '/push', label: 'התראות', icon: Bell },
      { href: '/users', label: 'משתמשים', icon: UserCog },
    ],
  },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      <div className="mb-8 px-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center font-bold text-lg">
            מ
          </div>
          <div>
            <h1 className="text-base font-bold text-white">מצודת הליכוד</h1>
            <p className="text-xs text-blue-200/80">ניהול תוכן</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-6 px-2">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-300/60 px-3 mb-2">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onLinkClick}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150',
                      isActive
                        ? 'bg-white/15 text-white font-medium shadow-sm'
                        : 'text-blue-200/80 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    <item.icon className="h-[18px] w-[18px] shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto px-3 pt-4 border-t border-white/10">
        <p className="text-[10px] text-blue-300/40">v0.1.0</p>
      </div>
    </>
  );
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-gradient-to-b from-[#1E3A8A] to-[#162d6e] text-white min-h-screen py-5 flex-col shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile overlay sidebar */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={onClose} />
          <aside className="absolute top-0 right-0 bottom-0 w-64 bg-gradient-to-b from-[#1E3A8A] to-[#162d6e] text-white py-5 flex flex-col shadow-2xl animate-slide-in-right">
            <div className="flex items-center justify-between px-3 mb-2">
              <span />
              <button
                onClick={onClose}
                className="text-blue-200 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                aria-label="סגור תפריט"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent onLinkClick={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}
