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

	// All color methods removed - colors now handled via CSS variables
	// This eliminates hardcoded colors and JavaScript-based color detection

	// Method to easily extend file type support
	public addFileType(config: FileTypeConfig): void {
		FILE_TYPE_CONFIGS.push(config);
		for (const ext of config.extensions) {
			this.typeMap.set(ext.toLowerCase(), config);
		}
	}
}
