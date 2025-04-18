import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import { Conference, Talk, Note } from "../types";

// Helper function to generate a random ID (replacing nanoid)
function generateId(length = 8) {
    const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Storage keys
const CONFERENCES_KEY = "conpanion_conferences";
const TALKS_KEY = "conpanion_talks";
const NOTES_KEY = "conpanion_notes";

// File system directories
export const IMAGES_DIRECTORY = FileSystem.documentDirectory + "images/";
export const AUDIO_DIRECTORY = FileSystem.documentDirectory + "audio/";

// Initialize directories
export const initializeFileSystem = async (): Promise<void> => {
    const imagesDirInfo = await FileSystem.getInfoAsync(IMAGES_DIRECTORY);
    if (!imagesDirInfo.exists) {
        await FileSystem.makeDirectoryAsync(IMAGES_DIRECTORY, {
            intermediates: true,
        });
    }

    const audioDirInfo = await FileSystem.getInfoAsync(AUDIO_DIRECTORY);
    if (!audioDirInfo.exists) {
        await FileSystem.makeDirectoryAsync(AUDIO_DIRECTORY, {
            intermediates: true,
        });
    }
};

// Generate unique filename
export const generateUniqueFilename = (extension: string): string => {
    return `${Date.now()}-${generateId(6)}.${extension}`;
};

// Save image to file system
export const saveImage = async (uri: string): Promise<string> => {
    const filename = generateUniqueFilename("jpg");
    const destination = IMAGES_DIRECTORY + filename;

    await FileSystem.copyAsync({
        from: uri,
        to: destination,
    });

    return destination;
};

// Save audio to file system
export const saveAudio = async (uri: string): Promise<string> => {
    const filename = generateUniqueFilename("m4a");
    const destination = AUDIO_DIRECTORY + filename;

    await FileSystem.copyAsync({
        from: uri,
        to: destination,
    });

    return destination;
};

// Conference storage functions
export const getConferences = async (): Promise<Conference[]> => {
    try {
        const conferencesJson = await AsyncStorage.getItem(CONFERENCES_KEY);
        if (conferencesJson) {
            // Parse stored JSON and convert date strings back to Date objects
            const parsedConferences = JSON.parse(conferencesJson);
            return parsedConferences.map((conf: any) => ({
                ...conf,
                startDate: new Date(conf.startDate),
                endDate: new Date(conf.endDate),
            }));
        }
        return [];
    } catch (error) {
        console.error("Error getting conferences:", error);
        return [];
    }
};

export const saveConference = async (conference: Conference): Promise<void> => {
    try {
        const conferences = await getConferences();
        const index = conferences.findIndex((c) => c.id === conference.id);

        if (index !== -1) {
            conferences[index] = conference;
        } else {
            conferences.push(conference);
        }

        await AsyncStorage.setItem(
            CONFERENCES_KEY,
            JSON.stringify(conferences)
        );
    } catch (error) {
        console.error("Error saving conference:", error);
    }
};

export const initializeDefaultConference = async (): Promise<Conference> => {
    const conferences = await getConferences();

    if (conferences.length === 0) {
        const now = new Date();
        const endDate = new Date();
        endDate.setDate(now.getDate() + 3); // Default 3-day conference

        const defaultConference: Conference = {
            id: generateId(),
            name: "My Conference",
            startDate: now,
            endDate: endDate,
        };

        await saveConference(defaultConference);
        return defaultConference;
    }

    return conferences[0]; // Return the first conference
};

// Talk storage functions
export const getTalks = async (): Promise<Talk[]> => {
    try {
        const talksJson = await AsyncStorage.getItem(TALKS_KEY);
        if (talksJson) {
            // Parse stored JSON and convert date strings back to Date objects
            const parsedTalks = JSON.parse(talksJson);
            return parsedTalks.map((talk: any) => ({
                ...talk,
                startTime: new Date(talk.startTime),
                endTime: talk.endTime ? new Date(talk.endTime) : undefined,
            }));
        }
        return [];
    } catch (error) {
        console.error("Error getting talks:", error);
        return [];
    }
};

export const saveTalk = async (talk: Talk): Promise<void> => {
    try {
        const talks = await getTalks();
        const index = talks.findIndex((t) => t.id === talk.id);

        if (index !== -1) {
            talks[index] = talk;
        } else {
            talks.push(talk);
        }

        await AsyncStorage.setItem(TALKS_KEY, JSON.stringify(talks));
    } catch (error) {
        console.error("Error saving talk:", error);
    }
};

export const deleteTalk = async (talkId: string): Promise<void> => {
    try {
        const talks = await getTalks();
        const updatedTalks = talks.filter((talk) => talk.id !== talkId);
        await AsyncStorage.setItem(TALKS_KEY, JSON.stringify(updatedTalks));
    } catch (error) {
        console.error("Error deleting talk:", error);
    }
};

// Note storage functions
export const getNotes = async (): Promise<Note[]> => {
    try {
        const notesJson = await AsyncStorage.getItem(NOTES_KEY);
        if (notesJson) {
            // Parse stored JSON and convert date strings back to Date objects
            const parsedNotes = JSON.parse(notesJson);
            return parsedNotes.map((note: any) => ({
                ...note,
                timestamp: new Date(note.timestamp),
            }));
        }
        return [];
    } catch (error) {
        console.error("Error getting notes:", error);
        return [];
    }
};

export const saveNote = async (note: Note): Promise<void> => {
    try {
        const notes = await getNotes();
        const index = notes.findIndex((n) => n.id === note.id);

        if (index !== -1) {
            notes[index] = note;
        } else {
            notes.push(note);
        }

        await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    } catch (error) {
        console.error("Error saving note:", error);
    }
};

export const deleteNote = async (noteId: string): Promise<void> => {
    try {
        const notes = await getNotes();
        const noteToDelete = notes.find((note) => note.id === noteId);

        if (noteToDelete) {
            // Delete associated files
            for (const imagePath of noteToDelete.images) {
                try {
                    await FileSystem.deleteAsync(imagePath);
                } catch (error) {
                    console.error("Error deleting image file:", error);
                }
            }

            for (const audioPath of noteToDelete.audioRecordings) {
                try {
                    await FileSystem.deleteAsync(audioPath);
                } catch (error) {
                    console.error("Error deleting audio file:", error);
                }
            }

            // Delete note from storage
            const updatedNotes = notes.filter((note) => note.id !== noteId);
            await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(updatedNotes));
        }
    } catch (error) {
        console.error("Error deleting note:", error);
    }
};
