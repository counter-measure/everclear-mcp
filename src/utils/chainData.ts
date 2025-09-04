interface ChainData {
  chains: Record<string, { name: string }>;
  tokens: Record<string, { name: string }>;
}

interface EverclearChainData {
  hub: {
    assets: Record<string, {
      symbol: string;
      tickerHash: string;
    }>;
  };
  chains: Record<string, {
    assets: Record<string, {
      symbol: string;
      tickerHash: string;
    }>;
  }>;
}

export class ChainDataService {
  private data: ChainData | null = null;
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  constructor() {
    // Initialize with empty data, will be fetched on first use
    this.data = {
      chains: {},
      tokens: {}
    };
  }

  /**
   * Fetch chain data from GitHub if cache is expired
   */
  private async fetchChainData(): Promise<ChainData> {
    const now = Date.now();
    
    // Return cached data if still valid
    if (this.data && (now - this.lastFetch) < this.CACHE_DURATION) {
      return this.data;
    }

    try {
      const response = await fetch('https://raw.githubusercontent.com/connext/chaindata/refs/heads/main/everclear.json');
      if (!response.ok) {
        throw new Error(`Failed to fetch chain data: ${response.status} ${response.statusText}`);
      }
      
      const everclearData = await response.json() as EverclearChainData;
      
      // Transform the data to our expected format
      const transformedData: ChainData = {
        chains: {},
        tokens: {}
      };

      // Extract chain names from the data structure
      const chainNames: Record<string, string> = {
        '1': 'Ethereum',
        '10': 'Optimism',
        '56': 'BSC',
        '137': 'Polygon',
        '250': 'Fantom',
        '42161': 'Arbitrum',
        '43114': 'Avalanche',
        '8453': 'Base',
        '59144': 'Linea',
        '534352': 'Scroll',
        '48900': 'Zircuit',
        '81457': 'Blast',
        '167000': 'Taiko',
        '33139': 'ApeChain',
        '34443': 'Mode',
        '130': 'UniChain',
        '324': 'zkSync',
        '2020': 'Ronin',
        '1399811149': 'Solana',
        '80094': 'Berachain',
        '100': 'Gnosis',
        '5000': 'Mantle',
        '146': 'Sonic',
        '57073': 'Ink',
        '728126428': 'Tron'
      };

      // Build chains mapping
      for (const [chainId, chainName] of Object.entries(chainNames)) {
        transformedData.chains[chainId] = { name: chainName };
      }

      // Extract tokens from hub and all chains
      const allAssets = { ...everclearData.hub.assets };
      
      for (const chain of Object.values(everclearData.chains)) {
        Object.assign(allAssets, chain.assets);
      }

      // Build tokens mapping
      for (const asset of Object.values(allAssets)) {
        if (asset.tickerHash && asset.symbol) {
          transformedData.tokens[asset.tickerHash] = { name: asset.symbol };
        }
      }

      this.data = transformedData;
      this.lastFetch = now;
      
      return this.data;
    } catch (error) {
      console.error('Failed to fetch chain data:', error);
      // Return cached data if available, otherwise return empty data
      return this.data || { chains: {}, tokens: {} };
    }
  }

  /**
   * Convert Chain ID to human-readable chain name
   * @param chainId - The chain ID to convert
   * @returns The human-readable chain name (e.g., "Arbitrum", "Optimism")
   */
  async convertChainIdToName(chainId: string): Promise<string> {
    const data = await this.fetchChainData();
    const chain = data.chains[chainId];
    return chain ? chain.name : `Unknown Chain (${chainId})`;
  }

  /**
   * Convert tickerhash to human-readable token name
   * @param tickerhash - The tickerhash to convert
   * @returns The human-readable token name (e.g., "USDC", "WETH")
   */
  async convertTickerhashToName(tickerhash: string): Promise<string> {
    const data = await this.fetchChainData();
    const token = data.tokens[tickerhash];
    return token ? token.name : `Unknown Token (${tickerhash})`;
  }

  /**
   * Get all available chain IDs
   * @returns Array of chain IDs
   */
  async getAllChainIds(): Promise<string[]> {
    const data = await this.fetchChainData();
    return Object.keys(data.chains);
  }

  /**
   * Get all available tickerhashes
   * @returns Array of tickerhashes
   */
  async getAllTickerhashes(): Promise<string[]> {
    const data = await this.fetchChainData();
    return Object.keys(data.tokens);
  }

  /**
   * Get all available chain names
   */
  async getAllChainNames(): Promise<string[]> {
    const data = await this.fetchChainData();
    return Object.values(data.chains).map(chain => chain.name);
  }

  /**
   * Get all available token names
   */
  async getAllTokenNames(): Promise<string[]> {
    const data = await this.fetchChainData();
    return Object.values(data.tokens).map(token => token.name);
  }
}