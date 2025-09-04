interface ChainData {
  chains: Record<string, { name: string }>;
  tokens: Record<string, { name: string }>;
}

interface EverclearChainData {
  hub: {
    assets: Record<string, {
      symbol: string;
      tickerHash: string;
      decimals: number;
    }>;
  };
  chains: Record<string, {
    network: string;
    assets: Record<string, {
      symbol: string;
      tickerHash: string;
      decimals: number;
    }>;
  }>;
}

export class ChainDataService {
  private data: ChainData | null = null;
  private rawData: EverclearChainData | null = null;
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

  /**
   * Get decimals for a specific tickerhash
   * @param tickerhash - The tickerhash to get decimals for
   * @returns The number of decimals for the token
   */
  async getTokenDecimals(tickerhash: string): Promise<number> {
    const everclearData = await this.fetchEverclearData();
    
    // Search through hub and all chains for the tickerhash
    const allAssets = { ...everclearData.hub.assets };
    for (const chain of Object.values(everclearData.chains)) {
      Object.assign(allAssets, chain.assets);
    }

    for (const asset of Object.values(allAssets)) {
      if (asset.tickerHash === tickerhash) {
        return asset.decimals;
      }
    }
    
    // Default to 18 decimals if not found
    return 18;
  }

  /**
   * Get asset information for a tickerhash
   * @param tickerhash - The tickerhash to get info for
   * @returns Object with symbol and decimals
   */
  async getAssetInfo(tickerhash: string): Promise<{ symbol: string; decimals: number } | null> {
    const everclearData = await this.fetchEverclearData();
    
    // Search through hub and all chains for the tickerhash
    // Prioritize EVM chains over non-EVM chains for decimals
    const foundAssets: Array<{ symbol: string; decimals: number; isEvm: boolean }> = [];
    
    // Check hub first
    for (const asset of Object.values(everclearData.hub.assets)) {
      if (asset.tickerHash === tickerhash) {
        foundAssets.push({
          symbol: asset.symbol,
          decimals: asset.decimals,
          isEvm: true // Hub is EVM
        });
      }
    }
    
    // Check all chains
    for (const [chainId, chain] of Object.entries(everclearData.chains)) {
      if (chain.assets) {
        for (const asset of Object.values(chain.assets)) {
          if (asset.tickerHash === tickerhash) {
            const isEvm = chain.network === 'evm';
            foundAssets.push({
              symbol: asset.symbol,
              decimals: asset.decimals,
              isEvm
            });
          }
        }
      }
    }
    
    if (foundAssets.length === 0) {
      return null;
    }
    
    // Prioritize EVM chains, then use the most common decimals
    const evmAssets = foundAssets.filter(asset => asset.isEvm);
    const assetsToUse = evmAssets.length > 0 ? evmAssets : foundAssets;
    
    // Get the most common decimals
    const decimalsCount: Record<number, number> = {};
    assetsToUse.forEach(asset => {
      decimalsCount[asset.decimals] = (decimalsCount[asset.decimals] || 0) + 1;
    });
    
    const mostCommonDecimals = Object.entries(decimalsCount)
      .sort(([,a], [,b]) => b - a)[0][0];
    
    return {
      symbol: assetsToUse[0].symbol,
      decimals: parseInt(mostCommonDecimals)
    };
  }

  /**
   * Fetch raw Everclear data (separate from transformed data)
   */
  private async fetchEverclearData(): Promise<EverclearChainData> {
    const now = Date.now();
    
    // Check if we have cached raw data
    if (this.rawData && (now - this.lastFetch) < this.CACHE_DURATION) {
      return this.rawData;
    }

    try {
      const response = await fetch('https://raw.githubusercontent.com/connext/chaindata/refs/heads/main/everclear.json');
      if (!response.ok) {
        throw new Error(`Failed to fetch chain data: ${response.status} ${response.statusText}`);
      }
      
      const everclearData = await response.json() as EverclearChainData;
      this.rawData = everclearData;
      this.lastFetch = now;
      
      return everclearData;
    } catch (error) {
      console.error('Failed to fetch chain data:', error);
      // Return cached data if available, otherwise return empty data
      return this.rawData || { hub: { assets: {} }, chains: {} };
    }
  }
}