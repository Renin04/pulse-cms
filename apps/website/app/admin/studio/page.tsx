import { Suspense } from 'react';
import PulseBlogStudio from '@/app/components/PulseBlogStudio';
import StudioAuthGate from '@/app/components/StudioAuthGate';

export default function AdminStudioPage() {
  return (
    <div className="-m-4 h-[calc(100vh-3.5rem)] lg:-m-8 lg:h-screen">
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--neutral-200)] border-t-[var(--pulse-red)]" />
          </div>
        }
      >
        <StudioAuthGate>
          <PulseBlogStudio />
        </StudioAuthGate>
      </Suspense>
    </div>
  );
}
