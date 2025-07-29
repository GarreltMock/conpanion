/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#60BDDE'; // Lighter blue for dark mode for better visibility

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    error: '#FF3B30',
    success: '#34C759',
    warning: '#FF9500',
    white: '#FFFFFF',
    border: 'rgba(150, 150, 150, 0.3)',
    borderLight: 'rgba(150, 150, 150, 0.2)',
    backgroundOverlay: 'rgba(150, 150, 150, 0.1)',
    backgroundOverlayLight: 'rgba(150, 150, 150, 0.05)',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#D0D3D6', // Brighter for better contrast
    tabIconDefault: '#D0D3D6', // Brighter for better contrast
    tabIconSelected: tintColorDark,
    error: '#FF453A',
    success: '#32D74B',
    warning: '#FF9F0A',
    white: '#FFFFFF',
    border: 'rgba(150, 150, 150, 0.4)',
    borderLight: 'rgba(150, 150, 150, 0.3)',
    backgroundOverlay: 'rgba(150, 150, 150, 0.15)',
    backgroundOverlayLight: 'rgba(150, 150, 150, 0.08)',
  },
};
