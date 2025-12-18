import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Side Project',
  description: '모노레포 사이드 프로젝트',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
