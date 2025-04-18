import React from "react";
import { View, StyleSheet, Pressable, Text } from "react-native";
import { router } from "expo-router";
import { format } from "date-fns";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Talk } from "@/types";

interface TalkHeaderProps {
    conferenceName: string;
    talk: Talk | null;
    onNewTalk?: () => void;
}

export const TalkHeader: React.FC<TalkHeaderProps> = ({
    conferenceName,
    talk,
    onNewTalk,
}) => {
    const tintColor = useThemeColor({}, "tint");
    const backgroundColor = useThemeColor({}, "background");

    const handleNewTalk = () => {
        if (onNewTalk) {
            onNewTalk();
        } else {
            router.push("/modals/new-talk");
        }
    };

    return (
        <ThemedView style={styles.container}>
            <View style={styles.headerContent}>
                <View>
                    <ThemedText style={styles.conferenceName}>
                        {conferenceName}
                    </ThemedText>
                    {talk ? (
                        <>
                            <ThemedText style={styles.talkTitle}>
                                {talk.title}
                            </ThemedText>
                            <ThemedText style={styles.startTime}>
                                Started{" "}
                                {format(talk.startTime, "h:mm a, MMM d")}
                            </ThemedText>
                        </>
                    ) : (
                        <ThemedText style={styles.noTalk}>
                            No active talk
                        </ThemedText>
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
                    onPress={handleNewTalk}
                >
                    <IconSymbol name="plus" size={22} color={backgroundColor} />
                    <Text
                        style={[styles.buttonText, { color: backgroundColor }]}
                    >
                        New Talk
                    </Text>
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
