import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, View, Text, TouchableOpacity, TextInput } from "react-native";

import { MyKeyboardAvoidingView } from "@/components/MyKeyboardAvoidingView";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useApp } from "@/context/AppContext";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Talk } from "@/types";

export default function TalkEvaluationModal() {
    const { talkId, source } = useLocalSearchParams<{ talkId: string; source?: string }>();
    const [talk, setTalk] = useState<Talk | null>(null);
    const [rating, setRating] = useState<number>(0);
    const [summary, setSummary] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);

    const { talks, saveEvaluation, endTalk, currentConference } = useApp();

    const tintColor = useThemeColor({}, "tint");
    const backgroundColor = useThemeColor({}, "background");
    const textColor = useThemeColor({}, "text");
    const borderLightColor = useThemeColor({}, "borderLight");
    const backgroundOverlayLightColor = useThemeColor({}, "backgroundOverlayLight");

    // Function to find the next upcoming talk
    const getNextTalk = (): Talk | null => {
        if (!currentConference || !talk) return null;

        const now = new Date();
        const currentTalkEndTime = talk.duration ? new Date(talk.startTime.getTime() + talk.duration * 60 * 1000) : now;

        const conferenceTalks = talks.filter(
            (t) => t.conferenceId === currentConference.id && t.isUserSelected && t.id !== talk.id
        );

        // Find talks that start after the current talk ends
        const upcomingTalks = conferenceTalks.filter((t) =>
            t.duration ? t.startTime > currentTalkEndTime : t.startTime > talk.startTime
        );

        if (upcomingTalks.length === 0) return null;

        // Sort by start time and return the earliest one
        upcomingTalks.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
        return upcomingTalks[0];
    };

    const nextTalk = getNextTalk();

    useEffect(() => {
        if (talkId) {
            const foundTalk = talks.find((t) => t.id === talkId);
            if (foundTalk) {
                setTalk(foundTalk);
                // Prefill existing evaluation data
                setRating(foundTalk.rating || 0);
                setSummary(foundTalk.summary || "");
            } else {
                Alert.alert("Error", "Talk not found");
                router.back();
            }
        }
        setIsLoading(false);
    }, [talkId, talks]);

    const handleKeepTakingNotes = async () => {
        if (!talk) return;

        try {
            await saveEvaluation(talk.id, rating, summary);
            router.back();
        } catch (error) {
            console.error("Error saving evaluation:", error);
            router.back(); // Still close modal even if save fails
        }
    };

    const handleDone = async () => {
        if (!talk) return;

        try {
            await saveEvaluation(talk.id, rating, summary);
            await endTalk(talk);

            router.back();
        } catch (error) {
            console.error("Error finishing talk:", error);
            Alert.alert("Error", "Failed to finish talk. Please try again.");
        }
    };

    const handleSave = async () => {
        if (!talk) return;

        try {
            await saveEvaluation(talk.id, rating, summary);
            router.back();
        } catch (error) {
            console.error("Error saving evaluation:", error);
            Alert.alert("Error", "Failed to save evaluation. Please try again.");
        }
    };

    const handleClose = () => {
        router.back();
    };

    // Check if this modal was opened from the talk detail view
    const isFromTalkDetail = source === "talk-detail";

    const renderStars = () => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <TouchableOpacity key={i} onPress={() => setRating(i)} style={styles.starButton}>
                    <IconSymbol
                        name={i <= rating ? "star.fill" : "star"}
                        size={28}
                        color={i <= rating ? "#FFB000" : textColor + "40"}
                    />
                </TouchableOpacity>
            );
        }
        return stars;
    };

    if (isLoading || !talk) {
        return (
            <ThemedView style={styles.backdrop}>
                <View style={styles.spacer} />
                <ThemedView style={styles.container}>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" />
                    </View>
                </ThemedView>
            </ThemedView>
        );
    }

    return (
        <MyKeyboardAvoidingView style={styles.backdrop}>
            <View style={styles.spacer} />
            {nextTalk && (
                <View style={styles.nextTalkContainer}>
                    <ThemedText style={[styles.nextTalkText, { color: textColor + "80" }]}>
                        Next Talk: {nextTalk.title}
                    </ThemedText>
                </View>
            )}
            <ThemedView style={styles.container}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <View>
                            <ThemedText style={styles.subtitle}>Evaluation</ThemedText>
                            <ThemedText style={styles.title}>{talk.title}</ThemedText>
                        </View>
                        {isFromTalkDetail && (
                            <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.6}>
                                <IconSymbol name="xmark" size={18} color={textColor + "80"} />
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.summarySection}>
                        <TextInput
                            style={[
                                styles.summaryInput,
                                {
                                    borderColor: borderLightColor,
                                    backgroundColor: backgroundOverlayLightColor,
                                    color: textColor,
                                },
                            ]}
                            placeholder="Summary"
                            placeholderTextColor={textColor + "60"}
                            multiline
                            value={summary}
                            onChangeText={setSummary}
                            textAlignVertical="top"
                        />
                    </View>

                    <View style={styles.ratingSection}>
                        <View style={styles.starsContainer}>{renderStars()}</View>
                    </View>

                    <View style={styles.buttonsContainer}>
                        {isFromTalkDetail ? (
                            // When opened from talk detail view - just show Save button
                            <TouchableOpacity
                                style={[styles.button, styles.saveButton, { backgroundColor: tintColor }]}
                                onPress={handleSave}
                            >
                                <Text style={[styles.buttonText, { color: backgroundColor }]}>Save</Text>
                            </TouchableOpacity>
                        ) : (
                            // When opened from normal flow - show original buttons
                            <>
                                <TouchableOpacity
                                    style={[styles.button, styles.keepNotesButton, { borderColor: borderLightColor }]}
                                    onPress={handleKeepTakingNotes}
                                >
                                    <Text style={[styles.buttonText, { color: textColor }]}>Keep taking notes</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.button, styles.doneButton, { backgroundColor: tintColor }]}
                                    onPress={handleDone}
                                >
                                    <Text style={[styles.buttonText, { color: backgroundColor }]}>Done</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </ThemedView>
        </MyKeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        justifyContent: "flex-end",
    },
    spacer: {
        flex: 1,
    },
    nextTalkContainer: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        alignItems: "center",
    },
    nextTalkText: {
        fontSize: 13,
        fontWeight: "500",
    },
    container: {
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingTop: 8,
        paddingBottom: 16,
        maxHeight: "80%",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        minHeight: 200,
    },
    content: {
        padding: 20,
        paddingTop: 8,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
    },
    subtitle: {
        fontSize: 12,
        opacity: 0.7,
        letterSpacing: 0.5,
    },
    closeButton: {
        padding: 4,
    },
    summarySection: {
        marginBottom: 20,
    },
    summaryInput: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 15,
        minHeight: 80,
        maxHeight: 120,
    },
    ratingSection: {
        alignItems: "center",
        marginBottom: 24,
    },
    starsContainer: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 6,
    },
    starButton: {
        padding: 2,
    },
    buttonsContainer: {
        flexDirection: "row",
        gap: 10,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    keepNotesButton: {
        borderWidth: 1,
    },
    doneButton: {
        // backgroundColor set dynamically
    },
    saveButton: {
        // backgroundColor set dynamically
    },
    buttonText: {
        fontSize: 15,
        fontWeight: "600",
    },
});
