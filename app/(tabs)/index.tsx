import React, { useEffect, useState } from "react";
import { StyleSheet, FlatList, View, ActivityIndicator } from "react-native";
import { router } from "expo-router";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { TalkHeader } from "@/components/note/TalkHeader";
import { NoteInput } from "@/components/note/NoteInput";
import { NoteItem } from "@/components/note/NoteItem";
import { useApp } from "@/context/AppContext";
import { Note } from "@/types";

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

    useEffect(() => {
        if (activeTalk) {
            const notesForTalk = getNotesForTalk(activeTalk.id);
            setTalkNotes(notesForTalk);
        } else {
            setTalkNotes([]);
        }
    }, [activeTalk, notes, getNotesForTalk]);

    const handleTalkDone = async () => {
        await endCurrentTalk();
        router.push("/modals/new-talk");
    };

    // Handle combined note submission (text, images, audio)
    const handleSubmitNote = async (
        text: string,
        images: string[],
        audioRecordings: string[]
    ) => {
        if (!text.trim() && images.length === 0 && audioRecordings.length === 0)
            return;
        await addCombinedNote(text, images, audioRecordings);
    };

    // Handle taking a photo
    const handleTakePhoto = async (): Promise<string> => {
        try {
            return await addImageNote();
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
            <ThemedText style={styles.emptyStateTitle}>
                No Active Talk
            </ThemedText>
            <ThemedText style={styles.emptyStateDescription}>
                Create a new talk to start taking notes
            </ThemedText>
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
        <ThemedView style={styles.container}>
            <TalkHeader
                conferenceName={currentConference?.name || "My Conference"}
                talk={activeTalk}
                onDone={handleTalkDone}
            />

            {activeTalk ? (
                <FlatList
                    data={talkNotes}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <NoteItem note={item} onDelete={handleDeleteNote} />
                    )}
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

            <NoteInput
                onSubmitNote={handleSubmitNote}
                onTakePhoto={handleTakePhoto}
                onRecordAudio={handleRecordAudio}
                isRecording={isRecording}
                disabled={!activeTalk}
            />
        </ThemedView>
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
});
