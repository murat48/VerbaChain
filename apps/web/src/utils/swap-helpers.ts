/**
 * DEX Swap Helper Functions
 * Using Mento Protocol on Celo Sepolia Testnet
 * Mento is the official stablecoin protocol on Celo - more reliable than DEXes on testnet
 */

import { parseEther, encodeFunctionData, Address } from 'viem';
import { CeloToken } from '@/types/nlte.types';

/**
 * Mento Broker Contract on Celo Sepolia Testnet
 * This is the official Mento exchange broker - handles all stablecoin swaps
 */
export const MENTO_BROKER = '0xB9Ae2065142EB79b6c5EB1E8778F883fad6B07Ba' as const;

/**
 * Mento Exchange Provider (with correct checksum)
 */
export const MENTO_EXCHANGE_PROVIDER = '0xecb3c656c131fcd9bb8d1d80898716bd684feb78' as const;

/**
 * Token addresses for swapping
 */
const TOKEN_ADDRESSES = {
  CELO: '0x471EcE3750Da237f93B8E339c536989b8978a438', // CELO token on Sepolia
  cUSD: '0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b',
  cEUR: '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F',
  cREAL: '0xE4D517785D091D3c54818832dB6094bcc2744545',
} as const;

/**
 * Exchange IDs for Mento pools (from your transaction)
 */
const MENTO_EXCHANGE_IDS = {
  'CELO-cUSD': '0x3135b662c38265d0655177091f1b647b4fef511103d06c016efdf18b46930d2c',
} as const;

/**
 * Get token address from CeloToken enum
 */
export function getTokenAddress(token: CeloToken): `0x${string}` {
  return TOKEN_ADDRESSES[token] as `0x${string}`;
}

/**
 * ERC20 Approve ABI
 */
const APPROVE_ABI = {
  name: 'approve',
  type: 'function',
  stateMutability: 'nonpayable',
  inputs: [
    { name: 'spender', type: 'address' },
    { name: 'amount', type: 'uint256' },
  ],
  outputs: [{ name: '', type: 'bool' }],
} as const;

/**
 * Mento swapIn ABI
 */
const MENTO_SWAP_IN_ABI = {
  name: 'swapIn',
  type: 'function',
  stateMutability: 'nonpayable',
  inputs: [
    { name: 'exchangeProvider', type: 'address' },
    { name: 'exchangeId', type: 'bytes32' },
    { name: 'tokenIn', type: 'address' },
    { name: 'tokenOut', type: 'address' },
    { name: 'amountIn', type: 'uint256' },
    { name: 'amountOutMin', type: 'uint256' },
  ],
  outputs: [{ name: 'amountOut', type: 'uint256' }],
} as const;

/**
 * Build approval transaction for CELO token
 * Step 1 of Mento swap - approve broker to spend CELO
 */
export function buildApprovalTransaction(
  amountIn: string,
  userAddress: `0x${string}`
): { to: Address; value: bigint; data: `0x${string}` } {
  const amountInWei = parseEther(amountIn);
  const celoTokenAddress = TOKEN_ADDRESSES.CELO as Address;
  
  console.log('✅ Step 1: Building Approval Transaction');
  console.log('Approving:', amountInWei.toString(), 'CELO to Mento Broker');
  
  const data = encodeFunctionData({
    abi: [APPROVE_ABI],
    functionName: 'approve',
    args: [MENTO_BROKER, amountInWei],
  });
  
  return {
    to: celoTokenAddress,
    value: BigInt(0),
    data,
  };
}

/**
 * Build swap transaction using Mento Protocol
 * Step 2 of Mento swap - execute the swap
 * @param fromToken - Token to swap from
 * @param toToken - Token to swap to  
 * @param amountIn - Amount to swap (as string)
 * @param userAddress - User's wallet address
 * @param slippageTolerance - Slippage tolerance (default 5% for testnet)
 * @returns Transaction parameters
 */
export function buildSwapTransaction(
  fromToken: CeloToken,
  toToken: CeloToken,
  amountIn: string,
  userAddress: `0x${string}`,
  slippageTolerance: number = 5.0
): { to: Address; value: bigint; data: `0x${string}`; needsApproval: boolean } {
  const amountInWei = parseEther(amountIn);
  
  // IMPORTANT: For CELO->cUSD on testnet, rate is approximately 0.31 cUSD per CELO
  // So for 1 CELO, expect ~0.31 cUSD output
  // With 10% slippage, minimum output = 0.31 * 0.9 = 0.279 cUSD
  
  if (fromToken === CeloToken.CELO && toToken === CeloToken.cUSD) {
    const celoAddress = TOKEN_ADDRESSES.CELO as Address;
    const cusdAddress = TOKEN_ADDRESSES.cUSD as Address;
    const exchangeId = MENTO_EXCHANGE_IDS['CELO-cUSD'];
    
    // Estimate output: 1 CELO ≈ 0.31 cUSD (based on your successful transaction)
    const estimatedOutputRate = 0.31;
    const estimatedOutput = parseFloat(amountIn) * estimatedOutputRate;
    const amountOutMin = parseEther((estimatedOutput * (100 - slippageTolerance) / 100).toFixed(18));
    
    console.log('🔄 Mento Swap (CELO → cUSD):', {
      broker: MENTO_BROKER,
      exchangeProvider: MENTO_EXCHANGE_PROVIDER,
      exchangeId,
      tokenIn: celoAddress,
      tokenOut: cusdAddress,
      amountIn: amountIn,
      amountInWei: amountInWei.toString(),
      estimatedOutput: estimatedOutput.toFixed(4) + ' cUSD',
      amountOutMin: amountOutMin.toString(),
      amountOutMinHuman: (Number(amountOutMin) / 1e18).toFixed(4) + ' cUSD',
      slippage: `${slippageTolerance}%`,
    });
    
    const data = encodeFunctionData({
      abi: [MENTO_SWAP_IN_ABI],
      functionName: 'swapIn',
      args: [
        MENTO_EXCHANGE_PROVIDER,
        exchangeId as `0x${string}`,
        celoAddress,
        cusdAddress,
        amountInWei,
        amountOutMin,
      ],
    });

    return {
      to: MENTO_BROKER,
      value: BigInt(0),
      data,
      needsApproval: true, // Mento requires approval first
    };
  }
  
  // Other token pairs not yet supported
  throw new Error(`Swap from ${fromToken} to ${toToken} not yet supported`);
}

/**
 * Check if swap is supported
 */
export function isSwapSupported(fromToken: CeloToken, toToken: CeloToken): boolean {
  // Currently only support CELO -> cUSD via Mento
  return fromToken === CeloToken.CELO && toToken === CeloToken.cUSD;
}

/**
 * Get estimated swap output (simplified - in production use Mento quotes)
 */
export function estimateSwapOutput(
  fromToken: CeloToken,
  toToken: CeloToken,
  amountIn: string
): string {
  // Simplified estimation (1 CELO ≈ 0.31 cUSD based on your transaction)
  const amount = parseFloat(amountIn);
  
  if (fromToken === CeloToken.CELO && toToken === CeloToken.cUSD) {
    return (amount * 0.31).toFixed(2);
  }
  
  return (amount * 0.3).toFixed(2);
}
