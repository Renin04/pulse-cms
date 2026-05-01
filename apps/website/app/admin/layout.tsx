'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/use-api';
import AdminAuth from '@/app/components/AdminAuth';
import {
  LayoutDashboard,
  FileText,
  Image,
  Tags,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Keyboard,
} from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/content', label: 'Content', icon: FileText },
  // Studio removed — editor opens inline from Content Library
  { href: '/admin/media', label: 'Media', icon: Image },
  { href: '/admin/taxonomies', label: 'Taxonomies', icon: Tags },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
  { href: '/admin/reference', label: 'Reference', icon: Keyboard },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [navCollapsed, setNavCollapsed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onFocusMode = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setNavCollapsed(detail?.active ?? false);
    };
    window.addEventListener('pulse-focus-mode', onFocusMode);
    return () => window.removeEventListener('pulse-focus-mode', onFocusMode);
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--neutral-50)]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--neutral-200)] border-t-[var(--pulse-red)]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminAuth onAuthenticated={() => window.location.reload()} />;
  }

  return (
    <div className="flex min-h-screen bg-[var(--neutral-50)]">
      {/* Mobile overlay */}
      {sidebarOpen && !navCollapsed && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`inset-y-0 left-0 z-50 transform bg-white transition-all duration-200 ease-in-out overflow-hidden ${
          navCollapsed
            ? 'fixed w-0 -translate-x-full border-transparent'
            : `fixed w-64 border-r border-[var(--neutral-200)] lg:relative lg:translate-x-0 ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }`
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--neutral-200)] px-6 py-4">
            <Link href="/admin" className="text-xl font-bold text-[var(--pulse-black)]">
              Pulse CMS
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-[var(--neutral-600)]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[var(--pulse-red)]/10 text-[var(--pulse-red)]'
                      : 'text-[var(--neutral-600)] hover:bg-[var(--neutral-100)] hover:text-[var(--pulse-black)]'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-[var(--neutral-200)] p-4">
            <div className="mb-3 px-3">
              <p className="text-sm font-medium text-[var(--pulse-black)] truncate">
                {user?.displayName || user?.email}
              </p>
              <p className="text-xs text-[var(--neutral-500)] truncate">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-[var(--neutral-600)] transition-colors hover:bg-[var(--neutral-100)] hover:text-[var(--pulse-red)]"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Mobile header */}
        <header className="flex items-center gap-4 border-b border-[var(--neutral-200)] bg-white px-4 py-3 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-[var(--neutral-600)]">
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-semibold text-[var(--pulse-black)]">Pulse CMS</span>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
