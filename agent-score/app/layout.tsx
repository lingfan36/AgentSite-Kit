import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AgentScore — How Agent-friendly is your website?',
  description: 'Check how well your website works with AI agents. Get a score and actionable suggestions.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
