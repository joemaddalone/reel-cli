import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import { BaseCommand } from './base-command';

export class HelpCommand extends BaseCommand {
  protected createCommand(): Command {
    return new Command('help')
      .description('Show detailed help information')
      .argument('[command]', 'Command to get help for')
      .action(async (command) => {
        await this.runWithErrorHandling(command);
      });
  }

  protected async execute(command?: string): Promise<void> {
    if (command) {
      await this.showCommandHelp(command);
    } else {
      await this.showGeneralHelp();
    }
  }

  private async showGeneralHelp(): Promise<void> {
    // Display ASCII art banner
    console.log(chalk.blue(figlet.textSync('reel-cli', { horizontalLayout: 'full' })));
    console.log(chalk.gray('🍿 Search for films and retrieve comprehensive data from TMDB\n'));

    this.logInfo('Available Commands:');
    console.log('');

    const commands = [
      {
        name: 'configure',
        description: 'Set up TMDB API credentials and preferences',
        usage: 'reel configure [options]'
      },
      {
        name: 'search',
        description: 'Search for films by title',
        usage: 'reel search <title> [options]'
      },
      {
        name: 'help',
        description: 'Show this help information',
        usage: 'reel help [command]'
      },
      {
        name: 'test',
        description: 'Test TMDB API connection and credentials',
        usage: 'reel test'
      },
      {
        name: 'list',
        description: 'List all saved films and manage storage',
        usage: 'reel list [options]'
      },
      {
        name: 'export',
        description: 'Export saved film data to different formats',
        usage: 'reel export [options]'
      }
    ];

    commands.forEach(cmd => {
      console.log(chalk.cyan(`  ${cmd.name.padEnd(12)} ${cmd.description}`));
      console.log(chalk.gray(`    Usage: ${cmd.usage}`));
      console.log('');
    });

    this.logInfo('Getting Started:');
    console.log('  1. Run "reel configure" to set up your TMDB API key');
    console.log('  2. Use "reel search <title>" to search for films');
    console.log('  3. Select a film and save the data locally');
    console.log('');

    this.logInfo('Examples:');
    console.log(chalk.gray('  # Search for a specific film'));
    console.log('  reel search "The Matrix"');
    console.log('');
    console.log(chalk.gray('  # Search with year filter'));
    console.log('  reel search "Batman" --year 2022');
    console.log('');
    console.log(chalk.gray('  # Configure with custom settings'));
    console.log('  reel configure --api-key YOUR_KEY --output-dir ./movies');
    console.log('');

    this.logInfo('For more information:');
    console.log('  • Visit: https://github.com/joemaddalone/reel-cli');
    console.log('  • TMDB API: https://www.themoviedb.org/documentation/api');
    console.log('');

    this.logInfo('Need help?');
    console.log('  • Run "reel help <command>" for command-specific help');
    console.log('  • Check the documentation for detailed examples');
  }

  private async showCommandHelp(commandName: string): Promise<void> {
    const commandHelp: Record<string, any> = {
      configure: {
        description: 'Configure TMDB API credentials and application settings',
        usage: 'reel configure [options]',
        options: [
          { flag: '-k, --api-key <key>', description: 'TMDB API key' },
          { flag: '-o, --output-dir <path>', description: 'Default output directory for films' },
          { flag: '-q, --image-quality <quality>', description: 'Image quality (low|medium|high)' }
        ],
        examples: [
          'reel configure',
          'reel configure --api-key YOUR_API_KEY',
          'reel configure --output-dir ./movies --image-quality high'
        ]
      },
      search: {
        description: 'Search for films by title and retrieve detailed information',
        usage: 'reel search <title> [options]',
        arguments: [
          { name: 'title', description: 'Film title to search for (required)' }
        ],
        options: [
          { flag: '-y, --year <year>', description: 'Filter by release year' },
          { flag: '-a, --adult', description: 'Include adult content in search results' },
          { flag: '-o, --output <path>', description: 'Output directory for this specific film' }
        ],
        examples: [
          'reel search "The Matrix"',
          'reel search "Batman" --year 2022',
          'reel search "Avengers" --output ./action-movies'
        ]
      },
      test: {
        description: 'Test TMDB API connection and credentials',
        usage: 'reel test',
        options: [],
        examples: [
          'reel test'
        ]
      },
      list: {
        description: 'List all saved films and manage storage',
        usage: 'reel list [options]',
        options: [
          { flag: '-o, --output <path>', description: 'Output directory to list films from' },
          { flag: '-s, --stats', description: 'Show storage statistics' },
          { flag: '-d, --delete', description: 'Delete a film' }
        ],
        examples: [
          'reel list',
          'reel list --stats',
          'reel list --output ./movies',
          'reel list --delete'
        ]
      },
      export: {
        description: 'Export saved film data to different formats or locations',
        usage: 'reel export [options]',
        options: [
          { flag: '-o, --output <path>', description: 'Output directory to export from' },
          { flag: '-d, --destination <path>', description: 'Destination directory for export' },
          { flag: '-f, --format <format>', description: 'Export format (json|csv|txt)' }
        ],
        examples: [
          'reel export',
          'reel export --format csv',
          'reel export --destination ./backup',
          'reel export --output ./movies --format json'
        ]
      }
    };

    const help = commandHelp[commandName as keyof typeof commandHelp];

    if (!help) {
      this.logError(`Unknown command: ${commandName}`);
      this.logInfo('Run "reel help" to see all available commands');
      return;
    }

    console.log(chalk.cyan(`Command: ${commandName}`));
    console.log(chalk.gray(help.description));
    console.log('');

    console.log(chalk.yellow('Usage:'));
    console.log(`  ${help.usage}`);
    console.log('');

    if (help.arguments) {
      console.log(chalk.yellow('Arguments:'));
      help.arguments.forEach((arg: any) => {
        console.log(`  ${arg.name.padEnd(15)} ${arg.description}`);
      });
      console.log('');
    }

    if (help.options) {
      console.log(chalk.yellow('Options:'));
      help.options.forEach((option: any) => {
        console.log(`  ${option.flag.padEnd(25)} ${option.description}`);
      });
      console.log('');
    }

    if (help.examples) {
      console.log(chalk.yellow('Examples:'));
      help.examples.forEach((example: any) => {
        console.log(`  ${example}`);
      });
      console.log('');
    }

          this.logInfo('For general help, run: reel help');
  }
}
