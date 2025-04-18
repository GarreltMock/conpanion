import React from 'react';
import { render, fireEvent, act, waitFor, screen } from '@testing-library/react-native';
import { View, Text, Pressable } from 'react-native';
import { AppProvider, useApp } from '../../context/AppContext';

// Mock the dependencies
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
  },
}));

jest.mock('../../storage', () => ({
  getTalks: jest.fn().mockResolvedValue([]),
  getNotes: jest.fn().mockResolvedValue([]),
  saveTalk: jest.fn().mockResolvedValue(undefined),
  saveNote: jest.fn().mockResolvedValue(undefined),
  deleteNote: jest.fn().mockResolvedValue(undefined),
  initializeDefaultConference: jest.fn().mockResolvedValue({
    id: 'test-conf-id',
    name: 'Test Conference',
    startDate: new Date(),
    endDate: new Date(),
  }),
  saveImage: jest.fn().mockResolvedValue('file:///test/image.jpg'),
  saveAudio: jest.fn().mockResolvedValue('file:///test/audio.m4a'),
  initializeFileSystem: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('nanoid', () => ({
  nanoid: () => 'test-id-123',
}));

jest.mock('@/hooks/useThemeColor', () => ({
  useThemeColor: () => '#000000',
}));

jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn((title, message, buttons) => {
    // Simulate clicking a button programmatically in tests
  }),
}));

// Create a simplified test component that simulates the main notes screen
const NoteTakingScreen: React.FC = () => {
  const { 
    currentConference, 
    activeTalk, 
    notes, 
    createTalk, 
    addTextNote, 
    deleteNote
  } = useApp();
  
  // Function to handle creating a new talk
  const handleNewTalk = () => {
    createTalk('New Test Talk');
  };
  
  // Function to add a text note
  const handleAddNote = () => {
    addTextNote('This is a test note');
  };
  
  // Function to delete a note
  const handleDeleteNote = (noteId: string) => {
    deleteNote(noteId);
  };
  
  return (
    <View>
      <Text>Conference: {currentConference?.name || 'None'}</Text>
      <Text>Active Talk: {activeTalk?.title || 'No active talk'}</Text>
      
      <Pressable onPress={handleNewTalk} testID="new-talk-button">
        <Text>Create New Talk</Text>
      </Pressable>
      
      {activeTalk && (
        <>
          <Pressable onPress={handleAddNote} testID="add-note-button">
            <Text>Add Note</Text>
          </Pressable>
          
          {notes.map(note => (
            <View key={note.id}>
              <Text>{note.textContent}</Text>
              <Pressable 
                onPress={() => handleDeleteNote(note.id)}
                testID={`delete-note-${note.id}`}
              >
                <Text>Delete</Text>
              </Pressable>
            </View>
          ))}
        </>
      )}
    </View>
  );
};

describe('Note Taking Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('full note-taking flow: create talk and add note', async () => {
    const { getByText, getByTestId, queryByText } = render(
      <AppProvider>
        <NoteTakingScreen />
      </AppProvider>
    );
    
    // Wait for the app to initialize
    await waitFor(() => {
      expect(getByText('Conference: Test Conference')).toBeTruthy();
      expect(getByText('Active Talk: No active talk')).toBeTruthy();
    });
    
    // Create a new talk
    await act(async () => {
      fireEvent.press(getByTestId('new-talk-button'));
    });
    
    // Verify the new talk was created
    await waitFor(() => {
      expect(getByText('Active Talk: New Test Talk')).toBeTruthy();
    });
    
    // Add a text note
    await act(async () => {
      fireEvent.press(getByTestId('add-note-button'));
    });
    
    // Verify the note was added
    await waitFor(() => {
      expect(getByText('This is a test note')).toBeTruthy();
    });
    
    // Delete the note
    await act(async () => {
      fireEvent.press(getByTestId('delete-note-test-id-123'));
    });
    
    // Verify the note was deleted
    await waitFor(() => {
      expect(queryByText('This is a test note')).toBeNull();
    });
  });
});