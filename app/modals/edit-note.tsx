import React, { useState, useEffect } from "react";
import {
    StyleSheet,
    View,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Image,
    Alert,
    ActivityIndicator,
    Pressable,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Audio } from "expo-av";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useApp } from "@/context/AppContext";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Note } from "@/types";

export default function EditNoteModal() {
    const { noteId } = useLocalSearchParams<{ noteId: string }>();
    const [note, setNote] = useState<Note | null>(null);
    const [textContent, setTextContent] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [playingIndex, setPlayingIndex] = useState<number | null>(null);

    const { notes, updateNote } = useApp();

    const tintColor = useThemeColor({}, "tint");
    const backgroundColor = useThemeColor({}, "background");
    const textColor = useThemeColor({}, "text");

    useEffect(() => {
        if (noteId) {
            const foundNote = notes.find((n) => n.id === noteId);
            if (foundNote) {
                setNote(foundNote);
                setTextContent(foundNote.textContent);
            } else {
                Alert.alert("Error", "Note not found");
                router.back();
            }
        }
    }, [noteId, notes]);

    useEffect(() => {
        // Clean up sound when component unmounts
        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [sound]);

    const handleSave = async () => {
        if (!note) return;

        try {
            setIsSaving(true);

            // Update the note
            const updatedNote: Note = {
                ...note,
                textContent: textContent.trim(),
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

    const handleDeleteImage = (index: number) => {
        if (!note) return;

        Alert.alert("Delete Image", "Are you sure you want to remove this image?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: () => {
                    const updatedImages = [...note.images];
                    updatedImages.splice(index, 1);
                    setNote({
                        ...note,
                        images: updatedImages,
                    });
                },
            },
        ]);
    };

    const handleDeleteAudio = (index: number) => {
        if (!note) return;

        Alert.alert("Delete Audio", "Are you sure you want to remove this audio recording?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: () => {
                    // Stop playback if this is the current audio
                    if (playingIndex === index && sound) {
                        sound.stopAsync().then(() => {
                            sound.unloadAsync();
                            setSound(null);
                            setIsPlaying(false);
                            setPlayingIndex(null);

                            // Update note
                            const updatedRecordings = [...note.audioRecordings];
                            updatedRecordings.splice(index, 1);
                            setNote({
                                ...note,
                                audioRecordings: updatedRecordings,
                            });
                        });
                    } else {
                        // Just update note
                        const updatedRecordings = [...note.audioRecordings];
                        updatedRecordings.splice(index, 1);
                        setNote({
                            ...note,
                            audioRecordings: updatedRecordings,
                        });
                    }
                },
            },
        ]);
    };

    const handlePlayPauseAudio = async (uri: string, index: number) => {
        // If a sound is already playing, stop it
        if (sound && isPlaying) {
            await sound.stopAsync();
            await sound.unloadAsync();
            setSound(null);
            setIsPlaying(false);
            setPlayingIndex(null);

            // If we're trying to pause the currently playing audio, just return
            if (playingIndex === index) {
                return;
            }
        }

        try {
            const { sound: newSound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });

            setSound(newSound);
            setIsPlaying(true);
            setPlayingIndex(index);

            // When playback finishes
            newSound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                    setIsPlaying(false);
                    setPlayingIndex(null);
                    newSound.unloadAsync();
                    setSound(null);
                }
            });
        } catch (error) {
            console.error("Error playing audio:", error);
            Alert.alert("Error", "Failed to play audio recording.");
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

                <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: tintColor }]}
                    onPress={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <ThemedText
                            style={[styles.saveText, { color: backgroundColor }]}
                            lightColor="#fff"
                            darkColor="#fff"
                        >
                            Save
                        </ThemedText>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {note.images.length > 0 && (
                    <View style={styles.imagesSection}>
                        <ThemedText style={styles.sectionTitle}>Images</ThemedText>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesContainer}>
                            {note.images.map((image, index) => (
                                <View key={`image-${index}`} style={styles.imageWrapper}>
                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPress={() => {
                                            // TODO: here is no edit possible
                                            // Pass both the primary image and original if available
                                            const params: any = {
                                                imageUri: encodeURIComponent(image.uri),
                                            };

                                            // If this is a transformed image with original and corners
                                            if (image.originalUri && image.corners) {
                                                params.originalUri = encodeURIComponent(image.originalUri);
                                                // Pass the saved corners as JSON string
                                                params.savedCorners = encodeURIComponent(JSON.stringify(image.corners));
                                            }

                                            router.push({
                                                pathname: "/modals/image-view",
                                                params,
                                            });
                                        }}
                                    >
                                        <Image source={{ uri: image.uri }} style={styles.image} resizeMode="cover" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.deleteImageButton}
                                        onPress={() => handleDeleteImage(index)}
                                    >
                                        <IconSymbol name="xmark.circle.fill" size={24} color="#FF3B30" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {note.audioRecordings.length > 0 && (
                    <View style={styles.audioSection}>
                        <ThemedText style={styles.sectionTitle}>Audio Recordings</ThemedText>
                        {note.audioRecordings.map((audioUri, index) => (
                            <View key={`audio-${index}`} style={styles.audioItem}>
                                <Pressable
                                    style={({ pressed }) => [styles.audioPlayer, pressed && styles.buttonPressed]}
                                    onPress={() => handlePlayPauseAudio(audioUri, index)}
                                >
                                    <View style={[styles.playButton, { backgroundColor: tintColor }]}>
                                        <IconSymbol
                                            name={isPlaying && playingIndex === index ? "pause.fill" : "play.fill"}
                                            size={14}
                                            color="#fff"
                                        />
                                    </View>
                                    <ThemedText style={styles.audioLabel}>Audio Recording {index + 1}</ThemedText>
                                    {isPlaying && playingIndex === index && (
                                        <View style={styles.playingIndicator}>
                                            <ThemedText style={{ color: tintColor }}>Playing</ThemedText>
                                        </View>
                                    )}
                                </Pressable>

                                <TouchableOpacity
                                    style={styles.deleteAudioButton}
                                    onPress={() => handleDeleteAudio(index)}
                                >
                                    <IconSymbol name="trash" size={20} color="#FF3B30" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}

                <View style={styles.textSection}>
                    <ThemedText style={styles.sectionTitle}>Note Text</ThemedText>
                    <TextInput
                        style={[styles.textInput, { color: textColor }]}
                        value={textContent}
                        onChangeText={setTextContent}
                        multiline
                        placeholder="Enter note text..."
                        placeholderTextColor={textColor + "60"}
                    />
                </View>
            </ScrollView>
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
    saveButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    saveText: {
        fontSize: 17,
        fontWeight: "600",
    },
    content: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: "600",
        marginBottom: 8,
    },
    imagesSection: {
        marginBottom: 24,
    },
    imagesContainer: {
        flexDirection: "row",
        paddingTop: 8,
    },
    imageWrapper: {
        position: "relative",
        marginRight: 12,
    },
    image: {
        height: 140,
        aspectRatio: 1.6,
        borderRadius: 8,
    },
    deleteImageButton: {
        position: "absolute",
        top: -8,
        right: -8,
        backgroundColor: "white",
        borderRadius: 12,
    },
    audioSection: {
        marginBottom: 24,
    },
    audioItem: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    audioPlayer: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: "rgba(150, 150, 150, 0.1)",
    },
    playButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    audioLabel: {
        flex: 1,
        fontSize: 14,
    },
    playingIndicator: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    deleteAudioButton: {
        padding: 12,
        marginLeft: 8,
    },
    textSection: {
        marginBottom: 24,
    },
    textInput: {
        minHeight: 100,
        borderWidth: 1,
        borderColor: "rgba(150, 150, 150, 0.3)",
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        textAlignVertical: "top",
    },
    buttonPressed: {
        opacity: 0.7,
    },
});
