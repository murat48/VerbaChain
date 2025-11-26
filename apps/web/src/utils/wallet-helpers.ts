/**
 * Wallet Helper Functions
 * Provides both MetaMask (browser) and Private Key (backend) wallet support
 */

import { createWalletClient, http, parseEther, createPublicClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { celoAlfajores } from 'viem/chains';

/**
 * Get wallet account from private key (for backend use only)
 * WARNING: Never expose private keys in frontend code!
 * This is only for server-side transaction signing
 */
export function getAccountFromPrivateKey() {
  const privateKey = process.env.PRIVATE_KEY;
  
  if (!privateKey) {
    throw new Error('PRIVATE_KEY not set in environment variables');
  }
  
  if (!privateKey.startsWith('0x')) {
    throw new Error('PRIVATE_KEY must start with 0x');
  }
  
  return privateKeyToAccount(privateKey as `0x${string}`);
}

/**
 * Create wallet client with private key (backend only)
 * Use this for automated transactions without user interaction
 */
export function createBackendWalletClient() {
  const account = getAccountFromPrivateKey();
  
  return createWalletClient({
    account,
    chain: celoAlfajores,
    transport: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC || 'https://alfajores-forno.celo-testnet.org'),
  });
}

/**
 * Create public client for reading blockchain data
 */
export function createPublicClientForNetwork() {
  return createPublicClient({
    chain: celoAlfajores,
    transport: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC || 'https://alfajores-forno.celo-testnet.org'),
  });
}

/**
 * Example: Send transaction using private key (backend only)
 * This bypasses MetaMask and signs transactions directly
 */
export async function sendTransactionWithPrivateKey(params: {
  to: `0x${string}`;
  value: string; // in ETH/CELO
  data?: `0x${string}`;
}) {
  const walletClient = createBackendWalletClient();
  
  const hash = await walletClient.sendTransaction({
    to: params.to,
    value: parseEther(params.value),
    data: params.data,
  });
  
  return hash;
}

/**
 * Check if private key is configured
 */
export function hasPrivateKey(): boolean {
  return !!process.env.PRIVATE_KEY;
}
