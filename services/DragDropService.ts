import { App, TFolder } from 'obsidian';
import { TreeNode } from '../types/TreeNode';
import type GraphicOrganizerPlugin from '../main';

export interface DragState {
	isDragging: boolean;
	draggedNode: TreeNode | null;
	originalPosition: { x: number; y: number } | null;
	validDropTarget: TreeNode | null;
}

export class DragDropService {
	private app: App;
	private plugin: GraphicOrganizerPlugin;
	private dragState: DragState;

	constructor(app: App, plugin: GraphicOrganizerPlugin) {
		this.app = app;
		this.plugin = plugin;
		this.dragState = {
			isDragging: false,
			draggedNode: null,
			originalPosition: null,
			validDropTarget: null
		};
	}

	public startDrag(node: TreeNode, x: number, y: number): void {
		this.dragState = {
			isDragging: true,
			draggedNode: node,
			originalPosition: { x, y },
			validDropTarget: null
		};
	}

	public updateDrag(x: number, y: number, potentialTarget: TreeNode | null): void {
		if (!this.dragState.isDragging || !this.dragState.draggedNode) return;

		// Validate drop target
		this.dragState.validDropTarget = this.isValidDropTarget(
			this.dragState.draggedNode,
			potentialTarget
		) ? potentialTarget : null;
	}

	public endDrag(): { success: boolean; movedNode?: TreeNode; newParent?: TreeNode } {
		if (!this.dragState.isDragging || !this.dragState.draggedNode) {
			this.resetDragState();
			return { success: false };
		}

		const result = {
			success: false,
			movedNode: this.dragState.draggedNode,
			newParent: this.dragState.validDropTarget
		};

		if (this.dragState.validDropTarget) {
			// Perform the move operation
			result.success = this.moveNode(
				this.dragState.draggedNode,
				this.dragState.validDropTarget
			);
		}

		this.resetDragState();
		return result;
	}

	public cancelDrag(): TreeNode | null {
		const draggedNode = this.dragState.draggedNode;
		this.resetDragState();
		return draggedNode;
	}

	public getDragState(): DragState {
		return { ...this.dragState };
	}

	private isValidDropTarget(draggedNode: TreeNode, target: TreeNode | null): boolean {
		if (!target || target.type !== 'folder') return false;
		if (target === draggedNode) return false;
		if (target === draggedNode.parent) return false;

		// Check if target is a descendant of dragged node (would create cycle)
		if (this.isDescendant(target, draggedNode)) return false;

		return true;
	}

	private isDescendant(potential: TreeNode, ancestor: TreeNode): boolean {
		if (!ancestor.children) return false;

		for (const child of ancestor.children) {
			if (child === potential) return true;
			if (this.isDescendant(potential, child)) return true;
		}

		return false;
	}

	private moveNode(node: TreeNode, newParent: TreeNode): boolean {
		try {
			// Use Obsidian's native file operations
			const abstractFile = this.app.vault.getAbstractFileByPath(node.path);
			if (!abstractFile) return false;

			const newPath = this.generateNewPath(node, newParent);
			
			// Perform the actual file/folder move
			this.app.fileManager.renameFile(abstractFile, newPath);
			
			return true;
		} catch (error) {
			console.error('Failed to move file/folder:', error);
			return false;
		}
	}

	private generateNewPath(node: TreeNode, newParent: TreeNode): string {
		const fileName = node.name;
		const newParentPath = newParent.path;
		
		if (newParentPath === '' || newParentPath === '/') {
			return fileName;
		}
		
		return `${newParentPath}/${fileName}`;
	}

	private resetDragState(): void {
		this.dragState = {
			isDragging: false,
			draggedNode: null,
			originalPosition: null,
			validDropTarget: null
		};
	}

	public isValidDropZone(x: number, y: number, nodes: TreeNode[], draggedNode: TreeNode): TreeNode | null {
		console.log(`Checking drop zone at ${x}, ${y} with ${nodes.length} nodes`);
		
		// Find the node at the given coordinates that can accept drops
		for (const node of nodes) {
			console.log(`Checking node ${node.name} (type: ${node.type}) at ${node.x}, ${node.y}`);
			
			if (node.type === 'folder' && node !== draggedNode && this.isPointInNode(x, y, node)) {
				console.log(`Point is in folder ${node.name}, checking if valid drop target`);
				// Additional validation to ensure it's a valid drop target
				if (this.isValidDropTarget(draggedNode, node)) {
					console.log(`${node.name} is a valid drop target!`);
					return node;
				}
			}
		}
		console.log('No valid drop target found');
		return null;
	}

	private isPointInNode(x: number, y: number, node: TreeNode): boolean {
		if (node.x === undefined || node.y === undefined) {
			return false;
		}
		
		// Define node bounds (adjust these based on your actual node dimensions)
		const nodeWidth = 120;
		const nodeHeight = 40;
		
		const isInside = (
			x >= node.x &&
			x <= node.x + nodeWidth &&
			y >= node.y &&
			y <= node.y + nodeHeight
		);
		
		return isInside;
	}
}
