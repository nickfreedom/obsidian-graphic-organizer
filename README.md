# Obsidian Graphic Organizer Plugin

A visual, interactive tree view plugin for Obsidian that displays your vault's file and folder hierarchy in a graphical format with drag-and-drop functionality.

## Features

### 🌳 Interactive Tree Visualization
- **Vertical tree layout** showing your vault's folder and file structure
- **Lazy loading** - folders load children only when first expanded
- **Real-time updates** reflecting changes to your vault structure
- **Zoom and pan** capabilities for navigating large vaults

### 🎯 Smart Interactions
- **Click files** to open them in new tabs
- **Drag and drop** files and folders to reorganize your vault
- **Right-click context menus** for creating and deleting items
- **Visual feedback** highlighting valid drop targets

### 📁 File Type Support
- **Distinctive icons** for different file types:
  - 📝 Markdown files
  - 🖼️ Images (PNG, JPG, GIF, WebP, SVG)
  - 📄 PDFs
  - 🎬 Videos
  - 🎵 Audio files
  - 💻 Code files
  - 🎨 Canvas files
  - 🗃️ Base files (databases)
  - 📁 Folders (with open/closed states)
  - 📃 Generic files

### ⚡ Performance Features
- **Large folder warnings** for folders with 50+ items (configurable)
- **Smooth or instant animations** (user preference)
- **Efficient rendering** using Konva.js with Svelte

## Installation

### From Obsidian Community Plugins (Recommended)
1. Open Obsidian Settings
2. Go to Community Plugins
3. Search for "Graphic Organizer"
4. Install and enable the plugin

### Manual Installation
1. Download the latest release from [GitHub Releases](link-to-releases)
2. Extract the files to your vault's `.obsidian/plugins/graphic-organizer/` directory
3. Enable the plugin in Obsidian Settings > Community Plugins

## Usage

### Opening the Graphic Organizer
- **Ribbon Icon**: Click the network icon in the left ribbon
- **Command Palette**: Use "Open Graphic Organizer" command
- The view will open in the right sidebar

### Navigation
- **Zoom**: Use mouse wheel or zoom controls (bottom-right corner)
- **Pan**: Drag the canvas background
- **Reset View**: Click the reset button in zoom controls

### File Operations
- **Open File**: Left-click any file to open it in a new tab
- **Expand/Collapse Folder**: Click on folders to toggle their state
- **Right-Click Menu**:
  - **Folders**: New note, New folder, New canvas, New base, Rename, Delete
  - **Files**: Reveal in explorer, Copy path, Rename, Delete

### Drag and Drop
1. **Start Drag**: Click and drag any file or folder
2. **Valid Targets**: Folders will highlight when you hover over them
3. **Drop**: Release over a valid folder to move the item
4. **Invalid Drop**: Dropping elsewhere returns the item to its original position

## Settings

Access settings via Obsidian Settings > Plugin Options > Graphic Organizer:

### Performance
- **Large folder threshold**: Number of items before showing warning (default: 50)

### Animations
- **Smooth animations**: Enable/disable smooth tree reorganization
- **Animation duration**: Speed of animations (100-1000ms)

### Zoom & Navigation
- **Zoom sensitivity**: How much to zoom per scroll step
- **Minimum/Maximum zoom**: Zoom level limits

### Layout
- **Horizontal spacing**: Distance between nodes horizontally
- **Vertical spacing**: Distance between nodes vertically

## Technical Details

### Architecture
- **Svelte + Konva.js**: Reactive UI with high-performance canvas rendering
- **TypeScript**: Full type safety and modern JavaScript features
- **Obsidian Native APIs**: Uses official Obsidian APIs for all file operations

### File Format Support
The plugin automatically detects file types based on extensions and provides appropriate icons. Support for new file types can be easily added by extending the `FileIconService`.

## Development

### Prerequisites
- Node.js 16+
- pnpm (recommended) or npm

### Setup
```bash
git clone <repository-url>
cd obsidian-graphic-organizer
pnpm install
```

### Build
```bash
# Development (with watching)
pnpm run dev

# Production build
pnpm run build
```

### Project Structure
```
├── main.ts                          # Main plugin class
├── main.js                          # Compiled main file
├── view.ts                          # Custom ItemView
├── manifest.json                    # Plugin manifest
├── settings.ts                      # Plugin settings
├── components/                      # Svelte components
│   ├── TreeCanvas.svelte           # Main canvas component
│   ├── Node.svelte                 # Individual node component
│   ├── ContextMenu.svelte          # Right-click menu
│   ├── ZoomControls.svelte         # Zoom controls
│   └── LargeFolderWarningModal.svelte
├── services/                        # Core services
│   ├── VaultHierarchyService.ts    # Vault structure management
│   ├── DragDropService.ts          # Drag and drop functionality
│   ├── FileIconService.ts          # File type icons
│   ├── FileOperationsService.ts    # File operations
│   ├── CoordinateService.ts        # Node positioning
│   ├── AccessibleColorService.ts   # Color management
│   └── SvgIconService.ts           # SVG icon utilities
├── types/                           # TypeScript definitions
│   ├── TreeNode.ts                 # Tree node types
│   ├── FileTypes.ts                # File type definitions
│   └── PluginSettings.ts           # Settings types
├── styles.css                       # Plugin styles
├── esbuild.config.mjs              # Build configuration
├── tsconfig.json                    # TypeScript config
└── version-bump.mjs                 # Version management
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

Apache License 2.0 - see [LICENSE](LICENSE) for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/your-username/obsidian-graphic-organizer/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/obsidian-graphic-organizer/discussions)
- **Documentation**: [Wiki](https://github.com/your-username/obsidian-graphic-organizer/wiki)

## Changelog

See [GitHub Releases](https://github.com/your-username/obsidian-graphic-organizer/releases) for version history and updates.
