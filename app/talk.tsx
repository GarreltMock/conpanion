import { format } from "date-fns";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View } from "react-native";

import { MyKeyboardAvoidingView } from "@/components/MyKeyboardAvoidingView";
import { NoteInput } from "@/components/note/NoteInput";
import { NoteItem } from "@/components/note/NoteItem";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useApp } from "@/context/AppContext";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Note, NoteImage, Talk } from "@/types";

export default function TalkDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [talk, setTalk] = useState<Talk | null>(null);
    const [talkNotes, setTalkNotes] = useState<Note[]>([]);

    const {
        talks,
        currentConference,
        addCombinedNote,
        addImageNote,
        stopAudioRecording,
        getNotesForTalk,
        addAudioNote,
        deleteNote,
        isLoading,
        isRecording,
    } = useApp();

    const textColor = useThemeColor({}, "text");

    useEffect(() => {
        if (id) {
            const foundTalk = talks.find((t) => t.id === id);
            if (foundTalk) {
                setTalk(foundTalk);
                const notes = getNotesForTalk(foundTalk.id);
                setTalkNotes(notes);
            }
        }
    }, [id, talks, getNotesForTalk]);

    const handleBack = () => {
        router.back();
    };

    const formatDuration = (startTime: Date, endTime?: Date) => {
        if (!endTime) return "Ongoing";

        const durationMs = endTime.getTime() - startTime.getTime();
        const minutes = Math.floor(durationMs / (1000 * 60));

        if (minutes < 60) {
            return `${minutes} min`;
        } else {
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            return `${hours}h ${remainingMinutes}m`;
        }
    };

    const handleSubmitNote = async (text: string, images: NoteImage[], audioRecordings: string[]) => {
        if (!text.trim() && images.length === 0 && audioRecordings.length === 0) return;
        await addCombinedNote(text, images, audioRecordings);
    };

    // Handle taking a photo
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
                console.log("Audio recording stopped, URI:", audioUri);
                return audioUri;
            } else {
                Ö;
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

    if (isLoading || !talk) {
        return (
            <ThemedView style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
            </ThemedView>
        );
    }

    return (
        <MyKeyboardAvoidingView>
            <ThemedView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                        <IconSymbol name="chevron.left" size={24} color={textColor} />
                        <ThemedText style={styles.backText}>Talks</ThemedText>
                    </TouchableOpacity>
                </View>

                <View style={styles.talkHeader}>
                    <ThemedText style={styles.conferenceName}>{currentConference?.name || "My Conference"}</ThemedText>
                    <ThemedText style={styles.talkTitle}>{talk.title}</ThemedText>
                    <View style={styles.talkDetails}>
                        <View style={styles.detailItem}>
                            <IconSymbol name="calendar" size={16} color={textColor + "80"} style={styles.detailIcon} />
                            <ThemedText style={styles.detailText}>{format(talk.startTime, "MMM d, yyyy")}</ThemedText>
                        </View>
                        <View style={styles.detailItem}>
                            <IconSymbol name="clock" size={16} color={textColor + "80"} style={styles.detailIcon} />
                            <ThemedText style={styles.detailText}>{format(talk.startTime, "h:mm a")}</ThemedText>
                        </View>
                        <View style={styles.detailItem}>
                            <IconSymbol name="timer" size={16} color={textColor + "80"} style={styles.detailIcon} />
                            <ThemedText style={styles.detailText}>
                                {formatDuration(talk.startTime, talk.endTime)}
                            </ThemedText>
                        </View>
                    </View>
                </View>

                <View style={styles.notesSectionHeader}>
                    <ThemedText style={styles.notesTitle}>Notes</ThemedText>
                    <ThemedText style={styles.notesCount}>
                        {talkNotes.length} {talkNotes.length === 1 ? "note" : "notes"}
                    </ThemedText>
                </View>

                <FlatList
                    data={talkNotes}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => <NoteItem note={item} onDelete={handleDeleteNote} />}
                    contentContainerStyle={styles.notesList}
                    keyboardShouldPersistTaps="handled"
                    ListEmptyComponent={() => (
                        <View style={styles.emptyContainer}>
                            <ThemedText style={styles.emptyText}>No notes available for this talk</ThemedText>
                        </View>
                    )}
                />

                <View style={styles.inputWrapper}>
                    <NoteInput
                        onSubmitNote={handleSubmitNote}
                        onTakePhoto={handleTakePhoto}
                        onRecordAudio={handleRecordAudio}
                        isRecording={isRecording}
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
    header: {
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
    },
    backButton: {
        flexDirection: "row",
        alignItems: "center",
    },
    backText: {
        fontSize: 17,
        marginLeft: 4,
    },
    talkHeader: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(150, 150, 150, 0.2)",
    },
    conferenceName: {
        fontSize: 14,
        opacity: 0.7,
        marginBottom: 4,
    },
    talkTitle: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 12,
    },
    talkDetails: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    detailItem: {
        flexDirection: "row",
        alignItems: "center",
        marginRight: 16,
        marginBottom: 8,
    },
    detailIcon: {
        marginRight: 4,
    },
    detailText: {
        fontSize: 14,
        opacity: 0.7,
    },
    notesSectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(150, 150, 150, 0.1)",
    },
    notesTitle: {
        fontSize: 18,
        fontWeight: "600",
    },
    notesCount: {
        fontSize: 14,
        opacity: 0.7,
    },
    notesList: {
        flexGrow: 1,
        paddingBottom: 16,
    },
    emptyContainer: {
        padding: 24,
        alignItems: "center",
    },
    emptyText: {
        fontSize: 16,
        textAlign: "center",
        opacity: 0.7,
    },
    inputWrapper: {
        borderTopWidth: 1,
        borderTopColor: "rgba(150, 150, 150, 0.2)",
    },
});
