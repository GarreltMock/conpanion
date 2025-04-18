// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/tabs',
  useLocalSearchParams: () => ({}),
}));

// Mock the useThemeColor hook
jest.mock('./hooks/useThemeColor', () => ({
  useThemeColor: () => '#000000',
}));

// Mock KeyboardAvoidingView to prevent test failures
jest.mock('react-native/Libraries/Components/Keyboard/KeyboardAvoidingView', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: View,
  };
});