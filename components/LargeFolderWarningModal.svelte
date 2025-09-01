<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { TreeNode } from '../types/TreeNode';

	// Props
	export let node: TreeNode;
	export let itemCount: number;
	export let threshold: number;

	const dispatch = createEventDispatcher();

	function handleCancel() {
		dispatch('cancel');
	}

	function handleLoadAnyway() {
		dispatch('loadanyway');
	}
</script>

<div class="modal-backdrop" on:click={handleCancel}>
	<div class="modal-container" on:click|stopPropagation>
		<div class="modal-header">
			<h3>⚠️ Large Folder Warning</h3>
		</div>
		
		<div class="modal-content">
			<p>
				The folder <strong>"{node.name}"</strong> contains <strong>{itemCount} items</strong>, 
				which exceeds the threshold of {threshold} items.
			</p>
			
			<p>
				Loading folders with many items may impact performance. 
				You can adjust this threshold in the plugin settings.
			</p>
			
			<p class="warning-text">
				Do you want to load this folder anyway?
			</p>
		</div>
		
		<div class="modal-footer">
			<button class="modal-button" on:click={handleCancel}>
				Cancel
			</button>
			<button class="modal-button mod-cta" on:click={handleLoadAnyway}>
				Load Anyway
			</button>
		</div>
	</div>
</div>

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10000;
	}

	.modal-container {
		background: var(--background-primary);
		border: 1px solid var(--background-modifier-border);
		border-radius: 8px;
		box-shadow: var(--shadow-l);
		min-width: 400px;
		max-width: 500px;
		max-height: 80vh;
		overflow: hidden;
	}

	.modal-header {
		padding: 16px 20px 12px;
		border-bottom: 1px solid var(--background-modifier-border);
	}

	.modal-header h3 {
		margin: 0;
		color: var(--text-error);
		font-size: 16px;
		font-weight: 600;
	}

	.modal-content {
		padding: 16px 20px;
		color: var(--text-normal);
		line-height: 1.5;
	}

	.modal-content p {
		margin: 0 0 12px 0;
	}

	.modal-content p:last-child {
		margin-bottom: 0;
	}

	.warning-text {
		color: var(--text-warning);
		font-weight: 500;
	}

	.modal-footer {
		padding: 12px 20px 16px;
		border-top: 1px solid var(--background-modifier-border);
		display: flex;
		gap: 8px;
		justify-content: flex-end;
	}

	.modal-button {
		padding: 8px 16px;
		border: 1px solid var(--background-modifier-border);
		border-radius: 4px;
		background: var(--interactive-normal);
		color: var(--text-normal);
		cursor: pointer;
		font-size: 13px;
		transition: background-color 0.1s ease;
	}

	.modal-button:hover {
		background: var(--interactive-hover);
	}

	.modal-button.mod-cta {
		background: var(--interactive-accent);
		color: var(--text-on-accent);
		border-color: var(--interactive-accent);
	}

	.modal-button.mod-cta:hover {
		background: var(--interactive-accent-hover);
	}
</style>
