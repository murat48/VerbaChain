/**
 * Parse Command API Route
 * POST /api/nlte/parse
 */

import { NextRequest, NextResponse } from 'next/server';
import { parseNLCommand } from '@/lib/nlp-parser';
import { NaturalLanguageCommand, ParseCommandResponse } from '@/types/nlte.types';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { command, userId, userAddress } = body;

    console.log('📝 NLTE Parse API called:', { command, userId, userAddress });

    if (!command || typeof command !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid command' },
        { status: 400 }
      );
    }

    const nlCommand: NaturalLanguageCommand = {
      text: command,
      timestamp: Date.now(),
      userId,
    };

    const parsed = parseNLCommand(nlCommand, userAddress);

    const response: ParseCommandResponse = {
      success: true,
      data: parsed,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Parse error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to parse command' },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    message: 'POST natural language command to parse',
    example: { command: 'Send 100 cUSD to Alice' },
  });
}
