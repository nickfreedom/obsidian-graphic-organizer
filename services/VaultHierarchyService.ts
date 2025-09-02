import { App, TAbstractFile, TFile, TFolder } from 'obsidian';
import { TreeNode, TreeLayout } from '../types/TreeNode';
import { FileIconService } from './FileIconService';
import type GraphicOrganizerPlugin from '../main';

export class VaultHierarchyService {
	private app: App;
	private plugin: GraphicOrganizerPlugin;
	private fileIconService: FileIconService;
	private treeLayout: TreeLayout;
	private listeners: Set<(layout: TreeLayout) => void> = new Set();
	private rootNode: TreeNode | null = null;
	private expandedFolders: Set<string> = new Set(); // Track expanded folders

	constructor(app: App, plugin: GraphicOrganizerPlugin) {
		this.app = app;
		this.plugin = plugin;
		this.fileIconService = new FileIconService();
		this.treeLayout = {
			nodes: new Map(),
			levels: new Map(),
			maxDepth: 0
		};

		this.setupVaultListeners();
	}

	private setupVaultListeners() {
		// Listen for file/folder changes
		this.app.vault.on('create', this.onFileCreate.bind(this));
		this.app.vault.on('delete', this.onFileDelete.bind(this));
		this.app.vault.on('rename', this.onFileRename.bind(this));
	}

	private onFileCreate(file: TAbstractFile) {
		this.refreshTree();
	}

	private onFileDelete(file: TAbstractFile) {
		this.refreshTree();
	}

	private onFileRename(file: TAbstractFile, oldPath: string) {
		this.refreshTree();
	}

	public addListener(callback: (layout: TreeLayout) => void) {
		this.listeners.add(callback);
	}

	public removeListener(callback: (layout: TreeLayout) => void) {
		this.listeners.delete(callback);
	}

	private notifyListeners() {
		this.listeners.forEach(callback => callback(this.treeLayout));
	}



	public async buildInitialTree(): Promise<TreeLayout> {
		const rootFolder = this.app.vault.getRoot();
		this.rootNode = this.createNodeFromFolder(rootFolder, null, 0);
		
		this.treeLayout.nodes.clear();
		this.treeLayout.levels.clear();
		this.treeLayout.maxDepth = 0;

		// Recursively build the tree, loading children for all expanded folders
		await this.recursivelyBuildTreeNodes(this.rootNode);
		
		this.calculatePositions();
		
		console.log('Graphic Organizer: Tree built with', this.treeLayout.nodes.size, 'nodes');
		console.log('Root node:', this.rootNode);
		
		this.notifyListeners();
		
		return this.treeLayout;
	}

	public async expandFolder(nodeId: string): Promise<void> {
		const node = this.treeLayout.nodes.get(nodeId);
		if (!node || node.type !== 'folder') return;

		// Add to expanded folders set (source of truth)
		this.expandedFolders.add(node.path);
		
		// Rebuild the entire tree to ensure proper loading of all expanded folders
		await this.rebuildLayout();
	}

	public async collapseFolder(nodeId: string): Promise<void> {
		const node = this.treeLayout.nodes.get(nodeId);
		if (!node || node.type !== 'folder') return;

		// Remove from expanded folders set (source of truth)
		this.expandedFolders.delete(node.path);
		
		// Rebuild the entire tree to ensure proper layout
		await this.rebuildLayout();
	}

	private createNodeFromFile(file: TFile, parent: TreeNode | null, depth: number): TreeNode {
		const fileType = this.fileIconService.getFileType(file.extension);
		
		return {
			id: file.path,
			name: file.name,
			type: 'file',
			path: file.path,
			parent,
			fileType,
			size: file.stat.size
		};
	}

	private createNodeFromFolder(folder: TFolder, parent: TreeNode | null, depth: number): TreeNode {
		const isRoot = folder.path === '' || folder.path === '/';
		const wasExpanded = this.expandedFolders.has(folder.path);
		return {
			id: isRoot ? 'root' : folder.path,
			name: folder.name || 'Vault Root',
			type: 'folder',
			path: folder.path,
			parent,
			children: [],
			isExpanded: depth === 0 || wasExpanded, // Preserve expansion state
			isLoaded: false,
			hasWarning: false
		};
	}

	private async loadFolderChildren(folderNode: TreeNode, checkThreshold: boolean = true): Promise<void> {
		const folder = this.app.vault.getAbstractFileByPath(folderNode.path) as TFolder;
		if (!folder) return;

		const children = folder.children;
		
		// Check if folder exceeds threshold
		if (checkThreshold && children.length > this.plugin.settings.largeFolderThreshold) {
			folderNode.hasWarning = true;
			return;
		}

		folderNode.children = [];
		
		// Sort children: folders first, then files
		const sortedChildren = children.sort((a, b) => {
			if (a instanceof TFolder && b instanceof TFile) return -1;
			if (a instanceof TFile && b instanceof TFolder) return 1;
			return a.name.localeCompare(b.name);
		});

		for (const child of sortedChildren) {
			let childNode: TreeNode;
			
			if (child instanceof TFolder) {
				childNode = this.createNodeFromFolder(child, folderNode, this.getNodeDepth(folderNode) + 1);
			} else {
				childNode = this.createNodeFromFile(child as TFile, folderNode, this.getNodeDepth(folderNode) + 1);
			}

			folderNode.children.push(childNode);
		}
	}

	private getNodeDepth(node: TreeNode): number {
		let depth = 0;
		let current = node.parent;
		while (current) {
			depth++;
			current = current.parent;
		}
		return depth;
	}

	private addNodeToLayout(node: TreeNode): void {
		this.treeLayout.nodes.set(node.id, node);

		// Add children if they exist and folder is expanded
		if (node.children && node.isExpanded) {
			for (const child of node.children) {
				this.addNodeToLayout(child);
			}
		}
	}

	private async recursivelyBuildTreeNodes(node: TreeNode): Promise<void> {
		// Add this node to the layout
		this.treeLayout.nodes.set(node.id, node);

		// If this is a folder and it's marked as expanded, ensure its children are loaded
		if (node.type === 'folder' && node.isExpanded) {
			// Load children if not already loaded
			if (!node.isLoaded) {
				const folder = this.app.vault.getAbstractFileByPath(node.path) as TFolder;
				if (folder) {
					await this.loadFolderChildren(node, true); // Check threshold
					node.isLoaded = true;
				}
			}
			
			// Recursively add all children to the layout
			if (node.children) {
				for (const child of node.children) {
					// The child's isExpanded state is already set correctly by createNodeFromFolder
					// when loadFolderChildren was called.
					await this.recursivelyBuildTreeNodes(child);
				}
			}
		}
	}

	private async rebuildLayout(): Promise<void> {
		// Recreate root node to ensure its expansion state is fresh
		const rootFolder = this.app.vault.getRoot();
		this.rootNode = this.createNodeFromFolder(rootFolder, null, 0);
		
		// Clear the current layout
		this.treeLayout.nodes.clear();
		this.treeLayout.levels.clear();
		this.treeLayout.maxDepth = 0;
		
		// Recursively rebuild the tree, loading children for all expanded folders
		await this.recursivelyBuildTreeNodes(this.rootNode);
		
		this.calculatePositions();
		this.notifyListeners();
	}

	private calculatePositions(): void {
		const rootNode = this.treeLayout.nodes.get('root') || this.treeLayout.nodes.values().next().value;
		if (!rootNode) return;

		// Clear existing levels and reset max depth before recalculating
		this.treeLayout.levels.clear();
		this.treeLayout.maxDepth = 0;

		// Use tree-based positioning instead of level-based
		this.assignTreePositions();
	}

	private assignTreePositions(): void {
		const rootNode = this.treeLayout.nodes.get('root') || this.treeLayout.nodes.values().next().value;
		if (!rootNode) return;

		const spacing = this.plugin.settings.nodeSpacing;
		const nodeWidth = 120;
		const nodeHeight = 40;
		const minNodeSpacing = 10; // Minimum buffer between nodes within same parent
		const subtreeSpacing = 40; // Extra space between different parent subtrees

		// New approach: Center-outward positioning
		this.assignCenterOutwardPositions(rootNode, nodeWidth, nodeHeight + spacing.vertical, minNodeSpacing, subtreeSpacing);
		
		// Debug: Log final positions for Test Folder 2 and Canvas 2.canvas
		this.debugFinalPositions();
	}



	private calculateSimpleSubtreeWidths(node: TreeNode, nodeWidth: number, minSpacing: number): number {
		if (!node.children || !node.isExpanded || node.children.length === 0) {
			// Leaf node or collapsed folder
			node.subtreeWidth = nodeWidth;
			return nodeWidth;
		}

		// Calculate width of all visible children with normal spacing
		let totalChildWidth = 0;
		for (let i = 0; i < node.children.length; i++) {
			const child = node.children[i];
			
			if (i > 0) {
				totalChildWidth += minSpacing; // Normal spacing between children
			}
			totalChildWidth += this.calculateSimpleSubtreeWidths(child, nodeWidth, minSpacing);
		}

		// The subtree width is the maximum of:
		// 1. The width needed for all children
		// 2. The width of the node itself
		node.subtreeWidth = Math.max(totalChildWidth, nodeWidth);
		return node.subtreeWidth;
	}

	private assignHierarchicalPositions(node: TreeNode, centerX: number, y: number, nodeWidth: number, levelHeight: number, minSpacing: number, subtreeSpacing: number): void {
		// Position this node at the center of its allocated space
		node.x = centerX - nodeWidth / 2;
		node.y = y;

		// If this node has expanded children, position them centered under this node
		if (node.children && node.isExpanded && node.children.length > 0) {
			const childY = y + levelHeight;
			
			// Use the node's actual center position (which is node.x + nodeWidth/2)
			const actualParentCenterX = node.x! + nodeWidth / 2;
			
			// Calculate positions for children (returns left edge positions, not centers)
			const childPositions = this.calculateChildPositions(node.children, actualParentCenterX, nodeWidth, minSpacing, subtreeSpacing);
			
			// Position each child and recurse
			for (let i = 0; i < node.children.length; i++) {
				const child = node.children[i];
				const childX = childPositions[i];
				const childCenterX = childX + nodeWidth / 2;
				
				// Recursively position the child and its descendants
				// Pass the center position - the recursive call will calculate x = centerX - nodeWidth/2
				this.assignHierarchicalPositions(child, childCenterX, childY, nodeWidth, levelHeight, minSpacing, subtreeSpacing);
			}
		}
	}

	private calculateChildPositions(children: TreeNode[], parentCenterX: number, nodeWidth: number, minSpacing: number, subtreeSpacing: number): number[] {
		if (children.length === 0) return [];
		
		// Special case: single child should be centered directly under parent
		if (children.length === 1) {
			const childX = parentCenterX - nodeWidth / 2;
			return [childX];
		}

		// Multiple children: calculate spacing and center the group under parent
		let totalWidth = 0;
		for (let i = 0; i < children.length; i++) {
			const child = children[i];
			if (i > 0) {
				totalWidth += minSpacing;
			}
			totalWidth += child.subtreeWidth || nodeWidth;
		}

		// Position children centered under parent
		const positions: number[] = [];
		let currentX = parentCenterX - totalWidth / 2;
		
		for (const child of children) {
			const childSubtreeWidth = child.subtreeWidth || nodeWidth;
			const childCenterX = currentX + childSubtreeWidth / 2;
			const childX = childCenterX - nodeWidth / 2;
			positions.push(childX);
			currentX += childSubtreeWidth + minSpacing;
		}

		return positions;
	}

	private applySmartSpacingAdjustments(rootNode: TreeNode, extraSpacing: number): void {
		// Collect all nodes by level
		const levels: TreeNode[][] = [];
		this.collectNodesByLevel(rootNode, 0, levels);

		// Apply smart spacing adjustments level by level, starting from the deepest level
		// This ensures parent adjustments account for all descendant adjustments
		for (let levelIndex = levels.length - 1; levelIndex >= 0; levelIndex--) {
			const nodesAtLevel = levels[levelIndex];
			
			// Always adjust parent centering for levels with children, even if spacing isn't adjusted
			if (levelIndex > 0) {
				this.adjustParentCentering(levels[levelIndex - 1]);
			}
			
			if (nodesAtLevel.length <= 1) {
				continue;
			}

			this.adjustSpacingForLevel(nodesAtLevel, extraSpacing);
		}
	}

	private collectNodesByLevel(node: TreeNode, level: number, levels: TreeNode[][]): void {
		if (!levels[level]) {
			levels[level] = [];
		}
		levels[level].push(node);

		if (node.children && node.isExpanded) {
			for (const child of node.children) {
				this.collectNodesByLevel(child, level + 1, levels);
			}
		}
	}

	private adjustSpacingForLevel(nodes: TreeNode[], extraSpacing: number): void {
		// Calculate how much extra space to add between nodes from different parents
		let totalAdjustment = 0;
		const adjustments: number[] = [];

		for (let i = 0; i < nodes.length; i++) {
			if (i === 0) {
				adjustments.push(0);
			} else {
				const currentNode = nodes[i];
				const previousNode = nodes[i - 1];
				
				// Add extra spacing if nodes have different parents
				if (currentNode.parent !== previousNode.parent) {
					adjustments.push(extraSpacing);
					totalAdjustment += extraSpacing;
				} else {
					adjustments.push(0);
				}
			}
		}

		// Apply adjustments by shifting nodes to the right
		let cumulativeAdjustment = 0;
		for (let i = 0; i < nodes.length; i++) {
			cumulativeAdjustment += adjustments[i];
			if (cumulativeAdjustment > 0) {
				const adjustment = cumulativeAdjustment;
				nodes[i].x! += adjustment;
				
				// Recursively adjust all descendants of this node
				this.adjustDescendantsPosition(nodes[i], adjustment);
			}
		}
	}
	
	private adjustDescendantsPosition(node: TreeNode, adjustment: number): void {
		if (!node.children || !node.isExpanded) return;
		
		for (const child of node.children) {
			// Only adjust if the child is currently visible in the layout
			if (child.x !== undefined) {
				child.x += adjustment;
				// Recursively adjust the child's descendants
				this.adjustDescendantsPosition(child, adjustment);
			}
		}
	}

	private adjustParentCentering(parents: TreeNode[]): void {
		// For each parent, recalculate its position to center it above its children
		for (const parent of parents) {
			if (!parent.children || !parent.isExpanded || parent.children.length === 0) {
				continue;
			}

			// Calculate the center point of all children based on their actual center positions
			const nodeWidth = 120;
			const childCenters = parent.children
				.filter(child => child.x !== undefined)
				.map(child => child.x! + nodeWidth / 2); // Get the center of each child node

			if (childCenters.length === 0) {
				continue;
			}

			// Calculate the leftmost and rightmost edges of the children group
			const leftmostCenter = Math.min(...childCenters);
			const rightmostCenter = Math.max(...childCenters);
			
			// The center of the children group is the midpoint between the leftmost and rightmost child centers
			const childrenGroupCenter = (leftmostCenter + rightmostCenter) / 2;
			
			// Position parent so its center aligns with the children group center
			const newParentX = childrenGroupCenter - nodeWidth / 2;
			
			// Only update if there's a meaningful change (avoid floating point precision issues)
			if (Math.abs((parent.x || 0) - newParentX) > 0.1) {
				parent.x = newParentX;
			}
		}
	}

	private assignCenterOutwardPositions(rootNode: TreeNode, nodeWidth: number, levelHeight: number, minSpacing: number, subtreeSpacing: number): void {
		// Step 1: Calculate subtree widths with smart spacing
		this.calculateSmartSubtreeWidths(rootNode, nodeWidth, minSpacing, subtreeSpacing);
		
		// Step 2: Position root at center (0, 0)
		const rootCenterX = 0;
		const rootY = 0;
		
		// Step 3: Recursively position all nodes with center-outward approach
		this.positionNodeCenterOutward(rootNode, rootCenterX, rootY, nodeWidth, levelHeight);
	}
	
	private calculateSmartSubtreeWidths(node: TreeNode, nodeWidth: number, minSpacing: number, subtreeSpacing: number): number {
		if (!node.children || !node.isExpanded || node.children.length === 0) {
			node.subtreeWidth = nodeWidth;
			return nodeWidth;
		}

		// Calculate total width of all child subtrees with smart spacing
		let totalChildWidth = 0;
		
		for (let i = 0; i < node.children.length; i++) {
			const child = node.children[i];
			const childWidth = this.calculateSmartSubtreeWidths(child, nodeWidth, minSpacing, subtreeSpacing);
			
			if (i > 0) {
				const currentChild = node.children[i];
				const previousChild = node.children[i - 1];
				
				// Add smart spacing between children from different parent lineages
				if (this.hasChildrenFromDifferentParents(currentChild, previousChild)) {
					totalChildWidth += subtreeSpacing;
				} else {
					totalChildWidth += minSpacing;
				}
			}
			
			totalChildWidth += childWidth;
		}

		// The subtree width is the maximum of:
		// 1. The total width of children
		// 2. The width of the node itself
		node.subtreeWidth = Math.max(totalChildWidth, nodeWidth);
		return node.subtreeWidth;
	}
	
	private positionNodeCenterOutward(node: TreeNode, centerX: number, y: number, nodeWidth: number, levelHeight: number): void {
		// Position this node centered at the given coordinates
		node.x = centerX - nodeWidth / 2;
		node.y = y;

		// If this node has expanded children, position them centered under this node
		if (node.children && node.isExpanded && node.children.length > 0) {
			const childY = y + levelHeight;
			
			console.log(`Positioning children of ${node.name}: ${node.children.map(c => c.name).join(', ')}`);
			
			// Calculate spacing with smart spacing between different parent groups
			const minSpacing = 10;
			const subtreeSpacing = 40;
			const childWidths = node.children.map(child => child.subtreeWidth || nodeWidth);
			
			// Calculate total width including smart spacing
			let totalWidth = childWidths.reduce((sum, width) => sum + width, 0);
			for (let i = 1; i < node.children.length; i++) {
				const currentChild = node.children[i];
				const previousChild = node.children[i - 1];
				
				// Add extra spacing between children from different parent lineages
				if (this.hasChildrenFromDifferentParents(currentChild, previousChild)) {
					console.log(`Adding extra spacing between ${previousChild.name} and ${currentChild.name} (different parents: ${previousChild.parent?.name} vs ${currentChild.parent?.name})`);
					totalWidth += subtreeSpacing;
				} else {
					totalWidth += minSpacing;
				}
			}
			
			// Position children centered under parent
			let currentX = centerX - totalWidth / 2;
			
			for (let i = 0; i < node.children.length; i++) {
				const child = node.children[i];
				const childWidth = childWidths[i];
				const childCenterX = currentX + childWidth / 2;
				
				// Recursively position the child and its descendants
				this.positionNodeCenterOutward(child, childCenterX, childY, nodeWidth, levelHeight);
				
				currentX += childWidth;
				
				// Add spacing for next iteration
				if (i < node.children.length - 1) {
					const nextChild = node.children[i + 1];
					if (this.hasChildrenFromDifferentParents(nextChild, child)) {
						currentX += subtreeSpacing;
					} else {
						currentX += minSpacing;
					}
				}
			}
		}
	}
	
	private hasChildrenFromDifferentParents(child1: TreeNode, child2: TreeNode): boolean {
		// Only apply extra spacing if these nodes are at level 1 (children of root) 
		// and both have expanded children (creating visual separation between folder hierarchies)
		const isLevel1 = child1.parent?.name === 'Vault Root' && child2.parent?.name === 'Vault Root';
		
		if (!isLevel1) {
			// For nodes not at level 1, use normal tight spacing
			return false;
		}
		
		// Apply extra spacing only when BOTH level 1 folders have expanded children
		// This creates separation between different folder hierarchies that are both active
		const child1HasExpandedChildren = child1.children && child1.isExpanded && child1.children.length > 0;
		const child2HasExpandedChildren = child2.children && child2.isExpanded && child2.children.length > 0;
		
		return child1HasExpandedChildren && child2HasExpandedChildren;
	}

	private debugFinalPositions(): void {
		const testFolder2 = this.findNodeByName('Test Folder 2');
		const canvas2 = this.findNodeByName('Canvas 2.canvas');
		
		if (testFolder2) {
			console.log(`FINAL: Test Folder 2 at x=${testFolder2.x}, y=${testFolder2.y}`);
		}
		if (canvas2) {
			console.log(`FINAL: Canvas 2.canvas at x=${canvas2.x}, y=${canvas2.y}`);
		}
	}
	
	private findNodeByName(name: string): TreeNode | null {
		for (const node of this.treeLayout.nodes.values()) {
			if (node.name === name) {
				return node;
			}
		}
		return null;
	}

	public refreshTree(): void {
		this.buildInitialTree().then(() => {
			this.notifyListeners();
		});
	}

	public async ensureFolderExpanded(folderPath: string): Promise<void> {
		// Ensure a specific folder is expanded after a drag/drop operation
		this.expandedFolders.add(folderPath);
		
		// Rebuild the tree to ensure the target folder is expanded and its children are loaded
		await this.buildInitialTree();
	}

	public getLayout(): TreeLayout {
		return this.treeLayout;
	}



	public destroy(): void {
		// Clean up listeners
		this.app.vault.off('create', this.onFileCreate.bind(this));
		this.app.vault.off('delete', this.onFileDelete.bind(this));
		this.app.vault.off('rename', this.onFileRename.bind(this));
		this.listeners.clear();
	}
}


