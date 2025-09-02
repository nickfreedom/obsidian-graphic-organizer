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
  color: string;
}

export const FILE_TYPE_CONFIGS: FileTypeConfig[] = [
  {
    type: FileType.MARKDOWN,
    extensions: ['.md'],
    color: '#4a9eff'
  },
  {
    type: FileType.IMAGE,
    extensions: ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'],
    color: '#ff6b6b'
  },
  {
    type: FileType.PDF,
    extensions: ['.pdf'],
    color: '#ff4757'
  },
  {
    type: FileType.VIDEO,
    extensions: ['.mp4', '.mov', '.avi', '.mkv', '.webm'],
    color: '#ff6348'
  },
  {
    type: FileType.AUDIO,
    extensions: ['.mp3', '.wav', '.ogg', '.flac', '.m4a'],
    color: '#2ed573'
  },
  {
    type: FileType.CODE,
    extensions: ['.js', '.ts', '.py', '.css', '.html', '.json', '.tsx', '.jsx'],
    color: '#5f27cd'
  },
  {
    type: FileType.CANVAS,
    extensions: ['.canvas'],
    color: '#ff9ff3'
  },
  {
    type: FileType.FOLDER,
    extensions: [],
    color: '#ffa502'
  },
  {
    type: FileType.GENERIC,
    extensions: [],
    color: '#a4b0be'
  }
];
