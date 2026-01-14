import { ItemView, WorkspaceLeaf } from 'obsidian';
import TreeCanvas from './components/TreeCanvas.svelte';
import type GraphicOrganizerPlugin from './main';

export const VIEW_TYPE_GRAPHIC_ORGANIZER = 'graphic-organizer-view';

export class GraphicOrganizerView extends ItemView {
	plugin: GraphicOrganizerPlugin;
	component: TreeCanvas;

	constructor(leaf: WorkspaceLeaf, plugin: GraphicOrganizerPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType() {
		return VIEW_TYPE_GRAPHIC_ORGANIZER;
	}

	getDisplayText() {
		return 'Graphic organizer';
	}

	getIcon() {
		return 'network';
	}

	onOpen(): Promise<void> {
		const container = this.containerEl.children[1];
		container.empty();

		// Create wrapper div for the Svelte component
		const wrapper = container.createEl('div', {
			cls: 'graphic-organizer-container'
		});

		// Initialize the Svelte component
		this.component = new TreeCanvas({
			target: wrapper,
			props: {
				app: this.app,
				plugin: this.plugin,
				view: this
			}
		});
		return Promise.resolve();
	}

	onClose(): Promise<void> {
		// Clean up the Svelte component
		if (this.component) {
			this.component.$destroy();
		}
		return Promise.resolve();
	}
}
