import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import { Conference, Talk, Note, ExportOptions } from "../types";

// Helper function to generate a random ID (replacing nanoid)
function generateId(length = 8) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
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
const ACTIVE_CONFERENCE_KEY = "conpanion_active_conference";
const EXPORT_OPTIONS_KEY = "conpanion_export_options";

// File system directories
export const IMAGES_DIRECTORY = FileSystem.documentDirectory + "images/";
export const AUDIO_DIRECTORY = FileSystem.documentDirectory + "audio/";
export const EXPORTS_DIRECTORY = FileSystem.documentDirectory + "exports/";

// Conference-specific directories
const getConferenceImagesDirectory = (conferenceId: string) =>
    `${FileSystem.documentDirectory}conferences/${conferenceId}/images/`;

const getConferenceAudioDirectory = (conferenceId: string) =>
    `${FileSystem.documentDirectory}conferences/${conferenceId}/audio/`;

// Initialize directories
export const initializeFileSystem = async (): Promise<void> => {
    // Create base directories
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

    // Create exports directory
    const exportsDirInfo = await FileSystem.getInfoAsync(EXPORTS_DIRECTORY);
    if (!exportsDirInfo.exists) {
        await FileSystem.makeDirectoryAsync(EXPORTS_DIRECTORY, {
            intermediates: true,
        });
    }

    // Create conference base directory
    const conferencesBaseDir = `${FileSystem.documentDirectory}conferences/`;
    const conferencesBaseDirInfo = await FileSystem.getInfoAsync(conferencesBaseDir);
    if (!conferencesBaseDirInfo.exists) {
        await FileSystem.makeDirectoryAsync(conferencesBaseDir, {
            intermediates: true,
        });
    }
};

// Generate unique filename
export const generateUniqueFilename = (extension: string): string => {
    return `${Date.now()}-${generateId(6)}.${extension}`;
};

// Initialize conference directories
export const initializeConferenceDirectories = async (conferenceId: string): Promise<void> => {
    if (!conferenceId) {
        console.error("Cannot initialize directories: conferenceId is undefined or null");
        throw new Error("Invalid conference ID");
    }

    console.log(`Initializing directories for conference: ${conferenceId}`);

    // First ensure the base conferences directory exists
    const conferencesBaseDir = `${FileSystem.documentDirectory}conferences/`;
    const conferencesBaseDirInfo = await FileSystem.getInfoAsync(conferencesBaseDir);
    if (!conferencesBaseDirInfo.exists) {
        await FileSystem.makeDirectoryAsync(conferencesBaseDir, {
            intermediates: true,
        });
    }

    // Create the conference specific directory
    const conferenceDir = `${FileSystem.documentDirectory}conferences/${conferenceId}/`;
    const conferenceDirInfo = await FileSystem.getInfoAsync(conferenceDir);
    if (!conferenceDirInfo.exists) {
        await FileSystem.makeDirectoryAsync(conferenceDir, {
            intermediates: true,
        });
    }

    // Create the images directory
    const imagesDir = getConferenceImagesDirectory(conferenceId);
    const imagesDirInfo = await FileSystem.getInfoAsync(imagesDir);
    if (!imagesDirInfo.exists) {
        await FileSystem.makeDirectoryAsync(imagesDir, {
            intermediates: true,
        });
    }

    // Create the audio directory
    const audioDir = getConferenceAudioDirectory(conferenceId);
    const audioDirInfo = await FileSystem.getInfoAsync(audioDir);
    if (!audioDirInfo.exists) {
        await FileSystem.makeDirectoryAsync(audioDir, {
            intermediates: true,
        });
    }

    console.log(`Successfully initialized directories for conference: ${conferenceId}`);
};

// Save image to file system
export const saveImage = async (uri: string, conferenceId?: string): Promise<string> => {
    const filename = generateUniqueFilename("jpg");
    let destination;

    if (conferenceId) {
        const directory = getConferenceImagesDirectory(conferenceId);
        // Ensure directory exists
        const dirInfo = await FileSystem.getInfoAsync(directory);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(directory, {
                intermediates: true,
            });
        }
        destination = directory + filename;
    } else {
        destination = IMAGES_DIRECTORY + filename;
    }

    await FileSystem.copyAsync({
        from: uri,
        to: destination,
    });

    return destination;
};

// Save audio to file system
export const saveAudio = async (uri: string, conferenceId?: string): Promise<string> => {
    const filename = generateUniqueFilename("m4a");
    let destination;

    if (conferenceId) {
        const directory = getConferenceAudioDirectory(conferenceId);
        // Ensure directory exists
        const dirInfo = await FileSystem.getInfoAsync(directory);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(directory, {
                intermediates: true,
            });
        }
        destination = directory + filename;
    } else {
        destination = AUDIO_DIRECTORY + filename;
    }

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
                createdAt: new Date(conf.createdAt),
                updatedAt: new Date(conf.updatedAt),
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

        // Always update the updatedAt timestamp when saving
        const updatedConference = {
            ...conference,
            updatedAt: new Date(),
        };

        // Ensure the conference directories exist first
        try {
            await initializeConferenceDirectories(conference.id);
        } catch (dirError) {
            console.error(`Error initializing directories for conference ${conference.id}:`, dirError);
            // Continue anyway - we don't want to fail saving the conference
        }

        if (index !== -1) {
            conferences[index] = updatedConference;
        } else {
            conferences.push(updatedConference);
        }

        await AsyncStorage.setItem(CONFERENCES_KEY, JSON.stringify(conferences));

        console.log(`Conference saved: ${conference.id} - ${conference.name}`);
    } catch (error) {
        console.error("Error saving conference:", error);
        throw error; // Re-throw to allow handling in calling code
    }
};

export const deleteConference = async (conferenceId: string): Promise<void> => {
    try {
        const conferences = await getConferences();
        const updatedConferences = conferences.filter((conf) => conf.id !== conferenceId);

        await AsyncStorage.setItem(CONFERENCES_KEY, JSON.stringify(updatedConferences));

        // If the deleted conference was the active one, clear the active conference
        const activeConferenceId = await AsyncStorage.getItem(ACTIVE_CONFERENCE_KEY);
        if (activeConferenceId === conferenceId) {
            await AsyncStorage.removeItem(ACTIVE_CONFERENCE_KEY);
        }

        // Delete conference directories (Note: This doesn't delete files inside the directories)
        // You might want to add more logic to delete files inside these directories
        const imagesDir = getConferenceImagesDirectory(conferenceId);
        const audioDir = getConferenceAudioDirectory(conferenceId);

        try {
            await FileSystem.deleteAsync(imagesDir, { idempotent: true });
            await FileSystem.deleteAsync(audioDir, { idempotent: true });
        } catch (fsError) {
            console.error("Error deleting conference directories:", fsError);
        }
    } catch (error) {
        console.error("Error deleting conference:", error);
    }
};

export const getActiveConferenceId = async (): Promise<string | null> => {
    try {
        return await AsyncStorage.getItem(ACTIVE_CONFERENCE_KEY);
    } catch (error) {
        console.error("Error getting active conference ID:", error);
        return null;
    }
};

export const setActiveConferenceId = async (conferenceId: string): Promise<void> => {
    try {
        await AsyncStorage.setItem(ACTIVE_CONFERENCE_KEY, conferenceId);
    } catch (error) {
        console.error("Error setting active conference ID:", error);
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
            status: "active",
            createdAt: now,
            updatedAt: now,
        };

        // Create conference directories first
        await initializeConferenceDirectories(defaultConference.id);

        // Save the conference to storage
        await saveConference(defaultConference);
        await setActiveConferenceId(defaultConference.id);
        return defaultConference;
    }

    // If there are conferences but no active conference, set the first one as active
    const activeId = await getActiveConferenceId();
    if (!activeId && conferences.length > 0) {
        // Ensure this conference has directories
        await initializeConferenceDirectories(conferences[0].id);
        await setActiveConferenceId(conferences[0].id);
        return conferences[0];
    }

    // Return the active conference if it exists
    if (activeId) {
        const activeConference = conferences.find((conf) => conf.id === activeId);
        if (activeConference) {
            // Ensure this conference has directories
            await initializeConferenceDirectories(activeConference.id);
            return activeConference;
        }
    }

    // Default fallback: return the first conference and ensure its directories
    if (conferences.length > 0) {
        await initializeConferenceDirectories(conferences[0].id);
        return conferences[0];
    }

    // This should never happen, but just in case, create a fresh default
    const now = new Date();
    const endDate = new Date();
    endDate.setDate(now.getDate() + 3);

    const defaultConference: Conference = {
        id: generateId(),
        name: "Default Conference",
        startDate: now,
        endDate: endDate,
        status: "active",
        createdAt: now,
        updatedAt: now,
    };

    await initializeConferenceDirectories(defaultConference.id);
    await saveConference(defaultConference);
    await setActiveConferenceId(defaultConference.id);
    return defaultConference;
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

// Export options storage functions
export const getExportOptions = async (): Promise<ExportOptions | null> => {
    try {
        const optionsJson = await AsyncStorage.getItem(EXPORT_OPTIONS_KEY);
        if (optionsJson) {
            return JSON.parse(optionsJson);
        }
        return null;
    } catch (error) {
        console.error("Error getting export options:", error);
        return null;
    }
};

export const saveExportOptions = async (options: ExportOptions): Promise<void> => {
    try {
        await AsyncStorage.setItem(EXPORT_OPTIONS_KEY, JSON.stringify(options));
    } catch (error) {
        console.error("Error saving export options:", error);
    }
};

// PDF and Markdown generation
export const generatePDF = async (
    conference: Conference,
    talks: Talk[],
    notes: Note[],
    options: ExportOptions
): Promise<string> => {
    // This will be implemented using react-native-pdf-lib
    // For now, returning a placeholder
    const filename = options.filename || `${conference.name.replace(/\s+/g, "-")}-${Date.now()}.pdf`;
    const filePath = `${EXPORTS_DIRECTORY}${filename}`;

    // Placeholder for PDF creation logic
    // We'll implement this later after UI is set up

    console.log(`PDF generated at: ${filePath}`);

    return filePath;
};

export const generateMarkdown = async (
    conference: Conference,
    talks: Talk[],
    notes: Note[],
    options: ExportOptions
): Promise<string> => {
    // This will generate a markdown file
    const filename = options.filename || `${conference.name.replace(/\s+/g, "-")}-${Date.now()}.md`;
    const filePath = `${EXPORTS_DIRECTORY}${filename}`;

    // Placeholder for markdown creation logic
    // We'll implement this later after UI is set up

    return filePath;
};
