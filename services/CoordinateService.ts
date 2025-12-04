import { App, ItemView } from 'obsidian';

/**
 * Service for handling coordinate transformations between different coordinate systems
 * in the graphic organizer (canvas, viewport, stage, etc.)
 */
export class CoordinateService {
    private app: App;

    constructor(app: App) {
        this.app = app;
    }

	/**
	 * Convert raw mouse event coordinates to viewport coordinates suitable for fixed positioning
	 * (like context menus)
	 */
	mouseEventToViewport(evt: MouseEvent, stageContainer?: HTMLElement): { x: number, y: number } {

		// For fixed positioned elements, we want viewport coordinates
		let x = evt.clientX;
		let y = evt.clientY;

		if (stageContainer) {
			const containerRect = stageContainer.getBoundingClientRect();

			// Check if we need to account for any additional offsets
			// In Obsidian, there might be additional interface elements affecting positioning
			const workspace = this.app.workspace;
			const activeView = workspace.getActiveViewOfType(ItemView);
			
			if (activeView?.containerEl) {
				const viewRect = activeView.containerEl.getBoundingClientRect();
				
				// If the view container is different from stage container, 
				// we might need additional adjustments
				if (viewRect.left !== containerRect.left || viewRect.top !== containerRect.top) {
					// Additional adjustments might be needed here
				}
			}
		}

		return { x, y };
	}	/**
	 * Convert mouse event coordinates to stage coordinates for canvas operations
	 * (like drag/drop hit detection)
	 */
	mouseEventToStage(evt: MouseEvent, stage: { getPointerPosition: () => { x: number; y: number } | null; getTransform: () => { copy: () => { invert: () => { point: (pos: { x: number; y: number }) => { x: number; y: number } } } } }): { x: number, y: number } {
		
		// Get the pointer position relative to the stage
		const stagePos = stage.getPointerPosition();
		
		if (stagePos) {
			// Apply inverse transform to get actual stage coordinates
			const stageTransform = stage.getTransform();
			const stageCoords = stageTransform.copy().invert().point(stagePos);
			
			return { x: stageCoords.x, y: stageCoords.y };
		}
		
		// Fallback to raw coordinates
		return { x: evt.clientX, y: evt.clientY };
	}	/**
	 * Get the stage container element from a Konva target
	 */
	getStageContainer(konvaTarget: { getStage?: () => { container?: () => HTMLElement } }): HTMLElement | null {
		try {
			const stage = konvaTarget?.getStage?.();
			return stage?.container?.() || null;
		} catch {
			// Could not get stage container
			return null;
		}
	}
}