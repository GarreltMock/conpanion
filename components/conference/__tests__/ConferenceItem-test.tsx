import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ConferenceItem } from '../ConferenceItem';

// Mock the context
jest.mock('../../../context/AppContext', () => ({
  useApp: () => ({
    talks: [
      { id: 'talk1', conferenceId: 'conf1', title: 'Test Talk', startTime: new Date() },
      { id: 'talk2', conferenceId: 'conf2', title: 'Other Talk', startTime: new Date() }
    ]
  }),
  AppProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock the hooks
jest.mock('../../../hooks/useThemeColor', () => ({
  useThemeColor: () => '#3498db',
}));

// Mock Ionicons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('ConferenceItem', () => {
  const mockConference = {
    id: 'conf1',
    name: 'Test Conference',
    startDate: new Date('2023-06-01'),
    endDate: new Date('2023-06-03'),
    location: 'Test Location',
    status: 'active' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProps = {
    conference: mockConference,
    isActive: false,
    onPress: jest.fn(),
    onExport: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
  };

  it('renders correctly', () => {
    const { getByText } = render(<ConferenceItem {...mockProps} />);
    
    expect(getByText('Test Conference')).toBeTruthy();
    expect(getByText('Test Location')).toBeTruthy();
    expect(getByText('1 talks')).toBeTruthy(); // From the mocked context
  });

  it('calls onPress when pressed', () => {
    const { getByText } = render(<ConferenceItem {...mockProps} />);
    
    fireEvent.press(getByText('Test Conference'));
    expect(mockProps.onPress).toHaveBeenCalled();
  });

  it('calls the correct callback when action buttons are pressed', () => {
    const { getByText } = render(<ConferenceItem {...mockProps} />);
    
    fireEvent.press(getByText('Export'));
    expect(mockProps.onExport).toHaveBeenCalled();
    
    fireEvent.press(getByText('Edit'));
    expect(mockProps.onEdit).toHaveBeenCalled();
    
    fireEvent.press(getByText('Delete'));
    expect(mockProps.onDelete).toHaveBeenCalled();
  });

  it('shows active indicator when isActive is true', () => {
    const activeProps = { ...mockProps, isActive: true };
    const { getByText } = render(<ConferenceItem {...activeProps} />);
    
    expect(getByText('active')).toBeTruthy();
  });
});