import React, { useState, useEffect } from "react";
import { StyleSheet, View, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { NoteInput } from "@/components/note/NoteInput";
import { useApp } from "@/context/AppContext";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Note, NoteImage } from "@/types";

export default function EditNoteModal() {
    const { noteId } = useLocalSearchParams<{ noteId: string }>();
    const [note, setNote] = useState<Note | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const { notes, isRecording, updateNote, addImageNote, addAudioNote, stopAudioRecording } = useApp();

    const tintColor = useThemeColor({}, "tint");

    useEffect(() => {
        if (noteId) {
            const foundNote = notes.find((n) => n.id === noteId);
            if (foundNote) {
                setNote(foundNote);
            } else {
                Alert.alert("Error", "Note not found");
                router.back();
            }
        }
    }, [noteId, notes]);

    const handleUpdateNote = async (text: string, images: NoteImage[], audioRecordings: string[]) => {
        if (!note) return;

        try {
            setIsSaving(true);

            // Update the note
            const updatedNote: Note = {
                ...note,
                textContent: text.trim(),
                images: images,
                audioRecordings: audioRecordings,
            };

            await updateNote(updatedNote);
            router.back();
        } catch (error) {
            console.error("Error updating note:", error);
            Alert.alert("Error", "Failed to update note. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        router.back();
    };

    const handleTakePhoto = async (fromGallery: boolean): Promise<string> => {
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

    if (!note) {
        return (
            <ThemedView style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} disabled={isSaving}>
                    <ThemedText style={styles.cancelText}>Cancel</ThemedText>
                </TouchableOpacity>

                <ThemedText style={styles.title}>Edit Note</ThemedText>

                {isSaving && <ActivityIndicator size="small" color={tintColor} />}
            </View>

            <View style={styles.content}>
                <NoteInput
                    onTakePhoto={handleTakePhoto}
                    onRecordAudio={handleRecordAudio}
                    onSubmitNote={handleUpdateNote}
                    isRecording={isRecording}
                    disabled={isSaving}
                    initialText={note.textContent}
                    initialAudio={note.audioRecordings}
                    initialImages={note.images}
                />
            </View>
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
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(150, 150, 150, 0.2)",
    },
    title: {
        fontSize: 17,
        fontWeight: "600",
    },
    cancelButton: {
        padding: 8,
    },
    cancelText: {
        fontSize: 17,
    },
    content: {
        flex: 1,
    },
});
