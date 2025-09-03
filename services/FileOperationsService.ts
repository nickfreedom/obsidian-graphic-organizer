import { App, Modal, Setting, Notice } from 'obsidian';
import type GraphicOrganizerPlugin from '../main';

export class FileOperationsService {
	private app: App;
	private plugin: GraphicOrganizerPlugin;

	constructor(app: App, plugin: GraphicOrganizerPlugin) {
		this.app = app;
		this.plugin = plugin;
	}

	async createNote(parentPath: string): Promise<void> {
		const name = await this.promptForName('New Note', 'Enter note name:', 'Untitled Note');
		if (!name) return;

		const fileName = name.endsWith('.md') ? name : `${name}.md`;
		const fullPath = this.joinPath(parentPath, fileName);

		try {
			await this.app.vault.create(fullPath, '');
			new Notice(`Created note: ${fileName}`);
		} catch (error) {
			new Notice(`Failed to create note: ${error.message}`);
			throw error;
		}
	}

	async createFolder(parentPath: string): Promise<void> {
		const name = await this.promptForName('New Folder', 'Enter folder name:', 'New Folder');
		if (!name) return;

		const fullPath = this.joinPath(parentPath, name);

		try {
			await this.app.vault.createFolder(fullPath);
			new Notice(`Created folder: ${name}`);
		} catch (error) {
			new Notice(`Failed to create folder: ${error.message}`);
			throw error;
		}
	}

	async createCanvas(parentPath: string): Promise<void> {
		const name = await this.promptForName('New Canvas', 'Enter canvas name:', 'Untitled Canvas');
		if (!name) return;

		const fileName = name.endsWith('.canvas') ? name : `${name}.canvas`;
		const fullPath = this.joinPath(parentPath, fileName);

		try {
			// Create empty canvas file with basic structure
			const canvasData: { nodes: any[]; edges: any[] } = {
				nodes: [],
				edges: []
			};
			await this.app.vault.create(fullPath, JSON.stringify(canvasData, null, 2));
			new Notice(`Created canvas: ${fileName}`);
		} catch (error) {
			new Notice(`Failed to create canvas: ${error.message}`);
			throw error;
		}
	}

	async createBase(parentPath: string): Promise<void> {
		const name = await this.promptForName('New Base', 'Enter base name:', 'Untitled Base');
		if (!name) return;

		const fileName = name.endsWith('.md') ? name : `${name}.md`;
		const fullPath = this.joinPath(parentPath, fileName);

		try {
			// Create markdown file with basic base structure
			const baseContent = `---
database: true
columns:
  - name: Name
    type: text
  - name: Status
    type: select
    options:
      - Not Started
      - In Progress
      - Complete
---

# ${name}

This is a base (database) file. You can add entries and manage data here.
`;
			await this.app.vault.create(fullPath, baseContent);
			new Notice(`Created base: ${fileName}`);
		} catch (error) {
			new Notice(`Failed to create base: ${error.message}`);
			throw error;
		}
	}

	async deleteItem(itemPath: string): Promise<void> {
		const confirmed = await this.confirmDeletion(itemPath);
		if (!confirmed) return;

		try {
			const abstractFile = this.app.vault.getAbstractFileByPath(itemPath);
			if (!abstractFile) {
				new Notice('File not found');
				return;
			}

			await this.app.fileManager.trashFile(abstractFile);
			new Notice(`Deleted: ${abstractFile.name}`);
		} catch (error) {
			new Notice(`Failed to delete item: ${error.message}`);
			throw error;
		}
	}

	async revealInExplorer(itemPath: string): Promise<void> {
		try {
			const abstractFile = this.app.vault.getAbstractFileByPath(itemPath);
			if (!abstractFile) {
				new Notice('File not found');
				return;
			}

			// Use Obsidian's file explorer to reveal the file
			this.app.workspace.trigger('reveal-file', abstractFile);
			new Notice(`Revealed: ${abstractFile.name}`);
		} catch (error) {
			new Notice(`Failed to reveal in explorer: ${error.message}`);
			throw error;
		}
	}

	async renameItem(itemPath: string): Promise<void> {
		try {
			const abstractFile = this.app.vault.getAbstractFileByPath(itemPath);
			if (!abstractFile) {
				new Notice('File not found');
				return;
			}

			const currentName = abstractFile.name;
			const newName = await this.promptForName('Rename Item', 'Enter new name:', currentName);
			if (!newName || newName === currentName) return;

			const parentPath = abstractFile.parent?.path || '';
			const newPath = this.joinPath(parentPath, newName);

			await this.app.vault.rename(abstractFile, newPath);
			new Notice(`Renamed: ${currentName} → ${newName}`);
		} catch (error) {
			new Notice(`Failed to rename item: ${error.message}`);
			throw error;
		}
	}

	private joinPath(parentPath: string, childName: string): string {
		if (!parentPath || parentPath === '/') {
			return childName;
		}
		return `${parentPath}/${childName}`;
	}

	private validateFileName(name: string): string | null {
		if (!name || name.trim() === '') {
			return 'Name cannot be empty';
		}

		// Check for invalid characters
		const invalidChars = /[<>:"/\\|?*]/;
		if (invalidChars.test(name)) {
			return 'Name contains invalid characters: < > : " / \\ | ? *';
		}

		// Check for reserved names (Windows)
		const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
		if (reservedNames.includes(name.toUpperCase())) {
			return 'Name is reserved and cannot be used';
		}

		return null;
	}

	private promptForName(title: string, placeholder: string, defaultValue: string): Promise<string | null> {
		return new Promise((resolve) => {
			const modal = new NamePromptModal(
				this.app,
				title,
				placeholder,
				defaultValue,
				this.validateFileName,
				resolve
			);
			modal.open();
		});
	}

	private confirmDeletion(itemPath: string): Promise<boolean> {
		return new Promise((resolve) => {
			const modal = new ConfirmationModal(
				this.app,
				'Confirm Deletion',
				`Are you sure you want to delete "${itemPath}"?`,
				'This action cannot be undone.',
				resolve
			);
			modal.open();
		});
	}
}

class NamePromptModal extends Modal {
	private result: string | null = null;
	private title: string;
	private placeholder: string;
	private defaultValue: string;
	private validator: (name: string) => string | null;
	private onSubmit: (result: string | null) => void;

	constructor(
		app: App,
		title: string,
		placeholder: string,
		defaultValue: string,
		validator: (name: string) => string | null,
		onSubmit: (result: string | null) => void
	) {
		super(app);
		this.title = title;
		this.placeholder = placeholder;
		this.defaultValue = defaultValue;
		this.validator = validator;
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl('h2', { text: this.title });

		let input: HTMLInputElement;
		let errorEl: HTMLElement;

		new Setting(contentEl)
			.setName('Name')
			.setDesc(this.placeholder)
			.addText((text) => {
				input = text.inputEl;
				text
					.setPlaceholder(this.placeholder)
					.setValue(this.defaultValue)
					.onChange((value) => {
						const error = this.validator(value);
						if (error) {
							errorEl.textContent = error;
							errorEl.className = 'setting-item-description modal-error-text';
						} else {
							errorEl.textContent = '';
							errorEl.className = 'setting-item-description';
						}
					});

				// Auto-focus and select text
				setTimeout(() => {
					input.focus();
					input.select();
				}, 10);
			});

		// Error display
		errorEl = contentEl.createEl('div', { cls: 'setting-item-description' });

		// Buttons
		const buttonContainer = contentEl.createEl('div', { 
			cls: 'modal-button-container'
		});

		const cancelButton = buttonContainer.createEl('button', { text: 'Cancel' });
		cancelButton.addEventListener('click', () => {
			this.result = null;
			this.close();
		});

		const createButton = buttonContainer.createEl('button', { 
			text: 'Create',
			cls: 'mod-cta'
		});
		createButton.addEventListener('click', () => {
			const value = input.value.trim();
			const error = this.validator(value);
			if (error) {
				errorEl.textContent = error;
				errorEl.className = 'setting-item-description modal-error-text';
				return;
			}
			this.result = value;
			this.close();
		});

		// Handle Enter key
		input.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') {
				createButton.click();
			} else if (e.key === 'Escape') {
				cancelButton.click();
			}
		});
	}

	onClose() {
		this.onSubmit(this.result);
	}
}

class ConfirmationModal extends Modal {
	private result: boolean = false;
	private title: string;
	private message: string;
	private warning: string;
	private onSubmit: (result: boolean) => void;

	constructor(
		app: App,
		title: string,
		message: string,
		warning: string,
		onSubmit: (result: boolean) => void
	) {
		super(app);
		this.title = title;
		this.message = message;
		this.warning = warning;
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl('h2', { text: this.title });
		contentEl.createEl('p', { text: this.message });
		contentEl.createEl('p', { 
			text: this.warning, 
			cls: 'setting-item-description modal-warning-text'
		});

		const buttonContainer = contentEl.createEl('div', { 
			cls: 'modal-button-container'
		});

		const cancelButton = buttonContainer.createEl('button', { text: 'Cancel' });
		cancelButton.addEventListener('click', () => {
			this.result = false;
			this.close();
		});

		const deleteButton = buttonContainer.createEl('button', { 
			text: 'Delete',
			cls: 'mod-warning'
		});
		deleteButton.addEventListener('click', () => {
			this.result = true;
			this.close();
		});
	}

	onClose() {
		this.onSubmit(this.result);
	}
}
