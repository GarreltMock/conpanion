import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { MyKeyboardAvoidingView } from "@/components/MyKeyboardAvoidingView";
import { ThemedView } from "@/components/ThemedView";
import { NoteInput } from "@/components/note/NoteInput";
import { useApp } from "@/context/AppContext";
import { useI18n } from "@/hooks/useI18n";
import { Note, NoteImage } from "@/types";
import { toast } from "sonner-native";

export default function EditNoteModal() {
    const { noteId } = useLocalSearchParams<{ noteId: string }>();
    const [note, setNote] = useState<Note | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const { notes, isRecording, updateNote, addImageNote, addAudioNote, stopAudioRecording, deleteImage } = useApp();
    const { t } = useI18n();

    useEffect(() => {
        if (noteId) {
            const foundNote = notes.find((n) => n.id === noteId);
            if (foundNote) {
                setNote(foundNote);
            } else {
                toast.error(t("errors.noteNotFound"));
                router.back();
            }
        }
    }, [noteId, notes, t]);

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
            toast.error(t("errors.updateNoteFailed"));
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        router.back();
    };

    const handleTakePhoto = async (fromGallery: boolean): Promise<string | null> => {
        try {
            if (!note) return null;
            return await addImageNote(note.talkId, fromGallery);
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
                if (!note) return null;
                const audioUri = await stopAudioRecording(note.talkId);
                return audioUri;
            } else {
                // Start recording
                if (!note) return null;
                await addAudioNote(note.talkId);
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
        <MyKeyboardAvoidingView style={styles.backdrop}>
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
                        autoFocus={true}
                    />
                </View>
            </ThemedView>
        </MyKeyboardAvoidingView>
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
