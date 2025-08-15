import React, { useState, useRef, useEffect } from "react";
import {
    View,
    TextInput,
    StyleSheet,
    Pressable,
    Keyboard,
    ActivityIndicator,
    Image,
    ScrollView,
    TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { DeviceEventEmitter } from "react-native";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Audio } from "expo-av";
import { ThemedText } from "@/components/ThemedText";
import { useImageTransform } from "@/hooks/useImageTransform";
import { Polygon, NoteImage } from "@/types";
import { getAbsolutePath, generateId } from "@/storage/helper";

interface CachedImage {
    id: string;
    uri: string;
    transformedUri?: string;
    corners?: Polygon;
    links?: string[];
    isProcessing?: boolean;
}

interface CachedAudio {
    id: string;
    uri: string;
    duration?: number;
}

interface NoteInputProps {
    onTakePhoto: (fromGallery: boolean) => Promise<string | null>;
    onRecordAudio: () => Promise<string | null>;
    onSubmitNote: (text: string, images: NoteImage[], audioRecordings: string[]) => Promise<void>;
    isRecording?: boolean;
    disabled?: boolean;
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
    const errorColor = useThemeColor({}, "error");
    const whiteColor = useThemeColor({}, "white");
    const backgroundOverlayColor = useThemeColor({}, "backgroundOverlay");

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

    // Handle image edit results via event emitter
    useEffect(() => {
        const subscription = DeviceEventEmitter.addListener(
            "imageEditComplete",
            (result: { editedImageId: string; transformedUri: string; corners: any; detectedUrls?: string[] }) => {
                console.log("Received image edit result:", result);

                // Update the cached images
                setCachedImages((prev) =>
                    prev.map((img) =>
                        img.id === result.editedImageId
                            ? {
                                  ...img,
                                  transformedUri: result.transformedUri,
                                  corners: result.corners,
                                  links: result.detectedUrls,
                              }
                            : img
                    )
                );
            }
        );

        return () => subscription.remove();
    }, []);

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
                links: img.links,
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
                        links: img.links,
                    };
                } else {
                    return {
                        uri: img.uri,
                        links: img.links,
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
                                                links: result.detectedUrls,
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

    const handleEditImage = (image: CachedImage) => {
        router.push({
            pathname: "/image-edit",
            params: {
                imageId: image.id,
                imageUri: encodeURIComponent(getAbsolutePath(image.uri)),
                existingCorners: image.corners ? encodeURIComponent(JSON.stringify(image.corners)) : undefined,
            },
        });
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
            // Ensure audio session is configured for playback
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
                shouldDuckAndroid: true,
                playThroughEarpieceAndroid: false,
            });

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
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => handleEditImage(image)}
                                disabled={image.isProcessing}
                            >
                                <Image
                                    source={{ uri: getAbsolutePath(image.transformedUri || image.uri) }}
                                    style={styles.imagePreview}
                                />
                                {image.isProcessing && (
                                    <View style={styles.loadingOverlay}>
                                        <ActivityIndicator size="small" color={whiteColor} />
                                    </View>
                                )}
                            </TouchableOpacity>
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
                                style={[styles.audioPreview, { backgroundColor: backgroundOverlayColor }]}
                                onPress={() => handlePlayPauseAudio(audio.uri, audio.id)}
                            >
                                <View style={[styles.playButton, { backgroundColor: tintColor }]}>
                                    <IconSymbol
                                        name={playingId === audio.id && isPlaying ? "pause" : "play"}
                                        size={14}
                                        color={whiteColor}
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
                        style={({ pressed }) => [
                            styles.iconButton,
                            pressed && styles.buttonPressed,
                            isRecording && styles.recordingButton,
                            isRecording && { backgroundColor: errorColor },
                        ]}
                        onPress={handleRecordAudio}
                        disabled={disabled}
                    >
                        <IconSymbol
                            name="mic.fill"
                            size={22}
                            color={disabled ? iconColor + "40" : isRecording ? whiteColor : iconColor}
                        />
                    </Pressable>

                    <View style={{ flex: 1 }} />

                    <Pressable
                        style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
                        onPress={() => handleTakePhoto()}
                        onLongPress={() => handleTakePhoto(true)}
                        disabled={disabled}
                    >
                        <IconSymbol name="camera.fill" size={22} color={disabled ? iconColor + "40" : iconColor} />
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
                            <ActivityIndicator color={whiteColor} size="small" />
                        ) : (
                            <IconSymbol name="arrow.up" size={20} color={whiteColor} />
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
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
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
        alignItems: "flex-start",
        flexWrap: "wrap",
    },
    textInput: {
        flexGrow: 1,
        minHeight: 40,
        maxHeight: 100,
        paddingLeft: 6,
        paddingTop: 10,
        paddingBottom: 10,
        fontSize: 16,
        fontFamily: "MuseoSans-Medium",
    },
    buttonsContainer: {
        flexBasis: "100%",
        alignContent: "flex-end",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
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
        borderRadius: 20,
    },
});
