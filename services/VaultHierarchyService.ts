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
		const rootNode = this.createNodeFromFolder(rootFolder, null, 0);
		
		// Only load immediate children initially (lazy loading)
		await this.loadFolderChildren(rootNode, false);
		
		this.treeLayout.nodes.clear();
		this.treeLayout.levels.clear();
		this.treeLayout.maxDepth = 0;

		this.addNodeToLayout(rootNode);
		this.calculatePositions();
		
		console.log('Graphic Organizer: Tree built with', this.treeLayout.nodes.size, 'nodes');
		console.log('Root node:', rootNode);
		
		this.notifyListeners();
		
		return this.treeLayout;
	}

	public async expandFolder(nodeId: string): Promise<void> {
		const node = this.treeLayout.nodes.get(nodeId);
		if (!node || node.type !== 'folder') return;

		if (!node.isLoaded) {
			const folder = this.app.vault.getAbstractFileByPath(node.path) as TFolder;
			if (folder) {
				await this.loadFolderChildren(node, true);
				node.isLoaded = true;
			}
		}

		node.isExpanded = true;
		this.calculatePositions();
		this.notifyListeners();
	}

	public collapseFolder(nodeId: string): void {
		const node = this.treeLayout.nodes.get(nodeId);
		if (!node || node.type !== 'folder') return;

		node.isExpanded = false;
		this.calculatePositions();
		this.notifyListeners();
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
		return {
			id: isRoot ? 'root' : folder.path,
			name: folder.name || 'Vault Root',
			type: 'folder',
			path: folder.path,
			parent,
			children: [],
			isExpanded: depth === 0, // Root folder starts expanded
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

	private calculatePositions(): void {
		const rootNode = this.treeLayout.nodes.get('root') || this.treeLayout.nodes.values().next().value;
		if (!rootNode) return;

		// First pass: calculate tree dimensions and organize by levels
		this.organizeNodesByLevels(rootNode, 0);
		
		// Second pass: assign positions using top-down hierarchy layout
		this.assignHierarchicalPositions();
	}

	private organizeNodesByLevels(node: TreeNode, depth: number): void {
		// Ensure the level exists in our map
		if (!this.treeLayout.levels.has(depth)) {
			this.treeLayout.levels.set(depth, []);
		}
		
		// Add node to its level (if not already there)
		const level = this.treeLayout.levels.get(depth)!;
		if (!level.includes(node)) {
			level.push(node);
		}
		
		// Update max depth
		this.treeLayout.maxDepth = Math.max(this.treeLayout.maxDepth, depth);
		
		// Process children if expanded
		if (node.children && node.isExpanded) {
			for (const child of node.children) {
				this.organizeNodesByLevels(child, depth + 1);
			}
		}
	}

	private assignHierarchicalPositions(): void {
		const spacing = this.plugin.settings.nodeSpacing;
		const nodeWidth = 120; // Approximate node width
		const nodeHeight = 40; // Approximate node height
		
		// Process each level
		for (let depth = 0; depth <= this.treeLayout.maxDepth; depth++) {
			const nodesAtLevel = this.treeLayout.levels.get(depth) || [];
			const levelY = depth * (nodeHeight + spacing.vertical);
			
			if (nodesAtLevel.length === 0) continue;
			
			// Calculate total width needed for this level
			const totalWidth = nodesAtLevel.length * nodeWidth + (nodesAtLevel.length - 1) * spacing.horizontal;
			
			// Center the level horizontally
			let startX = -totalWidth / 2;
			
			// Position each node in this level
			for (let i = 0; i < nodesAtLevel.length; i++) {
				const node = nodesAtLevel[i];
				node.x = startX + i * (nodeWidth + spacing.horizontal);
				node.y = levelY;
			}
		}
	}

	public refreshTree(): void {
		this.buildInitialTree().then(() => {
			this.notifyListeners();
		});
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
