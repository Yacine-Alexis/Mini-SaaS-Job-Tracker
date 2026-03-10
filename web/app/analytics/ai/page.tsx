import { Metadata } from 'next';
import AIAnalyticsClient from './AIAnalyticsClient';

export const metadata: Metadata = {
  title: 'AI Analytics | Job Tracker',
  description: 'View AI usage statistics and feedback analytics',
};

export default function AIAnalyticsPage() {
  return <AIAnalyticsClient />;
}
