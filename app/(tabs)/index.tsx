import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";

import { MyKeyboardAvoidingView } from "@/components/MyKeyboardAvoidingView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { NoteInput } from "@/components/note/NoteInput";
import { NoteItem } from "@/components/note/NoteItem";
import { TalkHeader } from "@/components/note/TalkHeader";
import { useApp } from "@/context/AppContext";
import { Note, NoteImage } from "@/types";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function NotesScreen() {
    const {
        currentConference,
        activeTalk,
        notes,
        addImageNote,
        addAudioNote,
        stopAudioRecording,
        addCombinedNote,
        deleteNote,
        getNotesForTalk,
        endCurrentTalk,
        isLoading,
        isRecording,
    } = useApp();

    const [talkNotes, setTalkNotes] = useState<Note[]>([]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const flatListRef = useRef<FlatList>(null);

    const borderLight = useThemeColor({}, "borderLight");

    // Set timeout to update state when scheduled talk ends
    useEffect(() => {
        if (!activeTalk || !activeTalk.duration) {
            return;
        }

        const now = new Date();
        const endTime = new Date(activeTalk.startTime.getTime() + activeTalk.duration * 60 * 1000);
        const timeUntilEnd = endTime.getTime() - now.getTime();

        // Only set timeout if the talk hasn't ended yet
        if (timeUntilEnd > 0) {
            const timeout = setTimeout(() => {
                setCurrentTime(new Date());
            }, timeUntilEnd);

            return () => clearTimeout(timeout);
        }
    }, [activeTalk]);

    // Update immediately when active talk changes
    useEffect(() => {
        setCurrentTime(new Date());
    }, [activeTalk]);

    useEffect(() => {
        if (activeTalk) {
            const notesForTalk = getNotesForTalk(activeTalk.id);
            setTalkNotes(notesForTalk);
        } else {
            setTalkNotes([]);
        }
    }, [activeTalk, notes, getNotesForTalk]);

    // Scroll to bottom when new notes are added
    useEffect(() => {
        if (talkNotes.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [talkNotes.length]);

    const handleTalkDone = async () => {
        if (!activeTalk) {
            router.push("/modals/new-talk");
            return;
        }

        const isScheduledTalk = activeTalk.duration !== undefined;
        const isTalkActive = activeTalk.duration
            ? new Date(activeTalk.startTime.getTime() + activeTalk.duration * 60 * 1000) > currentTime
            : true;

        if (isScheduledTalk && isTalkActive) {
            // For scheduled talks that are still active, create a new immediate talk
            router.push("/modals/new-talk");
        } else {
            // For immediate talks or finished scheduled talks, end current talk
            // and let the system recalculate the next active talk
            await endCurrentTalk();
            // Don't navigate - let the system determine the next state
        }
    };

    // Handle combined note submission (text, images, audio)
    const handleSubmitNote = async (text: string, images: NoteImage[], audioRecordings: string[]) => {
        if (!text.trim() && images.length === 0 && audioRecordings.length === 0) return;
        await addCombinedNote(text, images, audioRecordings);
    };

    // Handle taking a photo
    const handleTakePhoto = async (fromGallery: boolean): Promise<string | null> => {
        try {
            return await addImageNote(fromGallery);
        } catch (error) {
            console.error("Error taking photo:", error);
            throw error;
        }
    };

    // Handle audio recording
    const handleRecordAudio = async (): Promise<string | null> => {
        try {
            if (isRecording) {
                // When stopping, return the URI of the recorded audio
                const audioUri = await stopAudioRecording();
                console.log("Audio recording stopped, URI:", audioUri);
                return audioUri;
            } else {
                // Start recording
                await addAudioNote();
                return null;
            }
        } catch (error) {
            console.error("Error with audio recording:", error);
            return null;
        }
    };

    const handleDeleteNote = async (noteId: string) => {
        await deleteNote(noteId);
    };

    const renderEmptyState = () => (
        <View style={styles.emptyStateContainer}>
            <ThemedText style={styles.emptyStateTitle}>No Active Talk</ThemedText>
            <ThemedText style={styles.emptyStateDescription}>Create a new talk to start taking notes</ThemedText>
        </View>
    );

    if (isLoading) {
        return (
            <ThemedView style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
            </ThemedView>
        );
    }

    return (
        <MyKeyboardAvoidingView>
            <ThemedView style={styles.container}>
                <TalkHeader
                    conferenceName={currentConference?.name || "My Conference"}
                    talk={activeTalk}
                    onDone={handleTalkDone}
                />

                {activeTalk ? (
                    <FlatList
                        ref={flatListRef}
                        data={talkNotes}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => <NoteItem note={item} onDelete={handleDeleteNote} />}
                        contentContainerStyle={styles.notesList}
                        keyboardShouldPersistTaps="handled"
                        ListEmptyComponent={() => (
                            <View style={styles.emptyNotesContainer}>
                                <ThemedText style={styles.emptyNotesText}>
                                    No notes yet. Start taking notes for this talk.
                                </ThemedText>
                            </View>
                        )}
                    />
                ) : (
                    renderEmptyState()
                )}

                <View style={[styles.inputWrapper, { borderColor: borderLight }]}>
                    <NoteInput
                        onSubmitNote={handleSubmitNote}
                        onTakePhoto={handleTakePhoto}
                        onRecordAudio={handleRecordAudio}
                        isRecording={isRecording}
                        disabled={!activeTalk}
                    />
                </View>
            </ThemedView>
        </MyKeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    notesList: {
        flexGrow: 1,
        paddingBottom: 16,
        paddingTop: 4,
    },
    emptyStateContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
    },
    emptyStateTitle: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 8,
        textAlign: "center",
    },
    emptyStateDescription: {
        fontSize: 16,
        textAlign: "center",
        opacity: 0.7,
    },
    emptyNotesContainer: {
        padding: 24,
        alignItems: "center",
    },
    emptyNotesText: {
        fontSize: 16,
        textAlign: "center",
        opacity: 0.7,
    },
    inputWrapper: {
        borderWidth: 1,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        borderBottomWidth: 0,
        marginHorizontal: -1,
        overflow: "hidden",
    },
});
