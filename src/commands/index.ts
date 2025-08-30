import { Command } from 'commander';
import { BaseCommand } from './base-command';
import { ConfigureCommand } from './configure';
import { SearchCommand } from './search';
import { HelpCommand } from './help';
import { TestCommand } from './test';
import { ListCommand } from './list';
import { ExportCommand } from './export';
import packageJson from '../../package.json';

export class CommandRegistry {
  private commands: BaseCommand[] = [];
  private program: Command;

  constructor() {
    this.program = new Command();
    this.setupProgram();
    this.registerCommands();
  }

  private setupProgram(): void {
    this.program
      .name('reel')
      .description('Search for films and retrieve comprehensive data from TMDB')
      .version(packageJson.version)
      .option('-d, --debug', 'Enable debug mode')
      .option('-v, --verbose', 'Enable verbose output');
  }

  private registerCommands(): void {
    // Register all commands
    this.commands = [
      new ConfigureCommand(this.program),
      new SearchCommand(this.program),
      new HelpCommand(this.program),
      new TestCommand(this.program),
      new ListCommand(this.program),
      new ExportCommand(this.program)
    ];

    // Add each command to the program
    this.commands.forEach(command => {
      this.program.addCommand(command.getCommand());
    });
  }

  public async run(argv: string[]): Promise<void> {
    try {
      await this.program.parseAsync(argv);
    } catch (error) {
      console.error('Failed to parse command:', error);
      process.exit(1);
    }
  }

  public getProgram(): Command {
    return this.program;
  }

  public getCommands(): BaseCommand[] {
    return this.commands;
  }
}
