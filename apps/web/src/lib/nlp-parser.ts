/**
 * Natural Language Processing Parser for NLTE
 * Parses user commands and extracts transaction intents using pattern matching
 * This is a client-side NLP engine that can be enhanced with LLM integration
 */

import {
  ParsedCommand,
  TransactionIntent,
  CeloToken,
  NaturalLanguageCommand,
} from '@/types/nlte.types';

/**
 * Regex patterns for different transaction intents
 * NOTE: Order matters! More specific patterns (scheduled) must come before general ones
 */
const INTENT_PATTERNS = {
  SEND: [
    // Scheduled patterns MUST be first (more specific)
    /send\s+(\d+(?:\.\d+)?)\s+(\w+)\s+to\s+(\w+)\s+(tomorrow|today)\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/gi,
    /send\s+(\d+(?:\.\d+)?)\s+(\w+)\s+to\s+(\w+)\s+on\s+(\d{4}-\d{2}-\d{2})\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/gi,
    // General patterns (immediate send) - token is now required
    /send\s+(\d+(?:\.\d+)?)\s+(\w+)\s+to\s+(\w+)/gi,
    /transfer\s+(\d+(?:\.\d+)?)\s+(\w+)\s+to\s+(\w+)/gi,
    /pay\s+(\d+(?:\.\d+)?)\s+(\w+)\s+to\s+(\w+)/gi,
    /give\s+(\w+)\s+(\d+(?:\.\d+)?)\s+(\w+)/gi,
  ],
  SWAP: [
    /swap\s+(\d+(?:\.\d+)?)\s+(\w+)\s+(?:for|to)\s+(\w+)/gi,
    /exchange\s+(\d+(?:\.\d+)?)\s+(\w+)\s+(?:for|to)\s+(\w+)/gi,
    /convert\s+(\d+(?:\.\d+)?)\s+(\w+)\s+(?:for|to)\s+(\w+)/gi,
    /trade\s+(\d+(?:\.\d+)?)\s+(\w+)\s+(?:for|to)\s+(\w+)/gi,
  ],
  STAKE: [
    /stake\s+(\d+(?:\.\d+)?)\s+(\w+)\s+for\s+(\d+)\s+days/gi,
    /stake\s+(\d+(?:\.\d+)?)\s+(\w+)/gi,
    /lock\s+(\d+(?:\.\d+)?)\s+(\w+)\s+for\s+(\d+)\s+days/gi,
  ],
  CLAIM_REWARDS: [
    /claim\s+(?:my\s+)?rewards/gi,
    /harvest\s+(?:my\s+)?rewards/gi,
    /collect\s+(?:my\s+)?earnings/gi,
  ],
};

/**
 * Token symbol mapping for normalization
 */
const TOKEN_ALIASES: Record<string, CeloToken> = {
  celo: CeloToken.CELO,
  cel: CeloToken.CELO,
  cusd: CeloToken.cUSD,
  usd: CeloToken.cUSD,
  usdc: CeloToken.cUSD,
  ceur: CeloToken.cEUR,
  eur: CeloToken.cEUR,
  creal: CeloToken.cREAL,
  real: CeloToken.cREAL,
};

/**
 * Contact registry for name-to-address resolution
 * Now loads from localStorage to support user-added contacts
 */
export function getContactRegistry(userAddress?: string): Record<string, string> {
  if (!userAddress || typeof window === 'undefined') {
    console.log('⚠️ getContactRegistry: No userAddress or running on server');
    return {};
  }
  
  const saved = localStorage.getItem(`contacts_${userAddress}`);
  if (!saved) {
    console.log(`⚠️ No contacts found for user: ${userAddress}`);
    return {};
  }
  
  try {
    const contacts = JSON.parse(saved);
    const registry: Record<string, string> = {};
    contacts.forEach((c: any) => {
      registry[c.name.toLowerCase()] = c.address;
    });
    console.log(`✅ Loaded ${Object.keys(registry).length} contacts for user ${userAddress}:`, registry);
    return registry;
  } catch {
    console.error('❌ Failed to parse contacts from localStorage');
    return {};
  }
}

/**
 * Parse a natural language command into a structured ParsedCommand
 * @param command - The natural language command
 * @param userAddress - Current user address for contact resolution
 * @returns Parsed command with intent and parameters
 */
export function parseNLCommand(command: NaturalLanguageCommand, userAddress?: string): ParsedCommand {
  const text = command.text.toLowerCase().trim();

  // Check each intent pattern
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    for (const pattern of patterns) {
      const match = pattern.exec(text);
      if (match) {
        return buildParsedCommand(
          text,
          intent as TransactionIntent,
          match,
          pattern,
          userAddress
        );
      }
    }
  }

  // No pattern matched
  return {
    intent: TransactionIntent.UNKNOWN,
    parameters: {},
    confidence: 0,
    rawCommand: text,
  };
}

/**
 * Build a ParsedCommand from regex match
 * @param text - Original command text
 * @param intent - Detected intent
 * @param match - Regex match result
 * @param pattern - Original regex pattern
 * @param userAddress - Current user address for contact resolution
 * @returns Parsed command
 */
function buildParsedCommand(
  text: string,
  intent: string,
  match: RegExpExecArray,
  pattern: RegExp,
  userAddress?: string
): ParsedCommand {
  const parameters: Record<string, unknown> = {};
  let confidence = 0.75; // Base confidence for pattern match

  switch (intent) {
    case TransactionIntent.SEND:
      // Check if this is a scheduled send by examining match groups
      // Scheduled patterns have 7+ groups with date/time info in group 4
      const hasScheduleInfo = match.length >= 7 && match[4] && (
        match[4] === 'tomorrow' || 
        match[4] === 'today' || 
        /\d{4}-\d{2}-\d{2}/.test(match[4])
      );
      
      if (hasScheduleInfo) {
        // Scheduled send: amount, token, recipient, date, hour, minute, ampm
        parameters.amount = match[1];
        parameters.token = normalizeToken(match[2]);
        parameters.recipient = resolveRecipient(match[3], userAddress);
        
        const scheduleInfo = parseScheduleInfo(match);
        parameters.scheduledTime = scheduleInfo.timestamp;
        parameters.isScheduled = true;
        
        console.log(`📅 Scheduled send detected: ${parameters.amount} ${parameters.token} to ${parameters.recipient} at ${new Date(scheduleInfo.timestamp).toLocaleString()}`);
        confidence = 0.9;
      } else {
        // Immediate send: amount, token, recipient
        parameters.amount = match[1];
        parameters.token = normalizeToken(match[2]);
        parameters.recipient = resolveRecipient(match[3], userAddress);
        console.log(`💸 Immediate send detected: ${parameters.amount} ${parameters.token} to ${parameters.recipient}`);
        confidence = 0.85;
      }
      break;

    case TransactionIntent.SWAP:
      // Parse: swap 100 CELO for cUSD
      parameters.amount = match[1];
      parameters.fromToken = normalizeToken(match[2]);
      parameters.toToken = normalizeToken(match[3]);
      confidence = 0.8;
      break;

    case TransactionIntent.STAKE:
      // Parse: stake 100 CELO
      parameters.amount = match[1];
      parameters.token = normalizeToken(match[2]);
      if (match[3]) {
        parameters.stakeDuration = parseInt(match[3]);
      }
      confidence = 0.8;
      break;

    case TransactionIntent.CLAIM_REWARDS:
      confidence = 0.9;
      break;
  }

  return {
    intent: intent as TransactionIntent,
    parameters,
    confidence,
    rawCommand: text,
  };
}

/**
 * Parse schedule information from regex match
 * @param match - Regex match array
 * @returns Scheduling info with timestamp
 */
function parseScheduleInfo(match: RegExpExecArray): { timestamp: number } {
  const dateStr = match[4]; // "tomorrow", "today", or "YYYY-MM-DD"
  let hour = parseInt(match[5]);
  const minute = match[6] ? parseInt(match[6]) : 0;
  const ampm = match[7];

  // Convert to 24-hour format
  if (ampm) {
    if (ampm.toLowerCase() === 'pm' && hour !== 12) {
      hour += 12;
    } else if (ampm.toLowerCase() === 'am' && hour === 12) {
      hour = 0;
    }
  }

  let date = new Date();
  
  if (dateStr === 'tomorrow') {
    date.setDate(date.getDate() + 1);
  } else if (dateStr === 'today') {
    // Keep today
  } else {
    date = new Date(dateStr);
  }

  date.setHours(hour, minute, 0, 0);

  return {
    timestamp: date.getTime(),
  };
}

/**
 * Normalize token symbols to standard CeloToken values
 * @param symbol - Token symbol (e.g., "cUSD", "usd", "CELO")
 * @returns Normalized CeloToken
 */
export function normalizeToken(symbol: string): CeloToken {
  if (!symbol) return CeloToken.cUSD; // Default to cUSD

  const normalized = symbol.toLowerCase();
  return TOKEN_ALIASES[normalized] || CeloToken.cUSD;
}

/**
 * Resolve recipient name to address
 * Checks contact registry for known names
 * @param recipient - Name or address
 * @param userAddress - Current user address for loading contacts
 * @returns Resolved address or original input
 */
export function resolveRecipient(recipient: string, userAddress?: string): string {
  if (!recipient) return '';
  
  // If already an address, return as-is
  if (/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
    return recipient;
  }
  
  // Check contact registry (case-insensitive)
  const normalized = recipient.toLowerCase().trim();
  const contactRegistry = getContactRegistry(userAddress);
  const resolved = contactRegistry[normalized];
  
  if (resolved) {
    console.log(`✅ Resolved "${recipient}" to ${resolved}`);
    return resolved;
  }
  
  console.warn(`⚠️ Could not resolve "${recipient}" to address`);
  return recipient;
}

/**
 * Validate address format (simple check)
 * @param address - Address to validate
 * @returns Whether address looks valid
 */
export function validateAddress(address: string): boolean {
  if (!address) return false;
  // Check for Ethereum-style hex address
  if (/^0x[a-fA-F0-9]{40}$/.test(address)) return true;
  // Check for ENS name or alphanumeric
  if (/^[a-zA-Z0-9\-\.]+$/.test(address)) return true;
  return false;
}

/**
 * Validate numeric amount
 * @param amount - Amount string
 * @returns Whether amount is valid
 */
export function validateAmount(amount: string): boolean {
  if (!amount) return false;
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0;
}

/**
 * Extract confidence score from parsed command
 * Returns 0-100 percentage
 * @param parsed - Parsed command
 * @returns Confidence percentage
 */
export function getConfidencePercentage(parsed: ParsedCommand): number {
  return Math.round(parsed.confidence * 100);
}

/**
 * Get human-readable description of parsed command
 * @param parsed - Parsed command
 * @returns Description string
 */
export function getCommandDescription(parsed: ParsedCommand): string {
  switch (parsed.intent) {
    case TransactionIntent.SEND:
      return `Send ${parsed.parameters.amount} ${parsed.parameters.token} to ${parsed.parameters.recipient}`;

    case TransactionIntent.SWAP:
      return `Swap ${parsed.parameters.amount} ${parsed.parameters.fromToken} for ${parsed.parameters.toToken}`;

    case TransactionIntent.STAKE:
      return `Stake ${parsed.parameters.amount} ${parsed.parameters.token}`;

    case TransactionIntent.CLAIM_REWARDS:
      return 'Claim pending rewards';

    default:
      return 'Unknown transaction';
  }
}
