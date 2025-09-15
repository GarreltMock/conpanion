import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import { zip } from "react-native-zip-archive";
import { Conference, Talk, Note, ExportOptions, Activity } from "../types";
import { getAbsolutePath, generateId } from "./helper";

// Storage keys
const CONFERENCES_KEY = "conpanion_conferences";
const TALKS_KEY = "conpanion_talks";
const ACTIVITIES_KEY = "conpanion_activities";
const NOTES_KEY = "conpanion_notes";
const ACTIVE_CONFERENCE_KEY = "conpanion_active_conference";

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
};

// Save image to file system
export const saveImage = async (uri: string, conferenceId?: string): Promise<string> => {
    const filename = generateUniqueFilename("jpg");
    let destination;
    let relativePath;

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
        relativePath = `conferences/${conferenceId}/images/${filename}`;
    } else {
        destination = IMAGES_DIRECTORY + filename;
        relativePath = `images/${filename}`;
    }

    await FileSystem.copyAsync({
        from: uri,
        to: destination,
    });

    return relativePath;
};

// Save audio to file system
export const saveAudio = async (uri: string, conferenceId?: string): Promise<string> => {
    const filename = generateUniqueFilename("m4a");
    let destination;
    let relativePath;

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
        relativePath = `conferences/${conferenceId}/audio/${filename}`;
    } else {
        destination = AUDIO_DIRECTORY + filename;
        relativePath = `audio/${filename}`;
    }

    await FileSystem.copyAsync({
        from: uri,
        to: destination,
    });

    return relativePath;
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
                lastApiSync: conf.lastApiSync ? new Date(conf.lastApiSync) : undefined,
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

        const updatedConference = {
            ...conference,
            updatedAt: new Date(),
        };

        try {
            await initializeConferenceDirectories(conference.id);
        } catch (dirError) {
            console.error(`Error initializing directories for conference ${conference.id}:`, dirError);
        }

        if (index !== -1) {
            conferences[index] = updatedConference;
        } else {
            conferences.push(updatedConference);
        }

        await AsyncStorage.setItem(CONFERENCES_KEY, JSON.stringify(conferences));
    } catch (error) {
        console.error("Error saving conference:", error);
        throw error;
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
        const defaultConference = getProgrammiercon();

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
    const defaultConference = getProgrammiercon();

    await initializeConferenceDirectories(defaultConference.id);
    await saveConference(defaultConference);
    await setActiveConferenceId(defaultConference.id);
    return defaultConference;
};

// // keep here for after the conference
// const getDefaultConference = (): Conference => {
//     const now = new Date();
//     const endDate = new Date();
//     endDate.setDate(now.getDate() + 3);

//     return {
//         id: generateId(),
//         name: "Default Conference",
//         startDate: now,
//         endDate: endDate,
//         createdAt: now,
//         updatedAt: now,
//     };
// };

const getProgrammiercon = (): Conference => {
    const now = new Date();

    return {
        id: generateId(),
        name: "programmier.con",
        startDate: new Date("2025-10-29T00:00:00"),
        endDate: new Date("2025-10-30T23:59:59"),
        location: "Bad Nauheim",
        createdAt: now,
        updatedAt: now,
        apiTransformer: "programmiercon",
        apiUrl: "https://admin.programmier.bar/conference/1fc1201a-7b8e-4313-b1b6-2c41471a69c7",
    };
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
                duration: talk.duration,
                source: talk.source || "user", // Default to 'user' for existing talks
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

// Activity storage functions
export const getActivities = async (): Promise<Activity[]> => {
    try {
        const activitiesJson = await AsyncStorage.getItem(ACTIVITIES_KEY);
        if (activitiesJson) {
            // Parse stored JSON and convert date strings back to Date objects
            const parsedActivities = JSON.parse(activitiesJson);
            return parsedActivities.map((activity: any) => ({
                ...activity,
                startTime: new Date(activity.startTime),
                duration: activity.duration,
                source: activity.source || "user", // Default to 'user' for existing activities
            }));
        }
        return [];
    } catch (error) {
        console.error("Error getting activities:", error);
        return [];
    }
};

export const saveActivity = async (activity: Activity): Promise<void> => {
    try {
        const activities = await getActivities();
        const index = activities.findIndex((a) => a.id === activity.id);

        if (index !== -1) {
            activities[index] = activity;
        } else {
            activities.push(activity);
        }

        await AsyncStorage.setItem(ACTIVITIES_KEY, JSON.stringify(activities));
    } catch (error) {
        console.error("Error saving activity:", error);
    }
};

export const deleteActivity = async (activityId: string): Promise<void> => {
    try {
        const activities = await getActivities();
        const updatedActivities = activities.filter((activity) => activity.id !== activityId);
        await AsyncStorage.setItem(ACTIVITIES_KEY, JSON.stringify(updatedActivities));
    } catch (error) {
        console.error("Error deleting activity:", error);
    }
};

// Note storage functions
export const getNotes = async (): Promise<Note[]> => {
    try {
        const notesJson = await AsyncStorage.getItem(NOTES_KEY);
        if (notesJson) {
            const parsedNotes = JSON.parse(notesJson);
            const notes = parsedNotes.map((note: any) => ({
                ...note,
                timestamp: new Date(note.timestamp),
            }));

            // Save the migrated notes back to storage
            await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));

            return notes;
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
            for (const image of noteToDelete.images) {
                try {
                    // Convert relative path to absolute path for deletion
                    const imageAbsolutePath = getAbsolutePath(image.uri);
                    await FileSystem.deleteAsync(imageAbsolutePath);

                    // If it's a transformed image, also delete the original
                    if (image.originalUri) {
                        const originalAbsolutePath = getAbsolutePath(image.originalUri);
                        await FileSystem.deleteAsync(originalAbsolutePath);
                    }
                } catch (error) {
                    console.error("Error deleting image file:", error);
                }
            }

            for (const audioPath of noteToDelete.audioRecordings) {
                try {
                    // Convert relative path to absolute path for deletion
                    const audioAbsolutePath = getAbsolutePath(audioPath);
                    await FileSystem.deleteAsync(audioAbsolutePath);
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
    const baseFilename = options.filename || `${conference.name.replace(/\s+/g, "-")}-${Date.now()}`;
    const tempDir = `${EXPORTS_DIRECTORY}temp_${Date.now()}/`;
    const imagesDir = `${tempDir}images/`;

    // Create temporary directories
    await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true });
    await FileSystem.makeDirectoryAsync(imagesDir, { intermediates: true });

    // Filter talks based on options
    const selectedTalks = talks.filter(
        (talk) => options.includeTalkIds.length === 0 || options.includeTalkIds.includes(talk.id)
    );

    // Collect all images and create image filename mapping
    const imageMapping = new Map<string, string>();
    let imageCounter = 1;

    if (options.includeImages) {
        for (const talk of selectedTalks) {
            const talkNotes = notes.filter((note) => note.talkId === talk.id);
            for (const note of talkNotes) {
                for (const image of note.images) {
                    if (!imageMapping.has(image.uri)) {
                        const extension = image.uri.split(".").pop() || "jpg";
                        const newFilename = `image_${imageCounter}.${extension}`;
                        imageMapping.set(image.uri, newFilename);
                        imageCounter++;

                        // Copy image to temp directory
                        try {
                            const sourceAbsolutePath = getAbsolutePath(image.uri);
                            const destPath = `${imagesDir}${newFilename}`;
                            await FileSystem.copyAsync({
                                from: sourceAbsolutePath,
                                to: destPath,
                            });
                        } catch (error) {
                            console.error(`Error copying image ${image.uri}:`, error);
                        }
                    }
                }
            }
        }
    }

    // Build markdown content with relative image paths
    let markdown = `# ${conference.name}\n\n`;

    if (conference.description) {
        markdown += `${conference.description}\n\n`;
    }

    markdown += `**Conference Period:** ${conference.startDate.toLocaleDateString()} - ${conference.endDate.toLocaleDateString()}\n`;
    if (conference.location) {
        markdown += `**Location:** ${conference.location}\n`;
    }
    markdown += `\n---\n\n`;

    // Add talks and their notes
    for (const talk of selectedTalks) {
        markdown += `## ${talk.title}\n\n`;

        if (talk.speakers && talk.speakers.length > 0) {
            markdown += `**Speaker(s):** ${talk.speakers.map((s) => s.name).join(", ")}\n`;
        }

        markdown += `**Time:** ${talk.startTime.toLocaleString()}`;
        if (talk.duration) {
            markdown += ` (${talk.duration} minutes)`;
        }
        markdown += `\n`;

        if (talk.location) {
            markdown += `**Location:** ${talk.location}\n`;
        }

        if (talk.description) {
            markdown += `\n${talk.description}\n`;
        }

        if (talk.rating) {
            markdown += `\n**Rating:** ${"⭐".repeat(talk.rating)} (${talk.rating}/5)\n`;
        }

        if (talk.summary) {
            markdown += `\n**Summary:** ${talk.summary}\n`;
        }

        // Add notes for this talk
        const talkNotes = notes.filter((note) => note.talkId === talk.id);
        if (talkNotes.length > 0) {
            markdown += `\n### Notes\n\n`;

            for (const note of talkNotes.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())) {
                const timeLabel = note.relativeTime
                    ? `${Math.floor(note.relativeTime / 60)}:${String(note.relativeTime % 60).padStart(2, "0")}`
                    : note.timestamp.toLocaleTimeString();

                markdown += `**${timeLabel}**\n\n`;

                if (note.textContent.trim()) {
                    markdown += `${note.textContent}\n\n`;
                }

                if (options.includeImages && note.images.length > 0) {
                    for (const image of note.images) {
                        const relativeImagePath = imageMapping.get(image.uri);
                        if (relativeImagePath) {
                            markdown += `![Note Image](images/${relativeImagePath})\n\n`;

                            if (image.links && image.links.length > 0) {
                                markdown += `**Links detected:** ${image.links.join(", ")}\n\n`;
                            }
                        }
                    }
                }

                if (note.audioRecordings.length > 0) {
                    markdown += `**Audio recordings:** ${note.audioRecordings.length} file(s)\n\n`;
                }
            }
        }

        markdown += `\n---\n\n`;
    }

    // Write the markdown file to temp directory
    const markdownPath = `${tempDir}${baseFilename}.md`;
    await FileSystem.writeAsStringAsync(markdownPath, markdown);

    // Create zip file
    const zipPath = `${EXPORTS_DIRECTORY}${baseFilename}.zip`;
    await zip(tempDir, zipPath);

    // Clean up temporary directory
    await FileSystem.deleteAsync(tempDir, { idempotent: true });

    return zipPath;
};

// Delete image from file system
export const deleteImage = async (imagePath: string): Promise<void> => {
    try {
        const absolutePath = getAbsolutePath(imagePath);
        await FileSystem.deleteAsync(absolutePath, { idempotent: true });
    } catch (error) {
        console.error("Error deleting image file:", error);
        throw error;
    }
};
