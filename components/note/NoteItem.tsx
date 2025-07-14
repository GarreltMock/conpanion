import { format } from "date-fns";
import { Audio } from "expo-av";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Image,
    Linking,
    Pressable,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
    ActionSheetIOS,
} from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useApp } from "@/context/AppContext";
import { useImageTransformNotification } from "@/context/ImageTransformContext";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Note } from "@/types";
import { getAbsolutePath } from "@/storage/helper";

interface NoteItemProps {
    note: Note;
    onDelete?: (noteId: string) => Promise<void>;
    readOnly?: boolean;
}

export const NoteItem: React.FC<NoteItemProps> = ({ note, onDelete, readOnly = false }) => {
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [playingIndex, setPlayingIndex] = useState<number | null>(null);

    const tintColor = useThemeColor({}, "tint");

    const { updateNote } = useApp();
    const { lastTransformedImage, clearLastTransformed } = useImageTransformNotification();

    // Listen for image transformations and update this note if it contains the transformed image
    useEffect(() => {
        if (lastTransformedImage) {
            // Check if this note contains the image that was transformed
            const hasTransformedImage = note.images.some((img) => img.uri === lastTransformedImage.originalImageUri);

            if (hasTransformedImage) {
                const updatedImages = note.images.map((img) => {
                    if (img.uri === lastTransformedImage.originalImageUri) {
                        return {
                            ...img,
                            uri: lastTransformedImage.newImageUri,
                            originalUri: lastTransformedImage.originalUri,
                            corners: lastTransformedImage.corners,
                            links: lastTransformedImage.detectedUrls,
                        };
                    }
                    return img;
                });

                const updatedNote: Note = {
                    ...note,
                    images: updatedImages,
                };

                updateNote(updatedNote).catch((error) => console.error("NoteItem: Note update failed:", error));

                clearLastTransformed();
            }
        }
    }, [lastTransformedImage, note, updateNote, clearLastTransformed]);

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
            // Ensure audio session is configured for playback
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
                shouldDuckAndroid: true,
                playThroughEarpieceAndroid: false,
            });

            const audioUri = getAbsolutePath(uri);
            const { sound: newSound } = await Audio.Sound.createAsync({ uri: audioUri }, { shouldPlay: true });

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

    const handleEditNote = () => {
        router.push({
            pathname: "/modals/edit-note",
            params: { noteId: note.id },
        });
    };

    const handleDeleteNote = () => {
        if (!onDelete) return;

        Alert.alert("Delete Note", "Are you sure you want to delete this note?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: () => onDelete(note.id),
            },
        ]);
    };

    const handleOpenLink = async (url: string) => {
        try {
            const canOpen = await Linking.canOpenURL(url);
            if (canOpen) {
                await Linking.openURL(url);
            } else {
                Alert.alert("Error", "Cannot open this URL");
            }
        } catch (error) {
            console.error("Error opening URL:", error);
            Alert.alert("Error", "Failed to open URL");
        }
    };

    const handleLongPress = () => {
        if (readOnly) return;

        ActionSheetIOS.showActionSheetWithOptions(
            {
                options: ["Cancel", "Edit", "Delete"],
                destructiveButtonIndex: 2,
                cancelButtonIndex: 0,
            },
            (buttonIndex) => {
                if (buttonIndex === 1) {
                    handleEditNote();
                } else if (buttonIndex === 2) {
                    handleDeleteNote();
                }
            }
        );
    };

    const handlePress = () => {
        if (readOnly) return;
        handleEditNote();
    };

    return (
        <Pressable
            style={({ pressed }) => [styles.container, pressed && styles.containerPressed]}
            onPress={handlePress}
            onLongPress={handleLongPress}
        >
            <ThemedView style={styles.content}>
                {note.images.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesContainer}>
                        {note.images.map((image, index) => (
                            <TouchableOpacity
                                key={`image-${index}`}
                                activeOpacity={0.9}
                                onPress={() => {
                                    // Pass both the primary image and original if available
                                    const imageAbsoluteUri = getAbsolutePath(image.uri);
                                    const params: any = {
                                        imageUri: encodeURIComponent(imageAbsoluteUri),
                                    };

                                    // If this is a transformed image with original and corners
                                    if (image.originalUri && image.corners) {
                                        const originalAbsoluteUri = getAbsolutePath(image.originalUri);
                                        params.originalUri = encodeURIComponent(originalAbsoluteUri);
                                        // Pass the saved corners as JSON string
                                        params.savedCorners = encodeURIComponent(JSON.stringify(image.corners));
                                    }

                                    router.push({
                                        pathname: "/modals/image-view",
                                        params,
                                    });
                                }}
                            >
                                <Image
                                    source={{ uri: getAbsolutePath(image.uri) }}
                                    style={styles.image}
                                    resizeMode="cover"
                                />
                                {image.originalUri && (
                                    <View style={[styles.transformedIndicator, { backgroundColor: `${tintColor}CC` }]}>
                                        <IconSymbol name="wand.and.stars" size={12} color="#fff" />
                                    </View>
                                )}
                                {image.links && image.links.length > 0 && (
                                    <View style={[styles.linkIndicator, { backgroundColor: `${tintColor}CC` }]}>
                                        <IconSymbol name="link" size={12} color="#fff" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}

                {/* Links section - display all links from all images */}
                {note.images.some((image) => image.links && image.links.length > 0) && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.linksContainer}>
                        {note.images.flatMap(
                            (image, imageIndex) =>
                                image.links?.map((link, linkIndex) => (
                                    <TouchableOpacity
                                        key={`link-${imageIndex}-${linkIndex}`}
                                        style={[styles.linkItem, { backgroundColor: `${tintColor}20` }]}
                                        onPress={() => handleOpenLink(link)}
                                    >
                                        <IconSymbol name="link" size={14} color={tintColor} />
                                        <ThemedText style={styles.linkText} numberOfLines={1}>
                                            {link.replace(/^https?:\/\//, "").replace(/\/.*/, "")}
                                        </ThemedText>
                                    </TouchableOpacity>
                                )) || []
                        )}
                    </ScrollView>
                )}

                {note.audioRecordings.length > 0 && (
                    <View style={styles.audioContainer}>
                        {note.audioRecordings.map((audioUri, index) => (
                            <Pressable
                                key={`audio-${index}`}
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
                        ))}
                    </View>
                )}

                <View style={styles.bottomRow}>
                    <View style={styles.textContainer}>
                        {note.textContent.trim() !== "" && (
                            <ThemedText style={styles.textContent}>{note.textContent}</ThemedText>
                        )}
                    </View>
                    <View style={styles.timestampContainer}>
                        <ThemedText style={styles.timestamp}>{format(note.timestamp, "HH:mm")}</ThemedText>
                    </View>
                </View>
            </ThemedView>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 4,
        marginHorizontal: 16,
        borderRadius: 12,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(150, 150, 150, 0.2)",
    },
    containerPressed: {
        opacity: 0.7,
    },
    content: {
        paddingVertical: 4,
    },
    bottomRow: {
        width: "100%",
        flexDirection: "row",
        alignItems: "flex-end",
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    timestampContainer: {
        flexShrink: 1,
        flexBasis: "auto",
        marginLeft: 8,
        alignSelf: "flex-end",
        marginBottom: -8,
        marginRight: -6,
    },
    timestamp: {
        fontSize: 12,
        opacity: 0.7,
    },
    buttonPressed: {
        opacity: 0.7,
    },
    imagesContainer: {
        flexDirection: "row",
        paddingVertical: 4,
        paddingHorizontal: 12,
    },
    image: {
        height: 80,
        aspectRatio: 1.6,
        borderRadius: 8,
        marginRight: 8,
    },
    transformedIndicator: {
        position: "absolute",
        bottom: 4,
        right: 12,
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    linkIndicator: {
        position: "absolute",
        bottom: 28,
        right: 12,
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    linksContainer: {
        flexDirection: "row",
        paddingVertical: 4,
        paddingHorizontal: 12,
    },
    linkItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginRight: 8,
    },
    linkText: {
        fontSize: 12,
        marginLeft: 6,
        flex: 1,
    },
    audioContainer: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        flexDirection: "column",
        gap: 8,
    },
    audioPlayer: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: "rgba(150, 150, 150, 0.2)",
        paddingHorizontal: 12,
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
    textContainer: {
        flex: 1,
        paddingRight: 8,
    },
    textContent: {
        fontSize: 16,
        lineHeight: 22,
    },
});
