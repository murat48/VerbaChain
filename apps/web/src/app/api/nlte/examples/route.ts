/**
 * Examples API Route
 * GET /api/nlte/examples
 */

import { NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse> {
  const examples = [
    {
      command: 'Send 1 cUSD to Alice',
      intent: 'SEND',
      description: 'Transfer cUSD to another address',
      tips: 'Replace "Alice" with recipient name or address',
    },
    {
      command: 'Swap 1 CELO for cUSD',
      intent: 'SWAP',
      description: 'Swap CELO tokens for stablecoins',
      tips: 'You can specify any supported token',
    },
    {
      command: 'Stake 1 CELO',
      intent: 'STAKE',
      description: 'Lock CELO for staking rewards',
      tips: 'Your CELO will be locked and earn rewards',
    },
        {
      command: 'Send 1 CELO to Alice tomorrow at 3pm',
      intent: 'SEND',
      description: 'Schedule a future transfer of CELO',
      tips: 'You can specify a future date and time for the transfer',
    },
    {
      command: 'Claim my rewards',
      intent: 'CLAIM_REWARDS',
      description: 'Collect pending rewards from staking',
      tips: 'Check your pending rewards before claiming',
    },
    {
      command: 'Send 25.5 cUSD to 0x1234567890123456789012345678901234567890',
      intent: 'SEND',
      description: 'Send with full wallet address',
      tips: 'You can use full addresses instead of names',
    },
  ];

  return NextResponse.json({
    success: true,
    data: examples,
    note: 'These are example natural language commands you can use with NLTE',
  });
}
