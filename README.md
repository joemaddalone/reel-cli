# 🎬 Reel CLI

A powerful command-line interface tool for searching, retrieving, and managing comprehensive film data from The Movie Database (TMDB). Save film metadata, download images, and organize your movie collection locally.

## ✨ Features

- **🔍 Film Search**: Search TMDB database by title with advanced filtering
- **📊 Rich Data**: Retrieve comprehensive film information including cast, crew, ratings, and more
- **🖼️ Image Downloads**: Automatically download posters and backdrops with quality options
- **💾 Local Storage**: Save film data locally in organized directory structures
- **📁 File Management**: List, view, delete, and manage saved films
- **📤 Data Export**: Export film data in multiple formats (JSON, CSV, TXT)
- **⚙️ Persistent Configuration**: Store API credentials and preferences securely
- **🎨 Beautiful CLI**: Modern terminal interface with colors, spinners, and progress indicators

## 🚀 Installation

### Prerequisites

- Node.js 16+
- npm or yarn
- TMDB API key ([Get one here](https://www.themoviedb.org/settings/api))

### Install from npm

```bash
npm install -g reel-cli
```

### Install from source

```bash
git clone https://github.com/joemaddalone/reel-cli.git
cd reel-cli
npm install
npm run build
npm link
```

## 🎯 Quick Start

1. **Configure your API key:**
   ```bash
   reel configure
   ```

2. **Search for a film:**
   ```bash
   reel search "The Matrix"
   ```

3. **View saved films:**
   ```bash
   reel list
   ```

4. **Export your collection:**
   ```bash
   reel export --format csv
   ```

## 📖 Usage

### Commands Overview

| Command | Description | Usage |
|---------|-------------|-------|
| `configure` | Set up TMDB API credentials and preferences | `reel configure [options]` |
| `search` | Search for films by title | `reel search <title> [options]` |
| `list` | List and manage saved films | `reel list [options]` |
| `export` | Export film data to different formats | `reel export [options]` |
| `test` | Test TMDB API connection | `reel test` |
| `help` | Show help information | `reel help [command]` |

### Search Command

Search for films with advanced filtering options:

```bash
# Basic search
reel search "Inception"

# Search with year filter
reel search "Batman" --year 2022

# Search with adult content filter
reel search "Deadpool" --adult

# Search with primary release year
reel search "Avatar" --primary-release-year 2009
```

**Options:**
- `--year <year>`: Filter by release year
- `--primary-release-year <year>`: Filter by primary release year
- `--adult`: Include adult content in results

### List Command

Manage your saved film collection:

```bash
# List all saved films
reel list

# Show storage statistics
reel list --stats

# Delete a film
reel list --delete

# List from specific directory
reel list --output ./custom-movies
```

**Options:**
- `--stats`: Display storage statistics
- `--delete`: Interactive film deletion
- `--output <path>`: Specify source directory

### Export Command

Export your film collection in various formats:

```bash
# Export to JSON (default)
reel export

# Export to CSV
reel export --format csv

# Export to text format
reel export --format txt

# Export to custom directory
reel export --destination ./backup

# Export from specific source
reel export --output ./movies --format json
```

**Formats:**
- **JSON**: Structured data with optional image files
- **CSV**: Spreadsheet-compatible format
- **TXT**: Human-readable text summaries

**Options:**
- `--format <format>`: Export format (json|csv|txt)
- `--destination <path>`: Export destination directory
- `--output <path>`: Source directory to export from

### Configure Command

Set up your TMDB API credentials and preferences:

```bash
# Interactive configuration
reel configure

# Quick setup with options
reel configure --api-key YOUR_KEY --output-dir ./movies --image-quality high
```

**Options:**
- `--api-key <key>`: TMDB API key
- `--output-dir <path>`: Default output directory
- `--image-quality <quality>`: Image quality (low|medium|high)
- `--download-images`: Enable/disable image downloads

## 📁 File Structure

The CLI creates an organized directory structure for each film:

```
[output-directory]/
├── [film-id]-[film-title]/
│   ├── data.json          # Complete film metadata
│   ├── metadata.txt       # Human-readable summary
│   ├── poster.jpg         # Film poster (if available)
│   └── backdrop.jpg       # Film backdrop (if available)
```

## ⚙️ Configuration

Configuration is stored in `~/.reel-cli/` and includes:

- **API Credentials**: TMDB API key
- **User Preferences**: Output directory, image quality, download settings
- **Application Settings**: Logging levels, error handling

### Default Settings

```json
{
  "user": {
    "defaultOutputDir": "~/Movies",
    "imageQuality": "medium",
    "downloadImages": true
  },
  "app": {
    "logLevel": "info",
    "timeout": 30000
  }
}
```

## 🔧 Development

### Prerequisites

- Node.js 16+
- TypeScript 4.5+
- npm or yarn

### Setup

```bash
# Clone repository
git clone https://github.com/joemaddalone/reel-cli.git
cd reel-cli

# Install dependencies
npm install

# Build project
npm run build

# Run in development mode
npm run dev

# Run tests
npm test
```

### Project Structure

```
src/
├── commands/          # CLI command implementations
├── lib/              # Core services and utilities
├── types/            # TypeScript type definitions
├── utils/            # Helper functions
└── index.ts          # Main entry point
```

### Available Scripts

- `npm run build` - Build the project
- `npm run dev` - Run in development mode
- `npm run start` - Run the built application
- `npm run clean` - Clean build artifacts
- `npm run test` - Run tests

## 🧪 Testing

Test the CLI functionality:

```bash
# Test API connection
reel test

# Test search functionality
reel search "test"

# Test storage operations
reel list --stats
```

## 📝 Examples

### Complete Workflow

```bash
# 1. Configure the CLI
reel configure

# 2. Search for films
reel search "The Dark Knight"

# 3. Select and save a film
# (Interactive selection and saving)

# 4. View saved films
reel list

# 5. Export collection
reel export --format csv --destination ./backup
```

### Batch Operations

```bash
# Export all films to different formats
reel export --format json --destination ./json-export
reel export --format csv --destination ./csv-export
reel export --format txt --destination ./txt-export

# Get storage statistics
reel list --stats

# Clean up old films
reel list --delete
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Guidelines

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use TypeScript with strict mode
- Follow ESLint configuration
- Write meaningful commit messages
- Add tests for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [The Movie Database (TMDB)](https://www.themoviedb.org/) for providing the API
- [moviedb-promise](https://github.com/grantholle/moviedb-promise) for the Node.js wrapper
- [Commander.js](https://github.com/tj/commander.js) for CLI framework
- [Inquirer.js](https://github.com/SBoudrias/Inquirer.js) for interactive prompts

## 🐛 Issues & Support

- **Bug Reports**: [GitHub Issues](https://github.com/joemaddalone/reel-cli/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/joemaddalone/reel-cli/discussions)
- **Documentation**: [GitHub Wiki](https://github.com/joemaddalone/reel-cli/wiki)

## 📊 Project Status

- **Version**: 1.0.0
- **Status**: Active Development
- **Node.js**: 16+
- **License**: MIT

---

**Made with ❤️ for movie enthusiasts**
