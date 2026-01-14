import { Plugin } from 'obsidian';
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
		this.addRibbonIcon('network', 'Open visual hierarchy', () => {
			void this.activateView();
		});

		// Add command to activate the view
		this.addCommand({
			id: 'open-view',
			name: 'Open visual hierarchy',
			callback: () => {
				void this.activateView();
			}
		});

		// Add settings tab
		this.addSettingTab(new SettingsTab(this.app, this));
	}

	onunload() {
		// Plugin cleanup - avoid detaching leaves as it's an antipattern
		// Obsidian will handle view cleanup automatically
	}

	async activateView() {
		const { workspace } = this.app;
		
		// Check if view is already open
		let leaf = workspace.getLeavesOfType(VIEW_TYPE_GRAPHIC_ORGANIZER)[0];

		if (!leaf) {
			// Create new leaf in right sidebar
			leaf = workspace.getRightLeaf(false);
			if (leaf) {
				await leaf.setViewState({
					type: VIEW_TYPE_GRAPHIC_ORGANIZER,
					active: true,
				});
			}
		}

		// Reveal the leaf
		if (leaf) {
			void workspace.revealLeaf(leaf);
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
