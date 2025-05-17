import React, { useEffect, useState } from "react";
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from "react-native";
import { useApp } from "../context/AppContext";
import { ThemedText } from "../components/ThemedText";
import { ThemedView } from "../components/ThemedView";
import { useThemeColor } from "../hooks/useThemeColor";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Talk, Conference } from "../types";
import { format } from "date-fns";

export default function ConferenceDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const {
        conferences,
        talks,
        notes,
        switchActiveConference,
        currentConference,
    } = useApp();
    const [conference, setConference] = useState<Conference | null>(null);
    const [conferenceTalks, setConferenceTalks] = useState<Talk[]>([]);
    const [isActive, setIsActive] = useState(false);

    const router = useRouter();
    const tintColor = useThemeColor({}, "tint");
    const backgroundColor = useThemeColor({}, "background");

    useEffect(() => {
        // Log when accessed without ID, but don't try to redirect
        if (!id) {
            console.log(
                "Conference detail accessed without ID, no redirection needed"
            );
            // Let the UI handle this case with the loading state
        } else {
            // Find the conference
            const foundConference = conferences.find((conf) => conf.id === id);
            console.log("Found conference:", foundConference);

            if (foundConference) {
                setConference(foundConference);

                // Check if this is the active conference
                setIsActive(currentConference?.id === id);

                // Get talks for this conference
                const foundTalks = talks
                    .filter((talk) => talk.conferenceId === id)
                    .sort(
                        (a, b) => a.startTime.getTime() - b.startTime.getTime()
                    );
                setConferenceTalks(foundTalks);
            } else if (currentConference && currentConference.id === id) {
                // If we can't find it in conferences but it matches current conference, use that
                console.log("Using currentConference as fallback");
                setConference(currentConference);
                setIsActive(true);

                const foundTalks = talks
                    .filter((talk) => talk.conferenceId === id)
                    .sort(
                        (a, b) => a.startTime.getTime() - b.startTime.getTime()
                    );
                setConferenceTalks(foundTalks);
            }
        }
    }, [id, conferences, talks, currentConference, router]);

    const handleEditConference = () => {
        router.push({
            pathname: "/modals/edit-conference",
            params: { id: conference?.id },
        });
    };

    const handleExportConference = () => {
        router.push({
            pathname: "/modals/export-options",
            params: { id: conference?.id },
        });
    };

    const handleMakeActive = async () => {
        if (conference && !isActive) {
            try {
                await switchActiveConference(conference.id);
                setIsActive(true);
                Alert.alert(
                    "Success",
                    `${conference.name} is now your active conference`
                );
            } catch (error) {
                Alert.alert("Error", "Failed to switch conference");
            }
        }
    };

    const formatDate = (date: Date) => {
        return format(date, "MMMM d, yyyy");
    };

    const formatTime = (date: Date) => {
        return format(date, "h:mm a");
    };

    const getNotesCount = (talkId: string) => {
        return notes.filter((note) => note.talkId === talkId).length;
    };

    const getTotalNotesCount = () => {
        let count = 0;
        for (const talk of conferenceTalks) {
            count += getNotesCount(talk.id);
        }
        return count;
    };

    const handleViewTalk = (talkId: string) => {
        router.push({
            pathname: "/talk",
            params: { id: talkId },
        });
    };

    // If we're accessed without an ID or conference not found, show error and redirect
    if (!conference) {
        // If accessed without ID, redirect to tabs
        if (!id) {
            console.log(
                "Conference screen accessed without ID, redirecting to tabs"
            );
            // Use useEffect for navigation to avoid warnings
            return (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={tintColor} />
                    <ThemedText style={{ marginTop: 16 }}>
                        Redirecting...
                    </ThemedText>
                </View>
            );
        }

        // Otherwise show conference not found error
        return (
            <View style={styles.centered}>
                <ThemedText style={styles.errorText}>
                    Conference not found
                </ThemedText>
                <TouchableOpacity
                    style={[styles.backButton, { backgroundColor: tintColor }]}
                    onPress={() => router.push("/(tabs)")}
                >
                    <ThemedText style={styles.backButtonText}>
                        Go to Conferences
                    </ThemedText>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.headerContainer}>
                    <View style={styles.headerContent}>
                        <ThemedText type="title" style={styles.title}>
                            {conference.name}
                        </ThemedText>
                        <ThemedText style={styles.dates}>
                            {formatDate(conference.startDate)} -{" "}
                            {formatDate(conference.endDate)}
                        </ThemedText>
                        {conference.location && (
                            <ThemedText style={styles.location}>
                                <Ionicons
                                    name="location-outline"
                                    size={16}
                                    style={{ textAlignVertical: "center" }}
                                />{" "}
                                {conference.location}
                            </ThemedText>
                        )}
                        <View style={styles.statusContainer}>
                            <View
                                style={[
                                    styles.statusBadge,
                                    { backgroundColor: tintColor },
                                ]}
                            >
                                <ThemedText style={styles.statusText}>
                                    {conference.status}
                                </ThemedText>
                            </View>
                            {isActive && (
                                <View
                                    style={[
                                        styles.activeBadge,
                                        { backgroundColor: tintColor },
                                    ]}
                                >
                                    <ThemedText style={styles.statusText}>
                                        Active
                                    </ThemedText>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {conference.description && (
                    <ThemedView style={styles.section}>
                        <ThemedText style={styles.sectionTitle}>
                            Description
                        </ThemedText>
                        <ThemedText style={styles.description}>
                            {conference.description}
                        </ThemedText>
                    </ThemedView>
                )}

                <ThemedView style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>
                        Statistics
                    </ThemedText>
                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <ThemedText style={styles.statValue}>
                                {conferenceTalks.length}
                            </ThemedText>
                            <ThemedText style={styles.statLabel}>
                                Talks
                            </ThemedText>
                        </View>
                        <View style={styles.statItem}>
                            <ThemedText style={styles.statValue}>
                                {getTotalNotesCount()}
                            </ThemedText>
                            <ThemedText style={styles.statLabel}>
                                Notes
                            </ThemedText>
                        </View>
                        <View style={styles.statItem}>
                            <ThemedText style={styles.statValue}>
                                {conference.createdAt
                                    ? format(conference.createdAt, "MMM d")
                                    : "N/A"}
                            </ThemedText>
                            <ThemedText style={styles.statLabel}>
                                Created
                            </ThemedText>
                        </View>
                    </View>
                </ThemedView>

                <ThemedView style={styles.section}>
                    <View style={[styles.sectionHeader]}>
                        <ThemedText
                            style={[styles.sectionTitle, { marginBottom: 0 }]}
                        >
                            Talks Timeline
                        </ThemedText>
                        <TouchableOpacity
                            onPress={() => router.push("/modals/new-talk")}
                        >
                            <ThemedText
                                style={[
                                    styles.addTalkText,
                                    { color: tintColor },
                                ]}
                            >
                                + Add Talk
                            </ThemedText>
                        </TouchableOpacity>
                    </View>

                    {conferenceTalks.length > 0 ? (
                        <View style={styles.timelineContainer}>
                            {conferenceTalks.map((talk, index) => (
                                <TouchableOpacity
                                    key={talk.id}
                                    style={styles.timelineItem}
                                    onPress={() => handleViewTalk(talk.id)}
                                >
                                    <View style={styles.timeContainer}>
                                        <ThemedText style={styles.timeText}>
                                            {formatTime(talk.startTime)}
                                        </ThemedText>
                                        {talk.endTime && (
                                            <ThemedText
                                                style={styles.endTimeText}
                                            >
                                                - {formatTime(talk.endTime)}
                                            </ThemedText>
                                        )}
                                    </View>
                                    <View
                                        style={[
                                            styles.timelineLine,
                                            { backgroundColor: tintColor },
                                        ]}
                                    />
                                    <View
                                        style={[
                                            styles.timelineDot,
                                            { backgroundColor: tintColor },
                                        ]}
                                    />
                                    <View style={styles.talkContainer}>
                                        <ThemedText style={styles.talkTitle}>
                                            {talk.title}
                                        </ThemedText>
                                        <ThemedText style={styles.notesCount}>
                                            {getNotesCount(talk.id)} notes
                                        </ThemedText>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : (
                        <ThemedView style={styles.emptyContainer}>
                            <ThemedText style={styles.emptyText}>
                                No talks added yet
                            </ThemedText>
                            <TouchableOpacity
                                style={[
                                    styles.addTalkButton,
                                    { backgroundColor: tintColor },
                                ]}
                                onPress={() => router.push("/modals/new-talk")}
                            >
                                <ThemedText style={styles.addTalkButtonText}>
                                    Add First Talk
                                </ThemedText>
                            </TouchableOpacity>
                        </ThemedView>
                    )}
                </ThemedView>
            </ScrollView>

            <View style={styles.actionBar}>
                {!isActive && (
                    <TouchableOpacity
                        style={[
                            styles.actionButton,
                            styles.makeActiveButton,
                            { backgroundColor: tintColor },
                        ]}
                        onPress={handleMakeActive}
                    >
                        <Ionicons
                            name="checkmark-circle-outline"
                            size={20}
                            color="white"
                        />
                        <ThemedText style={styles.actionButtonText}>
                            Make Active
                        </ThemedText>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={[
                        styles.actionButton,
                        { backgroundColor: backgroundColor },
                    ]}
                    onPress={handleEditConference}
                >
                    <Ionicons
                        name="pencil-outline"
                        size={20}
                        color={tintColor}
                    />
                    <ThemedText
                        style={[styles.actionButtonText, { color: tintColor }]}
                    >
                        Edit
                    </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.actionButton,
                        { backgroundColor: backgroundColor },
                    ]}
                    onPress={handleExportConference}
                >
                    <Ionicons
                        name="share-outline"
                        size={20}
                        color={tintColor}
                    />
                    <ThemedText
                        style={[styles.actionButtonText, { color: tintColor }]}
                    >
                        Export
                    </ThemedText>
                </TouchableOpacity>
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#fff",
    },
    container: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    errorText: {
        fontSize: 18,
        marginBottom: 20,
        textAlign: "center",
    },
    backButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        marginTop: 10,
    },
    backButtonText: {
        color: "white",
        fontWeight: "bold",
    },
    scrollContent: {
        paddingBottom: 16,
    },
    headerContainer: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.1)",
    },
    headerContent: {
        paddingBottom: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 8,
    },
    dates: {
        fontSize: 16,
        marginBottom: 8,
    },
    location: {
        fontSize: 16,
        marginBottom: 12,
        lineHeight: 22,
    },
    statusContainer: {
        flexDirection: "row",
        marginTop: 8,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginRight: 8,
    },
    activeBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    statusText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 12,
        textTransform: "uppercase",
    },
    section: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.1)",
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 28,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 12,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
    },
    statsContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
    },
    statItem: {
        alignItems: "center",
    },
    statValue: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 14,
        opacity: 0.7,
    },
    addTalkText: {
        fontSize: 16,
        fontWeight: "bold",
    },
    timelineContainer: {
        paddingLeft: 8,
    },
    timelineItem: {
        flexDirection: "row",
        marginBottom: 24,
        position: "relative",
    },
    timeContainer: {
        width: 80,
        marginRight: 16,
    },
    timeText: {
        fontSize: 14,
        fontWeight: "bold",
    },
    endTimeText: {
        fontSize: 14,
    },
    timelineLine: {
        position: "absolute",
        width: 2,
        height: "100%",
        left: 88,
        top: 24,
    },
    timelineDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 12,
        marginTop: 4,
    },
    talkContainer: {
        flex: 1,
        marginLeft: 8,
    },
    talkTitle: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 4,
    },
    notesCount: {
        fontSize: 14,
        opacity: 0.7,
    },
    emptyContainer: {
        alignItems: "center",
        paddingVertical: 24,
    },
    emptyText: {
        fontSize: 16,
        marginBottom: 16,
        opacity: 0.7,
    },
    addTalkButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    addTalkButtonText: {
        color: "white",
        fontWeight: "bold",
    },
    actionBar: {
        flexDirection: "row",
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: "rgba(0,0,0,0.1)",
    },
    actionButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 12,
        borderRadius: 8,
        marginHorizontal: 4,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.1)",
    },
    makeActiveButton: {
        flex: 1.5,
    },
    actionButtonText: {
        marginLeft: 8,
        fontWeight: "bold",
        color: "white",
    },
});
