import type { Metadata } from 'next';
import "../globals.css";

export const metadata: Metadata = {
  title: 'ReMember Me - Never Forget the People Who Matter',
  description: 'Your personal relationship intelligence app. Track conversations, remember important details, and maintain meaningful connections effortlessly.',
  keywords: ['relationship management', 'CRM', 'personal connections', 'networking', 'contact management', 'AI assistant'],
  openGraph: {
    title: 'ReMember Me - Never Forget the People Who Matter',
    description: 'Your personal relationship intelligence app. Track conversations, remember important details, and maintain meaningful connections effortlessly.',
    type: 'website',
  },
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
