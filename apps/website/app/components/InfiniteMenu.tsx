import Link from 'next/link';
import { type LucideIcon } from 'lucide-react';

interface InfiniteMenuItem {
  icon: LucideIcon;
  title: string;
  description: string;
  label: string;
  href: string;
}

interface InfiniteMenuProps {
  items: InfiniteMenuItem[];
}

export default function InfiniteMenu({ items }: InfiniteMenuProps) {
  const doubled = [...items, ...items];

  return (
    <div className="infinite-menu-shell relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/70 p-4 shadow-[0_24px_70px_-42px_rgba(17,24,39,0.55)] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[rgba(255,249,235,0.96)] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[rgba(255,249,235,0.96)] to-transparent" />

      <div className="infinite-menu-track">
        {doubled.map((item, index) => (
          <Link
            key={`${item.title}-${index}`}
            href={item.href}
            className="group w-[18rem] shrink-0 rounded-[1.6rem] border border-white/75 bg-[linear-gradient(155deg,rgba(255,255,255,0.94),rgba(255,245,204,0.55))] p-4 shadow-[0_14px_34px_-30px_rgba(17,24,39,0.7)] transition-transform duration-300 hover:-translate-y-1"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="rounded-2xl bg-[var(--pulse-black)] p-3 text-white transition-colors duration-300 group-hover:bg-[var(--pulse-red)]">
                <item.icon className="h-4 w-4" />
              </div>
              <span className="rounded-full border border-[var(--neutral-200)] bg-white/85 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--neutral-500)]">
                {item.label}
              </span>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-[var(--pulse-black)]">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--neutral-600)]">
                {item.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
