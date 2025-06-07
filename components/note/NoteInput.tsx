import React, { useState, useRef, useEffect } from "react";
import {
    View,
    TextInput,
    StyleSheet,
    Pressable,
    Keyboard,
    ActivityIndicator,
    Platform,
    Image,
    ScrollView,
    TouchableOpacity,
} from "react-native";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Audio } from "expo-av";
import { ThemedText } from "@/components/ThemedText";
import { useImageTransform } from "@/hooks/useImageTransform";
import { Polygon, NoteImage } from "@/types";
import { useApp } from "@/context/AppContext";

interface CachedImage {
    id: string;
    uri: string;
    transformedUri?: string;
    corners?: Polygon;
    isProcessing?: boolean;
}

interface CachedAudio {
    id: string;
    uri: string;
    duration?: number;
}

interface NoteInputProps {
    onTakePhoto: (fromGallery: boolean) => Promise<string>;
    onRecordAudio: () => Promise<string | null>;
    onSubmitNote: (text: string, images: NoteImage[], audioRecordings: string[]) => Promise<void>;
    isRecording?: boolean;
    disabled?: boolean;
    keyboardSpaceDiff?: number; // Optional prop to control space below input
    initialText?: string;
    initialImages?: NoteImage[];
    initialAudio?: string[];
    autoFocus?: boolean; // Auto focus the text input when component mounts
}

export const NoteInput: React.FC<NoteInputProps> = ({
    onTakePhoto,
    onRecordAudio,
    onSubmitNote,
    isRecording = false,
    disabled = false,
    keyboardSpaceDiff = undefined,
    initialText = "",
    initialImages = [],
    initialAudio = [],
    autoFocus = false,
}) => {
    const [text, setText] = useState(initialText);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cachedImages, setCachedImages] = useState<CachedImage[]>([]);
    const [cachedAudio, setCachedAudio] = useState<CachedAudio[]>([]);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playingId, setPlayingId] = useState<string | null>(null);
    const inputRef = useRef<TextInput>(null);

    const backgroundColor = useThemeColor({}, "background");
    const textColor = useThemeColor({}, "text");
    const tintColor = useThemeColor({}, "tint");
    const iconColor = useThemeColor({}, "icon");

    const { getAbsolutePath } = useApp();

    // Initialize the image transformation hook
    const { isInitialized, processImageFromUri } = useImageTransform();

    // Auto focus the text input if requested
    useEffect(() => {
        if (autoFocus && inputRef.current) {
            // Add a small delay to ensure the component is fully mounted
            const timer = setTimeout(() => {
                const input = inputRef.current;
                if (input) {
                    input.focus();
                    // Position cursor at the end of the text
                    if (text.length > 0) {
                        input.setSelection(text.length, text.length);
                    }
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [autoFocus, text]);

    // Generate a unique ID for cached assets
    const generateId = () => {
        return Math.random().toString(36).substring(2, 15);
    };

    // Initialize cached assets from props - use a ref to track if already initialized
    const [hasInitializedProps, setHasInitializedProps] = useState(false);

    useEffect(() => {
        if (!hasInitializedProps && (initialImages.length > 0 || initialAudio.length > 0 || initialText)) {
            // Convert initial images to cached format
            const convertedImages: CachedImage[] = initialImages.map((img) => ({
                id: generateId(),
                uri: img.originalUri ? img.originalUri : img.uri,
                transformedUri: img.originalUri ? img.uri : undefined,
                corners: img.corners,
                isProcessing: false,
            }));

            // Convert initial audio to cached format
            const convertedAudio: CachedAudio[] = initialAudio.map((audioUri) => ({
                id: generateId(),
                uri: audioUri,
            }));

            setCachedImages(convertedImages);
            setCachedAudio(convertedAudio);
            setHasInitializedProps(true);
        }
    }, [initialImages, initialAudio, initialText, hasInitializedProps]);

    const handleSubmitNote = async () => {
        if ((!text.trim() && cachedImages.length === 0 && cachedAudio.length === 0) || isSubmitting || disabled) return;

        try {
            setIsSubmitting(true);

            // Convert cached images to NoteImage format
            const noteImages: NoteImage[] = cachedImages.map((img) => {
                if (img.transformedUri && img.corners) {
                    return {
                        uri: img.transformedUri,
                        originalUri: img.uri,
                        corners: img.corners,
                    };
                } else {
                    return {
                        uri: img.uri,
                    };
                }
            });

            const audioUris = cachedAudio.map((audio) => audio.uri);

            // Submit note with all content
            await onSubmitNote(text, noteImages, audioUris);

            // Clear all cached content
            setText("");
            setCachedImages([]);
            setCachedAudio([]);
            Keyboard.dismiss();
        } catch (error) {
            console.error("Error submitting note:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTakePhoto = async (fromGallery: boolean = false) => {
        if (isSubmitting || disabled) return;

        try {
            Keyboard.dismiss();
            const imageUri = await onTakePhoto(fromGallery);
            if (imageUri) {
                const newImageId = generateId();

                // Add the image to cache with processing state
                setCachedImages((prev) => [
                    ...prev,
                    {
                        id: newImageId,
                        uri: imageUri, // Store absolute path for display
                        isProcessing: isInitialized, // Only set processing state if models are initialized
                    },
                ]);

                // Process the image if models are initialized
                if (isInitialized) {
                    try {
                        // Process the image asynchronously
                        processImageFromUri(getAbsolutePath(imageUri))
                            .then((result) => {
                                setCachedImages((prev) =>
                                    prev.map((img) => {
                                        if (img.id === newImageId) {
                                            return {
                                                ...img,
                                                transformedUri: result.transformed?.uri,
                                                corners: result.corners || undefined,
                                                isProcessing: false,
                                            };
                                        }
                                        return img;
                                    })
                                );
                            })
                            .catch((err) => {
                                console.error("Error processing image:", err);
                                // Mark processing as complete even if it failed
                                setCachedImages((prev) =>
                                    prev.map((img) => {
                                        if (img.id === newImageId) {
                                            return { ...img, isProcessing: false };
                                        }
                                        return img;
                                    })
                                );
                            });
                    } catch (err) {
                        console.error("Error initiating image processing:", err);
                        // Mark processing as complete
                        setCachedImages((prev) =>
                            prev.map((img) => {
                                if (img.id === newImageId) {
                                    return { ...img, isProcessing: false };
                                }
                                return img;
                            })
                        );
                    }
                }
            }
        } catch (error) {
            console.error("Error taking photo:", error);
        }
    };

    const handleRecordAudio = async () => {
        if (isSubmitting || disabled) return;

        try {
            Keyboard.dismiss();
            const audioUri = await onRecordAudio();

            if (audioUri) {
                setCachedAudio((prev) => [
                    ...prev,
                    {
                        id: generateId(),
                        uri: audioUri,
                    },
                ]);
            }
        } catch (error) {
            console.error("Error recording audio:", error);
        }
    };

    const handleDeleteImage = (id: string) => {
        setCachedImages((prev) => prev.filter((img) => img.id !== id));
    };

    const handleDeleteAudio = (id: string) => {
        // Stop playback if this audio is playing
        if (playingId === id && sound) {
            sound.stopAsync().catch((error) => console.error("Error stopping sound:", error));
            setSound(null);
            setIsPlaying(false);
            setPlayingId(null);
        }
        setCachedAudio((prev) => prev.filter((audio) => audio.id !== id));
    };

    const handlePlayPauseAudio = async (audioUri: string, id: string) => {
        // If already playing this audio, pause it
        if (playingId === id && sound && isPlaying) {
            try {
                await sound.pauseAsync();
                setIsPlaying(false);
            } catch (error) {
                console.error("Error pausing audio:", error);
            }
            return;
        }

        // If a different audio is playing, stop it
        if (sound && isPlaying) {
            try {
                await sound.stopAsync();
                await sound.unloadAsync();
                setSound(null);
                setIsPlaying(false);
                setPlayingId(null);
            } catch (error) {
                console.error("Error stopping previous audio:", error);
            }
        }

        try {
            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: getAbsolutePath(audioUri) },
                { shouldPlay: true }
            );

            setSound(newSound);
            setIsPlaying(true);
            setPlayingId(id);

            // When playback finishes
            newSound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                    setIsPlaying(false);
                    setPlayingId(null);
                    newSound.unloadAsync().catch((error) => console.error("Error unloading sound:", error));
                    setSound(null);
                }
            });
        } catch (error) {
            console.error("Error playing audio:", error, "URI:", audioUri);
        }
    };

    // Cleanup audio resources when component unmounts
    useEffect(() => {
        return () => {
            // Cleanup audio resources
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [sound]);

    // Calculate if we need to show the attachments area
    const hasAttachments = cachedImages.length > 0 || cachedAudio.length > 0;

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor,
                },
            ]}
        >
            {/* Attachments area */}
            {hasAttachments && (
                <ScrollView
                    horizontal
                    style={styles.attachmentsContainer}
                    contentContainerStyle={styles.attachmentsContentContainer}
                    showsHorizontalScrollIndicator={false}
                >
                    {/* Image previews */}
                    {cachedImages.map((image) => (
                        <View key={image.id} style={styles.imagePreviewContainer}>
                            <Image
                                source={{ uri: getAbsolutePath(image.transformedUri || image.uri) }}
                                style={styles.imagePreview}
                            />
                            {image.isProcessing && (
                                <View style={styles.loadingOverlay}>
                                    <ActivityIndicator size="small" color="#fff" />
                                </View>
                            )}
                            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteImage(image.id)}>
                                <IconSymbol
                                    name="xmark.circle.fill"
                                    size={20}
                                    color={iconColor}
                                    style={{ backgroundColor, borderRadius: 20 }}
                                />
                            </TouchableOpacity>
                        </View>
                    ))}

                    {/* Audio previews */}
                    {cachedAudio.map((audio) => (
                        <View key={audio.id} style={styles.audioPreviewContainer}>
                            <TouchableOpacity
                                style={styles.audioPreview}
                                onPress={() => handlePlayPauseAudio(audio.uri, audio.id)}
                            >
                                <View style={[styles.playButton, { backgroundColor: tintColor }]}>
                                    <IconSymbol
                                        name={playingId === audio.id && isPlaying ? "pause" : "play"}
                                        size={14}
                                        color="#fff"
                                    />
                                </View>
                                <ThemedText style={styles.audioLabel}>Audio Recording</ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteAudio(audio.id)}>
                                <IconSymbol
                                    name="xmark.circle.fill"
                                    size={20}
                                    color={iconColor}
                                    style={{ backgroundColor, borderRadius: 20 }}
                                />
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
            )}

            {/* Input area */}
            <View style={styles.inputContainer}>
                <TextInput
                    ref={inputRef}
                    style={[styles.textInput, { color: textColor }]}
                    placeholder="Type a note..."
                    placeholderTextColor={textColor + "80"}
                    value={text}
                    onChangeText={setText}
                    multiline
                    maxLength={500}
                    editable={!disabled}
                />

                <View style={styles.buttonsContainer}>
                    <Pressable
                        style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
                        onPress={() => handleTakePhoto()}
                        onLongPress={() => handleTakePhoto(true)}
                        disabled={disabled}
                    >
                        <IconSymbol name="camera.fill" size={22} color={disabled ? textColor + "40" : tintColor} />
                    </Pressable>

                    <Pressable
                        style={({ pressed }) => [
                            styles.iconButton,
                            pressed && styles.buttonPressed,
                            isRecording && styles.recordingButton,
                        ]}
                        onPress={handleRecordAudio}
                        disabled={disabled}
                    >
                        <IconSymbol
                            name="mic.fill"
                            size={22}
                            color={disabled ? textColor + "40" : isRecording ? "#fff" : tintColor}
                        />
                    </Pressable>

                    <Pressable
                        style={({ pressed }) => [
                            styles.sendButton,
                            { backgroundColor: tintColor },
                            pressed && styles.buttonPressed,
                            ((!text.trim() && !hasAttachments) || disabled) && styles.disabledButton,
                        ]}
                        onPress={handleSubmitNote}
                        disabled={(!text.trim() && !hasAttachments) || disabled}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <IconSymbol name="arrow.up" size={20} color="#fff" />
                        )}
                    </Pressable>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 8,
    },
    attachmentsContainer: {
        marginBottom: 8,
    },
    attachmentsContentContainer: {
        flexDirection: "row",
        paddingHorizontal: 4,
        paddingTop: 5,
        paddingBottom: 4,
    },
    imagePreviewContainer: {
        position: "relative",
        marginRight: 8,
    },
    imagePreview: {
        height: 50,
        aspectRatio: 1.6,
        borderRadius: 8,
    },
    loadingOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 8,
    },
    audioPreviewContainer: {
        position: "relative",
        marginRight: 8,
    },
    audioPreview: {
        width: 140,
        height: 50,
        borderRadius: 8,
        backgroundColor: "rgba(150, 150, 150, 0.2)",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 8,
        overflow: "hidden",
    },
    audioLabel: {
        fontSize: 12,
        marginLeft: 8,
    },
    playButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    deleteButton: {
        position: "absolute",
        top: -6,
        right: -6,
        zIndex: 10,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "flex-end",
    },
    textInput: {
        flex: 1,
        minHeight: 40,
        maxHeight: 100,
        paddingLeft: 6,
        paddingTop: 10,
        paddingBottom: 10,
        borderRadius: 20,
        // backgroundColor: "rgba(150, 150, 150, 0.1)",
        fontSize: 16,
    },
    buttonsContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginLeft: 8,
    },
    iconButton: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
        marginHorizontal: 2,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 4,
    },
    buttonPressed: {
        opacity: 0.7,
    },
    disabledButton: {
        opacity: 0.5,
    },
    recordingButton: {
        backgroundColor: "#FF4136",
        borderRadius: 20,
    },
});
