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

	public getFileType(extension: string): string {
		if (!extension) return FileType.GENERIC;
		
		const normalizedExt = extension.startsWith('.') ? extension.toLowerCase() : `.${extension.toLowerCase()}`;
		const config = this.typeMap.get(normalizedExt);
		
		return config ? config.type : FileType.GENERIC;
	}

	public getFileIcon(extension: string): string {
		const fileType = this.getFileType(extension);
		const config = FILE_TYPE_CONFIGS.find(c => c.type === fileType);
		return config ? config.icon : FILE_TYPE_CONFIGS.find(c => c.type === FileType.GENERIC)!.icon;
	}

	public getFileColor(extension: string): string {
		const fileType = this.getFileType(extension);
		const config = FILE_TYPE_CONFIGS.find(c => c.type === fileType);
		return config ? config.color : FILE_TYPE_CONFIGS.find(c => c.type === FileType.GENERIC)!.color;
	}

	public getFolderIcon(isOpen: boolean): string {
		return isOpen ? '📂' : '📁';
	}

	public getFolderColor(): string {
		return FILE_TYPE_CONFIGS.find(c => c.type === FileType.FOLDER)!.color;
	}

	public getWarningIcon(): string {
		return '⚠️';
	}

	public getWarningColor(): string {
		return '#ff6b6b';
	}

	// Method to easily extend file type support
	public addFileType(config: FileTypeConfig): void {
		FILE_TYPE_CONFIGS.push(config);
		for (const ext of config.extensions) {
			this.typeMap.set(ext.toLowerCase(), config);
		}
	}
}
