/**
 * NLTE Input Component
 * Allows users to input natural language commands
 */

'use client';

import React, { useState } from 'react';
import { ParseCommandResponse } from '@/types/nlte.types';

interface NLTEInputProps {
  onCommandParsed?: (response: ParseCommandResponse) => void;
  onError?: (error: string) => void;
  isLoading?: boolean;
  userAddress?: string;
  initialCommand?: string;
}

/**
 * Input form for natural language transaction commands
 */
export function NLTEInput({ onCommandParsed, onError, isLoading = false, userAddress, initialCommand }: NLTEInputProps) {
  const [command, setCommand] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [examples, setExamples] = useState<Array<{ command: string }>>([]);

  React.useEffect(() => {
    // Load example commands
    fetchExamples();
  }, []);

  // Set initial command from URL
  React.useEffect(() => {
    if (initialCommand && !command) {
      setCommand(initialCommand);
    }
  }, [initialCommand]);

  const fetchExamples = async () => {
    try {
      const res = await fetch('/api/nlte/examples');
      const data = await res.json();
      if (data.success) {
        setExamples(data.data);
      }
    } catch (error) {
      console.error('Failed to load examples:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    setIsSubmitting(true);
    try {
      // Parse command client-side (with contact resolution)
      const nlCommand = {
        text: command,
        timestamp: Date.now(),
        userId: userAddress || 'anonymous',
      };
      
      // Import parseNLCommand dynamically to avoid SSR issues
      const { parseNLCommand } = await import('@/lib/nlp-parser');
      const parsed = parseNLCommand(nlCommand, userAddress);

      // Create response
      const response: ParseCommandResponse = {
        success: true,
        data: parsed,
      };

      setCommand(''); // Clear input
      onCommandParsed?.(response);
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExampleClick = (exampleCommand: string) => {
    setCommand(exampleCommand);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="command" className="block text-sm font-medium mb-2">
            What do you want to do?
          </label>
          <textarea
            id="command"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="e.g., Send 100 cUSD to Alice or Swap 50 CELO for cUSD"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            disabled={isSubmitting || isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || isLoading || !command.trim()}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
        >
          {isSubmitting || isLoading ? 'Processing...' : 'Parse Command'}
        </button>
      </form>

      {examples.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-3">Try these examples:</p>
          <div className="space-y-2">
            {examples.slice(0, 4).map((example, idx) => (
              <button
                key={idx}
                onClick={() => handleExampleClick(example.command)}
                className="block w-full text-left px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded hover:bg-gray-100 transition"
              >
                {example.command}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
