import type { Metadata } from 'next';
import { Suspense } from 'react';
import PulseBlogStudio from '../components/PulseBlogStudio';
import StudioAuthGate from '../components/StudioAuthGate';

export const metadata: Metadata = {
  title: 'Studio',
  description: 'The Pulse content studio — create, edit, and publish interactive blog posts.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function StudioPage() {
  return (
    <div className="h-screen">
      <StudioAuthGate>
        <Suspense fallback={
          <div className="flex h-full items-center justify-center bg-[var(--neutral-50)]">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--neutral-200)] border-t-[var(--pulse-red)]" />
          </div>
        }>
          <PulseBlogStudio />
        </Suspense>
      </StudioAuthGate>
    </div>
  );
}
