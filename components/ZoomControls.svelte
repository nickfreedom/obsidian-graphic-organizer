<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	
	export let scale: number = 1;
	
	const dispatch = createEventDispatcher();
	
	function zoomIn() {
		dispatch('zoomin');
	}
	
	function zoomOut() {
		dispatch('zoomout');
	}
	
	function resetZoom() {
		dispatch('zoomreset');
	}
	
	$: zoomPercentage = Math.round(scale * 100);
</script>

<div class="zoom-controls">
	<div class="zoom-display">
		{zoomPercentage}%
	</div>
	
	<button 
		class="zoom-button"
		on:click={zoomIn}
		title="Zoom In"
		aria-label="Zoom In"
	>
		<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
			<path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
		</svg>
	</button>
	
	<button 
		class="zoom-button"
		on:click={zoomOut}
		title="Zoom Out"
		aria-label="Zoom Out"
	>
		<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
			<path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8z"/>
		</svg>
	</button>
	
	<button 
		class="zoom-button"
		on:click={resetZoom}
		title="Reset Zoom"
		aria-label="Reset Zoom to 100%"
	>
		<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
			<path d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8zm15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
		</svg>
	</button>
</div>

<style>
	.zoom-controls {
		position: absolute;
		bottom: 16px;
		right: 16px;
		display: flex;
		flex-direction: column;
		gap: 4px;
		background: var(--background-secondary);
		border: 1px solid var(--background-modifier-border);
		border-radius: 8px;
		padding: 8px;
		box-shadow: var(--shadow-s);
		z-index: 1000;
	}
	
	.zoom-display {
		text-align: center;
		font-size: 11px;
		color: var(--text-muted);
		margin-bottom: 4px;
		min-width: 40px;
	}
	
	.zoom-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background: var(--interactive-normal);
		border: 1px solid var(--background-modifier-border);
		border-radius: 4px;
		color: var(--text-normal);
		cursor: pointer;
		transition: background-color 0.2s ease;
	}
	
	.zoom-button:hover {
		background: var(--interactive-hover);
	}
	
	.zoom-button:active {
		background: var(--interactive-active);
	}
	
	.zoom-button svg {
		pointer-events: none;
	}
</style>
