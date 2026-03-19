import { Command } from 'commander';
import { existsSync } from 'node:fs';
import { loadConfig } from '../config/loader.js';
import { startMcpServer } from '../mcp/server.js';
import { log } from '../utils/logger.js';

export function registerMcpCommand(program: Command) {
  program
    .command('mcp')
    .description('Start MCP (Model Context Protocol) server over stdio')
    .action(async () => {
      const config = loadConfig();
      const outDir = config.output.dir;

      if (!existsSync(`${outDir}/scan-result.json`)) {
        log.error('No data found. Run `agentsite scan` and `agentsite generate` first.');
        process.exit(1);
      }

      // MCP uses stdio, so we suppress normal logs
      await startMcpServer(outDir);
    });
}
