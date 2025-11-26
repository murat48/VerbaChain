/**
 * NLTE Demo Page
 * Demonstrates Natural Language Transaction Engine
 */

'use client';

import dynamic from 'next/dynamic';

// Dynamically import NLTEPage to avoid SSR issues with Wagmi
const NLTEPage = dynamic(
  () => import('@/components/nlte-page').then((mod) => ({ default: mod.NLTEPage })),
  { ssr: false }
);

export default function NLTEDemoPage() {
  return <NLTEPage />;
}
