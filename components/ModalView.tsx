import React from 'react';
import { Platform, StatusBar } from 'react-native';
import { ThemedView, type ThemedViewProps } from './ThemedView';

export type ModalViewProps = ThemedViewProps;

/**
 * A themed view component specifically designed for modals.
 * Automatically handles status bar padding on Android to prevent overlap
 * with transparent status bars.
 */
export function ModalView({ style, ...otherProps }: ModalViewProps) {
  // Get status bar height for Android to avoid overlap
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
  
  return (
    <ThemedView 
      style={[{ paddingTop: statusBarHeight }, style]} 
      {...otherProps} 
    />
  );
}