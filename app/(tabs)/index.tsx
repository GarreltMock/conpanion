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
        addTextNote,
        addImageNote,
        addAudioNote,
        stopAudioRecording,
        deleteNote,
        getNotesForTalk,
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

    const handleNewTalk = () => {
        router.push("/modals/new-talk");
    };

    const handleSubmitText = async (text: string) => {
        if (!text.trim()) return;
        await addTextNote(text);
    };

    const handleTakePhoto = async () => {
        await addImageNote();
    };

    const handleRecordAudio = async () => {
        if (isRecording) {
            await stopAudioRecording();
        } else {
            await addAudioNote();
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
                onNewTalk={handleNewTalk}
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
                onSubmitText={handleSubmitText}
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
