<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Stage, Layer, Line } from 'svelte-konva';
	import Konva from 'konva';
	import { App } from 'obsidian';
	import type GraphicOrganizerPlugin from '../main';
	import type { GraphicOrganizerView } from '../view';
	import { VaultHierarchyService } from '../services/VaultHierarchyService';
	import { DragDropService } from '../services/DragDropService';
	import { TreeNode, TreeLayout } from '../types/TreeNode';
	import Node from './Node.svelte';
	import ZoomControls from './ZoomControls.svelte';
	import ContextMenu from './ContextMenu.svelte';

	// Props
	export let app: App;
	export let plugin: GraphicOrganizerPlugin;
	export let view: GraphicOrganizerView;

	// Services
	let hierarchyService: VaultHierarchyService;
	let dragDropService: DragDropService;

	// State
	let stageWidth = 800;
	let stageHeight = 600;
	let treeLayout: TreeLayout = {
		nodes: new Map(),
		levels: new Map(),
		maxDepth: 0
	};
	let visibleNodes: TreeNode[] = [];
	let dragState: any = null;

	// Konva stage and layer references
	let stage: Konva.Stage;
	let layer: Konva.Layer;

	// Transform state
	let scale = 1;
	let stageX = 0;
	let stageY = 0;

	// Context menu state
	let showContextMenu = false;
	let contextMenuX = 0;
	let contextMenuY = 0;
	let contextNode: TreeNode | null = null;

	// Debug contextNode changes
	$: console.log('TreeCanvas: contextNode reactive change:', contextNode);
	$: console.log('TreeCanvas: showContextMenu reactive change:', showContextMenu);

	// Drag configuration
	Konva.dragDistance = 5; // Threshold for distinguishing click from drag

	onMount(async () => {
		// Initialize services
		hierarchyService = new VaultHierarchyService(app, plugin);
		dragDropService = new DragDropService(app, plugin);

		// Set up hierarchy service listener
		hierarchyService.addListener(onTreeLayoutChange);

		// Get container dimensions (retry if needed)
		updateDimensions();
		
		// Retry after a short delay if we got zero dimensions
		if (stageWidth === 800 && stageHeight === 600) {
			setTimeout(() => {
				updateDimensions();
			}, 100);
		}
		
		window.addEventListener('resize', updateDimensions);

		// Build initial tree
		await hierarchyService.buildInitialTree();
	});

	onDestroy(() => {
		if (hierarchyService) {
			hierarchyService.removeListener(onTreeLayoutChange);
			hierarchyService.destroy();
		}
		window.removeEventListener('resize', updateDimensions);
	});

	function updateDimensions() {
		const container = (view as any).containerEl?.querySelector('.graphic-organizer-container');
		if (container) {
			const width = container.clientWidth;
			const height = container.clientHeight;
			
			console.log('Graphic Organizer: Container dimensions:', width, 'x', height);
			
			// Set dimensions with fallbacks if container is not yet sized
			stageWidth = width > 0 ? width : 800;
			stageHeight = height > 0 ? height : 600;
			
			console.log('Graphic Organizer: Stage dimensions set to:', stageWidth, 'x', stageHeight);
		} else {
			console.log('Graphic Organizer: Container not found, using defaults');
			stageWidth = 800;
			stageHeight = 600;
		}
	}

	function onTreeLayoutChange(newLayout: TreeLayout) {
		console.log('Graphic Organizer: Layout changed with', newLayout.nodes.size, 'nodes');
		treeLayout = newLayout;
		updateVisibleNodes();
	}

	function updateVisibleNodes() {
		visibleNodes = [];
		
		function addVisibleNode(node: TreeNode) {
			visibleNodes.push(node);
			if (node.children && node.isExpanded) {
				for (const child of node.children) {
					addVisibleNode(child);
				}
			}
		}

		// Start from root node
		const rootNode = treeLayout.nodes.get('root') || treeLayout.nodes.values().next().value;
		if (rootNode) {
			addVisibleNode(rootNode);
		}

		console.log('Graphic Organizer: Visible nodes updated, count:', visibleNodes.length);
		
		// Trigger reactivity
		visibleNodes = visibleNodes;
	}

	function getConnectionLines() {
		const lines = [];
		const nodeWidth = 120;
		const nodeHeight = 40;
		
		for (const node of visibleNodes) {
			if (node.children && node.isExpanded) {
				for (const child of node.children) {
					if (visibleNodes.includes(child)) {
						// Calculate connection points
						const parentCenterX = node.x + nodeWidth / 2;
						const parentBottomY = node.y + nodeHeight;
						const childCenterX = child.x + nodeWidth / 2;
						const childTopY = child.y;
						
						lines.push({
							points: [parentCenterX, parentBottomY, childCenterX, childTopY],
							stroke: '#666',
							strokeWidth: 2
						});
					}
				}
			}
		}
		
		return lines;
	}

	function handleNodeClick(node: TreeNode) {
		if (node.type === 'file') {
			// Open file in new tab
			const file = app.vault.getAbstractFileByPath(node.path);
			if (file) {
				app.workspace.openLinkText(file.path, '', true);
			}
		} else if (node.type === 'folder') {
			// Handle folder expansion/collapse
			if (node.hasWarning && !node.isLoaded) {
				// Show warning modal for large folders
				showLargeFolderWarning(node);
			} else {
				toggleFolder(node);
			}
		}
	}

	function toggleFolder(node: TreeNode) {
		if (node.isExpanded) {
			hierarchyService.collapseFolder(node.id);
		} else {
			hierarchyService.expandFolder(node.id);
		}
	}

	function showLargeFolderWarning(node: TreeNode) {
		// TODO: Implement warning modal
		// For now, just expand anyway
		hierarchyService.expandFolder(node.id);
	}

	function handleNodeDragStart(node: TreeNode, x: number, y: number) {
		if (x !== undefined && y !== undefined) {
			console.log('Drag start:', node.name, x, y);
			dragDropService.startDrag(node, x, y);
			dragState = dragDropService.getDragState();
			console.log('Drag state after start:', dragState);
		}
	}

	function handleNodeDragMove(node: TreeNode, x: number, y: number) {
		if (x !== undefined && y !== undefined) {
			console.log('Drag move:', node.name, 'to', x, y);
			
			// The coordinates from Node.svelte are stage coordinates, not mouse coordinates
			// We need to get the actual mouse position from the stage
			const mousePos = stage?.getPointerPosition();
			
			if (mousePos) {
				// Check if stage has transform (zoom/pan) that affects coordinates
				const stageTransform = stage.getTransform();
				console.log('Mouse pos (raw):', mousePos);
				console.log('Stage transform:', stageTransform);
				
				// Apply inverse transform to get actual stage coordinates
				const stageCoords = stageTransform.copy().invert().point(mousePos);
				console.log('Mouse pos (transformed to stage coords):', stageCoords);
				
				// Find potential drop target using transformed coordinates
				const potentialTarget = dragDropService.isValidDropZone(stageCoords.x, stageCoords.y, visibleNodes, node);
				console.log('Potential target:', potentialTarget?.name || 'none');
				dragDropService.updateDrag(stageCoords.x, stageCoords.y, potentialTarget);
				const newDragState = dragDropService.getDragState();
				console.log('Updated drag state:', newDragState);
				dragState = newDragState;
			}
		}
	}

	function handleNodeDragEnd(node: TreeNode) {
		console.log('Drag end for:', node.name);
		const result = dragDropService.endDrag();
		console.log('Drag end result:', result);
		dragState = null; // Clear drag state
		
		if (result.success && result.movedNode && result.newParent) {
			// The hierarchy service will automatically update via vault listeners
			console.log('Successfully moved', result.movedNode.name, 'to', result.newParent.name);
		}
	}

	function handleRightClick(node: TreeNode, x: number, y: number) {
		console.log('TreeCanvas handleRightClick called with:', { node, x, y });
		if (x !== undefined && y !== undefined && node) {
			console.log('TreeCanvas: Setting context state - node:', node.name, 'pos:', x, y);
			
			// Set all values in sequence with explicit logging
			contextMenuX = x;
			contextMenuY = y;
			console.log('TreeCanvas: Set position:', contextMenuX, contextMenuY);
			
			contextNode = node;
			console.log('TreeCanvas: Set contextNode:', contextNode);
			
			// Use setTimeout to ensure all reactive updates complete before showing menu
			setTimeout(() => {
				showContextMenu = true;
				console.log('TreeCanvas: Set showContextMenu to true. contextNode is now:', contextNode);
			}, 0);
		}
	}

	function handleCanvasRightClick(x: number, y: number) {
		console.log('TreeCanvas: handleCanvasRightClick called - this should only happen for clicks on empty space');
		// Right click on empty space - don't show context menu
		// (In the future, this could show general options like "New folder" at root level)
		console.log('TreeCanvas: Not showing context menu for blank space click');
	}

	function closeContextMenu() {
		console.log('TreeCanvas: closeContextMenu called');
		showContextMenu = false;
		contextNode = null;
	}

	function handleZoom(delta: number, centerX: number = stageWidth / 2, centerY: number = stageHeight / 2) {
		const scaleBy = 1.05;
		const oldScale = scale;
		const newScale = delta > 0 ? oldScale * scaleBy : oldScale / scaleBy;
		
		// Apply zoom limits if configured
		const minZoom = plugin.settings.minZoom;
		const maxZoom = plugin.settings.maxZoom;
		scale = Math.max(minZoom, Math.min(maxZoom, newScale));

		// Adjust position to zoom towards center
		const mousePointTo = {
			x: (centerX - stageX) / oldScale,
			y: (centerY - stageY) / oldScale,
		};

		stageX = centerX - mousePointTo.x * scale;
		stageY = centerY - mousePointTo.y * scale;
	}

	function handleWheel(e: WheelEvent) {
		e.preventDefault();
		const delta = e.deltaY > 0 ? -1 : 1;
		handleZoom(delta, e.clientX, e.clientY);
	}

	function handleZoomIn() {
		// Calculate the center point in stage coordinates to maintain current view
		const centerX = stageWidth / 2;
		const centerY = stageHeight / 2;
		
		const scaleBy = 1.05;
		const oldScale = scale;
		const newScale = oldScale * scaleBy;
		
		// Apply zoom limits
		const minZoom = plugin.settings.minZoom;
		const maxZoom = plugin.settings.maxZoom;
		scale = Math.max(minZoom, Math.min(maxZoom, newScale));
		
		// Adjust position to zoom towards the current center point
		const mousePointTo = {
			x: (centerX - stageX) / oldScale,
			y: (centerY - stageY) / oldScale,
		};

		stageX = centerX - mousePointTo.x * scale;
		stageY = centerY - mousePointTo.y * scale;
	}

	function handleZoomOut() {
		// Calculate the center point in stage coordinates to maintain current view
		const centerX = stageWidth / 2;
		const centerY = stageHeight / 2;
		
		const scaleBy = 1.05;
		const oldScale = scale;
		const newScale = oldScale / scaleBy;
		
		// Apply zoom limits
		const minZoom = plugin.settings.minZoom;
		const maxZoom = plugin.settings.maxZoom;
		scale = Math.max(minZoom, Math.min(maxZoom, newScale));
		
		// Adjust position to zoom towards the current center point
		const mousePointTo = {
			x: (centerX - stageX) / oldScale,
			y: (centerY - stageY) / oldScale,
		};

		stageX = centerX - mousePointTo.x * scale;
		stageY = centerY - mousePointTo.y * scale;
	}

	function handleZoomReset() {
		scale = 1;
		stageX = 0;
		stageY = 0;
	}

	function convertAbsoluteToStageCoordinates(x: number, y: number) {
		// Convert absolute coordinates back to stage coordinates
		return {
			x: (x - stageX) / scale,
			y: (y - stageY) / scale
		};
	}

	function isActiveDropTargetForNode(node: TreeNode): boolean {
		if (!dragState?.isDragging || !dragState?.draggedNode) {
			return false;
		}

		// Only highlight the current active drop target (the one being hovered over)
		return node === dragState.validDropTarget;
	}

	function isValidDropTargetForNode(node: TreeNode): boolean {
		if (!dragState?.isDragging || !dragState?.draggedNode) {
			return false;
		}

		// Only folders can be drop targets
		if (node.type !== 'folder') {
			return false;
		}

		// Can't drop on itself
		if (node === dragState.draggedNode) {
			return false;
		}

		// Can't drop on current parent
		if (node === dragState.draggedNode.parent) {
			return false;
		}

		// Check if this would create a cycle (dropping parent into child)
		const isValid = !isDescendantOfDraggedNode(node, dragState.draggedNode);
		
		return isValid;
	}

	function isDescendantOfDraggedNode(node: TreeNode, draggedNode: TreeNode): boolean {
		if (!draggedNode.children) return false;
		
		for (const child of draggedNode.children) {
			if (child === node) return true;
			if (isDescendantOfDraggedNode(node, child)) return true;
		}
		
		return false;
	}
</script>

<div class="tree-canvas-container" on:wheel={handleWheel}>
	<Stage 
		config={{
			width: stageWidth,
			height: stageHeight,
			scaleX: scale,
			scaleY: scale,
			x: stageX,
			y: stageY,
			draggable: true
		}}
		bind:handle={stage}
		on:mousedown={(e) => {
			if (e.detail.evt?.button === 2) {
				e.detail.evt.preventDefault();
				
				// Check if the target is a Node (Group) vs the Stage itself
				const target = e.detail.target;
				console.log('Stage mousedown - target:', target?.constructor?.name, target);
				
				// Only handle canvas right-clicks if the target is the Stage itself, not a Node
				if (!target || target === stage) {
					const pos = stage.getPointerPosition();
					if (pos) {
						console.log('Stage: Handling canvas right-click');
						handleCanvasRightClick(pos.x, pos.y);
					}
				} else {
					console.log('Stage: Ignoring right-click on Node, letting Node handle it');
				}
			}
		}}
	>
		<Layer bind:handle={layer}>
			<!-- Connection lines (drawn first, so they appear behind nodes) -->
			{#each getConnectionLines() as line}
				<Line 
					config={{
						points: line.points,
						stroke: line.stroke,
						strokeWidth: line.strokeWidth
					}}
				/>
			{/each}
			
			<!-- Nodes -->
			{#each visibleNodes as node (node.id)}
				<Node 
					{node}
					isValidDropTarget={dragState?.validDropTarget === node}

					on:click={(e) => handleNodeClick(node)}
					on:rightclick={(e) => handleRightClick(e.detail?.node, e.detail?.x, e.detail?.y)}
					on:dragstart={(e) => handleNodeDragStart(node, e.detail?.x, e.detail?.y)}
					on:dragmove={(e) => handleNodeDragMove(node, e.detail?.x, e.detail?.y)}
					on:dragend={(e) => handleNodeDragEnd(node)}
				/>
			{/each}
		</Layer>
	</Stage>

	<ZoomControls 
		on:zoomin={handleZoomIn}
		on:zoomout={handleZoomOut}
		on:zoomreset={handleZoomReset}
		{scale}
	/>

	{#if showContextMenu}
		<!-- Debug: log what we're passing to ContextMenu -->
		{console.log('TreeCanvas: About to create ContextMenu with node:', contextNode)}
		<ContextMenu 
			{app}
			{plugin}
			node={contextNode}
			x={contextMenuX}
			y={contextMenuY}
			on:close={closeContextMenu}
		/>
	{/if}
</div>

<style>
	.tree-canvas-container {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
		background: var(--background-primary);
	}
</style>
