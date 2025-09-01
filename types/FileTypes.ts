export enum FileType {
  MARKDOWN = 'markdown',
  IMAGE = 'image',
  PDF = 'pdf',
  VIDEO = 'video',
  AUDIO = 'audio',
  CODE = 'code',
  CANVAS = 'canvas',
  BASE = 'base',
  FOLDER = 'folder',
  GENERIC = 'generic'
}

export interface FileTypeConfig {
  type: FileType;
  extensions: string[];
  icon: string;
  color: string;
}

export const FILE_TYPE_CONFIGS: FileTypeConfig[] = [
  {
    type: FileType.MARKDOWN,
    extensions: ['.md'],
    icon: '📝',
    color: '#4a9eff'
  },
  {
    type: FileType.IMAGE,
    extensions: ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'],
    icon: '🖼️',
    color: '#ff6b6b'
  },
  {
    type: FileType.PDF,
    extensions: ['.pdf'],
    icon: '📄',
    color: '#ff4757'
  },
  {
    type: FileType.VIDEO,
    extensions: ['.mp4', '.mov', '.avi', '.mkv', '.webm'],
    icon: '🎬',
    color: '#ff6348'
  },
  {
    type: FileType.AUDIO,
    extensions: ['.mp3', '.wav', '.ogg', '.flac', '.m4a'],
    icon: '🎵',
    color: '#2ed573'
  },
  {
    type: FileType.CODE,
    extensions: ['.js', '.ts', '.py', '.css', '.html', '.json', '.tsx', '.jsx'],
    icon: '💻',
    color: '#5f27cd'
  },
  {
    type: FileType.CANVAS,
    extensions: ['.canvas'],
    icon: '🎨',
    color: '#ff9ff3'
  },
  {
    type: FileType.FOLDER,
    extensions: [],
    icon: '📁',
    color: '#ffa502'
  },
  {
    type: FileType.GENERIC,
    extensions: [],
    icon: '📃',
    color: '#a4b0be'
  }
];
