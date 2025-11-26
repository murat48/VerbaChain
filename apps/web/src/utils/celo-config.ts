/**
 * Celo Token Addresses
 * Sepolia Testnet is the new recommended testnet (Alfajores is deprecated)
 */
export const CELO_TOKENS = {
  sepolia: {
    CELO: '0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9', // Native CELO
    cUSD: '0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b',
    cEUR: '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F',
    cREAL: '0xE4D517785D091D3c54818832dB6094bcc2744545',
  },
  alfajores: {
    CELO: '0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9',
    cUSD: '0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b',
    cEUR: '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F',
    cREAL: '0xE4D517785D091D3c54818832dB6094bcc2744545',
  },
  mainnet: {
    CELO: '0x471EcE3750Da237f93B8E339c536989b8978a438',
    cUSD: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
    cEUR: '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73',
    cREAL: '0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787',
  },
} as const;

/**
 * Contract Addresses for Staking and Rewards
 * These will be updated after deployment
 */
export const CELO_CONTRACTS = {
  sepolia: {
    staking: '0x7b18750f69a8034463dde05c29637316cf349aa6',
    rewards: '0x1d5304af7137334b258a443c9ffc74f0c6cb80e9',
  },
  alfajores: {
    staking: '0x0000000000000000000000000000000000000000', // Deploy first
    rewards: '0x0000000000000000000000000000000000000000', // Deploy first
  },
  mainnet: {
    staking: '0x0000000000000000000000000000000000000000', // Deploy on mainnet
    rewards: '0x0000000000000000000000000000000000000000', // Deploy on mainnet
  },
} as const;

/**
 * Celo Network Configuration
 */
export const CELO_NETWORKS = {
  sepolia: {
    id: 44787,
    name: 'Celo Sepolia Testnet',
    rpcUrl: 'https://alfajores-forno.celo-testnet.org', // Note: Same RPC as Alfajores for now
    blockExplorer: 'https://celo-sepolia.blockscout.com',
    nativeCurrency: {
      name: 'CELO',
      symbol: 'CELO',
      decimals: 18,
    },
  },
  alfajores: {
    id: 44787,
    name: 'Celo Alfajores Testnet',
    rpcUrl: 'https://alfajores-forno.celo-testnet.org',
    blockExplorer: 'https://alfajores.celoscan.io',
    nativeCurrency: {
      name: 'CELO',
      symbol: 'CELO',
      decimals: 18,
    },
  },
  mainnet: {
    id: 42220,
    name: 'Celo Mainnet',
    rpcUrl: 'https://forno.celo.org',
    blockExplorer: 'https://celoscan.io',
    nativeCurrency: {
      name: 'CELO',
      symbol: 'CELO',
      decimals: 18,
    },
  },
} as const;

/**
 * Get the current network configuration
 */
export const getCurrentNetwork = () => {
  const network = process.env.NEXT_PUBLIC_CELO_NETWORK || 'sepolia';
  return CELO_NETWORKS[network as keyof typeof CELO_NETWORKS];
};

/**
 * Get token addresses for the current network
 */
export const getTokenAddresses = () => {
  const network = process.env.NEXT_PUBLIC_CELO_NETWORK || 'sepolia';
  return CELO_TOKENS[network as keyof typeof CELO_TOKENS];
};

/**
 * Get contract addresses for the current network
 */
export const getContractAddresses = () => {
  const network = process.env.NEXT_PUBLIC_CELO_NETWORK || 'sepolia';
  return CELO_CONTRACTS[network as keyof typeof CELO_CONTRACTS];
};

/**
 * ERC-20 Token ABI (minimal for balance and transfer)
 */
export const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
] as const;
