/**
 * Add Token to MetaMask Helper
 * Automatically prompts user to add token to MetaMask
 */

import { CeloToken } from '@/types/nlte.types';

const TOKEN_INFO = {
  [CeloToken.cUSD]: {
    address: '0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b',
    symbol: 'cUSD',
    decimals: 18,
    image: 'https://raw.githubusercontent.com/ubeswap/default-token-list/master/assets/asset_cUSD.png',
  },
  [CeloToken.cEUR]: {
    address: '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F',
    symbol: 'cEUR',
    decimals: 18,
    image: 'https://raw.githubusercontent.com/ubeswap/default-token-list/master/assets/asset_cEUR.png',
  },
  [CeloToken.cREAL]: {
    address: '0xE4D517785D091D3c54818832dB6094bcc2744545',
    symbol: 'cREAL',
    decimals: 18,
    image: 'https://raw.githubusercontent.com/ubeswap/default-token-list/master/assets/asset_cREAL.png',
  },
  [CeloToken.CELO]: {
    address: '0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9',
    symbol: 'CELO',
    decimals: 18,
    image: 'https://cryptologos.cc/logos/celo-celo-logo.png',
  },
} as const;

/**
 * Prompt user to add token to MetaMask
 */
export async function addTokenToMetaMask(token: CeloToken): Promise<boolean> {
  if (typeof window === 'undefined' || !window.ethereum) {
    console.error('MetaMask not available');
    return false;
  }

  const tokenInfo = TOKEN_INFO[token];
  
  try {
    const wasAdded = await window.ethereum.request({
      method: 'wallet_watchAsset',
      params: {
        type: 'ERC20',
        options: {
          address: tokenInfo.address,
          symbol: tokenInfo.symbol,
          decimals: tokenInfo.decimals,
          image: tokenInfo.image,
        },
      },
    });

    return wasAdded as boolean;
  } catch (error) {
    console.error('Error adding token to MetaMask:', error);
    return false;
  }
}

/**
 * Get token info for display
 */
export function getTokenInfo(token: CeloToken) {
  return TOKEN_INFO[token];
}
