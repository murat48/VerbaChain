/**
 * Celo SDK Utilities
 * Provides wrapper functions for interacting with Celo blockchain
 * Supports both Alfajores testnet and mainnet
 */

import { createPublicClient, createWalletClient, http, custom, formatUnits, parseUnits, defineChain } from 'viem';
import { celoAlfajores, celo } from 'viem/chains';
import { ERC20_ABI, getTokenAddresses } from './celo-config';
import { CeloToken, BalanceInfo, TokenType } from '@/types/nlte.types';

/**
 * Celo Sepolia testnet chain definition
 */
export const celoSepolia = defineChain({
  id: 11142220,
  name: 'Celo Sepolia Testnet',
  network: 'celo-sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'CELO',
    symbol: 'CELO',
  },
  rpcUrls: {
    default: {
      http: ['https://forno.celo-sepolia.celo-testnet.org'],
    },
    public: {
      http: ['https://forno.celo-sepolia.celo-testnet.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Celo Sepolia Explorer',
      url: 'https://celo-sepolia.blockscout.com',
    },
  },
  testnet: true,
});

/**
 * Gets the appropriate Celo chain configuration
 */
export function getCeloChain() {
  const network = process.env.NEXT_PUBLIC_CELO_NETWORK || 'sepolia';
  
  if (network === 'mainnet') return celo;
  if (network === 'alfajores') return celoAlfajores;
  return celoSepolia; // Default to sepolia
}

/**
 * Creates a public client for reading blockchain data
 */
export function getPublicClient() {
  const chain = getCeloChain();
  const rpcUrl = process.env.NEXT_PUBLIC_ALFAJORES_RPC || chain.rpcUrls.default.http[0];
  
  return createPublicClient({
    chain,
    transport: http(rpcUrl),
  });
}

/**
 * Creates a wallet client for signing transactions
 * Requires window.ethereum (MetaMask)
 */
export function getWalletClient() {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not found');
  }

  const chain = getCeloChain();
  
  return createWalletClient({
    chain,
    transport: custom(window.ethereum),
  });
}

/**
 * Gets token balance for a given address
 * @param address - Wallet address
 * @param token - Token type
 * @returns Balance as string in human-readable format
 */
export async function getTokenBalance(
  address: `0x${string}`,
  token: CeloToken | TokenType
): Promise<string> {
  const publicClient = getPublicClient();
  const tokenAddresses = getTokenAddresses();

  // Normalize token to CeloToken
  const normalizedToken = token as CeloToken;

  if (normalizedToken === CeloToken.CELO) {
    // Native CELO balance
    const balance = await publicClient.getBalance({ address });
    return formatUnits(balance, 18);
  }

  // ERC-20 token balance
  const tokenAddress = tokenAddresses[normalizedToken as keyof typeof tokenAddresses] as `0x${string}`;
  
  const balance = await publicClient.readContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
  }) as bigint;

  return formatUnits(balance, 18);
}

/**
 * Gets balances for all supported tokens
 * @param address - Wallet address
 * @returns Array of balance information
 */
export async function getAllBalances(address: `0x${string}`): Promise<BalanceInfo[]> {
  const tokens: (CeloToken | TokenType)[] = [CeloToken.CELO, CeloToken.cUSD];
  
  const balances = await Promise.all(
    tokens.map(async (token) => {
      try {
        const balance = await getTokenBalance(address, token);
        return {
          token,
          balance,
          address,
        } as BalanceInfo;
      } catch (error) {
        console.error(`Error fetching balance for ${token}:`, error);
        return {
          token,
          balance: '0',
          address,
        } as BalanceInfo;
      }
    })
  );

  return balances;
}

/**
 * Estimates gas for a token transfer
 * @param from - Sender address
 * @param to - Recipient address
 * @param amount - Amount to send (in wei)
 * @param token - Token type
 * @returns Gas estimate object
 */
export async function estimateTransferGas(
  from: `0x${string}`,
  to: `0x${string}`,
  amount: bigint,
  token: CeloToken | TokenType
) {
  const publicClient = getPublicClient();
  const tokenAddresses = getTokenAddresses();
  
  const normalizedToken = token as CeloToken;

  try {
    if (normalizedToken === CeloToken.CELO) {
      // Native CELO transfer - use fixed gas for speed
      const gasLimit = BigInt(21000); // Standard transfer gas
      const gasPrice = await publicClient.getGasPrice();

      return {
        gasLimit: gasLimit.toString(),
        maxFeePerGas: gasPrice.toString(),
        maxPriorityFeePerGas: gasPrice.toString(),
        estimatedCost: formatUnits(gasLimit * gasPrice, 18),
      };
    } else {
      // ERC-20 token transfer
      const tokenAddress = tokenAddresses[normalizedToken as keyof typeof tokenAddresses] as `0x${string}`;
      
      const gasLimit = await publicClient.estimateContractGas({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [to, amount],
        account: from,
      });

      const gasPrice = await publicClient.getGasPrice();

      return {
        gasLimit: gasLimit.toString(),
        maxFeePerGas: gasPrice.toString(),
        maxPriorityFeePerGas: gasPrice.toString(),
        estimatedCost: formatUnits(gasLimit * gasPrice, 18),
      };
    }
  } catch (error) {
    console.error('Gas estimation error:', error);
    // Return default estimates if estimation fails
    return {
      gasLimit: '100000',
      maxFeePerGas: '5000000000',
      maxPriorityFeePerGas: '1000000000',
      estimatedCost: '0.0005',
    };
  }
}

/**
 * Sends a token transfer transaction
 * @param to - Recipient address
 * @param amount - Amount in wei
 * @param token - Token type
 * @returns Transaction hash
 */
export async function sendTokenTransfer(
  to: `0x${string}`,
  amount: bigint,
  token: CeloToken | TokenType
): Promise<`0x${string}`> {
  const walletClient = getWalletClient();
  const [from] = await walletClient.getAddresses();
  const tokenAddresses = getTokenAddresses();

  const normalizedToken = token as CeloToken;

  if (normalizedToken === CeloToken.CELO) {
    // Native CELO transfer
    const hash = await walletClient.sendTransaction({
      account: from,
      to,
      value: amount,
    });
    return hash;
  } else {
    // ERC-20 token transfer
    const tokenAddress = tokenAddresses[token as keyof typeof tokenAddresses] as `0x${string}`;
    
    const hash = await walletClient.writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [to, amount],
      account: from,
    });
    return hash;
  }
}

/**
 * Waits for a transaction to be confirmed
 * @param hash - Transaction hash
 * @returns Transaction receipt
 */
export async function waitForTransaction(hash: `0x${string}`) {
  const publicClient = getPublicClient();
  return await publicClient.waitForTransactionReceipt({ hash });
}
