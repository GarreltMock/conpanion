import React, { useEffect, useState, useCallback } from "react";
import {
    StyleSheet,
    FlatList,
    View,
    TouchableOpacity,
    ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { format } from "date-fns";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useApp } from "@/context/AppContext";
import { Talk } from "@/types";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function TalksScreen() {
    const { currentConference, activeTalk, getAllTalks, isLoading } = useApp();

    const [talks, setTalks] = useState<Talk[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const tintColor = useThemeColor({}, "tint");

    const loadTalks = useCallback(async () => {
        try {
            setRefreshing(true);
            const allTalks = await getAllTalks();

            // Sort talks by start time (newest first)
            const sortedTalks = [...allTalks].sort(
                (a, b) => b.startTime.getTime() - a.startTime.getTime()
            );

            setTalks(sortedTalks);
        } catch (error) {
            console.error("Error loading talks:", error);
        } finally {
            setRefreshing(false);
        }
    }, [getAllTalks]);

    useEffect(() => {
        loadTalks();
    }, [loadTalks]);

    const handleRefresh = () => {
        loadTalks();
    };

    const handleNewTalk = () => {
        router.push("/modals/new-talk");
    };

    const handleTalkPress = (talkId: string) => {
        router.push(`/(talk)?id=${talkId}`);
    };

    const renderTalkItem = ({ item }: { item: Talk }) => {
        const isActive = activeTalk?.id === item.id;

        return (
            <TouchableOpacity
                style={[
                    styles.talkItem,
                    isActive && { borderColor: tintColor, borderWidth: 2 },
                ]}
                onPress={() => handleTalkPress(item.id)}
                activeOpacity={0.7}
            >
                <View style={styles.talkContent}>
                    <ThemedText style={styles.talkTitle}>
                        {item.title}
                    </ThemedText>
                    <ThemedText style={styles.talkDate}>
                        {format(item.startTime, "MMM d, yyyy • h:mm a")}
                    </ThemedText>
                    {item.endTime && (
                        <ThemedText style={styles.talkDuration}>
                            Duration:{" "}
                            {formatDuration(item.startTime, item.endTime)}
                        </ThemedText>
                    )}
                </View>

                {isActive && (
                    <View
                        style={[
                            styles.activeIndicator,
                            { backgroundColor: tintColor },
                        ]}
                    >
                        <ThemedText
                            style={styles.activeText}
                            lightColor="#fff"
                            darkColor="#fff"
                        >
                            Active
                        </ThemedText>
                    </View>
                )}

                <IconSymbol
                    size={20}
                    name="chevron.right"
                    color={tintColor}
                    style={styles.chevron}
                />
            </TouchableOpacity>
        );
    };

    const formatDuration = (startTime: Date, endTime: Date) => {
        const durationMs = endTime.getTime() - startTime.getTime();
        const minutes = Math.floor(durationMs / (1000 * 60));

        if (minutes < 60) {
            return `${minutes} min`;
        } else {
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            return `${hours}h ${remainingMinutes}m`;
        }
    };

    if (isLoading) {
        return (
            <ThemedView style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <ThemedText style={styles.conferenceLabel}>
                        CONFERENCE
                    </ThemedText>
                    <ThemedText style={styles.conferenceName}>
                        {currentConference?.name || "My Conference"}
                    </ThemedText>
                </View>

                <TouchableOpacity
                    style={[
                        styles.newTalkButton,
                        { backgroundColor: tintColor },
                    ]}
                    onPress={handleNewTalk}
                    activeOpacity={0.8}
                >
                    <IconSymbol name="plus" size={22} color="#fff" />
                    <ThemedText
                        style={styles.buttonText}
                        lightColor="#fff"
                        darkColor="#fff"
                    >
                        New Talk
                    </ThemedText>
                </TouchableOpacity>
            </View>

            <FlatList
                data={talks}
                keyExtractor={(item) => item.id}
                renderItem={renderTalkItem}
                contentContainerStyle={styles.talksList}
                refreshing={refreshing}
                onRefresh={handleRefresh}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <ThemedText style={styles.emptyTitle}>
                            No Talks Yet
                        </ThemedText>
                        <ThemedText style={styles.emptyDescription}>
                            Create a new talk to start taking notes
                        </ThemedText>
                    </View>
                )}
            />
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
        paddingTop: 60,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(150, 150, 150, 0.2)",
    },
    conferenceLabel: {
        fontSize: 12,
        opacity: 0.7,
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    conferenceName: {
        fontSize: 22,
        fontWeight: "bold",
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
    talksList: {
        flexGrow: 1,
        paddingBottom: 16,
    },
    talkItem: {
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: 16,
        marginTop: 12,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(150, 150, 150, 0.2)",
    },
    talkContent: {
        flex: 1,
    },
    talkTitle: {
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 4,
    },
    talkDate: {
        fontSize: 14,
        opacity: 0.7,
        marginBottom: 2,
    },
    talkDuration: {
        fontSize: 12,
        opacity: 0.6,
    },
    activeIndicator: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 8,
    },
    activeText: {
        fontSize: 12,
        fontWeight: "600",
    },
    chevron: {
        marginLeft: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
        marginTop: 80,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 8,
        textAlign: "center",
    },
    emptyDescription: {
        fontSize: 16,
        textAlign: "center",
        opacity: 0.7,
    },
});
