#!/usr/bin/env node

import { CommandRegistry } from './commands';
import chalk from 'chalk';
import figlet from 'figlet';

async function main(): Promise<void> {
  try {
    // Display welcome banner
    console.log(chalk.blue(figlet.textSync('reel-cli', { horizontalLayout: 'full' })));
    console.log(chalk.gray('🍿 Film data retrieval tool\n'));

    // Initialize command registry
    const registry = new CommandRegistry();

    // Run the CLI with command line arguments
    await registry.run(process.argv);

  } catch (error) {
    console.error(chalk.red('❌ Fatal error:'), error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error(chalk.red('❌ Uncaught Exception:'), error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('❌ Unhandled Rejection at:'), promise);
  console.error(chalk.red('Reason:'), reason);
  process.exit(1);
});

// Run the main function
if (require.main === module) {
  main().catch((error) => {
    console.error(chalk.red('❌ Failed to start reel-cli:'), error);
    process.exit(1);
  });
}
