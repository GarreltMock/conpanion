import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
    useCallback,
} from "react";
import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";
import { Conference, Talk, Note } from "../types";
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
} from "../storage";

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

interface AppContextType {
    // Conference Management
    currentConference: Conference | null;
    loadConference: () => Promise<void>;

    // Talk Management
    talks: Talk[];
    activeTalk: Talk | null;
    createTalk: (title: string) => Promise<Talk>;
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

    // States
    isLoading: boolean;
    isRecording: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
    children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
    const [currentConference, setCurrentConference] =
        useState<Conference | null>(null);
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

                // Load conference data
                await loadConference();

                // Load talks
                const storedTalks = await getTalks();
                setTalks(storedTalks);

                // Set active talk (most recent talk that hasn't ended)
                const activeTalks = storedTalks.filter((talk) => !talk.endTime);
                if (activeTalks.length > 0) {
                    // Sort by start time, most recent first
                    activeTalks.sort(
                        (a, b) => b.startTime.getTime() - a.startTime.getTime()
                    );
                    setActiveTalk(activeTalks[0]);
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
    const loadConference = async () => {
        try {
            // Initialize with default if none exists
            console.log("Loading conference data...");
            const defaultConference = await initializeDefaultConference();
            console.log("Default conference loaded:", defaultConference);
            setCurrentConference(defaultConference);
        } catch (error) {
            console.error("Error loading conference:", error);
        }
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

        const updatedTalk: Talk = {
            ...activeTalk,
            endTime: new Date(),
        };

        await saveTalk(updatedTalk);

        // Update state
        setTalks((prevTalks) =>
            prevTalks.map((talk) =>
                talk.id === updatedTalk.id ? updatedTalk : talk
            )
        );
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
            allowsEditing: true,
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

            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

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
        setNotes((prevNotes) =>
            prevNotes.map((note) =>
                note.id === updatedNote.id ? updatedNote : note
            )
        );
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

    const contextValue: AppContextType = {
        currentConference,
        loadConference,

        talks,
        activeTalk,
        createTalk,
        endCurrentTalk,
        getAllTalks,

        notes,
        addTextNote,
        addImageNote,
        addAudioNote,
        stopAudioRecording,
        addCombinedNote,
        updateNote,
        deleteNote: deleteNoteById,
        getNotesForTalk,

        isLoading,
        isRecording,
    };

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = (): AppContextType => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error("useApp must be used within an AppProvider");
    }
    return context;
};
