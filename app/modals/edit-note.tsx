import React, { useState, useEffect } from "react";
import { StyleSheet, View, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams, router } from "expo-router";

import { ThemedView } from "@/components/ThemedView";
import { NoteInput } from "@/components/note/NoteInput";
import { useApp } from "@/context/AppContext";
import { Note, NoteImage } from "@/types";

export default function EditNoteModal() {
    const { noteId } = useLocalSearchParams<{ noteId: string }>();
    const [note, setNote] = useState<Note | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const { notes, isRecording, updateNote, addImageNote, addAudioNote, stopAudioRecording, deleteImage } = useApp();

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

    const handleDeletedImages = async (initialImages: NoteImage[], currentImages: NoteImage[]) => {
        const currentImageUris = new Set(currentImages.map((img) => img.uri));
        const deletedImages = initialImages.filter((img) => !currentImageUris.has(img.uri));

        for (const deletedImage of deletedImages) {
            try {
                await deleteImage(deletedImage.uri);
                if (deletedImage.originalUri) {
                    await deleteImage(deletedImage.originalUri);
                }
            } catch (error) {
                console.error("Error deleting image:", deletedImage.uri, error);
            }
        }
    };

    const handleUpdateNote = async (text: string, images: NoteImage[], audioRecordings: string[]) => {
        if (!note) return;

        try {
            setIsSaving(true);

            // Handle deleted images
            await handleDeletedImages(note.images, images);

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
        <KeyboardAvoidingView 
            style={styles.backdrop} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.spacer} onTouchEnd={handleCancel} />
            <ThemedView style={styles.container}>
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
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
    },
    spacer: {
        flex: 1,
    },
    container: {
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        maxHeight: "70%",
        minHeight: 180,
        paddingTop: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
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
        paddingBottom: 16,
    },
});
