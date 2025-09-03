import chainData from '../data/chain-data.json';

interface ChainData {
  chains: Record<string, { name: string }>;
  tokens: Record<string, { name: string }>;
}

export class ChainDataService {
  private data: ChainData;

  constructor() {
    this.data = chainData;
  }

  /**
   * Convert Chain ID to human-readable chain name
   * @param chainId - The chain ID to convert
   * @returns The human-readable chain name (e.g., "Arbitrum", "Optimism")
   */
  convertChainIdToName(chainId: string): string {
    const chain = this.data.chains[chainId];
    return chain ? chain.name : `Unknown Chain (${chainId})`;
  }

  /**
   * Convert tickerhash to human-readable token name
   * @param tickerhash - The tickerhash to convert
   * @returns The human-readable token name (e.g., "USDC", "WETH")
   */
  convertTickerhashToName(tickerhash: string): string {
    const token = this.data.tokens[tickerhash];
    return token ? token.name : `Unknown Token (${tickerhash})`;
  }

  /**
   * Get all available chain names
   */
  getAllChainNames(): string[] {
    return Object.values(this.data.chains).map(chain => chain.name);
  }

  /**
   * Get all available token names
   */
  getAllTokenNames(): string[] {
    return Object.values(this.data.tokens).map(token => token.name);
  }
}
