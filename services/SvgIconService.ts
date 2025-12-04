import { FileType } from '../types/FileTypes';

export interface SvgIconData {
  path: string;
  viewBox: string;
  scale?: number;
}

export class SvgIconService {
  private static icons: Map<FileType, SvgIconData> = new Map([
    [FileType.MARKDOWN, {
      path: 'M2 3h20a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm2 2v14h16V5H4zm2 2h2v2H6V7zm0 3h2v2H6v-2zm0 3h2v2H6v-2zm4-6h8v1H10V7zm0 3h8v1H10v-1zm0 3h8v1H10v-1z',
      viewBox: '0 0 24 24'
    }],
    [FileType.IMAGE, {
      path: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v12h16V6H4zm2 2l4 4 2-2 6 6H6V8z',
      viewBox: '0 0 24 24'
    }],
    [FileType.PDF, {
      path: 'M12 2l3 3h5a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h8zm-1 2H5v16h14V6h-4V4H11z M7 12h2v2H7v-2zm0 3h2v2H7v-2zm3-3h4v1h-4v-1zm0 2h4v1h-4v-1zm0 2h2v1h-2v-1z',
      viewBox: '0 0 24 24'
    }],
    [FileType.VIDEO, {
      path: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v12h16V6H4zm6 2l6 4-6 4V8z',
      viewBox: '0 0 24 24'
    }],
    [FileType.AUDIO, {
      path: 'M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm0 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm-2 4h1.5v2.793l2.854-2.854 1.061 1.061L12.56 12l2.855 2.854-1.061 1.061L11.5 13.061V16H10V8z',
      viewBox: '0 0 24 24'
    }],
    [FileType.CODE, {
      path: 'M8.5 6l-6 6 6 6 1.5-1.5L5.5 12l4.5-4.5L8.5 6zm7 0L14 7.5l4.5 4.5-4.5 4.5L15.5 18l6-6-6-6z',
      viewBox: '0 0 24 24'
    }],
    [FileType.CANVAS, {
      path: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v12h16V6H4zm2 2h2v2H6V8zm4 0h2v2h-2V8zm4 0h2v2h-2V8zm-8 4h2v2H6v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zm-8 4h2v2H6v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z',
      viewBox: '0 0 24 24'
    }],
    [FileType.FOLDER, {
      path: 'M3 5a2 2 0 0 1 2-2h3.93a2 2 0 0 1 1.664.89L12.07 6H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5z',
      viewBox: '0 0 24 24'
    }],
    [FileType.GENERIC, {
      path: 'M12 2l3 3h5a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h8zm-1 2H5v16h14V6h-4V4H11z',
      viewBox: '0 0 24 24'
    }],
    [FileType.BASE, {
      path: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v3h16V6H4zm0 5v7h16v-7H4zm2 1h2v1H6v-1zm4 0h2v1h-2v-1zm-4 2h2v1H6v-1zm4 0h2v1h-2v-1zm-4 2h2v1H6v-1zm4 0h2v1h-2v-1z',
      viewBox: '0 0 24 24'
    }]
  ]);

	static getIconData(fileType: FileType): SvgIconData {
		return this.icons.get(fileType) ?? this.icons.get(FileType.GENERIC) ?? {
			path: 'M12 2l3 3h5a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h8zm-1 2H5v16h14V6h-4V4H11z',
			viewBox: '0 0 24 24'
		};
	}  static getFolderIconData(isOpen: boolean): SvgIconData {
    if (isOpen) {
      return {
        path: 'M3 5a2 2 0 0 1 2-2h3.93a2 2 0 0 1 1.664.89L12.07 6H19a2 2 0 0 1 2 2v1H3V5zm0 4v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9H3z',
        viewBox: '0 0 24 24'
      };
    } else {
      return this.getIconData(FileType.FOLDER);
    }
  }

  static getWarningIconData(): SvgIconData {
    return {
      path: 'M12 2L1 21h22L12 2zm0 3.5L19.5 19h-15L12 5.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z',
      viewBox: '0 0 24 24'
    };
  }
}
