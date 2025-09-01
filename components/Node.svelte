<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Group, Rect, Text, Circle } from 'svelte-konva';
	import { TreeNode } from '../types/TreeNode';
	import { FileIconService } from '../services/FileIconService';
	import { CoordinateService } from '../services/CoordinateService';

	// Props
	export let node: TreeNode;
	export let isValidDropTarget: boolean = false;

	// Services
	const fileIconService = new FileIconService();
	const dispatch = createEventDispatcher();
	
	// We'll get the app instance when we need it from the parent component
	// For now, we'll handle coordinates directly but use the service approach

	// Node dimensions
	const nodeWidth = 120;
	const nodeHeight = 40;
	const iconSize = 16;
	const padding = 8;

	// Drag state tracking
	let wasDragging = false;
	let wasRightClicking = false;

	// Calculate node appearance
	$: isFolder = node.type === 'folder';
	$: icon = isFolder 
		? fileIconService.getFolderIcon(node.isExpanded || false)
		: fileIconService.getFileIcon(node.fileType || '');
	$: color = isFolder 
		? fileIconService.getFolderColor()
		: fileIconService.getFileColor(node.fileType || '');
	$: textColor = '#ffffff';
	$: strokeColor = isValidDropTarget 
		? '#00ff00' 
		: (isFolder && node.hasWarning ? fileIconService.getWarningColor() : color);
	$: strokeWidth = isValidDropTarget 
		? 4 
		: (isFolder && node.hasWarning ? 2 : 1);
	$: backgroundColor = isValidDropTarget 
		? '#004400' 
		: color;
	$: shadowConfig = isValidDropTarget 
		? { shadowColor: '#00ff00', shadowBlur: 8, shadowOffset: { x: 0, y: 0 }, shadowOpacity: 0.6 }
		: { shadowColor: 'black', shadowBlur: 3, shadowOffset: { x: 1, y: 1 }, shadowOpacity: 0.3 };

	// Position
	$: x = node.x || 0;
	$: y = node.y || 0;

	function handleClick() {
		console.log('Node click handler called for:', node.name);
		if (wasDragging) {
			// Ignore clicks that were actually drags
			return;
		}
		
		if (wasRightClicking) {
			// Ignore clicks that were actually right clicks
			console.log('Ignoring click because it was a right click');
			wasRightClicking = false;
			return;
		}
		
		dispatch('click', { node });
	}

	function handleRightClick(e: any) {
		console.log('Node handleRightClick called for:', node.name, '(click #' + Date.now() + ')');
		console.log('Full event object:', e);
		console.log('Event detail:', e.detail);
		console.log('Event evt:', e.detail?.evt);
		console.log('Event button:', e.detail?.evt?.button);
		console.log('Event which:', e.detail?.evt?.which);
		
		// Check if it's a right click (button 2 or which 3)
		if (e.detail?.evt?.button === 2 || e.detail?.evt?.which === 3) {
			console.log('Right click detected, preventing default and stopping propagation');
			e.detail.evt.preventDefault();
			e.detail.evt.stopPropagation(); // Prevent the Stage from handling this event
			
			// Set flag to prevent subsequent click event
			wasRightClicking = true;
			// Reset flag after a brief delay
			setTimeout(() => {
				wasRightClicking = false;
			}, 100);
			
			// Get the stage to access container positioning
			const konvaTarget = e.detail?.target || e.detail?.currentTarget;
			const stage = konvaTarget?.getStage?.();
			const stageContainer = stage?.container?.();
			
			// Use the mouse coordinates from the DOM event for menu positioning
			let menuX = e.detail.evt.clientX;
			let menuY = e.detail.evt.clientY;
			console.log('Mouse coordinates (clientX/Y):', menuX, menuY);
			console.log('Mouse coordinates (screenX/Y):', e.detail.evt.screenX, e.detail.evt.screenY);
			console.log('Mouse coordinates (pageX/Y):', e.detail.evt.pageX, e.detail.evt.pageY);
			
			// Account for container offset since ContextMenu is rendered inside TreeCanvas container
			if (stageContainer) {
				const containerRect = stageContainer.getBoundingClientRect();
				console.log('Stage container rect (current):', containerRect);
				console.log('Stage container offset from viewport (current):', containerRect.left, containerRect.top);
				
				// Since the ContextMenu is positioned relative to the TreeCanvas container,
				// we need to subtract the container offset to get the correct position
				const originalX = menuX;
				const originalY = menuY;
				menuX = menuX - containerRect.left;
				menuY = menuY - containerRect.top;
				console.log('Coordinate adjustment:', originalX, '-', containerRect.left, '=', menuX, '|', originalY, '-', containerRect.top, '=', menuY);
			} else {
				console.log('Warning: No stage container found for coordinate adjustment');
			}
			
			dispatch('rightclick', { 
				node, 
				x: menuX, 
				y: menuY 
			});
			console.log('Dispatched rightclick event with node:', node.name);
		}
	}

	function handleDragStart(e: any) {
		console.log('Node handleDragStart called for:', node.name);
		console.log('Event object:', e);
		wasDragging = true;
		
		// Try different ways to get position
		let pos = e.target?.absolutePosition?.();
		if (!pos) {
			pos = e.target?.position?.();
		}
		if (!pos) {
			// Use the current node position as fallback
			pos = { x: node.x || 0, y: node.y || 0 };
		}
		
		console.log('Position:', pos);
		console.log('Dispatching dragstart event');
		dispatch('dragstart', { 
			node, 
			x: pos.x, 
			y: pos.y 
		});
	}

	function handleDragMove(e: any) {
		console.log('Node handleDragMove called for:', node.name);
		
		// Get the current position of the dragged node
		let pos = e.target?.absolutePosition?.();
		
		if (!pos) {
			// Try relative position
			pos = e.target?.position?.();
		}
		
		// If we still don't have position, try getting it from the stage
		if (!pos) {
			const konvaTarget = e.detail?.target || e.detail?.currentTarget;
			const stage = konvaTarget?.getStage?.();
			pos = stage?.getPointerPosition?.();
		}
		
		if (!pos) {
			// Use the current node position as last resort
			pos = { x: node.x || 0, y: node.y || 0 };
		}
		
		console.log('DragMove position:', pos);
		dispatch('dragmove', { 
			node, 
			x: pos.x, 
			y: pos.y 
		});
	}

	function handleDragEnd(e: any) {
		console.log('Node handleDragEnd called for:', node.name);
		
		// Get the stage and pointer position (mouse position)
		const konvaTarget = e.detail?.target || e.detail?.currentTarget;
		const stage = konvaTarget?.getStage?.();
		let pos = stage?.getPointerPosition?.();
		
		if (!pos) {
			// Fallback to target position
			pos = e.target?.absolutePosition?.();
		}
		if (!pos) {
			pos = e.target?.position?.();
		}
		if (!pos) {
			// Use the current node position as last resort
			pos = { x: node.x || 0, y: node.y || 0 };
		}
		
		console.log('DragEnd mouse position:', pos);
		dispatch('dragend', { 
			node, 
			x: pos.x, 
			y: pos.y 
		});
		
		// Reset drag flag after a brief delay to allow click handling
		setTimeout(() => {
			wasDragging = false;
		}, 10);
	}

	// Generate truncated text for display
	function getTruncatedText(text: string, maxLength: number = 15): string {
		if (text.length <= maxLength) return text;
		return text.substring(0, maxLength - 3) + '...';
	}

	$: displayText = getTruncatedText(node.name);
</script>

<Group
	config={{
		x,
		y,
		draggable: true
	}}
	on:click={handleClick}
	on:mousedown={handleRightClick}
	on:dragstart={handleDragStart}
	on:dragmove={handleDragMove}
	on:dragend={handleDragEnd}
>
	<!-- Main node rectangle -->
	<Rect
		config={{
			width: nodeWidth,
			height: nodeHeight,
			fill: backgroundColor,
			stroke: strokeColor,
			strokeWidth,
			cornerRadius: 8,
			...shadowConfig
		}}
	/>
	
	<!-- Icon circle background -->
	<Circle
		config={{
			x: padding + iconSize / 2,
			y: nodeHeight / 2,
			radius: iconSize / 2 + 2,
			fill: 'rgba(255, 255, 255, 0.2)'
		}}
	/>
	
	<!-- Icon text (emoji) -->
	<Text
		config={{
			x: padding,
			y: nodeHeight / 2 - iconSize / 2,
			width: iconSize,
			height: iconSize,
			text: icon,
			fontSize: iconSize - 2,
			align: 'center',
			verticalAlign: 'middle'
		}}
	/>
	
	<!-- Node name text -->
	<Text
		config={{
			x: padding * 2 + iconSize,
			y: nodeHeight / 2 - 6,
			width: nodeWidth - (padding * 3 + iconSize),
			text: displayText,
			fontSize: 12,
			fill: textColor,
			fontFamily: 'var(--font-interface)',
			align: 'left',
			verticalAlign: 'middle'
		}}
	/>
	
	<!-- Warning indicator for large folders -->
	{#if isFolder && node.hasWarning}
		<Text
			config={{
				x: nodeWidth - padding - 12,
				y: padding,
				width: 12,
				height: 12,
				text: fileIconService.getWarningIcon(),
				fontSize: 10,
				align: 'center',
				verticalAlign: 'middle'
			}}
		/>
	{/if}
	
	<!-- Expansion indicator for folders -->
	{#if isFolder}
		<Text
			config={{
				x: nodeWidth - padding - 8,
				y: nodeHeight - padding - 8,
				width: 8,
				height: 8,
				text: node.isExpanded ? '−' : '+',
				fontSize: 10,
				fill: textColor,
				fontFamily: 'monospace',
				align: 'center',
				verticalAlign: 'middle'
			}}
		/>
	{/if}
</Group>
