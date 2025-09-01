<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { App } from 'obsidian';
	import { TreeNode } from '../types/TreeNode';
	import type GraphicOrganizerPlugin from '../main';
	import { FileOperationsService } from '../services/FileOperationsService';

	// Props
	export let app: App;
	export let plugin: GraphicOrganizerPlugin;
	export let node: TreeNode | null;
	export let x: number;
	export let y: number;

	// Reposition when x or y props change
	$: if (contextMenuElement && x !== undefined && y !== undefined) {
		contextMenuElement.style.left = `${x}px`;
		contextMenuElement.style.top = `${y}px`;
	}

	const dispatch = createEventDispatcher();
	const fileOpsService = new FileOperationsService(app, plugin);

	let contextMenuElement: HTMLDivElement;
	let menuItems: any[] = [];

	onMount(() => {
		// Position the menu immediately
		if (contextMenuElement) {
			contextMenuElement.style.left = `${x}px`;
			contextMenuElement.style.top = `${y}px`;
		}
		
		// Then adjust for viewport bounds after a tick
		setTimeout(() => {
			positionMenu();
		}, 0);
		
		// Close menu when clicking outside
		const handleClickOutside = (event: MouseEvent) => {
			if (contextMenuElement && !contextMenuElement.contains(event.target as Node)) {
				closeMenu();
			}
		};
		
		// Close menu on escape key
		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				closeMenu();
			}
		};
		
		// Add click outside listener after a short delay to prevent immediate closure
		const timeoutId = setTimeout(() => {
			document.addEventListener('click', handleClickOutside);
		}, 100);
		
		document.addEventListener('keydown', handleEscape);
		
		return () => {
			clearTimeout(timeoutId);
			document.removeEventListener('click', handleClickOutside);
			document.removeEventListener('keydown', handleEscape);
		};
	});

	function positionMenu() {
		if (!contextMenuElement) return;
		
		const rect = contextMenuElement.getBoundingClientRect();
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;
		
		// Adjust x position if menu would overflow right edge
		let adjustedX = x;
		if (x + rect.width > viewportWidth) {
			adjustedX = viewportWidth - rect.width - 10;
		}
		
		// Adjust y position if menu would overflow bottom edge
		let adjustedY = y;
		if (y + rect.height > viewportHeight) {
			adjustedY = viewportHeight - rect.height - 10;
		}
		
		contextMenuElement.style.left = `${Math.max(10, adjustedX)}px`;
		contextMenuElement.style.top = `${Math.max(10, adjustedY)}px`;
	}

	function closeMenu() {
		dispatch('close');
	}

	async function createNewNote() {
		if (!node || node.type !== 'folder') return;
		
		try {
			await fileOpsService.createNote(node.path);
			closeMenu();
		} catch (error) {
			console.error('Failed to create note:', error);
		}
	}

	async function createNewFolder() {
		if (!node || node.type !== 'folder') return;
		
		try {
			await fileOpsService.createFolder(node.path);
			closeMenu();
		} catch (error) {
			console.error('Failed to create folder:', error);
		}
	}

	async function createNewCanvas() {
		if (!node || node.type !== 'folder') return;
		
		try {
			await fileOpsService.createCanvas(node.path);
			closeMenu();
		} catch (error) {
			console.error('Failed to create canvas:', error);
		}
	}

	async function createNewBase() {
		if (!node || node.type !== 'folder') return;
		
		try {
			await fileOpsService.createBase(node.path);
			closeMenu();
		} catch (error) {
			console.error('Failed to create base:', error);
		}
	}

	async function deleteItem() {
		if (!node) return;
		
		try {
			await fileOpsService.deleteItem(node.path);
			closeMenu();
		} catch (error) {
			console.error('Failed to delete item:', error);
		}
	}

	// Get menu items based on node type - use explicit reactive statement
	$: {
		console.log('ContextMenu: Reactive block triggered with node:', node);
		menuItems = getMenuItems(node);
		console.log('ContextMenu: Generated menuItems:', menuItems);
	}

	function getMenuItems(node: TreeNode | null) {
		console.log('ContextMenu getMenuItems called with node:', node);
		
		if (!node) {
			// No specific node - could show general options
			console.log('ContextMenu: No node provided');
			return [];
		}
		
		console.log('ContextMenu: Node type is:', node.type);
		
		if (node.type === 'folder') {
			console.log('ContextMenu: Returning folder menu items');
			return [
				{ label: 'New note', action: createNewNote, icon: '📝' },
				{ label: 'New folder', action: createNewFolder, icon: '📁' },
				{ label: 'New canvas', action: createNewCanvas, icon: '🎨' },
				{ label: 'New base', action: createNewBase, icon: '🗃️' },
				{ separator: true },
				{ label: 'Delete', action: deleteItem, icon: '🗑️', destructive: true }
			];
		} else {
			// File node
			console.log('ContextMenu: Returning file menu items');
			return [
				{ label: 'Delete', action: deleteItem, icon: '🗑️', destructive: true }
			];
		}
	}
</script>

<div 
	class="context-menu"
	bind:this={contextMenuElement}
	on:click|stopPropagation
>
	{#each menuItems as item}
		{#if item.separator}
			<div class="menu-separator"></div>
		{:else}
			<button
				class="menu-item {item.destructive ? 'destructive' : ''}"
				on:click={item.action}
			>
				<span class="menu-icon">{item.icon}</span>
				<span class="menu-label">{item.label}</span>
			</button>
		{/if}
	{/each}
</div>

<style>
	.context-menu {
		position: fixed;
		background: var(--background-primary);
		border: 1px solid var(--background-modifier-border);
		border-radius: 8px;
		box-shadow: var(--shadow-l);
		padding: 4px 0;
		min-width: 160px;
		max-width: 240px;
		z-index: 10000;
		font-size: 13px;
	}

	.menu-item {
		display: flex;
		align-items: center;
		width: 100%;
		padding: 8px 12px;
		background: none;
		border: none;
		color: var(--text-normal);
		cursor: pointer;
		text-align: left;
		transition: background-color 0.1s ease;
	}

	.menu-item:hover:not(.disabled) {
		background: var(--background-modifier-hover);
	}

	.menu-item.destructive {
		color: var(--text-error);
	}

	.menu-item.destructive:hover {
		background: var(--background-modifier-error-hover);
	}



	.menu-icon {
		margin-right: 8px;
		width: 16px;
		text-align: center;
		font-size: 12px;
	}

	.menu-label {
		flex: 1;
		font-weight: 400;
	}

	.menu-separator {
		height: 1px;
		background: var(--background-modifier-border);
		margin: 4px 8px;
	}
</style>
