import { format } from "date-fns";
import { Audio } from "expo-av";
import { router } from "expo-router";
import React, { useState, useRef } from "react";
import {
    Alert,
    Image,
    Linking,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
    Dimensions,
} from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
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
    const [showSubmenu, setShowSubmenu] = useState<boolean>(false);
    const [submenuPosition, setSubmenuPosition] = useState<{ top: number; right: number }>({ top: 100, right: 16 });
    const containerRef = useRef<View>(null);

    const tintColor = useThemeColor({}, "tint");
    const whiteColor = useThemeColor({}, "white");
    const borderLightColor = useThemeColor({}, "borderLight");
    const backgroundOverlayColor = useThemeColor({}, "backgroundOverlay");
    const backgroundColor = useThemeColor({}, "background");

    // Format stored relative time for display
    const formatRelativeTime = () => {
        if (note.relativeTime === undefined) {
            return format(note.timestamp, "HH:mm");
        }

        const totalSeconds = note.relativeTime;
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
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

        containerRef.current?.measureInWindow((x, y, width, height) => {
            const screenHeight = Dimensions.get("window").height;
            const screenWidth = Dimensions.get("window").width;

            // Position the menu below the note item, towards the right
            const menuTop = y + height + 8; // 8px below the note
            const menuRight = screenWidth - (x + width); // Align with right edge of note

            // Adjust if menu would go off screen
            const adjustedTop = Math.min(menuTop, screenHeight - 200); // Prevent going off bottom
            const adjustedRight = Math.max(menuRight, 16); // Ensure minimum margin from right

            setSubmenuPosition({ top: adjustedTop, right: adjustedRight });
            setShowSubmenu(true);
        });
    };

    const handleEditNoteFromMenu = () => {
        setShowSubmenu(false);
        handleEditNote();
    };

    const handleDeleteNoteFromMenu = () => {
        setShowSubmenu(false);
        handleDeleteNote();
    };

    const handlePress = () => {
        if (readOnly) return;
        handleEditNote();
    };

    return (
        <Pressable
            ref={containerRef}
            style={({ pressed }) => [
                styles.container,
                { borderColor: borderLightColor },
                pressed && styles.containerPressed,
            ]}
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
                                        <IconSymbol name="wand.and.stars" size={12} color={backgroundColor} />
                                    </View>
                                )}
                                {image.links && image.links.length > 0 && (
                                    <View style={[styles.linkIndicator, { backgroundColor: `${tintColor}CC` }]}>
                                        <IconSymbol name="link" size={12} color={whiteColor} />
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
                                style={({ pressed }) => [
                                    styles.audioPlayer,
                                    { backgroundColor: backgroundOverlayColor },
                                    pressed && styles.buttonPressed,
                                ]}
                                onPress={() => handlePlayPauseAudio(audioUri, index)}
                            >
                                <View style={[styles.playButton, { backgroundColor: tintColor }]}>
                                    <IconSymbol
                                        name={isPlaying && playingIndex === index ? "pause.fill" : "play.fill"}
                                        size={14}
                                        color={whiteColor}
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
                        <ThemedText style={styles.timestamp}>{formatRelativeTime()}</ThemedText>
                    </View>
                </View>
            </ThemedView>

            <Modal
                visible={showSubmenu}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowSubmenu(false)}
            >
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowSubmenu(false)}>
                    <View
                        style={[
                            styles.submenu,
                            {
                                backgroundColor: backgroundColor,
                                borderColor: borderLightColor,
                                position: "absolute",
                                top: submenuPosition.top,
                                right: submenuPosition.right,
                            },
                        ]}
                    >
                        <TouchableOpacity style={styles.menuItem} onPress={handleEditNoteFromMenu}>
                            <IconSymbol name="pencil" size={20} color={tintColor} />
                            <ThemedText style={[styles.menuItemText, { color: tintColor }]}>Edit</ThemedText>
                        </TouchableOpacity>
                        <View style={[styles.menuSeparator, { backgroundColor: borderLightColor }]} />
                        <TouchableOpacity style={styles.menuItem} onPress={handleDeleteNoteFromMenu}>
                            <IconSymbol name="trash" size={20} color="#FF3B30" />
                            <ThemedText style={[styles.menuItemText, { color: "#FF3B30" }]}>Delete</ThemedText>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
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
        paddingTop: 8,
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
        paddingTop: 8,
        flexDirection: "column",
        gap: 8,
    },
    audioPlayer: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        borderRadius: 8,
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
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    submenu: {
        borderRadius: 12,
        borderWidth: 1,
        minWidth: 150,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    menuItemText: {
        marginLeft: 12,
        fontSize: 16,
        fontWeight: "500",
    },
    menuSeparator: {
        height: 1,
        marginHorizontal: 16,
    },
});
