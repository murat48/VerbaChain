/**
 * Draft Transaction API Route
 * POST /api/nlte/draft
 */

import { NextRequest, NextResponse } from 'next/server';
import { draftTransaction } from '@/utils/transaction-helpers';
import { ParsedCommand, DraftTransactionResponse } from '@/types/nlte.types';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { parsedCommand, userAddress } = body;

    if (!parsedCommand || !userAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: parsedCommand and userAddress' },
        { status: 400 }
      );
    }

    // Validate address format
    if (typeof userAddress !== 'string' || !userAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json(
        { success: false, error: 'Invalid Ethereum address format' },
        { status: 400 }
      );
    }

    const draft = await draftTransaction(
      parsedCommand as ParsedCommand,
      userAddress as `0x${string}`
    );

    const response: DraftTransactionResponse = {
      success: true,
      data: draft,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Draft error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to draft transaction' },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    message: 'POST parsed command and address to draft transaction',
    example: {
      parsedCommand: {
        intent: 'SEND',
        parameters: { amount: '100', token: 'cUSD', recipient: 'Alice' },
        confidence: 0.85,
        rawCommand: 'Send 100 cUSD to Alice',
      },
      userAddress: '0x1234567890123456789012345678901234567890',
    },
  });
}
