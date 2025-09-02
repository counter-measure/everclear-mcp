# Everclear MCP Server

A Model Context Protocol (MCP) server that provides Claude AI with direct access to Everclear.org's API endpoints. This enables Claude to interact with the Everclear protocol, query intents and invoices, retrieve analytics, and perform various blockchain-related operations.

## Features

### Required Endpoints
- **Get Intents**: Retrieve a list of intents with optional filters
- **Get Intent Details**: Get detailed information about a specific intent
- **Get Invoices**: Fetch list of invoices with optional filters
- **Get Invoice Details**: Get detailed information about a specific invoice
- **Get Invoice Min Amounts**: Calculate minimum amounts needed to settle an invoice
- **Get Route Quote**: Get quote for a route including fees and limits

### Optional Endpoints
- **Get Liquidity Flow**: Retrieve liquidity flow metrics
- **Get Clearing Volume**: Retrieve clearing volume metrics

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd everclear-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Usage

### Running the Server

For development:
```bash
npm run dev
```

For production:
```bash
npm start
```

### Integration with Claude Desktop

1. Open Claude Desktop configuration file:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - Linux: `~/.config/Claude/claude_desktop_config.json`

2. Add the Everclear MCP server configuration:
```json
{
  "mcpServers": {
    "everclear": {
      "command": "node",
      "args": ["/path/to/everclear-mcp/dist/index.js"]
    }
  }
}
```

3. Restart Claude Desktop

### Available Tools

Once connected, Claude will have access to the following tools:

#### get_intents
Retrieve a list of intents from Everclear.
- Parameters:
  - `status` (optional): Filter by intent status
  - `limit` (optional): Number of results to return
  - `offset` (optional): Pagination offset

#### get_intent_details
Get detailed information about a specific intent.
- Parameters:
  - `intentId` (required): The ID of the intent

#### get_invoices
Retrieve a list of invoices.
- Parameters:
  - `status` (optional): Filter by invoice status
  - `limit` (optional): Number of results to return
  - `offset` (optional): Pagination offset

#### get_invoice_details
Get detailed information about a specific invoice.
- Parameters:
  - `invoiceId` (required): The ID of the invoice

#### get_invoice_min_amounts
Calculate minimum amounts needed to settle an invoice.
- Parameters:
  - `invoiceId` (required): The ID of the invoice

#### get_route_quote
Get a quote for a route including fees and limits.
- Parameters:
  - `fromChain` (required): Source chain identifier
  - `toChain` (required): Destination chain identifier
  - `amount` (required): Amount to transfer
  - `token` (required): Token address or identifier

#### get_liquidity_flow
Retrieve liquidity flow metrics.
- Parameters:
  - `timeRange` (optional): Time range for metrics
  - `chainId` (optional): Filter by specific chain

#### get_clearing_volume
Retrieve clearing volume metrics.
- Parameters:
  - `timeRange` (optional): Time range for metrics
  - `chainId` (optional): Filter by specific chain

## Development

### Project Structure
```
everclear-mcp/
├── src/
│   └── index.ts        # Main MCP server implementation
├── dist/               # Compiled JavaScript output
├── package.json        # Project dependencies and scripts
├── tsconfig.json       # TypeScript configuration
├── README.md           # This file
└── PRODUCT_SPEC.md     # Product specification document
```

### Scripts
- `npm run build`: Compile TypeScript to JavaScript
- `npm run dev`: Run the server in development mode with hot reload
- `npm start`: Run the compiled server

## API Documentation

For more information about the Everclear API endpoints, visit:
https://docs.everclear.org/developers/api

## License

ISC