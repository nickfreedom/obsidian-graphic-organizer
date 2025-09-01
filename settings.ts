import { App, PluginSettingTab, Setting } from 'obsidian';
import type GraphicOrganizerPlugin from './main';

export class SettingsTab extends PluginSettingTab {
	plugin: GraphicOrganizerPlugin;

	constructor(app: App, plugin: GraphicOrganizerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Graphic Organizer Settings' });

		// Performance Settings
		containerEl.createEl('h3', { text: 'Performance' });

		new Setting(containerEl)
			.setName('Large folder threshold')
			.setDesc('Number of items above which folders will show a warning before loading')
			.addSlider(slider => slider
				.setLimits(10, 200, 10)
				.setValue(this.plugin.settings.largeFolderThreshold)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.largeFolderThreshold = value;
					await this.plugin.saveSettings();
				}));

		// Animation Settings
		containerEl.createEl('h3', { text: 'Animations' });

		new Setting(containerEl)
			.setName('Smooth animations')
			.setDesc('Enable smooth animations for tree reorganization (may impact performance)')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableSmoothAnimations)
				.onChange(async (value) => {
					this.plugin.settings.enableSmoothAnimations = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Animation duration')
			.setDesc('Duration of animations in milliseconds')
			.addSlider(slider => slider
				.setLimits(100, 1000, 50)
				.setValue(this.plugin.settings.animationDuration)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.animationDuration = value;
					await this.plugin.saveSettings();
				}));

		// Zoom Settings
		containerEl.createEl('h3', { text: 'Zoom & Navigation' });

		new Setting(containerEl)
			.setName('Zoom sensitivity')
			.setDesc('How much to zoom with each scroll wheel step')
			.addSlider(slider => slider
				.setLimits(0.05, 0.5, 0.05)
				.setValue(this.plugin.settings.zoomSensitivity)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.zoomSensitivity = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Minimum zoom')
			.setDesc('Minimum zoom level (as a percentage)')
			.addSlider(slider => slider
				.setLimits(0.1, 1.0, 0.1)
				.setValue(this.plugin.settings.minZoom)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.minZoom = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Maximum zoom')
			.setDesc('Maximum zoom level (as a percentage)')
			.addSlider(slider => slider
				.setLimits(2.0, 10.0, 0.5)
				.setValue(this.plugin.settings.maxZoom)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.maxZoom = value;
					await this.plugin.saveSettings();
				}));

		// Layout Settings
		containerEl.createEl('h3', { text: 'Layout' });

		new Setting(containerEl)
			.setName('Horizontal spacing')
			.setDesc('Space between nodes horizontally (in pixels)')
			.addSlider(slider => slider
				.setLimits(80, 300, 10)
				.setValue(this.plugin.settings.nodeSpacing.horizontal)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.nodeSpacing.horizontal = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Vertical spacing')
			.setDesc('Space between nodes vertically (in pixels)')
			.addSlider(slider => slider
				.setLimits(40, 150, 5)
				.setValue(this.plugin.settings.nodeSpacing.vertical)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.nodeSpacing.vertical = value;
					await this.plugin.saveSettings();
				}));

		// Reset Settings
		containerEl.createEl('h3', { text: 'Reset' });

		new Setting(containerEl)
			.setName('Reset to defaults')
			.setDesc('Reset all settings to their default values')
			.addButton(button => button
				.setButtonText('Reset Settings')
				.setWarning()
				.onClick(async () => {
					// Reset to defaults
					const { DEFAULT_SETTINGS } = await import('./types/PluginSettings');
					this.plugin.settings = { ...DEFAULT_SETTINGS };
					await this.plugin.saveSettings();
					
					// Refresh the settings display
					this.display();
				}));
	}
}
