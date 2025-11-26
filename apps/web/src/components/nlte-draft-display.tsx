/**
 * NLTE Transaction Draft Component
 * Displays transaction draft for user approval
 */

'use client';

import React from 'react';
import { TransactionDraft, TransactionIntent } from '@/types/nlte.types';
import { formatTransactionForDisplay, calculateTotalCost, getTransactionDescription } from '@/utils/transaction-helpers';

interface TransactionDraftDisplayProps {
  draft: TransactionDraft;
  onApprove?: () => void;
  onReject?: () => void;
  isProcessing?: boolean;
}

/**
 * Display and approve/reject transaction draft
 */
export function TransactionDraftDisplay({
  draft,
  onApprove,
  onReject,
  isProcessing = false,
}: TransactionDraftDisplayProps) {
  const formatted = formatTransactionForDisplay(draft);
  const totalCost = calculateTotalCost(draft);

  const getIntentIcon = (intent: TransactionIntent): string => {
    switch (intent) {
      case TransactionIntent.SEND:
        return '📤';
      case TransactionIntent.SWAP:
        return '🔄';
      case TransactionIntent.STAKE:
        return '🔒';
      case TransactionIntent.CLAIM_REWARDS:
        return '🎁';
      default:
        return '❓';
    }
  };

  const getStatusColor = (isValid: boolean): string => {
    return isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
  };

  return (
    <div className={`w-full max-w-2xl mx-auto p-6 border-2 rounded-lg ${getStatusColor(draft.validation.isValid)}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span>{getIntentIcon(draft.intent)}</span>
          {formatted.description}
        </h2>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${draft.validation.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {draft.validation.isValid ? 'Ready' : 'Invalid'}
        </span>
      </div>

      {/* Transaction Details */}
      <div className="space-y-4 mb-6 bg-white p-4 rounded">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Amount</p>
            <p className="text-lg font-semibold">{formatted.amount}</p>
          </div>

          {draft.to && (
            <div>
              <p className="text-sm text-gray-600">Recipient</p>
              <p className="text-sm font-mono truncate">{draft.to}</p>
            </div>
          )}

          {draft.metadata.recipientName && (
            <div>
              <p className="text-sm text-gray-600">Recipient Name</p>
              <p className="text-lg font-semibold">{draft.metadata.recipientName}</p>
            </div>
          )}

          {draft.metadata.stakeDuration && (
            <div>
              <p className="text-sm text-gray-600">Stake Duration</p>
              <p className="text-lg font-semibold">{draft.metadata.stakeDuration} days</p>
            </div>
          )}
        </div>

        {/* Costs */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Gas Cost</span>
            <span className="font-mono">{formatted.gasCost}</span>
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span>Total Cost</span>
            <span className="font-mono">{formatted.totalCost}</span>
          </div>
        </div>
      </div>

      {/* Errors */}
      {draft.validation.errors.length > 0 && (
        <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded">
          <p className="font-semibold text-red-800 mb-2">Errors:</p>
          <ul className="space-y-1">
            {draft.validation.errors.map((error, idx) => (
              <li key={idx} className="text-red-700 text-sm">
                • {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {draft.validation.warnings.length > 0 && (
        <div className="mb-4 p-4 bg-yellow-100 border border-yellow-300 rounded">
          <p className="font-semibold text-yellow-800 mb-2">Warnings:</p>
          <ul className="space-y-1">
            {draft.validation.warnings.map((warning, idx) => (
              <li key={idx} className="text-yellow-700 text-sm">
                • {warning.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Transaction Info */}
      <div className="text-xs text-gray-500 mb-6 p-3 bg-gray-100 rounded">
        <p className="font-mono">ID: {draft.id}</p>
        <p className="font-mono">Created: {new Date(draft.timestamp).toLocaleString()}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onReject}
          disabled={isProcessing}
          className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg font-medium hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed transition"
        >
          Reject
        </button>
        <button
          onClick={onApprove}
          disabled={isProcessing || !draft.validation.isValid}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
        >
          {isProcessing ? 'Processing...' : 'Approve & Send'}
        </button>
      </div>
    </div>
  );
}
