import React, { useState, useRef } from "react";
import {
    View,
    TextInput,
    StyleSheet,
    Pressable,
    Keyboard,
    ActivityIndicator,
    Platform,
    KeyboardAvoidingView,
} from "react-native";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useThemeColor } from "@/hooks/useThemeColor";

interface NoteInputProps {
    onSubmitText: (text: string) => Promise<void>;
    onTakePhoto: () => Promise<void>;
    onRecordAudio: () => Promise<void>;
    isRecording?: boolean;
    disabled?: boolean;
}

export const NoteInput: React.FC<NoteInputProps> = ({
    onSubmitText,
    onTakePhoto,
    onRecordAudio,
    isRecording = false,
    disabled = false,
}) => {
    const [text, setText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const inputRef = useRef<TextInput>(null);

    const backgroundColor = useThemeColor({}, "background");
    const textColor = useThemeColor({}, "text");
    const tintColor = useThemeColor({}, "tint");

    const handleSubmitText = async () => {
        if (!text.trim() || isSubmitting || disabled) return;

        try {
            setIsSubmitting(true);
            await onSubmitText(text);
            setText("");
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
            await onTakePhoto();
        } catch (error) {
            console.error("Error taking photo:", error);
        }
    };

    const handleRecordAudio = async () => {
        if (isSubmitting || disabled) return;

        try {
            Keyboard.dismiss();
            await onRecordAudio();
        } catch (error) {
            console.error("Error recording audio:", error);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
            <View style={[styles.container, { backgroundColor }]}>
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
                                (!text.trim() || disabled) &&
                                    styles.disabledButton,
                            ]}
                            onPress={handleSubmitText}
                            disabled={!text.trim() || disabled}
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
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 8,
        borderTopWidth: 1,
        borderTopColor: "rgba(150, 150, 150, 0.2)",
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
