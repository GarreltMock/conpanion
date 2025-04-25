import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getConferences,
  saveConference,
  deleteConference,
  getActiveConferenceId,
  setActiveConferenceId,
} from '../index';
import { Conference } from '../../types';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock FileSystem
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file://test/',
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true }),
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
}));

describe('Conference Storage Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockConference: Conference = {
    id: 'test-id',
    name: 'Test Conference',
    startDate: new Date('2023-06-01'),
    endDate: new Date('2023-06-03'),
    status: 'active',
    createdAt: new Date('2023-05-01'),
    updatedAt: new Date('2023-05-01'),
  };

  describe('getConferences', () => {
    it('returns an empty array when no conferences exist', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      
      const result = await getConferences();
      
      expect(result).toEqual([]);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('conpanion_conferences');
    });

    it('returns parsed conferences with proper date conversion', async () => {
      const mockData = JSON.stringify([{
        ...mockConference,
        startDate: mockConference.startDate.toISOString(),
        endDate: mockConference.endDate.toISOString(),
        createdAt: mockConference.createdAt.toISOString(),
        updatedAt: mockConference.updatedAt.toISOString(),
      }]);
      
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(mockData);
      
      const result = await getConferences();
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockConference.id);
      expect(result[0].startDate).toBeInstanceOf(Date);
      expect(result[0].endDate).toBeInstanceOf(Date);
      expect(result[0].createdAt).toBeInstanceOf(Date);
      expect(result[0].updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('saveConference', () => {
    it('adds a new conference when it does not exist', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify([]));
      
      await saveConference(mockConference);
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'conpanion_conferences',
        expect.any(String)
      );
      const savedData = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
      expect(savedData).toHaveLength(1);
      expect(savedData[0].id).toBe(mockConference.id);
    });

    it('updates an existing conference', async () => {
      const existingConferences = [mockConference];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(existingConferences));
      
      const updatedConference = {
        ...mockConference,
        name: 'Updated Conference',
      };
      
      await saveConference(updatedConference);
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'conpanion_conferences',
        expect.any(String)
      );
      const savedData = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
      expect(savedData).toHaveLength(1);
      expect(savedData[0].name).toBe('Updated Conference');
    });
  });

  describe('deleteConference', () => {
    it('removes a conference from storage', async () => {
      const existingConferences = [mockConference, { ...mockConference, id: 'other-id' }];
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(existingConferences)) // for getConferences
        .mockResolvedValueOnce(null); // for getActiveConferenceId
      
      await deleteConference('test-id');
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'conpanion_conferences',
        expect.any(String)
      );
      const savedData = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
      expect(savedData).toHaveLength(1);
      expect(savedData[0].id).toBe('other-id');
    });

    it('clears active conference if deleted', async () => {
      const existingConferences = [mockConference];
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(existingConferences)) // for getConferences
        .mockResolvedValueOnce('test-id'); // for getActiveConferenceId
      
      await deleteConference('test-id');
      
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('conpanion_active_conference');
    });
  });

  describe('Active Conference ID', () => {
    it('gets active conference ID', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('test-id');
      
      const result = await getActiveConferenceId();
      
      expect(result).toBe('test-id');
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('conpanion_active_conference');
    });

    it('sets active conference ID', async () => {
      await setActiveConferenceId('test-id');
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'conpanion_active_conference',
        'test-id'
      );
    });
  });
});