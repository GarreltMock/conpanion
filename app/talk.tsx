import { format } from "date-fns";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View, Image, Text, ScrollView } from "react-native";

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
    const [detailsExpanded, setDetailsExpanded] = useState(false);

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
        toggleTalkSelection,
    } = useApp();

    const textColor = useThemeColor({}, "text");
    const tintColor = useThemeColor({}, "tint");
    const backgroundColor = useThemeColor({}, "background");

    useEffect(() => {
        if (id) {
            const foundTalk = talks.find((t) => t.id === id);
            if (foundTalk) {
                setTalk(foundTalk);
                const notes = getNotesForTalk(foundTalk.id);
                setTalkNotes(notes);
                // Set details expanded based on user selection - expand if NOT user selected
                setDetailsExpanded(!foundTalk.isUserSelected);
            }
        }
    }, [id, talks, getNotesForTalk]);

    const handleBack = () => {
        router.back();
    };

    const formatDuration = (duration?: number) => {
        if (!duration) return "Ongoing";

        if (duration < 60) {
            return `${duration} min`;
        } else {
            const hours = Math.floor(duration / 60);
            const remainingMinutes = duration % 60;
            return `${hours}h ${remainingMinutes}m`;
        }
    };

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

    const handleAddToUserTalks = async () => {
        if (!talk) return;
        try {
            await toggleTalkSelection(talk.id);
        } catch (error) {
            console.error("Error adding talk to user talks:", error);
        }
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
                    <ThemedText style={styles.talkTitle}>{talk.title}</ThemedText>
                    <View style={styles.talkDetails}>
                        <View style={styles.detailItem}>
                            <IconSymbol name="calendar" size={16} color={textColor + "80"} style={styles.detailIcon} />
                            <ThemedText style={styles.detailText}>{format(talk.startTime, "MMM d, yyyy")}</ThemedText>
                        </View>
                        <View style={styles.detailItem}>
                            <IconSymbol name="clock" size={16} color={textColor + "80"} style={styles.detailIcon} />
                            <ThemedText style={styles.detailText}>{format(talk.startTime, "HH:mm")}</ThemedText>
                        </View>
                        <View style={styles.detailItem}>
                            <IconSymbol name="timer" size={16} color={textColor + "80"} style={styles.detailIcon} />
                            <ThemedText style={styles.detailText}>{formatDuration(talk.duration)}</ThemedText>
                        </View>
                    </View>
                </View>

                {/* Talk Details Section - Collapsible only if user selected */}
                {(talk.speakers?.length || talk.stage || talk.description) && (
                    <View style={[styles.detailsSection, detailsExpanded && { flex: 1 }]}>
                        {talk.isUserSelected ? (
                            <TouchableOpacity
                                style={styles.detailsToggle}
                                onPress={() => setDetailsExpanded(!detailsExpanded)}
                            >
                                <ThemedText style={styles.detailsToggleText}>Talk Details</ThemedText>
                                <IconSymbol
                                    name={detailsExpanded ? "chevron.up" : "chevron.down"}
                                    size={16}
                                    color={textColor + "80"}
                                />
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.detailsToggle}>
                                <ThemedText style={styles.detailsToggleText}>Talk Details</ThemedText>
                            </View>
                        )}

                        {detailsExpanded && (
                            <ScrollView
                                contentContainerStyle={styles.detailsContent}
                                showsVerticalScrollIndicator={true}
                            >
                                {/* Speakers */}
                                {talk.speakers && talk.speakers.length > 0 && (
                                    <View style={styles.talkDetailItem}>
                                        <View style={styles.talkDetailHeader}>
                                            <IconSymbol
                                                name="person.2"
                                                size={16}
                                                color={textColor + "80"}
                                                style={styles.talkDetailIcon}
                                            />
                                            <ThemedText style={styles.talkDetailLabel}>
                                                {talk.speakers.length === 1 ? "Speaker" : "Speakers"}
                                            </ThemedText>
                                        </View>
                                        <View style={styles.speakersContainer}>
                                            {talk.speakers.map((speaker, index) => (
                                                <View key={index} style={styles.speakerItem}>
                                                    <View style={styles.speakerContent}>
                                                        {speaker.photo && (
                                                            <Image
                                                                source={{ uri: speaker.photo }}
                                                                style={styles.speakerPhoto}
                                                                resizeMode="cover"
                                                            />
                                                        )}
                                                        <View style={styles.speakerTextContent}>
                                                            <ThemedText style={styles.speakerName}>
                                                                {speaker.name}
                                                            </ThemedText>
                                                            {speaker.bio && (
                                                                <ThemedText style={styles.speakerBio}>
                                                                    {speaker.bio}
                                                                </ThemedText>
                                                            )}
                                                        </View>
                                                    </View>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                )}

                                {/* Stage/Location */}
                                {talk.stage && (
                                    <View style={styles.talkDetailItem}>
                                        <View style={styles.talkDetailHeader}>
                                            <IconSymbol
                                                name="location"
                                                size={16}
                                                color={textColor + "80"}
                                                style={styles.talkDetailIcon}
                                            />
                                            <ThemedText style={styles.talkDetailLabel}>Location</ThemedText>
                                        </View>
                                        <ThemedText style={styles.talkDetailValue}>{talk.stage}</ThemedText>
                                    </View>
                                )}

                                {/* Description */}
                                {talk.description && (
                                    <View style={styles.talkDetailItem}>
                                        <View style={styles.talkDetailHeader}>
                                            <IconSymbol
                                                name="doc.text"
                                                size={16}
                                                color={textColor + "80"}
                                                style={styles.talkDetailIcon}
                                            />
                                            <ThemedText style={styles.talkDetailLabel}>Description</ThemedText>
                                        </View>
                                        <ThemedText style={styles.talkDetailValue}>{talk.description}</ThemedText>
                                    </View>
                                )}
                            </ScrollView>
                        )}
                    </View>
                )}

                {talk.isUserSelected && !detailsExpanded ? (
                    <>
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
                    </>
                ) : !talk.isUserSelected ? (
                    <>
                        <View style={styles.addToUserTalksWrapper}>
                            <TouchableOpacity
                                style={[styles.addToUserTalksButton, { backgroundColor: tintColor }]}
                                onPress={handleAddToUserTalks}
                                activeOpacity={0.8}
                            >
                                <IconSymbol name="bookmark.fill" size={20} color={backgroundColor} />
                                <Text style={[styles.addToUserTalksText, { color: backgroundColor }]}>
                                    Add to My Talks
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </>
                ) : (
                    <></>
                )}
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
        borderWidth: 1,
        borderColor: "rgba(150, 150, 150, 0.2)",
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        borderBottomWidth: 0,
        marginHorizontal: -1,
        overflow: "hidden",
        marginBottom: 16,
    },
    detailsSection: {
        // flex: 1,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(150, 150, 150, 0.2)",
    },
    detailsToggle: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: "rgba(150, 150, 150, 0.05)",
    },
    detailsToggleText: {
        fontSize: 16,
        fontWeight: "600",
    },
    detailsContent: {
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    talkDetailItem: {
        marginBottom: 16,
    },
    talkDetailHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    talkDetailIcon: {
        marginRight: 8,
    },
    talkDetailLabel: {
        fontSize: 14,
        fontWeight: "600",
        opacity: 0.8,
    },
    talkDetailValue: {
        fontSize: 14,
        opacity: 0.7,
        lineHeight: 20,
        marginLeft: 24,
    },
    speakersContainer: {
        marginLeft: 24,
    },
    speakerItem: {
        marginBottom: 12,
    },
    speakerContent: {
        flexDirection: "row",
        alignItems: "flex-start",
    },
    speakerPhoto: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
        backgroundColor: "rgba(150, 150, 150, 0.1)",
    },
    speakerTextContent: {
        flex: 1,
    },
    speakerName: {
        fontSize: 14,
        fontWeight: "500",
        marginBottom: 4,
    },
    speakerBio: {
        fontSize: 13,
        opacity: 0.7,
        lineHeight: 18,
        fontStyle: "italic",
    },
    emptyNotesContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
        paddingVertical: 48,
    },
    emptyNotesTitle: {
        fontSize: 20,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 12,
    },
    emptyNotesDescription: {
        fontSize: 16,
        textAlign: "center",
        opacity: 0.7,
        lineHeight: 22,
    },
    addToUserTalksWrapper: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: "rgba(150, 150, 150, 0.2)",
    },
    addToUserTalksButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    addToUserTalksText: {
        fontSize: 17,
        fontWeight: "600",
        marginLeft: 8,
    },
});
