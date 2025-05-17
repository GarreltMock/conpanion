import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";
import { Conference, Talk, Note, ExportOptions, ConferenceStatus } from "../types";
import {
    getTalks,
    getNotes,
    saveTalk,
    saveNote,
    deleteNote as deleteNoteFromStorage,
    initializeDefaultConference,
    saveImage,
    saveAudio,
    initializeFileSystem,
    getConferences as getConferencesFromStorage,
    saveConference as saveConferenceToStorage,
    deleteConference as deleteConferenceFromStorage,
    getActiveConferenceId,
    setActiveConferenceId,
    getExportOptions as getExportOptionsFromStorage,
    saveExportOptions as saveExportOptionsToStorage,
    generatePDF,
    generateMarkdown,
    initializeConferenceDirectories,
} from "../storage";

// Helper function to generate a random ID (replacing nanoid)
function generateId(length = 8) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

interface AppContextType {
    // Conference Management
    currentConference: Conference | null;
    conferences: Conference[];
    loadConference: () => Promise<void>;
    createConference: (
        name: string,
        startDate: Date,
        endDate: Date,
        location?: string,
        description?: string
    ) => Promise<Conference>;
    updateConference: (conference: Conference) => Promise<void>;
    deleteConference: (conferenceId: string) => Promise<void>;
    switchActiveConference: (conferenceId: string) => Promise<void>;
    archiveConference: (conferenceId: string) => Promise<void>;
    getConferences: () => Promise<Conference[]>;
    hasConferences: () => Promise<boolean>;

    // Talk Management
    talks: Talk[];
    activeTalk: Talk | null;
    createTalk: (title: string) => Promise<Talk>;
    endTalk: (talk: Talk) => Promise<void>;
    endCurrentTalk: () => Promise<void>;
    getAllTalks: () => Promise<Talk[]>;

    // Note Management
    notes: Note[];
    addTextNote: (text: string) => Promise<Note>;
    addImageNote: () => Promise<string>; // Returns image URI instead of creating note
    addAudioNote: () => Promise<Note | null>;
    stopAudioRecording: () => Promise<string | null>; // Returns audio URI instead of creating note
    addCombinedNote: (text: string, images: string[], audioRecordings: string[]) => Promise<Note>;
    updateNote: (note: Note) => Promise<void>;
    deleteNote: (noteId: string) => Promise<void>;
    getNotesForTalk: (talkId: string) => Note[];

    // Export Functionality
    exportToPDF: (conferenceId: string, options: ExportOptions) => Promise<string>;
    exportToMarkdown: (conferenceId: string, options: ExportOptions) => Promise<string>;
    saveExportOptions: (options: ExportOptions) => Promise<void>;
    getExportOptions: () => Promise<ExportOptions | null>;

    // States
    isLoading: boolean;
    isRecording: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
    children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
    const [currentConference, setCurrentConference] = useState<Conference | null>(null);
    const [conferences, setConferences] = useState<Conference[]>([]);
    const [talks, setTalks] = useState<Talk[]>([]);
    const [activeTalk, setActiveTalk] = useState<Talk | null>(null);
    const [notes, setNotes] = useState<Note[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [recording, setRecording] = useState<Audio.Recording | null>(null);

    // Initialize the app
    useEffect(() => {
        const initialize = async () => {
            try {
                setIsLoading(true);

                // Initialize file system directories
                await initializeFileSystem();

                // Load all conferences first
                const allConferences = await loadAllConferences();
                console.log("Loaded conferences:", allConferences);

                // Load active conference (or initialize a default one)
                await loadConference();

                // Ensure conference directories exist for all conferences
                for (const conf of allConferences) {
                    try {
                        await initializeConferenceDirectories(conf.id);
                    } catch (dirError) {
                        console.error(`Error initializing directories for conference ${conf.id}:`, dirError);
                    }
                }

                // Load talks
                const storedTalks = await getTalks();
                setTalks(storedTalks);

                // Set active talk (most recent talk that hasn't ended AND belongs to current conference)
                if (currentConference) {
                    const activeTalks = storedTalks.filter(
                        (talk) => !talk.endTime && talk.conferenceId === currentConference.id
                    );

                    if (activeTalks.length > 0) {
                        // Sort by start time, most recent first
                        activeTalks.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
                        console.log("Setting active talk:", activeTalks[0].title);
                        setActiveTalk(activeTalks[0]);
                    } else {
                        console.log("No active talks found for the current conference");
                        setActiveTalk(null);
                    }
                } else {
                    console.log("No current conference, not setting any active talk");
                    setActiveTalk(null);
                }

                // Load notes
                const storedNotes = await getNotes();
                setNotes(storedNotes);
            } catch (error) {
                console.error("Error initializing app:", error);
            } finally {
                setIsLoading(false);
            }
        };

        initialize();
    }, []);

    // Conference Management
    const loadAllConferences = async () => {
        try {
            const allConferences = await getConferencesFromStorage();
            setConferences(allConferences);
            return allConferences;
        } catch (error) {
            console.error("Error loading all conferences:", error);
            return [];
        }
    };

    const loadConference = async () => {
        try {
            // Initialize with default if none exists
            console.log("Loading active conference data...");
            const defaultConference = await initializeDefaultConference();
            console.log("Active conference loaded:", defaultConference);
            setCurrentConference(defaultConference);

            // Update conferences list if needed
            const allConferences = await loadAllConferences();
            if (!allConferences.some((conf) => conf.id === defaultConference.id)) {
                setConferences((prev) => [...prev, defaultConference]);
            }
        } catch (error) {
            console.error("Error loading conference:", error);
        }
    };

    const createConference = async (
        name: string,
        startDate: Date,
        endDate: Date,
        location?: string,
        description?: string
    ): Promise<Conference> => {
        if (!name || !startDate || !endDate) {
            throw new Error("Conference name, start date, and end date are required");
        }

        const now = new Date();

        // Determine status based on dates
        let status: ConferenceStatus = "upcoming";
        if (startDate <= now && endDate >= now) {
            status = "active";
        } else if (endDate < now) {
            status = "past";
        }

        const newConference: Conference = {
            id: generateId(),
            name,
            startDate,
            endDate,
            location,
            description,
            status,
            createdAt: now,
            updatedAt: now,
        };

        // End any active talk before setting a new conference
        if (activeTalk) {
            console.log("Ending active talk before creating new conference");
            await endCurrentTalk();
        }

        await saveConferenceToStorage(newConference);
        await setActiveConferenceId(newConference.id);

        // Update state
        setCurrentConference(newConference);
        setConferences((prev) => [...prev, newConference]);

        // Clear active talk when creating a new conference
        setActiveTalk(null);

        console.log(`Created new conference: ${newConference.name} (ID: ${newConference.id})`);
        return newConference;
    };

    const updateConference = async (conference: Conference): Promise<void> => {
        // Ensure updatedAt is set to current time
        const updatedConference = {
            ...conference,
            updatedAt: new Date(),
        };

        await saveConferenceToStorage(updatedConference);

        // Update state
        setConferences((prev) => prev.map((conf) => (conf.id === updatedConference.id ? updatedConference : conf)));

        // If this is the current conference, update it
        if (currentConference && currentConference.id === updatedConference.id) {
            setCurrentConference(updatedConference);
        }
    };

    const deleteConferenceById = async (conferenceId: string): Promise<void> => {
        if (!conferenceId) {
            throw new Error("Conference ID is required");
        }

        // Get talks for this conference
        const conferenceTalks = talks.filter((talk) => talk.conferenceId === conferenceId);

        // Get notes for these talks
        const talkIds = conferenceTalks.map((talk) => talk.id);
        const conferenceNotes = notes.filter((note) => talkIds.includes(note.talkId));

        // Delete notes
        for (const note of conferenceNotes) {
            await deleteNoteFromStorage(note.id);
        }

        // Delete conference
        await deleteConferenceFromStorage(conferenceId);

        // Update state
        setConferences((prev) => prev.filter((conf) => conf.id !== conferenceId));

        // If this was the current conference, load a new one
        if (currentConference && currentConference.id === conferenceId) {
            await loadConference();
        }
    };

    const switchActiveConference = async (conferenceId: string): Promise<void> => {
        if (!conferenceId) {
            throw new Error("Conference ID is required");
        }

        const conference = conferences.find((conf) => conf.id === conferenceId);
        if (!conference) {
            throw new Error("Conference not found");
        }

        // First end any active talk
        if (activeTalk) {
            console.log("Ending active talk before switching conference");
            await endCurrentTalk();
        }

        await setActiveConferenceId(conferenceId);
        setCurrentConference(conference);

        // Reset active talk
        setActiveTalk(null);

        console.log(`Switched to conference: ${conference.name}`);
    };

    const archiveConference = async (conferenceId: string): Promise<void> => {
        const conference = conferences.find((conf) => conf.id === conferenceId);
        if (!conference) {
            throw new Error("Conference not found");
        }

        const updatedConference = {
            ...conference,
            status: "past" as ConferenceStatus,
            updatedAt: new Date(),
        };

        await updateConference(updatedConference);
    };

    const getConferencesFromContext = async (): Promise<Conference[]> => {
        // First check if we already have conferences in state
        if (conferences.length > 0) {
            console.log("Using cached conferences:", conferences.length);
            return conferences;
        }

        // Otherwise load from storage
        console.log("Loading conferences from storage");
        const storedConferences = await getConferencesFromStorage();
        setConferences(storedConferences);
        return storedConferences;
    };

    const hasConferencesInStorage = async (): Promise<boolean> => {
        const storedConferences = await getConferencesFromStorage();
        return storedConferences.length > 0;
    };

    // Talk Management
    const createTalk = async (title: string): Promise<Talk> => {
        console.log("Creating talk with title:", title);
        console.log("Current conference state:", currentConference);

        if (!currentConference) {
            console.error("Conference is null or undefined");
            throw new Error("No current conference exists");
        }

        // End current active talk if one exists
        if (activeTalk) {
            console.log("Ending current active talk:", activeTalk.title);
            await endCurrentTalk();
        }

        const newTalk: Talk = {
            id: generateId(),
            conferenceId: currentConference.id,
            title,
            startTime: new Date(),
        };

        await saveTalk(newTalk);

        // Update state
        setTalks((prevTalks) => [...prevTalks, newTalk]);
        setActiveTalk(newTalk);

        return newTalk;
    };

    const endCurrentTalk = async (): Promise<void> => {
        if (!activeTalk) return;
        await endTalk(activeTalk);
    };

    const endTalk = async (talk: Talk): Promise<void> => {
        const updatedTalk: Talk = {
            ...talk,
            endTime: new Date(),
        };

        await saveTalk(updatedTalk);

        // Update state
        setTalks((prevTalks) => prevTalks.map((talk) => (talk.id === updatedTalk.id ? updatedTalk : talk)));
        setActiveTalk(null);
    };

    const getAllTalks = useCallback(async (): Promise<Talk[]> => {
        const storedTalks = await getTalks();
        setTalks(storedTalks);
        return storedTalks;
    }, []);

    // Note Management
    const addTextNote = async (text: string): Promise<Note> => {
        if (!activeTalk) {
            throw new Error("No active talk to add note to");
        }

        if (!text.trim()) {
            throw new Error("Note text cannot be empty");
        }

        const newNote: Note = {
            id: generateId(),
            talkId: activeTalk.id,
            textContent: text,
            images: [],
            audioRecordings: [],
            timestamp: new Date(),
        };

        await saveNote(newNote);

        // Update state
        setNotes((prevNotes) => [...prevNotes, newNote]);

        return newNote;
    };

    const addImageNote = async (): Promise<string> => {
        if (!activeTalk) {
            throw new Error("No active talk to add note to");
        }

        // Request camera permissions
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
            console.error("Camera permission not granted");
            throw new Error("Camera permission not granted");
        }

        // Launch camera
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            allowsEditing: false,
        });

        if (result.canceled || !result.assets || result.assets.length === 0) {
            throw new Error("No image selected");
        }

        // Save image to file system
        const imageUri = result.assets[0].uri;
        const savedImagePath = await saveImage(imageUri);

        // Just return the saved image path
        return savedImagePath;
    };

    const addAudioNote = async (): Promise<Note | null> => {
        if (!activeTalk) {
            throw new Error("No active talk to add note to");
        }

        // Request audio recording permissions
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== "granted") {
            console.error("Audio recording permission not granted");
            return null;
        }

        try {
            // Start recording
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);

            setRecording(recording);
            setIsRecording(true);

            // Wait for stop recording action (this will be handled externally)
            return null;
        } catch (error) {
            console.error("Error starting audio recording:", error);
            return null;
        }
    };

    // Function to stop audio recording and return the URI
    const stopAudioRecording = async (): Promise<string | null> => {
        if (!recording || !isRecording || !activeTalk) {
            return null;
        }

        try {
            setIsRecording(false);

            // Stop recording
            await recording.stopAndUnloadAsync();
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
            });

            // Get recording URI and save to file system
            const uri = recording.getURI();
            if (!uri) {
                throw new Error("Recording URI is null");
            }

            const savedAudioPath = await saveAudio(uri);
            setRecording(null);

            // Return the saved audio path
            return savedAudioPath;
        } catch (error) {
            console.error("Error stopping audio recording:", error);
            setRecording(null);
            setIsRecording(false);
            return null;
        }
    };

    // Function to create a note with combined content (text, images, audio)
    const addCombinedNote = async (text: string, images: string[], audioRecordings: string[]): Promise<Note> => {
        if (!activeTalk) {
            throw new Error("No active talk to add note to");
        }

        // Create the new note with all content
        const newNote: Note = {
            id: generateId(),
            talkId: activeTalk.id,
            textContent: text,
            images: images,
            audioRecordings: audioRecordings,
            timestamp: new Date(),
        };

        await saveNote(newNote);

        // Update state
        setNotes((prevNotes) => [...prevNotes, newNote]);

        return newNote;
    };

    const updateNote = async (updatedNote: Note): Promise<void> => {
        await saveNote(updatedNote);

        // Update state
        setNotes((prevNotes) => prevNotes.map((note) => (note.id === updatedNote.id ? updatedNote : note)));
    };

    const deleteNoteById = async (noteId: string): Promise<void> => {
        await deleteNoteFromStorage(noteId);

        // Update state
        setNotes((prevNotes) => prevNotes.filter((note) => note.id !== noteId));
    };

    const getNotesForTalk = (talkId: string): Note[] => {
        return notes
            .filter((note) => note.talkId === talkId)
            .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    };

    // Export Functionality
    const exportToPDF = async (conferenceId: string, options: ExportOptions): Promise<string> => {
        const conference = conferences.find((conf) => conf.id === conferenceId);
        if (!conference) {
            throw new Error("Conference not found");
        }

        // Filter talks based on options
        let conferenceTalks = talks.filter((talk) => talk.conferenceId === conferenceId);
        if (options.includeTalkIds && options.includeTalkIds.length > 0) {
            conferenceTalks = conferenceTalks.filter((talk) => options.includeTalkIds.includes(talk.id));
        }

        // Get notes for these talks
        const allNotes: Note[] = [];
        for (const talk of conferenceTalks) {
            const talkNotes = getNotesForTalk(talk.id);
            allNotes.push(...talkNotes);
        }

        // Generate PDF
        const pdfPath = await generatePDF(conference, conferenceTalks, allNotes, options);
        return pdfPath;
    };

    const exportToMarkdown = async (conferenceId: string, options: ExportOptions): Promise<string> => {
        const conference = conferences.find((conf) => conf.id === conferenceId);
        if (!conference) {
            throw new Error("Conference not found");
        }

        // Filter talks based on options
        let conferenceTalks = talks.filter((talk) => talk.conferenceId === conferenceId);
        if (options.includeTalkIds && options.includeTalkIds.length > 0) {
            conferenceTalks = conferenceTalks.filter((talk) => options.includeTalkIds.includes(talk.id));
        }

        // Get notes for these talks
        const allNotes: Note[] = [];
        for (const talk of conferenceTalks) {
            const talkNotes = getNotesForTalk(talk.id);
            allNotes.push(...talkNotes);
        }

        // Generate Markdown
        const markdownPath = await generateMarkdown(conference, conferenceTalks, allNotes, options);
        return markdownPath;
    };

    const saveExportOptionsToContext = async (options: ExportOptions): Promise<void> => {
        await saveExportOptionsToStorage(options);
    };

    const getExportOptionsFromContext = async (): Promise<ExportOptions | null> => {
        return await getExportOptionsFromStorage();
    };

    const contextValue: AppContextType = {
        // Conference Management
        currentConference,
        conferences,
        loadConference,
        createConference,
        updateConference,
        deleteConference: deleteConferenceById,
        switchActiveConference,
        archiveConference,
        getConferences: getConferencesFromContext,
        hasConferences: hasConferencesInStorage,

        // Talk Management
        talks,
        activeTalk,
        createTalk,
        endTalk,
        endCurrentTalk,
        getAllTalks,

        // Note Management
        notes,
        addTextNote,
        addImageNote,
        addAudioNote,
        stopAudioRecording,
        addCombinedNote,
        updateNote,
        deleteNote: deleteNoteById,
        getNotesForTalk,

        // Export Functionality
        exportToPDF,
        exportToMarkdown,
        saveExportOptions: saveExportOptionsToContext,
        getExportOptions: getExportOptionsFromContext,

        // States
        isLoading,
        isRecording,
    };

    return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error("useApp must be used within an AppProvider");
    }
    return context;
};
