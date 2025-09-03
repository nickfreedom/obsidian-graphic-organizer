<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Group, Rect, Text, Circle, Path } from 'svelte-konva';
	import { TreeNode } from '../types/TreeNode';
	import { FileIconService } from '../services/FileIconService';
	import { SvgIconService } from '../services/SvgIconService';
	import { CoordinateService } from '../services/CoordinateService';

	/**
	 * Converts a string to a CSS-safe identifier by replacing all non-CSS-friendly characters
	 * with encoded equivalents. CSS identifiers can only contain: a-z, A-Z, 0-9, -, _, and Unicode ≥ U+0080
	 */
	function toCssId(str: string): string {
		return str.replace(/[^a-zA-Z0-9\-_\u0080-\uFFFF]/g, (match) => {
			// Convert character to hex code for unique, reversible encoding
			const code = match.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0');
			return `_U${code}_`;
		});
	}

	// Props
	export let node: TreeNode;
	export let isValidDropTarget: boolean = false;

	// Services
	const fileIconService = new FileIconService();
	const dispatch = createEventDispatcher();
	
	// We'll get the app instance when we need it from the parent component
	// For now, we'll handle coordinates directly but use the service approach

	// Node dimensions
	const nodeWidth = 150; // Increased by 25% from 120px
	const nodeHeight = 40;
	const iconSize = 16;
	const padding = 8;

	// Drag state tracking
	let wasDragging = false;
	let wasRightClicking = false;
	
	// Tooltip state
	let showTooltip = false;
	let tooltipX = 0;
	let tooltipY = 0;

	// Calculate node appearance
	$: isFolder = node.type === 'folder';
	$: iconData = isFolder 
		? SvgIconService.getFolderIconData(node.isExpanded || false)
		: SvgIconService.getIconData(fileIconService.getFileType(node.fileType || ''));
	
	// Function to get resolved CSS custom property values for Konva
	// This is needed because Konva requires actual color values, not CSS variables
	function getCSSVariableValue(varName: string, fallback: string = '#000000'): string {
		if (typeof window === 'undefined' || !document.documentElement) return fallback;
		
		// Get the computed value from the document root
		const value = getComputedStyle(document.documentElement)
			.getPropertyValue(varName)
			.trim();
		
		// Return the resolved value or fallback
		return value || fallback;
	}
	
	// Determine CSS classes for styling
	$: nodeClass = isFolder ? 'node-folder' : 'node-file';
	$: additionalClasses = [
		isValidDropTarget ? 'node-drop-target' : '',
		(isFolder && node.hasWarning) ? 'node-warning' : ''
	].filter(Boolean).join(' ');
	
	// Stroke width still needs to be dynamic for visual feedback
	$: strokeWidth = isValidDropTarget 
		? 4 
		: (isFolder && node.hasWarning ? 2 : 1);
		
	// Resolve CSS custom properties to actual values for Konva
	$: backgroundColor = isValidDropTarget 
		? getCSSVariableValue('--interactive-accent-hover', '#004400')
		: (isFolder 
			? getCSSVariableValue('--node-color-folder', '#d97706') 
			: getCSSVariableValue('--node-color-file', '#1e40af'));
			
	$: strokeColor = isValidDropTarget 
		? getCSSVariableValue('--interactive-accent', '#00ff00')
		: (isFolder && node.hasWarning 
			? getCSSVariableValue('--text-error', '#ff6b6b')
			: (isFolder 
				? getCSSVariableValue('--node-color-folder', '#d97706') 
				: getCSSVariableValue('--node-color-file', '#1e40af')));
				
	$: shadowConfig = isValidDropTarget 
		? { 
			shadowColor: getCSSVariableValue('--interactive-accent', '#00ff00'), 
			shadowBlur: 8, 
			shadowOffset: { x: 0, y: 0 }, 
			shadowOpacity: 0.6 
		}
		: { 
			shadowColor: getCSSVariableValue('--shadow-color', 'rgba(0, 0, 0, 0.3)'), 
			shadowBlur: 3, 
			shadowOffset: { x: 1, y: 1 }, 
			shadowOpacity: 0.3 
		};

	// Position
	$: x = node.x || 0;
	$: y = node.y || 0;

	function handleClick() {

		if (wasDragging) {
			// Ignore clicks that were actually drags
			return;
		}
		
		if (wasRightClicking) {
			// Ignore clicks that were actually right clicks

			wasRightClicking = false;
			return;
		}
		
		dispatch('click', { node });
	}

	function handleRightClick(e: any) {

		
		// Check if it's a right click (button 2 or which 3)
		if (e.detail?.evt?.button === 2 || e.detail?.evt?.which === 3) {

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

			
			// Account for container offset since ContextMenu is rendered inside TreeCanvas container
			if (stageContainer) {
				const containerRect = stageContainer.getBoundingClientRect();

				
				// Since the ContextMenu is positioned relative to the TreeCanvas container,
				// we need to subtract the container offset to get the correct position
				const originalX = menuX;
				const originalY = menuY;
				menuX = menuX - containerRect.left;
				menuY = menuY - containerRect.top;

			} else {
			}
			
			dispatch('rightclick', { 
				node, 
				x: menuX, 
				y: menuY 
			});

		}
	}

	function handleDragStart(e: any) {

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
		

		dispatch('dragstart', { 
			node, 
			x: pos.x, 
			y: pos.y 
		});
	}

	function handleDragMove(e: any) {

		
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
		

		dispatch('dragmove', { 
			node, 
			x: pos.x, 
			y: pos.y 
		});
	}

	function handleDragEnd(e: any) {

		
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
	function getTruncatedText(text: string, maxLength: number = 20): string { // Increased from 15 to 20 characters
		if (text.length <= maxLength) return text;
		return text.substring(0, maxLength - 3) + '...';
	}

	$: displayText = getTruncatedText(node.name);
	$: shouldShowTooltip = node.name.length > 20; // Only show tooltip if text is truncated
	
	function handleMouseEnter(e: any) {
		if (!shouldShowTooltip) return;
		
		// Get the stage to calculate tooltip position
		const konvaTarget = e.detail?.target || e.detail?.currentTarget;
		const stage = konvaTarget?.getStage?.();
		const stageContainer = stage?.container?.();
		
		if (stageContainer) {
			const containerRect = stageContainer.getBoundingClientRect();
			// Position tooltip above the node
			tooltipX = containerRect.left + (node.x || 0) + nodeWidth / 2;
			tooltipY = containerRect.top + (node.y || 0) - 10;
			showTooltip = true;
		}
	}
	
	function handleMouseLeave() {
		showTooltip = false;
	}
</script>

	<Group
		config={{
			x,
			y,
			draggable: true,
			id: `node-${toCssId(node.id)}`
		}}
	on:click={handleClick}
	on:mousedown={handleRightClick}
	on:dragstart={handleDragStart}
	on:dragmove={handleDragMove}
	on:dragend={handleDragEnd}
	on:mouseenter={handleMouseEnter}
	on:mouseleave={handleMouseLeave}
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
			fill: isFolder 
				? getCSSVariableValue('--node-color-folder', '#d97706') 
				: getCSSVariableValue('--node-color-file', '#1e40af'),
			stroke: getCSSVariableValue('--text-normal', '#ffffff'),
			strokeWidth: 0.5,
			opacity: 0.8
		}}
	/>
	
	<!-- SVG Icon -->
	<Path
		config={{
			x: padding + iconSize / 2 - 6, // Center the 12px icon in the 16px space
			y: nodeHeight / 2 - 6,
			data: iconData.path,
			fill: getCSSVariableValue('--text-normal', '#ffffff'),
			scaleX: 0.5, // Scale down from 24x24 to 12x12
			scaleY: 0.5
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
			fill: getCSSVariableValue('--text-normal', '#ffffff'),
			fontFamily: 'var(--font-interface)',
			align: 'left',
			verticalAlign: 'middle'
		}}
	/>
	
	<!-- Warning indicator for large folders -->
	{#if isFolder && node.hasWarning}
		<Path
			config={{
				x: nodeWidth - padding - 12,
				y: padding,
				data: SvgIconService.getWarningIconData().path,
				fill: getCSSVariableValue('--text-error', '#ff6b6b'),
				scaleX: 0.5,
				scaleY: 0.5
			}}
		/>
	{/if}
	
	<!-- Expansion indicator for folders -->
	{#if isFolder}
		<Path
			config={{
				x: nodeWidth - padding - 8,
				y: nodeHeight - padding - 8,
				data: node.isExpanded 
					? 'M19 13H5v-2h14v2z' // Minus icon
					: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z', // Plus icon
				fill: getCSSVariableValue('--text-normal', '#ffffff'),
				scaleX: 0.33,
				scaleY: 0.33
			}}
		/>
	{/if}
</Group>

<!-- Tooltip for full filename -->
{#if showTooltip && shouldShowTooltip}
	<div 
		class="node-tooltip"
		style="left: {tooltipX}px; top: {tooltipY}px;"
	>
		{node.name}
	</div>
{/if}
