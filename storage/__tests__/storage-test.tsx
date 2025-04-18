import AsyncStorage from '@react-native-async-storage/async-storage';
// Mock FileSystem is imported but not directly used in tests
import {
  getConferences,
  saveConference,
  getTalks,
  saveTalk,
  getNotes,
  saveNote,
  initializeDefaultConference,
} from '../index';
import { Conference, Talk, Note } from '../../types';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// Mock FileSystem
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///test/',
  getInfoAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  copyAsync: jest.fn(),
}));

describe('Storage Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Conference Storage', () => {
    test('getConferences should return an empty array when no data exists', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null);
      
      const result = await getConferences();
      
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('conpanion_conferences');
      expect(result).toEqual([]);
    });
    
    test('getConferences should parse JSON and convert dates', async () => {
      const mockConferences = [
        { 
          id: '1', 
          name: 'Test Conference', 
          startDate: '2023-01-01T00:00:00.000Z', 
          endDate: '2023-01-03T00:00:00.000Z' 
        }
      ];
      
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(mockConferences));
      
      const result = await getConferences();
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
      expect(result[0].name).toBe('Test Conference');
      expect(result[0].startDate).toBeInstanceOf(Date);
      expect(result[0].endDate).toBeInstanceOf(Date);
    });
    
    test('saveConference should update an existing conference', async () => {
      const existingConferences = [
        { id: '1', name: 'Old Name', startDate: new Date(), endDate: new Date() }
      ];
      
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(existingConferences));
      
      const updatedConference: Conference = {
        id: '1',
        name: 'Updated Name',
        startDate: new Date(),
        endDate: new Date()
      };
      
      await saveConference(updatedConference);
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'conpanion_conferences',
        expect.any(String)
      );
      
      // Extract the argument and parse it to verify the update
      const setItemArg = JSON.parse(AsyncStorage.setItem.mock.calls[0][1]);
      expect(setItemArg).toHaveLength(1);
      expect(setItemArg[0].id).toBe('1');
      expect(setItemArg[0].name).toBe('Updated Name');
    });
    
    test('saveConference should add a new conference if it doesn\'t exist', async () => {
      const existingConferences: Conference[] = [];
      
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(existingConferences));
      
      const newConference: Conference = {
        id: '2',
        name: 'New Conference',
        startDate: new Date(),
        endDate: new Date()
      };
      
      await saveConference(newConference);
      
      // Extract the argument and parse it to verify the addition
      const setItemArg = JSON.parse(AsyncStorage.setItem.mock.calls[0][1]);
      expect(setItemArg).toHaveLength(1);
      expect(setItemArg[0].id).toBe('2');
      expect(setItemArg[0].name).toBe('New Conference');
    });
  });

  describe('Talk Storage', () => {
    test('getTalks should return an empty array when no data exists', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null);
      
      const result = await getTalks();
      
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('conpanion_talks');
      expect(result).toEqual([]);
    });
    
    test('saveTalk should update an existing talk', async () => {
      const existingTalks = [
        { 
          id: '1', 
          conferenceId: 'conf1', 
          title: 'Old Title', 
          startTime: new Date(), 
        }
      ];
      
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(existingTalks));
      
      const updatedTalk: Talk = {
        id: '1',
        conferenceId: 'conf1',
        title: 'Updated Title',
        startTime: new Date(),
        endTime: new Date()
      };
      
      await saveTalk(updatedTalk);
      
      const setItemArg = JSON.parse(AsyncStorage.setItem.mock.calls[0][1]);
      expect(setItemArg).toHaveLength(1);
      expect(setItemArg[0].id).toBe('1');
      expect(setItemArg[0].title).toBe('Updated Title');
    });
  });

  describe('Note Storage', () => {
    test('getNotes should return an empty array when no data exists', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null);
      
      const result = await getNotes();
      
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('conpanion_notes');
      expect(result).toEqual([]);
    });
    
    test('saveNote should add a new note', async () => {
      const existingNotes: Note[] = [];
      
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(existingNotes));
      
      const newNote: Note = {
        id: '1',
        talkId: 'talk1',
        textContent: 'Test note',
        images: [],
        audioRecordings: [],
        timestamp: new Date()
      };
      
      await saveNote(newNote);
      
      const setItemArg = JSON.parse(AsyncStorage.setItem.mock.calls[0][1]);
      expect(setItemArg).toHaveLength(1);
      expect(setItemArg[0].id).toBe('1');
      expect(setItemArg[0].textContent).toBe('Test note');
    });
  });

  describe('Default Conference', () => {
    test('initializeDefaultConference should create a default conference if none exists', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify([]));
      
      const result = await initializeDefaultConference();
      
      expect(AsyncStorage.setItem).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
      expect(result.name).toBe('My Conference');
    });
    
    test('initializeDefaultConference should return the first conference if one exists', async () => {
      const existingConferences = [
        { 
          id: 'existing-id', 
          name: 'Existing Conference', 
          startDate: new Date(), 
          endDate: new Date() 
        }
      ];
      
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(existingConferences));
      
      const result = await initializeDefaultConference();
      
      expect(result.id).toBe('existing-id');
      expect(result.name).toBe('Existing Conference');
    });
  });
});