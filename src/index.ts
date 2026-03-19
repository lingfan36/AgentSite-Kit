import { Command } from 'commander';
import { registerInitCommand } from './commands/init.js';
import { registerScanCommand } from './commands/scan.js';
import { registerGenerateCommand } from './commands/generate.js';
import { registerServeCommand } from './commands/serve.js';
import { registerUpdateCommand } from './commands/update.js';
import { registerMcpCommand } from './commands/mcp.js';

const program = new Command();

program
  .name('agentsite')
  .description('Make any website Agent-friendly')
  .version('1.0.0');

registerInitCommand(program);
registerScanCommand(program);
registerGenerateCommand(program);
registerServeCommand(program);
registerUpdateCommand(program);
registerMcpCommand(program);

program.parse();
