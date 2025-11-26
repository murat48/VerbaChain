import { isAddress, formatUnits, parseUnits } from 'viem';
import {
  CeloToken,
  TokenType,
  ParsedCommand,
  TransactionIntent,
  TransactionDraft,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from '@/types/nlte.types';
import { getTokenBalance, estimateTransferGas } from './celo-sdk';
import { isStakingSupported, getPendingStakingRewards, getPendingRewards } from './staking-helpers';

/**
 * Validates if a string is a valid Ethereum/Celo address
 * @param address - The address to validate
 * @returns True if valid, false otherwise
 */
export function isValidAddress(address: string): boolean {
  return isAddress(address);
}

/**
 * Formats a token amount from wei to human-readable format
 * @param amount - Amount in wei
 * @param decimals - Token decimals (default 18)
 * @returns Formatted amount as string
 */
export function formatTokenAmount(amount: bigint, decimals: number = 18): string {
  return formatUnits(amount, decimals);
}

/**
 * Parses a human-readable amount to wei
 * @param amount - Human-readable amount
 * @param decimals - Token decimals (default 18)
 * @returns Amount in wei as bigint
 */
export function parseTokenAmount(amount: string, decimals: number = 18): bigint {
  return parseUnits(amount, decimals);
}

/**
 * Validates if an amount is positive and valid
 * @param amount - Amount string to validate
 * @returns True if valid, false otherwise
 */
export function isValidAmount(amount: string): boolean {
  try {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0 && isFinite(num);
  } catch {
    return false;
  }
}

/**
 * Checks if user has sufficient balance for a transaction
 * @param balance - User's current balance
 * @param amount - Amount to send
 * @param gasEstimate - Estimated gas cost (optional, for native token)
 * @returns True if sufficient, false otherwise
 */
export function hasSufficientBalance(
  balance: string,
  amount: string,
  gasEstimate?: string
): boolean {
  try {
    const balanceNum = parseFloat(balance);
    const amountNum = parseFloat(amount);
    const gasNum = gasEstimate ? parseFloat(gasEstimate) : 0;
    
    return balanceNum >= amountNum + gasNum;
  } catch {
    return false;
  }
}

/**
 * Shortens an address for display
 * @param address - Full address
 * @param chars - Number of characters to show on each side
 * @returns Shortened address like "0x1234...5678"
 */
export function shortenAddress(address: string, chars: number = 4): string {
  if (!isValidAddress(address)) return address;
  return `${address.substring(0, chars + 2)}...${address.substring(42 - chars)}`;
}

/**
 * Normalizes token name to CeloToken enum
 * @param token - Token name in various formats
 * @returns CeloToken enum value
 */
export function normalizeTokenType(token: string): CeloToken {
  const normalized = token.toUpperCase().trim();
  
  switch (normalized) {
    case 'CELO':
    case 'CEL':
      return CeloToken.CELO;
    case 'CUSD':
    case 'USD':
    case 'USDC':
      return CeloToken.cUSD;
    case 'CEUR':
    case 'EUR':
      return CeloToken.cEUR;
    case 'CREAL':
    case 'REAL':
      return CeloToken.cREAL;
    default:
      return CeloToken.cUSD; // Default to cUSD
  }
}

/**
 * Formats a transaction hash for display
 * @param hash - Transaction hash
 * @returns Formatted hash
 */
export function formatTransactionHash(hash: string): string {
  return `${hash.substring(0, 10)}...${hash.substring(hash.length - 8)}`;
}

/**
 * Gets block explorer URL for a transaction
 * @param hash - Transaction hash
 * @param network - Network name
 * @returns Full URL to block explorer
 */
export function getExplorerUrl(hash: string, network: string = 'alfajores'): string {
  const baseUrl =
    network === 'mainnet'
      ? 'https://celoscan.io'
      : 'https://alfajores.celoscan.io';
  return `${baseUrl}/tx/${hash}`;
}

/**
 * Validates that a number string has reasonable precision
 * @param amount - Amount string
 * @param maxDecimals - Maximum allowed decimals
 * @returns True if valid precision
 */
export function hasValidPrecision(amount: string, maxDecimals: number = 18): boolean {
  const parts = amount.split('.');
  if (parts.length === 1) return true;
  return parts[1].length <= maxDecimals;
}

/**
 * Generates a unique transaction ID
 * @returns Unique ID string
 */
export function generateTransactionId(): string {
  return `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Formats a timestamp to readable date
 * @param timestamp - Unix timestamp
 * @returns Formatted date string
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

/**
 * Draft a transaction from a parsed command
 * @param parsedCommand - Parsed natural language command
 * @param userAddress - User's wallet address
 * @returns Transaction draft with validation
 */
export async function draftTransaction(
  parsedCommand: ParsedCommand,
  userAddress: `0x${string}`
): Promise<TransactionDraft> {
  const token = (parsedCommand.parameters.token || CeloToken.cUSD) as CeloToken;
  
  const draft: TransactionDraft = {
    id: generateTransactionId(),
    intent: parsedCommand.intent,
    from: userAddress,
    token,
    amount: parsedCommand.parameters.amount || '0',
    to: parsedCommand.parameters.recipient as `0x${string}` | undefined,
    gasEstimate: {
      gasLimit: '100000',
      maxFeePerGas: '5000000000',
      maxPriorityFeePerGas: '1000000000',
      estimatedCost: '0.0005',
    },
    metadata: {
      recipientName: parsedCommand.parameters.recipientName,
      fromToken: parsedCommand.parameters.fromToken as CeloToken | undefined,
      toToken: parsedCommand.parameters.toToken as CeloToken | undefined,
      swapRate: parsedCommand.parameters.toToken ? '1.0' : undefined,
      stakeDuration: parsedCommand.parameters.stakeDuration,
    },
    validation: { isValid: true, errors: [], warnings: [] },
    timestamp: Date.now(),
  };

  // Validate the transaction
  draft.validation = await validateTransaction(draft);

  // Estimate gas if valid so far (with timeout for speed)
  if (draft.validation.errors.length === 0) {
    // Different gas estimation for different intents
    if (draft.intent === TransactionIntent.SEND) {
      try {
        const gasEstimatePromise = estimateGasForDraft(draft);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Gas estimation timeout')), 3000)
        );
        
        const gasEstimate = await Promise.race([gasEstimatePromise, timeoutPromise]) as any;
        draft.gasEstimate = gasEstimate;
      } catch (error) {
        console.warn('Gas estimation failed or timed out, using defaults:', error);
        // Keep default gas estimate
      }
    } else if (draft.intent === TransactionIntent.STAKE) {
      // Staking requires more gas
      draft.gasEstimate = {
        gasLimit: '150000',
        maxFeePerGas: '5000000000',
        maxPriorityFeePerGas: '1000000000',
        estimatedCost: '0.00075',
      };
    } else if (draft.intent === TransactionIntent.CLAIM_REWARDS) {
      // Claiming rewards
      draft.gasEstimate = {
        gasLimit: '120000',
        maxFeePerGas: '5000000000',
        maxPriorityFeePerGas: '1000000000',
        estimatedCost: '0.0006',
      };
    }
  }

  return draft;
}

const TOKEN_DECIMALS: Record<CeloToken, number> = {
  [CeloToken.CELO]: 18,
  [CeloToken.cUSD]: 18,
  [CeloToken.cEUR]: 18,
  [CeloToken.cREAL]: 18,
};

/**
 * Validate a transaction draft
 * @param draft - Transaction draft to validate
 * @returns Validation result
 */
export async function validateTransaction(
  draft: TransactionDraft
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Validate amount (except for CLAIM_REWARDS)
  if (draft.intent !== TransactionIntent.CLAIM_REWARDS) {
    if (!draft.amount || parseFloat(draft.amount) <= 0) {
      errors.push({
        code: 'INVALID_AMOUNT',
        message: 'Transaction amount must be greater than 0',
        field: 'amount',
      });
    }
  }

  // Validate token
  if (!Object.values(CeloToken).includes(draft.token)) {
    errors.push({
      code: 'INVALID_TOKEN',
      message: `Unsupported token: ${draft.token}`,
      field: 'token',
    });
  }

  // Validate recipient address for SEND
  if (
    draft.intent === TransactionIntent.SEND &&
    (!draft.to || !isValidAddress(draft.to))
  ) {
    errors.push({
      code: 'INVALID_RECIPIENT',
      message: draft.to 
        ? `"${draft.to}" is not a valid address. Use full address (0x...) or known contact name.`
        : 'Recipient address is required',
      field: 'to',
    });
  }

  // Validate STAKE specific requirements
  if (draft.intent === TransactionIntent.STAKE) {
    if (!isStakingSupported()) {
      errors.push({
        code: 'STAKING_NOT_SUPPORTED',
        message: 'Staking contracts are not deployed on this network',
        field: 'intent',
      });
    }
    
    if (draft.token !== CeloToken.CELO) {
      errors.push({
        code: 'INVALID_STAKE_TOKEN',
        message: 'Only CELO can be staked',
        field: 'token',
      });
    }

    // Validate duration if provided
    const duration = draft.metadata.stakeDuration;
    if (duration !== undefined && ![0, 30, 90, 180, 365].includes(duration)) {
      warnings.push({
        code: 'INVALID_DURATION',
        message: 'Recommended durations: 0 (flexible), 30, 90, 180, or 365 days',
        field: 'stakeDuration',
      });
    }
  }

  // Validate CLAIM_REWARDS specific requirements
  if (draft.intent === TransactionIntent.CLAIM_REWARDS) {
    if (!isStakingSupported()) {
      errors.push({
        code: 'REWARDS_NOT_SUPPORTED',
        message: 'Rewards contracts are not deployed on this network',
        field: 'intent',
      });
    }

    // Check if user has pending rewards
    try {
      const [stakingRewards, contractRewards] = await Promise.all([
        getPendingStakingRewards(draft.from as `0x${string}`),
        getPendingRewards(draft.from as `0x${string}`),
      ]);

      const totalRewards = stakingRewards + contractRewards;
      
      if (totalRewards === 0n) {
        warnings.push({
          code: 'NO_REWARDS',
          message: 'You have no pending rewards to claim',
          field: 'amount',
        });
      }
    } catch (error) {
      console.warn('Failed to check pending rewards:', error);
    }
  }

  // Check sufficient balance (except for CLAIM_REWARDS)
  if (draft.intent !== TransactionIntent.CLAIM_REWARDS) {
    try {
      const balancePromise = getTokenBalance(draft.from as `0x${string}`, draft.token);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Balance check timeout')), 2000)
      );
      
      const balance = await Promise.race([balancePromise, timeoutPromise]) as string;
      const draftAmount = parseFloat(draft.amount);
      const availableBalance = parseFloat(balance);

      if (availableBalance < draftAmount) {
        errors.push({
          code: 'INSUFFICIENT_BALANCE',
          message: `Insufficient ${draft.token} balance. Available: ${balance}`,
          field: 'amount',
        });
      }

      // Warning for low balance
      if (availableBalance < draftAmount * 1.1) {
        warnings.push({
          code: 'LOW_BALANCE',
          message: 'Low balance after transaction',
          field: 'amount',
        });
      }
    } catch (error) {
      console.warn('Balance check failed or timed out:', error);
      warnings.push({
        code: 'BALANCE_CHECK_FAILED',
        message: 'Could not verify balance (continuing anyway)',
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Estimate gas for a transaction draft
 * @param draft - Transaction draft
 * @returns Gas estimate
 */
export async function estimateGasForDraft(draft: TransactionDraft) {
  if (!draft.to || draft.intent !== TransactionIntent.SEND) {
    return draft.gasEstimate;
  }

  const amount = parseUnits(draft.amount, TOKEN_DECIMALS[draft.token]);

  try {
    return await estimateTransferGas(draft.from as `0x${string}`, draft.to as `0x${string}`, amount, draft.token);
  } catch (error) {
    console.error('Gas estimation error:', error);
    return draft.gasEstimate;
  }
}

/**
 * Get human-readable transaction description
 * @param draft - Transaction draft
 * @returns Description string
 */
export function getTransactionDescription(draft: TransactionDraft): string {
  switch (draft.intent) {
    case TransactionIntent.SEND:
      return `Send ${draft.amount} ${draft.token} to ${draft.to || 'unknown'}`;

    case TransactionIntent.SWAP:
      return `Swap ${draft.amount} ${draft.token} for ${draft.metadata.swapRate || '?'}`;

    case TransactionIntent.STAKE:
      return `Stake ${draft.amount} ${draft.token}${
        draft.metadata.stakeDuration ? ` for ${draft.metadata.stakeDuration} days` : ''
      }`;

    case TransactionIntent.CLAIM_REWARDS:
      return 'Claim pending rewards';

    default:
      return 'Unknown transaction';
  }
}

/**
 * Calculate total transaction cost (amount + gas)
 * @param draft - Transaction draft
 * @returns Total cost in CELO
 */
export function calculateTotalCost(draft: TransactionDraft): string {
  const amount = parseFloat(draft.amount);
  const gasCost = parseFloat(draft.gasEstimate.estimatedCost);

  // If paying with CELO, add gas cost
  if (draft.token === CeloToken.CELO) {
    return (amount + gasCost).toFixed(6);
  }

  // For stablecoins, gas is paid in CELO only
  return gasCost.toFixed(6);
}

/**
 * Format transaction for display
 * @param draft - Transaction draft
 * @returns Formatted transaction object
 */
export function formatTransactionForDisplay(draft: TransactionDraft) {
  return {
    id: draft.id,
    type: draft.intent,
    description: getTransactionDescription(draft),
    amount: `${draft.amount} ${draft.token}`,
    recipient: draft.to,
    gasCost: `${draft.gasEstimate.estimatedCost} CELO`,
    totalCost: `${calculateTotalCost(draft)} CELO`,
    isValid: draft.validation.isValid,
    errors: draft.validation.errors,
    warnings: draft.validation.warnings,
    timestamp: new Date(draft.timestamp).toISOString(),
  };
}