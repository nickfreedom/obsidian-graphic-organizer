import { FileType } from '../types/FileTypes';

export interface AccessibleColor {
  background: string;
  text: string;
  contrastRatio: number;
}

export class AccessibleColorService {
  // Dark theme colors (backgrounds that work well with white text)
  private static darkThemeColors: Map<FileType, string> = new Map([
    [FileType.MARKDOWN, '#1e40af'], // Dark blue
    [FileType.IMAGE, '#dc2626'],    // Dark red
    [FileType.PDF, '#b91c1c'],      // Darker red
    [FileType.VIDEO, '#7c2d12'],    // Dark orange-red
    [FileType.AUDIO, '#166534'],    // Dark green
    [FileType.CODE, '#581c87'],     // Dark purple
    [FileType.CANVAS, '#be185d'],   // Dark pink
    [FileType.FOLDER, '#d97706'],   // Dark amber
    [FileType.GENERIC, '#6b7280'],  // Neutral gray
    [FileType.BASE, '#0f766e']      // Dark teal
  ]);

  // Light theme colors (backgrounds that work well with black text)
  private static lightThemeColors: Map<FileType, string> = new Map([
    [FileType.MARKDOWN, '#93c5fd'], // Light blue
    [FileType.IMAGE, '#fca5a5'],    // Light red
    [FileType.PDF, '#fbb6ce'],      // Light pink
    [FileType.VIDEO, '#fed7aa'],    // Light orange
    [FileType.AUDIO, '#86efac'],    // Light green
    [FileType.CODE, '#c4b5fd'],     // Light purple
    [FileType.CANVAS, '#f9a8d4'],   // Light pink
    [FileType.FOLDER, '#fde047'],   // Light yellow
    [FileType.GENERIC, '#d1d5db'],  // Light gray
    [FileType.BASE, '#5eead4']      // Light teal
  ]);

  // Legacy accessible colors for backward compatibility
  private static accessibleColors: Map<FileType, AccessibleColor> = new Map();

  /**
   * Get accessible colors for a file type
   */
  static getAccessibleColor(fileType: FileType): AccessibleColor {
    return this.accessibleColors.get(fileType) || this.accessibleColors.get(FileType.GENERIC)!;
  }

  /**
   * Calculate relative luminance of a color (for contrast calculations)
   */
  private static getRelativeLuminance(hexColor: string): number {
    // Remove # if present
    const hex = hexColor.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    // Apply gamma correction
    const rLinear = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    const gLinear = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    const bLinear = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

    // Calculate relative luminance
    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
  }

  /**
   * Calculate contrast ratio between two colors
   */
  static getContrastRatio(color1: string, color2: string): number {
    const lum1 = this.getRelativeLuminance(color1);
    const lum2 = this.getRelativeLuminance(color2);
    
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Determine if white or black text provides better contrast
   */
  static getBestTextColor(backgroundColor: string): string {
    const whiteContrast = this.getContrastRatio(backgroundColor, '#ffffff');
    const blackContrast = this.getContrastRatio(backgroundColor, '#000000');
    
    return whiteContrast > blackContrast ? '#ffffff' : '#000000';
  }

  /**
   * Get theme-aware accessible colors that adapt to Obsidian's theme
   */
  static getThemeAwareColors(fileType: FileType): AccessibleColor {
    // Check if we're in dark mode
    const isDarkMode = document.body.classList.contains('theme-dark');
    
    if (isDarkMode) {
      // Dark theme: dark backgrounds with white text
      const backgroundColor = this.darkThemeColors.get(fileType) || this.darkThemeColors.get(FileType.GENERIC)!;
      return {
        background: backgroundColor,
        text: '#ffffff',
        contrastRatio: this.getContrastRatio(backgroundColor, '#ffffff')
      };
    } else {
      // Light theme: light backgrounds with black text
      const backgroundColor = this.lightThemeColors.get(fileType) || this.lightThemeColors.get(FileType.GENERIC)!;
      return {
        background: backgroundColor,
        text: '#000000',
        contrastRatio: this.getContrastRatio(backgroundColor, '#000000')
      };
    }
  }

  /**
   * Lighten a hex color by a percentage
   */
  private static lightenColor(hexColor: string, percent: number): string {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    const newR = Math.min(255, Math.floor(r + (255 - r) * percent));
    const newG = Math.min(255, Math.floor(g + (255 - g) * percent));
    const newB = Math.min(255, Math.floor(b + (255 - b) * percent));

    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }
}
