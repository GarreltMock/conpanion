import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TalkHeader } from '../TalkHeader';
import { router } from 'expo-router';
import { Talk } from '../../../types';

// Mock the dependencies
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
}));

jest.mock('@/hooks/useThemeColor', () => ({
  useThemeColor: () => '#0000FF',
}));

describe('TalkHeader Component', () => {
  const mockConferenceName = 'Test Conference';
  const mockTalk: Talk = {
    id: 'talk-id-1',
    conferenceId: 'conf-id-1',
    title: 'Test Talk Title',
    startTime: new Date(2023, 0, 1, 10, 0)
  };
  
  const mockNewTalkFn = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders with active talk correctly', () => {
    const { getByText } = render(
      <TalkHeader
        conferenceName={mockConferenceName}
        talk={mockTalk}
      />
    );
    
    // Check conference name is displayed
    expect(getByText('Test Conference')).toBeTruthy();
    
    // Check talk title is displayed
    expect(getByText('Test Talk Title')).toBeTruthy();
    
    // Check start time is displayed
    expect(getByText('Started 10:00 AM, Jan 1')).toBeTruthy();
    
    // Check new talk button is displayed
    expect(getByText('New Talk')).toBeTruthy();
  });
  
  test('renders without active talk correctly', () => {
    const { getByText, queryByText } = render(
      <TalkHeader
        conferenceName={mockConferenceName}
        talk={null}
      />
    );
    
    // Check conference name is displayed
    expect(getByText('Test Conference')).toBeTruthy();
    
    // Check 'No active talk' message is displayed
    expect(getByText('No active talk')).toBeTruthy();
    
    // Check talk title is not displayed
    expect(queryByText('Test Talk Title')).toBeNull();
  });
  
  test('handles new talk button press with custom handler', () => {
    const { getByText } = render(
      <TalkHeader
        conferenceName={mockConferenceName}
        talk={mockTalk}
        onNewTalk={mockNewTalkFn}
      />
    );
    
    // Find new talk button and press it
    const newTalkButton = getByText('New Talk');
    fireEvent.press(newTalkButton);
    
    // Check custom handler was called
    expect(mockNewTalkFn).toHaveBeenCalled();
    
    // Check router.push was not called
    expect(router.push).not.toHaveBeenCalled();
  });
  
  test('handles new talk button press with default navigation', () => {
    const { getByText } = render(
      <TalkHeader
        conferenceName={mockConferenceName}
        talk={mockTalk}
      />
    );
    
    // Find new talk button and press it
    const newTalkButton = getByText('New Talk');
    fireEvent.press(newTalkButton);
    
    // Check router.push was called with correct path
    expect(router.push).toHaveBeenCalledWith('/modals/new-talk');
  });
});