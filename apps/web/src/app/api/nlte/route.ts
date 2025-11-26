/**
 * API Routes for NLTE
 * Main NLTE API information endpoint
 */

import { NextResponse } from 'next/server';

/**
 * GET /api/nlte
 * API information endpoint
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    message: 'NLTE API - Natural Language Transaction Engine',
    version: '1.0.0',
    endpoints: {
      parse: {
        method: 'POST',
        path: '/api/nlte/parse',
        description: 'Parse natural language command',
      },
      draft: {
        method: 'POST',
        path: '/api/nlte/draft',
        description: 'Draft transaction from parsed command',
      },
      examples: {
        method: 'GET',
        path: '/api/nlte/examples',
        description: 'Get example commands',
      },
    },
    documentation: '/NLTE_README.md',
  });
}
