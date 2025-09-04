#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { ChainDataService } from './utils/chainData.js';

const API_BASE_URL = 'https://api.everclear.org';

interface IntentParams {
  status?: string;
  limit?: number;
  offset?: number;
}

interface IntentDetailsParams {
  intentId: string;
}

interface InvoiceParams {
  status?: string;
  limit?: number;
  offset?: number;
}

interface InvoiceDetailsParams {
  invoiceId: string;
}

interface RouteQuoteParams {
  fromChain: string;
  toChain: string;
  amount: string;
  token: string;
}

interface MetricsParams {
  timeRange?: string;
  chainId?: string;
}

interface ChainIdParams {
  chainId: string;
}

interface TickerhashParams {
  tickerhash: string;
}

class EverclearMCPServer {
  private server: Server;
  private chainDataService: ChainDataService;

  constructor() {
    this.server = new Server(
      {
        name: 'everclear-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.chainDataService = new ChainDataService();
    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'get_intents',
          description: 'Retrieve a list of intents from Everclear',
          inputSchema: {
            type: 'object',
            properties: {
              status: { type: 'string', description: 'Filter by intent status' },
              limit: { type: 'number', description: 'Number of results to return' },
              offset: { type: 'number', description: 'Pagination offset' },
            },
          },
        },
        {
          name: 'get_intent_details',
          description: 'Get detailed information about a specific intent',
          inputSchema: {
            type: 'object',
            properties: {
              intentId: { type: 'string', description: 'The ID of the intent' },
            },
            required: ['intentId'],
          },
        },
        {
          name: 'get_invoices',
          description: 'Retrieve a list of invoices',
          inputSchema: {
            type: 'object',
            properties: {
              status: { type: 'string', description: 'Filter by invoice status' },
              limit: { type: 'number', description: 'Number of results to return' },
              offset: { type: 'number', description: 'Pagination offset' },
            },
          },
        },
        {
          name: 'get_invoice_details',
          description: 'Get detailed information about a specific invoice',
          inputSchema: {
            type: 'object',
            properties: {
              invoiceId: { type: 'string', description: 'The ID of the invoice' },
            },
            required: ['invoiceId'],
          },
        },
        {
          name: 'get_invoice_min_amounts',
          description: 'Calculate minimum amounts needed to settle an invoice',
          inputSchema: {
            type: 'object',
            properties: {
              invoiceId: { type: 'string', description: 'The ID of the invoice' },
            },
            required: ['invoiceId'],
          },
        },
        {
          name: 'get_route_quote',
          description: 'Get a quote for a route including fees and limits',
          inputSchema: {
            type: 'object',
            properties: {
              fromChain: { type: 'string', description: 'Source chain identifier' },
              toChain: { type: 'string', description: 'Destination chain identifier' },
              amount: { type: 'string', description: 'Amount to transfer' },
              token: { type: 'string', description: 'Token address or identifier' },
            },
            required: ['fromChain', 'toChain', 'amount', 'token'],
          },
        },
        {
          name: 'get_liquidity_flow',
          description: 'Retrieve liquidity flow metrics',
          inputSchema: {
            type: 'object',
            properties: {
              timeRange: { type: 'string', description: 'Time range for metrics' },
              chainId: { type: 'string', description: 'Filter by specific chain' },
            },
          },
        },
        {
          name: 'get_clearing_volume',
          description: 'Retrieve clearing volume metrics',
          inputSchema: {
            type: 'object',
            properties: {
              timeRange: { type: 'string', description: 'Time range for metrics' },
              chainId: { type: 'string', description: 'Filter by specific chain' },
            },
          },
        },
        {
          name: 'convert_chain_id_to_name',
          description: `Convert a chain ID to its human-readable name.
          
          WORKFLOW INSTRUCTIONS:
          - Use this to make API responses more readable
          - Chain IDs are numeric strings, names are like "Arbitrum", "Optimism"
          - Returns "Unknown Chain (ID)" if chain ID not found
          
          DATA FORMATTING:
          - Always use this before displaying chain information to users
          - Combine with other tools for complete chain analysis`,
          inputSchema: {
            type: 'object',
            properties: {
              chainId: { type: 'string', description: 'The chain ID to convert' },
            },
            required: ['chainId'],
          },
        },
        {
          name: 'convert_tickerhash_to_name',
          description: `Convert a tickerhash to its human-readable token name.
          
          WORKFLOW INSTRUCTIONS:
          - Use this to make token information more readable
          - Tickerhashes are long strings, names are like "USDC", "WETH"
          - Returns "Unknown Token (hash)" if tickerhash not found
          
          DATA FORMATTING:
          - Always use this before displaying token information to users
          - Essential for route quotes and invoice analysis`,
          inputSchema: {
            type: 'object',
            properties: {
              tickerhash: { type: 'string', description: 'The tickerhash to convert' },
            },
            required: ['tickerhash'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_intents':
            return await this.getIntents(args as unknown as IntentParams);
          case 'get_intent_details':
            return await this.getIntentDetails(args as unknown as IntentDetailsParams);
          case 'get_invoices':
            return await this.getInvoices(args as unknown as InvoiceParams);
          case 'get_invoice_details':
            return await this.getInvoiceDetails(args as unknown as InvoiceDetailsParams);
          case 'get_invoice_min_amounts':
            return await this.getInvoiceMinAmounts(args as unknown as InvoiceDetailsParams);
          case 'get_route_quote':
            return await this.getRouteQuote(args as unknown as RouteQuoteParams);
          case 'get_liquidity_flow':
            return await this.getLiquidityFlow(args as unknown as MetricsParams);
          case 'get_clearing_volume':
            return await this.getClearingVolume(args as unknown as MetricsParams);
          case 'convert_chain_id_to_name':
            return await this.convertChainIdToName(args as unknown as ChainIdParams);
          case 'convert_tickerhash_to_name':
            return await this.convertTickerhashToName(args as unknown as TickerhashParams);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
            },
          ],
        };
      }
    });
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  private buildQueryString(params: Record<string, any>): string {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
    const queryString = queryParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  private async getIntents(params: IntentParams) {
    const queryString = this.buildQueryString(params);
    const data = await this.makeRequest(`/intents${queryString}`);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  private async getIntentDetails(params: IntentDetailsParams) {
    const data = await this.makeRequest(`/intents/${params.intentId}`);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  private async getInvoices(params: InvoiceParams) {
    const queryString = this.buildQueryString(params);
    const data = await this.makeRequest(`/invoices${queryString}`);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  private async getInvoiceDetails(params: InvoiceDetailsParams) {
    const data = await this.makeRequest(`/invoices/${params.invoiceId}`);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  private async getInvoiceMinAmounts(params: InvoiceDetailsParams) {
    const data = await this.makeRequest(`/invoices/${params.invoiceId}/min-amounts`);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  private async getRouteQuote(params: RouteQuoteParams) {
    const data = await this.makeRequest('/routes/quotes', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  private async getLiquidityFlow(params: MetricsParams) {
    const queryString = this.buildQueryString(params);
    const data = await this.makeRequest(`/metrics/liquidity-flow${queryString}`);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  private async getClearingVolume(params: MetricsParams) {
    const queryString = this.buildQueryString(params);
    const data = await this.makeRequest(`/metrics/clearing-volume${queryString}`);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  private async convertChainIdToName(params: ChainIdParams) {
    const chainName = await this.chainDataService.convertChainIdToName(params.chainId);
    return {
      content: [
        {
          type: 'text',
          text: `Chain ID: ${params.chainId}
Chain Name: ${chainName}

FORMATTING INSTRUCTIONS:
- Use this name when displaying chain information to users
- Combine with other tools for complete chain analysis
- Consider using get_liquidity_flow with this chain ID for metrics`,
        },
      ],
    };
  }

  private async convertTickerhashToName(params: TickerhashParams) {
    const tokenName = await this.chainDataService.convertTickerhashToName(params.tickerhash);
    return {
      content: [
        {
          type: 'text',
          text: `Tickerhash: ${params.tickerhash}
Token Name: ${tokenName}

FORMATTING INSTRUCTIONS:
- Use this name when displaying token information to users
- Essential for route quotes and invoice analysis
- Combine with get_route_quote for complete transfer analysis`,
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Everclear MCP server running on stdio');
  }
}

const server = new EverclearMCPServer();
server.run().catch(console.error);