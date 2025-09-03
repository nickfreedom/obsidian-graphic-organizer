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
}

export const FILE_TYPE_CONFIGS: FileTypeConfig[] = [
  {
    type: FileType.MARKDOWN,
    extensions: ['.md']
  },
  {
    type: FileType.IMAGE,
    extensions: ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']
  },
  {
    type: FileType.PDF,
    extensions: ['.pdf']
  },
  {
    type: FileType.VIDEO,
    extensions: ['.mp4', '.mov', '.avi', '.mkv', '.webm']
  },
  {
    type: FileType.AUDIO,
    extensions: ['.mp3', '.wav', '.ogg', '.flac', '.m4a']
  },
  {
    type: FileType.CODE,
    extensions: ['.js', '.ts', '.py', '.css', '.html', '.json', '.tsx', '.jsx']
  },
  {
    type: FileType.CANVAS,
    extensions: ['.canvas']
  },
  {
    type: FileType.FOLDER,
    extensions: []
  },
  {
    type: FileType.GENERIC,
    extensions: []
  }
];
