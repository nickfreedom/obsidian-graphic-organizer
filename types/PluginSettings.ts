export interface PluginSettings {
  largeFolderThreshold: number;
  enableSmoothAnimations: boolean;
  animationDuration: number;
  zoomSensitivity: number;
  minZoom: number;
  maxZoom: number;
  nodeSpacing: {
    horizontal: number;
    vertical: number;
  };
}

export const DEFAULT_SETTINGS: PluginSettings = {
  largeFolderThreshold: 50,
  enableSmoothAnimations: true,
  animationDuration: 300,
  zoomSensitivity: 0.1,
  minZoom: 0.1,
  maxZoom: 5.0,
  nodeSpacing: {
    horizontal: 150,
    vertical: 80
  }
};
