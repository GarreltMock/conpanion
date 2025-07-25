import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, Text } from "react-native";
import { format } from "date-fns";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useApp } from "@/context/AppContext";
import { Talk } from "@/types";

interface TalkHeaderProps {
    conferenceName: string;
    talk: Talk | null;
    onDone?: () => void;
}

export const TalkHeader: React.FC<TalkHeaderProps> = ({ conferenceName, talk, onDone }) => {
    const tintColor = useThemeColor({}, "tint");
    const backgroundColor = useThemeColor({}, "background");
    const [currentTime, setCurrentTime] = useState(new Date());

    const { endTalk } = useApp();

    // Set timeout to update button when scheduled talk ends
    useEffect(() => {
        if (!talk || !talk.duration) {
            return;
        }

        const now = new Date();
        const endTime = new Date(talk.startTime.getTime() + talk.duration * 60 * 1000);
        const timeUntilEnd = endTime.getTime() - now.getTime();

        // Only set timeout if the talk hasn't ended yet
        if (timeUntilEnd > 0) {
            const timeout = setTimeout(() => {
                setCurrentTime(new Date());
            }, timeUntilEnd);

            return () => clearTimeout(timeout);
        }
    }, [talk]);

    // Update immediately when talk changes
    useEffect(() => {
        setCurrentTime(new Date());
    }, [talk]);

    const handleDone = () => {
        if (onDone) {
            onDone();
        } else {
            if (!talk) return;
            endTalk(talk);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <View style={styles.headerContent}>
                <View style={styles.titleContainer}>
                    <ThemedText style={styles.conferenceName}>{conferenceName}</ThemedText>
                    {talk ? (
                        <>
                            <ThemedText style={styles.talkTitle} numberOfLines={1} ellipsizeMode="tail">
                                {talk.title}
                            </ThemedText>
                            <ThemedText style={styles.startTime}>
                                Started {format(talk.startTime, "HH:mm, MMM d")}
                            </ThemedText>
                        </>
                    ) : (
                        <ThemedText style={styles.noTalk}>No active talk</ThemedText>
                    )}
                </View>

                <Pressable
                    style={({ pressed }) => [
                        styles.newTalkButton,
                        {
                            backgroundColor: tintColor,
                            opacity: pressed ? 0.8 : 1,
                        },
                    ]}
                    onPress={handleDone}
                >
                    {(() => {
                        if (!talk) {
                            return (
                                <>
                                    <IconSymbol name="plus" size={18} color={backgroundColor} />
                                    <Text style={[styles.buttonText, { color: backgroundColor }]}>New Talk</Text>
                                </>
                            );
                        }

                        const isScheduledTalk = talk.duration !== undefined;
                        const isTalkActive = talk.duration ? 
                            new Date(talk.startTime.getTime() + talk.duration * 60 * 1000) > currentTime : 
                            true;

                        if (isScheduledTalk && isTalkActive) {
                            return (
                                <>
                                    <IconSymbol name="plus" size={18} color={backgroundColor} />
                                    <Text style={[styles.buttonText, { color: backgroundColor }]}>Join Another</Text>
                                </>
                            );
                        } else {
                            return (
                                <>
                                    <IconSymbol name="checkmark" size={18} color={backgroundColor} />
                                    <Text style={[styles.buttonText, { color: backgroundColor }]}>Done</Text>
                                </>
                            );
                        }
                    })()}
                </Pressable>
            </View>
        </ThemedView>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(150, 150, 150, 0.2)",
    },
    headerContent: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    titleContainer: {
        flex: 1,
        marginRight: 16,
    },
    conferenceName: {
        fontSize: 14,
        opacity: 0.7,
        marginBottom: 4,
    },
    talkTitle: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 4,
    },
    startTime: {
        fontSize: 14,
        opacity: 0.7,
    },
    noTalk: {
        fontSize: 18,
        fontWeight: "500",
        marginTop: 8,
        marginBottom: 8,
        opacity: 0.7,
    },
    newTalkButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    buttonText: {
        marginLeft: 6,
        fontWeight: "600",
    },
});
