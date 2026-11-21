import type { ReactNode } from 'react';
import { StoreProvider } from '@/lib/store';
import AppShell from '@/components/AppShell';

export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <StoreProvider>
      <AppShell>{children}</AppShell>
    </StoreProvider>
  );
}
