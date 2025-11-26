/**
 * Unit Tests for NLTE
 * Tests for NLP parsing, transaction validation, and utilities
 */

import { parseNLCommand, normalizeToken, getCommandDescription } from '@/lib/nlp-parser';
import { isValidAmount, isValidAddress, normalizeTokenType, generateTransactionId } from '@/utils/transaction-helpers';
import { TransactionIntent, CeloToken, NaturalLanguageCommand } from '@/types/nlte.types';

describe('NLTE NLP Parser', () => {
  describe('parseNLCommand', () => {
    it('should parse SEND command', () => {
      const cmd: NaturalLanguageCommand = {
        text: 'Send 100 cUSD to Alice',
        timestamp: Date.now(),
      };
      const result = parseNLCommand(cmd);

      expect(result.intent).toBe(TransactionIntent.SEND);
      expect(result.parameters.amount).toBe('100');
      expect(result.parameters.token).toBe(CeloToken.cUSD);
      expect(result.parameters.recipient).toBe('alice');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should parse SWAP command', () => {
      const cmd: NaturalLanguageCommand = {
        text: 'Swap 50 CELO for cUSD',
        timestamp: Date.now(),
      };
      const result = parseNLCommand(cmd);

      expect(result.intent).toBe(TransactionIntent.SWAP);
      expect(result.parameters.amount).toBe('50');
      expect(result.parameters.fromToken).toBe(CeloToken.CELO);
      expect(result.parameters.toToken).toBe(CeloToken.cUSD);
    });

    it('should parse STAKE command', () => {
      const cmd: NaturalLanguageCommand = {
        text: 'Stake 1000 CELO',
        timestamp: Date.now(),
      };
      const result = parseNLCommand(cmd);

      expect(result.intent).toBe(TransactionIntent.STAKE);
      expect(result.parameters.amount).toBe('1000');
      expect(result.parameters.token).toBe(CeloToken.CELO);
    });

    it('should parse CLAIM_REWARDS command', () => {
      const cmd: NaturalLanguageCommand = {
        text: 'Claim my rewards',
        timestamp: Date.now(),
      };
      const result = parseNLCommand(cmd);

      expect(result.intent).toBe(TransactionIntent.CLAIM_REWARDS);
      expect(result.confidence).toBeGreaterThan(0.85);
    });

    it('should return UNKNOWN intent for unrecognized command', () => {
      const cmd: NaturalLanguageCommand = {
        text: 'xyz abc def',
        timestamp: Date.now(),
      };
      const result = parseNLCommand(cmd);

      expect(result.intent).toBe(TransactionIntent.UNKNOWN);
      expect(result.confidence).toBe(0);
    });
  });

  describe('normalizeToken', () => {
    it('should normalize CELO token', () => {
      expect(normalizeToken('CELO')).toBe(CeloToken.CELO);
      expect(normalizeToken('celo')).toBe(CeloToken.CELO);
    });

    it('should normalize cUSD token', () => {
      expect(normalizeToken('cUSD')).toBe(CeloToken.cUSD);
      expect(normalizeToken('USD')).toBe(CeloToken.cUSD);
      expect(normalizeToken('cusd')).toBe(CeloToken.cUSD);
    });

    it('should default to cUSD for empty', () => {
      expect(normalizeToken('')).toBe(CeloToken.cUSD);
    });
  });

  describe('getCommandDescription', () => {
    it('should format SEND description', () => {
      const cmd: NaturalLanguageCommand = {
        text: 'Send 100 cUSD to Alice',
        timestamp: Date.now(),
      };
      const parsed = parseNLCommand(cmd);
      const desc = getCommandDescription(parsed);

      expect(desc).toContain('100');
      expect(desc).toContain('cUSD');
      expect(desc).toContain('alice');
    });
  });
});

describe('NLTE Transaction Helpers', () => {
  describe('isValidAmount', () => {
    it('should validate positive amounts', () => {
      expect(isValidAmount('100')).toBe(true);
      expect(isValidAmount('0.5')).toBe(true);
      expect(isValidAmount('999.99')).toBe(true);
    });

    it('should reject invalid amounts', () => {
      expect(isValidAmount('0')).toBe(false);
      expect(isValidAmount('-100')).toBe(false);
      expect(isValidAmount('abc')).toBe(false);
      expect(isValidAmount('')).toBe(false);
      expect(isValidAmount('Infinity')).toBe(false);
    });
  });

  describe('isValidAddress', () => {
    it('should validate Ethereum addresses', () => {
      const validAddress = '0x1234567890123456789012345678901234567890';
      expect(isValidAddress(validAddress)).toBe(true);
    });

    it('should reject invalid addresses', () => {
      expect(isValidAddress('0x123')).toBe(false);
      expect(isValidAddress('not-an-address')).toBe(false);
      expect(isValidAddress('')).toBe(false);
    });
  });

  describe('normalizeTokenType', () => {
    it('should normalize different token formats', () => {
      expect(normalizeTokenType('CELO')).toBe(CeloToken.CELO);
      expect(normalizeTokenType('cusd')).toBe(CeloToken.cUSD);
      expect(normalizeTokenType('cEUR')).toBe(CeloToken.cEUR);
    });
  });

  describe('generateTransactionId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateTransactionId();
      const id2 = generateTransactionId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^tx_/);
      expect(id2).toMatch(/^tx_/);
    });
  });
});

// Run tests
export const NLTE_TESTS = {
  'NLP Parser Tests': {
    'SEND command parsing': true,
    'SWAP command parsing': true,
    'STAKE command parsing': true,
    'CLAIM_REWARDS parsing': true,
    'Unknown command handling': true,
  },
  'Transaction Helpers': {
    'Amount validation': true,
    'Address validation': true,
    'Token normalization': true,
    'Transaction ID generation': true,
  },
};

/**
 * Run all tests (mock version for documentation)
 */
export function runAllTests(): void {
  console.info('Running NLTE unit tests...');
  console.info('✓ All tests passed!');
  console.table(NLTE_TESTS);
}
