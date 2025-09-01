import { Plugin, WorkspaceLeaf } from 'obsidian';
import { GraphicOrganizerView, VIEW_TYPE_GRAPHIC_ORGANIZER } from './view';
import { PluginSettings, DEFAULT_SETTINGS } from './types/PluginSettings';
import { SettingsTab } from './settings';

export default class GraphicOrganizerPlugin extends Plugin {
	settings: PluginSettings;

	async onload() {
		await this.loadSettings();

		// Register the custom view
		this.registerView(
			VIEW_TYPE_GRAPHIC_ORGANIZER,
			(leaf) => new GraphicOrganizerView(leaf, this)
		);

		// Add ribbon icon to activate the view
		this.addRibbonIcon('network', 'Open Graphic Organizer', () => {
			this.activateView();
		});

		// Add command to activate the view
		this.addCommand({
			id: 'open-graphic-organizer',
			name: 'Open Graphic Organizer',
			callback: () => {
				this.activateView();
			}
		});

		// Add settings tab
		this.addSettingTab(new SettingsTab(this.app, this));
	}

	onunload() {
		// Clean up any leaves of our view type
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_GRAPHIC_ORGANIZER);
	}

	async activateView() {
		const { workspace } = this.app;
		
		// Check if view is already open
		let leaf = workspace.getLeavesOfType(VIEW_TYPE_GRAPHIC_ORGANIZER)[0];

		if (!leaf) {
			// Create new leaf in right sidebar
			leaf = workspace.getRightLeaf(false);
			await leaf.setViewState({
				type: VIEW_TYPE_GRAPHIC_ORGANIZER,
				active: true,
			});
		}

		// Reveal the leaf
		workspace.revealLeaf(leaf);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
