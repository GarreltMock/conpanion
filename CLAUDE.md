# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Conpanion is a React Native conference companion app built with Expo Router. The app allows users to manage conferences, take notes during talks, capture images, record audio, and export their notes in various formats. It features advanced image processing with OpenCV and ONNX models for document scanning and QR code detection.

## Key Architecture Components

- **Expo Router**: File-based routing system with tab navigation and modal screens
- **AppContext**: Centralized state management for conferences, talks, and notes
- **Storage Layer**: File-based persistence for conferences, talks, notes, images, and audio
- **Native Modules**: Custom iOS/Android modules for OpenCV image processing and ONNX model inference
- **Theming**: Light/dark mode support with custom color scheme

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Run on platforms
npx expo run:ios --device 00008110-000414A03ED0201E  # Specific device
npx expo run:android

# Testing
npm test                    # Run Jest tests
npm run lint               # Run ESLint

# Other commands
npm run postinstall        # Apply patches with patch-package
```

## Required Assets Setup

### OpenCV Frameworks
- iOS: Download opencv-4.11.0-ios-framework.zip and extract to `ios/opencv2.framework/`
- Android: Download opencv-4.11.0-android-sdk.zip and extract to `android/opencv/`

## Code Organization

### App Structure
- `app/` - Expo Router screens and modals
  - `(tabs)/` - Main tab screens (index, conferences, talks)
  - `modals/` - Modal screens for creating/editing content
  - `talk.tsx`, `conference.tsx` - Detail screens
  - `image-edit.tsx` - Image editing interface

### Core Modules
- `context/AppContext.tsx` - Central state management and business logic
- `types/index.ts` - TypeScript definitions for all data models
- `storage/` - File system operations and data persistence
- `hooks/` - Custom React hooks including image processing utilities
- `components/` - Reusable UI components organized by feature
- `constants/Colors.ts` - Theme colors for light/dark modes

### Data Models
- **Conference**: Event with dates, location, talks
- **Talk**: Individual sessions with speakers, duration, user selection
- **Note**: Text, images, and audio recordings tied to specific talks
- **NoteImage**: Images with optional transformation data and QR code links

## Development Guidelines

### Screen Layout
- If you create or edit a screen and need to add SafeAreaInsets use the installed library `react-native-safe-area-context`

### Expo Development Warnings
- Never run "expo prebuild --clean" - it removes custom native modules

### Color Scheme Guidelines
- Always check if colors exist in `useColorScheme` hook before using custom colors
- Use theme colors from `constants/Colors.ts` for consistency

### State Management
- Use `AppContext` for all data operations - don't access storage directly from components
- The context handles automatic talk activation based on conference schedule
- All file operations (images/audio) are managed through the context

### Image Processing
- Images go through OpenCV processing for document scanning
- ONNX models provide corner detection for document transformation
- QR codes are automatically detected and extracted as links
- All images are stored in conference-specific directories

### Testing
- Jest configuration in `jest.config.js`
- Component tests use `@testing-library/react-native`
- Storage operations have dedicated test suites

### Use i18n
- If you add any visible text use the implemented i18n features and add it to all languages.