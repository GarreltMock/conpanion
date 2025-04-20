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
    Dimensions,
    TouchableOpacity,
} from "react-native";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useThemeColor } from "@/hooks/useThemeColor";
import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";
import { ThemedText } from "@/components/ThemedText";

// Define types for cached assets
interface CachedImage {
    id: string;
    uri: string;
}

interface CachedAudio {
    id: string;
    uri: string;
    duration?: number;
}

interface NoteInputProps {
    onTakePhoto: () => Promise<string>;
    onRecordAudio: () => Promise<string | null>;
    onSubmitNote: (
        text: string,
        images: string[],
        audioRecordings: string[]
    ) => Promise<void>;
    isRecording?: boolean;
    disabled?: boolean;
}

export const NoteInput: React.FC<NoteInputProps> = ({
    onTakePhoto,
    onRecordAudio,
    onSubmitNote,
    isRecording = false,
    disabled = false,
}) => {
    const [text, setText] = useState("");
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

    // Generate a unique ID for cached assets
    const generateId = () => {
        return Math.random().toString(36).substring(2, 15);
    };

    const handleSubmitNote = async () => {
        if (
            (!text.trim() &&
                cachedImages.length === 0 &&
                cachedAudio.length === 0) ||
            isSubmitting ||
            disabled
        )
            return;

        try {
            setIsSubmitting(true);

            // Extract URIs from cached assets
            const imageUris = cachedImages.map((img) => img.uri);
            const audioUris = cachedAudio.map((audio) => audio.uri);

            // Submit note with all content
            await onSubmitNote(text, imageUris, audioUris);

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

    const handleTakePhoto = async () => {
        if (isSubmitting || disabled) return;

        try {
            Keyboard.dismiss();
            const imageUri = await onTakePhoto();
            if (imageUri) {
                // Cache the new image
                setCachedImages((prev) => [
                    ...prev,
                    { id: generateId(), uri: imageUri },
                ]);
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

            // If we got an audio URI back (recording stopped), add it to cached audio
            if (audioUri) {
                console.log("Adding audio to cache:", audioUri);
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
            sound
                .stopAsync()
                .catch((error) =>
                    console.error("Error stopping sound:", error)
                );
            setSound(null);
            setIsPlaying(false);
            setPlayingId(null);
        }
        setCachedAudio((prev) => prev.filter((audio) => audio.id !== id));
    };

    const handlePlayPauseAudio = async (audioUri: string, id: string) => {
        console.log("Playing/pausing audio:", audioUri);

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
            console.log("Creating new sound for URI:", audioUri);
            // Load and play the selected audio
            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: audioUri },
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
                    newSound
                        .unloadAsync()
                        .catch((error) =>
                            console.error("Error unloading sound:", error)
                        );
                    setSound(null);
                }
            });
        } catch (error) {
            console.error("Error playing audio:", error, "URI:", audioUri);
        }
    };

    const [keyboardSpace, setKeyboardSpace] = useState(0);

    // Handle keyboard events to manage space below input
    useEffect(() => {
        const keyboardWillShowListener = Keyboard.addListener(
            Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
            (e) => {
                const keyboardHeight = e.endCoordinates.height;

                // Only add extra space on iOS
                if (Platform.OS === "ios") {
                    // Calculate how much space to add below the input
                    setKeyboardSpace(keyboardHeight - 60);
                }
            }
        );

        const keyboardWillHideListener = Keyboard.addListener(
            Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
            () => {
                setKeyboardSpace(0);
            }
        );

        return () => {
            keyboardWillShowListener.remove();
            keyboardWillHideListener.remove();

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
                    paddingBottom: keyboardSpace > 0 ? keyboardSpace : 8,
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
                        <View
                            key={image.id}
                            style={styles.imagePreviewContainer}
                        >
                            <Image
                                source={{ uri: image.uri }}
                                style={styles.imagePreview}
                            />
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => handleDeleteImage(image.id)}
                            >
                                <IconSymbol
                                    name="xmark.circle.fill"
                                    size={20}
                                    color="#fff"
                                />
                            </TouchableOpacity>
                        </View>
                    ))}

                    {/* Audio previews */}
                    {cachedAudio.map((audio) => (
                        <View
                            key={audio.id}
                            style={styles.audioPreviewContainer}
                        >
                            <TouchableOpacity
                                style={styles.audioPreview}
                                onPress={() =>
                                    handlePlayPauseAudio(audio.uri, audio.id)
                                }
                            >
                                <View
                                    style={[
                                        styles.playButton,
                                        { backgroundColor: tintColor },
                                    ]}
                                >
                                    <IconSymbol
                                        name={
                                            playingId === audio.id && isPlaying
                                                ? "pause"
                                                : "play"
                                        }
                                        size={14}
                                        color="#fff"
                                    />
                                </View>
                                <ThemedText style={styles.audioLabel}>
                                    Audio Recording
                                </ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => handleDeleteAudio(audio.id)}
                            >
                                <IconSymbol
                                    name="xmark.circle.fill"
                                    size={20}
                                    color="#fff"
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
                        ]}
                        onPress={handleTakePhoto}
                        disabled={disabled}
                    >
                        <IconSymbol
                            name="camera.fill"
                            size={22}
                            color={disabled ? textColor + "40" : tintColor}
                        />
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
                            color={
                                disabled
                                    ? textColor + "40"
                                    : isRecording
                                    ? "#fff"
                                    : tintColor
                            }
                        />
                    </Pressable>

                    <Pressable
                        style={({ pressed }) => [
                            styles.sendButton,
                            { backgroundColor: tintColor },
                            pressed && styles.buttonPressed,
                            ((!text.trim() && !hasAttachments) || disabled) &&
                                styles.disabledButton,
                        ]}
                        onPress={handleSubmitNote}
                        disabled={(!text.trim() && !hasAttachments) || disabled}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <IconSymbol
                                name="arrow.up"
                                size={20}
                                color="#fff"
                            />
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
        borderTopWidth: 1,
        borderTopColor: "rgba(150, 150, 150, 0.2)",
        // Dynamic padding will be set by the component
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
        width: 50,
        height: 50,
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
        paddingHorizontal: 12,
        paddingTop: 10,
        paddingBottom: 10,
        borderRadius: 20,
        backgroundColor: "rgba(150, 150, 150, 0.1)",
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
