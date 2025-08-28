import { Command } from 'commander';
import chalk from 'chalk';
import { PopcornError } from '../types';

export abstract class BaseCommand {
  protected program: Command;
  protected command: Command;

  constructor(program: Command) {
    this.program = program;
    this.command = this.createCommand();
  }

  protected abstract createCommand(): Command;
  protected abstract execute(...args: any[]): Promise<void>;

  protected async runWithErrorHandling(...args: any[]): Promise<void> {
    try {
      await this.execute(...args);
    } catch (error) {
      await this.handleError(error);
      process.exit(1);
    }
  }

  protected async handleError(error: unknown): Promise<void> {
    if (error instanceof PopcornError) {
      console.error(chalk.red(`❌ ${error.name}: ${error.message}`));

      if (error.details) {
        console.error(chalk.gray('Details:'), error.details);
      }
    } else if (error instanceof Error) {
      console.error(chalk.red(`❌ Error: ${error.message}`));

      if (process.env.NODE_ENV === 'development') {
        console.error(chalk.gray('Stack trace:'), error.stack);
      }
    } else {
      console.error(chalk.red('❌ An unexpected error occurred'));

      if (process.env.NODE_ENV === 'development') {
        console.error(chalk.gray('Error details:'), error);
      }
    }
  }

  protected logInfo(message: string): void {
    console.log(chalk.blue(`ℹ️  ${message}`));
  }

  protected logSuccess(message: string): void {
    console.log(chalk.green(`✅ ${message}`));
  }

  protected logWarning(message: string): void {
    console.log(chalk.yellow(`⚠️  ${message}`));
  }

  protected logError(message: string): void {
    console.error(chalk.red(`❌ ${message}`));
  }

  protected logDebug(message: string): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(chalk.gray(`🔍 ${message}`));
    }
  }

  protected validateRequiredArgs(args: Record<string, any>, required: string[]): void {
    const missing = required.filter(arg => !args[arg]);

    if (missing.length > 0) {
      throw new PopcornError(
        `Missing required arguments: ${missing.join(', ')}`,
        'VALIDATION_ERROR',
        { missing, provided: args }
      );
    }
  }

  public validateApiKey(apiKey: string): void {
    if (!apiKey || apiKey.trim().length === 0) {
      throw new PopcornError(
        'TMDB API key is required. Please run "reel configure" to set up your API key.',
        'CONFIGURATION_ERROR'
      );
    }
  }

  public getCommand(): Command {
    return this.command;
  }
}
