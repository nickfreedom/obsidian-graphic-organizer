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

