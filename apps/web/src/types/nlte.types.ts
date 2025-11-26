/**
 * Intent types that the NLP engine can recognize
 */
export enum TransactionIntent {
  SEND = 'SEND',
  SWAP = 'SWAP',
  STAKE = 'STAKE',
  CLAIM_REWARDS = 'CLAIM_REWARDS',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Supported tokens on Celo network
 */
export enum CeloToken {
  CELO = 'CELO',
  cUSD = 'cUSD',
  cEUR = 'cEUR',
  cREAL = 'cREAL',
}

/**
 * Legacy token type alias for backward compatibility
 */
export type TokenType = CeloToken;

/**
 * Raw natural language command from user
 */
export interface NaturalLanguageCommand {
  text: string;
  timestamp: number;
  userId?: string;
}

/**
 * Parsed command with extracted intent and parameters
 */
export interface ParsedCommand {
  intent: TransactionIntent;
  parameters: {
    amount?: string;
    token?: TokenType;
    recipient?: string;
    recipientName?: string; // For user-friendly display (e.g., "Alice")
    fromToken?: TokenType;
    toToken?: TokenType;
    stakeDuration?: number; // in days
    scheduledTime?: number; // Unix timestamp for scheduled transfers
    isScheduled?: boolean; // Flag indicating if this is a scheduled transfer
  };
  confidence: number; // 0-1 confidence score from LLM
  rawCommand: string;
}

/**
 * Transaction draft before user confirmation
 */
export interface TransactionDraft {
  id: string;
  intent: TransactionIntent;
  from: string; // User's wallet address
  to?: string; // Recipient address (for SEND)
  token: TokenType;
  amount: string;
  gasEstimate: {
    gasLimit: string;
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
    estimatedCost: string; // in native token
  };
  metadata: {
    recipientName?: string;
    fromToken?: TokenType;
    toToken?: TokenType;
    swapRate?: string;
    stakeDuration?: number;
  };
  validation: ValidationResult;
  timestamp: number;
}

/**
 * Validation result for transaction draft
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Validation error
 */
export interface ValidationError {
  code: string;
  message: string;
  field?: string;
}

/**
 * Validation warning (non-blocking)
 */
export interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
}

/**
 * Executed transaction result
 */
export interface TransactionResult {
  success: boolean;
  transactionHash?: string;
  blockNumber?: number;
  error?: string;
  timestamp: number;
}

/**
 * User balance information
 */
export interface BalanceInfo {
  token: TokenType;
  balance: string;
  balanceInUSD?: string;
  address: string;
}

/**
 * API Response for command parsing
 */
export interface ParseCommandResponse {
  success: boolean;
  data?: ParsedCommand;
  error?: string;
}

/**
 * API Response for transaction draft
 */
export interface DraftTransactionResponse {
  success: boolean;
  data?: TransactionDraft;
  error?: string;
}

/**
 * API Response for balance check
 */
export interface BalanceCheckResponse {
  success: boolean;
  data?: BalanceInfo[];
  error?: string;
}

/**
 * Transaction history item
 */
export interface TransactionHistoryItem {
  id: string;
  command: string;
  intent: TransactionIntent;
  amount: string;
  token: TokenType;
  status: 'pending' | 'confirmed' | 'failed';
  transactionHash?: string;
  timestamp: number;
}

/**
 * Self Protocol integration for future use
 */
export interface SelfProtocolConfig {
  enabled: boolean;
  apiKey?: string;
  endpoint?: string;
}

/**
 * MiniApp integration for future use
 */
export interface MiniAppConfig {
  enabled: boolean;
  appId?: string;
  config?: Record<string, unknown>;
}
