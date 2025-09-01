export interface TreeNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: TreeNode[];
  parent?: TreeNode;
  isExpanded?: boolean;
  isLoaded?: boolean;
  x?: number;
  y?: number;
  fileType?: string;
  size?: number;
  hasWarning?: boolean; // for large folders
}

export interface TreeLayout {
  nodes: Map<string, TreeNode>;
  levels: Map<number, TreeNode[]>;
  maxDepth: number;
}
