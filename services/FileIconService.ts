import { FileType, FILE_TYPE_CONFIGS, FileTypeConfig } from '../types/FileTypes';

export class FileIconService {
	private typeMap: Map<string, FileTypeConfig> = new Map();

	constructor() {
		this.buildTypeMap();
	}

	private buildTypeMap(): void {
		for (const config of FILE_TYPE_CONFIGS) {
			for (const ext of config.extensions) {
				this.typeMap.set(ext.toLowerCase(), config);
			}
		}
	}

	public getFileType(extension: string): FileType {
		if (!extension) return FileType.GENERIC;
		
		const normalizedExt = extension.startsWith('.') ? extension.toLowerCase() : `.${extension.toLowerCase()}`;
		const config = this.typeMap.get(normalizedExt);
		
		return config ? config.type : FileType.GENERIC;
	}

	// Icon methods removed - now using SvgIconService

	public getFileColor(extension: string): string {
		const fileType = this.getFileType(extension);
		const config = FILE_TYPE_CONFIGS.find(c => c.type === fileType);
		return config ? config.color : FILE_TYPE_CONFIGS.find(c => c.type === FileType.GENERIC)!.color;
	}

	/**
	 * Get a theme-aware color for generic files/folders when we want them to blend with the theme
	 */
	public getThemeAwareColor(): string {
		return getComputedStyle(document.documentElement)
			.getPropertyValue('--text-muted')
			.trim() || '#a4b0be';
	}

	// Folder icons now handled by SvgIconService

	public getFolderColor(): string {
		// Use a more theme-aware approach for folder colors
		const accentColor = getComputedStyle(document.documentElement)
			.getPropertyValue('--interactive-accent')
			.trim();
		
		return accentColor || FILE_TYPE_CONFIGS.find(c => c.type === FileType.FOLDER)!.color;
	}

	// Warning icons now handled by SvgIconService

	public getWarningColor(): string {
		// Use Obsidian's CSS variable for error color if available
		return getComputedStyle(document.documentElement)
			.getPropertyValue('--text-error')
			.trim() || '#ff6b6b';
	}

	// Method to easily extend file type support
	public addFileType(config: FileTypeConfig): void {
		FILE_TYPE_CONFIGS.push(config);
		for (const ext of config.extensions) {
			this.typeMap.set(ext.toLowerCase(), config);
		}
	}
}
