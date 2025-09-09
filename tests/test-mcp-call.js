#!/usr/bin/env node

// Test script to call getInvoicesFormatted through MCP protocol simulation
import { spawn } from 'child_process';

async function testMCPCall() {
  console.log('🧪 Testing getInvoicesFormatted through MCP protocol...\n');
  
  // Simulate MCP tool call
  const mcpRequest = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "get_invoices_formatted",
      arguments: {
        limit: 20
      }
    }
  };
  
  console.log('📤 MCP Request:');
  console.log(JSON.stringify(mcpRequest, null, 2));
  
  // Start the MCP server
  const server = spawn('node', ['dist/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  let response = '';
  
  server.stdout.on('data', (data) => {
    response += data.toString();
  });
  
  server.stderr.on('data', (data) => {
    console.log('Server log:', data.toString());
  });
  
  // Send the request
  server.stdin.write(JSON.stringify(mcpRequest) + '\n');
  server.stdin.end();
  
  // Wait for response
  setTimeout(() => {
    console.log('\n📥 MCP Response:');
    try {
      const parsedResponse = JSON.parse(response);
      console.log(JSON.stringify(parsedResponse, null, 2));
    } catch (error) {
      console.log('Raw response (not valid JSON):');
      console.log(response);
    }
    server.kill();
  }, 5000);
}

testMCPCall().catch(console.error);