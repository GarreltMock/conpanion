import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useApp } from "../context/AppContext";
import { ThemedText } from "../components/ThemedText";
import { ThemedView } from "../components/ThemedView";
import { useThemeColor } from "../hooks/useThemeColor";
import { useI18n } from "../hooks/useI18n";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Talk, Conference } from "../types";
import { format } from "date-fns";

export default function ConferenceDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { conferences, talks, notes, switchActiveConference, currentConference } = useApp();
    const [conference, setConference] = useState<Conference | null>(null);
    const [conferenceTalks, setConferenceTalks] = useState<Talk[]>([]);
    const [isActive, setIsActive] = useState(false);

    // Helper function to calculate current conference status based on dates
    const calculateCurrentStatus = (startDate: Date, endDate: Date) => {
        const now = new Date();
        if (startDate <= now && endDate >= now) {
            return "ongoing";
        } else if (endDate < now) {
            return "past";
        }
        return "upcoming";
    };

    const router = useRouter();
    const { t } = useI18n();
    const tintColor = useThemeColor({}, "tint");
    const backgroundColor = useThemeColor({}, "background");
    const borderLight = useThemeColor({}, "borderLight");
    const textColor = useThemeColor({}, "text");
    const mutedColor = useThemeColor({}, "tabIconDefault");

    useEffect(() => {
        // Log when accessed without ID, but don't try to redirect
        if (!id) {
            console.log("Conference detail accessed without ID, no redirection needed");
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
                    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
                setConferenceTalks(foundTalks);
            } else if (currentConference && currentConference.id === id) {
                // If we can't find it in conferences but it matches current conference, use that
                console.log("Using currentConference as fallback");
                setConference(currentConference);
                setIsActive(true);

                const foundTalks = talks
                    .filter((talk) => talk.conferenceId === id)
                    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
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
                Alert.alert(t("common.ok"), t("conferences.activeConference", { name: conference.name }));
            } catch (error) {
                Alert.alert(t("common.errors.title"), t("errors.switchConferenceFailed"));
            }
        }
    };

    const formatDate = (date: Date) => {
        return format(date, "MMMM d, yyyy");
    };

    const formatTime = (date: Date) => {
        return format(date, "HH:mm");
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
            console.log("Conference screen accessed without ID, redirecting to tabs");
            // Use useEffect for navigation to avoid warnings
            return (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={tintColor} />
                    <ThemedText style={{ marginTop: 16 }}>{t("common.loading")}</ThemedText>
                </View>
            );
        }

        // Otherwise show conference not found error
        return (
            <View style={styles.centered}>
                <ThemedText style={styles.errorText}>{t("errors.conferenceNotFound")}</ThemedText>
                <TouchableOpacity
                    style={[styles.backButton, { backgroundColor: tintColor }]}
                    onPress={() => router.push("/(tabs)")}
                >
                    <ThemedText style={styles.backButtonText}>{t("conferences.goToConferences")}</ThemedText>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={[styles.headerContainer, { borderBottomColor: borderLight }]}>
                    <View style={styles.headerContent}>
                        <ThemedText type="title" style={styles.title}>
                            {conference.name}
                        </ThemedText>
                        <ThemedText style={styles.dates}>
                            {formatDate(conference.startDate)} - {formatDate(conference.endDate)}
                        </ThemedText>
                        {conference.location ? (
                            <View style={styles.locationContainer}>
                                <Ionicons name="location-outline" size={16} color={textColor} />
                                <ThemedText style={styles.location}>{conference.location}</ThemedText>
                            </View>
                        ) : (
                            <></>
                        )}
                        <View style={styles.statusContainer}>
                            <View
                                style={[
                                    styles.statusBadge,
                                    {
                                        backgroundColor:
                                            calculateCurrentStatus(conference.startDate, conference.endDate) ===
                                            "ongoing"
                                                ? tintColor
                                                : mutedColor,
                                    },
                                ]}
                            >
                                <ThemedText style={styles.statusText}>
                                    {t(`status.${calculateCurrentStatus(conference.startDate, conference.endDate)}`)}
                                </ThemedText>
                            </View>
                            {isActive && (
                                <View style={[styles.activeBadge, { backgroundColor: tintColor }]}>
                                    <ThemedText style={styles.statusText}>{t("status.active")}</ThemedText>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {conference.description && (
                    <ThemedView style={[styles.section, { borderBottomColor: borderLight }]}>
                        <ThemedText style={styles.sectionTitle}>{t("talks.description")}</ThemedText>
                        <ThemedText style={styles.description}>{conference.description}</ThemedText>
                    </ThemedView>
                )}

                <ThemedView style={[styles.section, { borderBottomColor: borderLight }]}>
                    <ThemedText style={styles.sectionTitle}>{t("conferences.statistics")}</ThemedText>
                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <ThemedText style={styles.statValue}>{conferenceTalks.length}</ThemedText>
                            <ThemedText style={styles.statLabel}>{t("navigation.tabs.talks")}</ThemedText>
                        </View>
                        <View style={styles.statItem}>
                            <ThemedText style={styles.statValue}>{getTotalNotesCount()}</ThemedText>
                            <ThemedText style={styles.statLabel}>{t("navigation.tabs.notes")}</ThemedText>
                        </View>
                        <View style={styles.statItem}>
                            <ThemedText style={styles.statValue}>
                                {conference.createdAt ? format(conference.createdAt, "MMM d") : "N/A"}
                            </ThemedText>
                            <ThemedText style={styles.statLabel}>{t("conferences.created")}</ThemedText>
                        </View>
                    </View>
                </ThemedView>

                <ThemedView style={[styles.section]}>
                    <View style={[styles.sectionHeader]}>
                        <ThemedText style={[styles.sectionTitle, { marginBottom: 0 }]}>
                            {t("conferences.timeline")}
                        </ThemedText>
                    </View>

                    {conferenceTalks.length > 0 ? (
                        <View style={styles.timelineContainer}>
                            {conferenceTalks.map((talk) => (
                                <TouchableOpacity
                                    key={talk.id}
                                    style={styles.timelineItem}
                                    onPress={() => handleViewTalk(talk.id)}
                                >
                                    <View style={styles.timeContainer}>
                                        <ThemedText style={styles.timeText}>{formatTime(talk.startTime)}</ThemedText>
                                        {!!talk.duration && (
                                            <ThemedText style={styles.endTimeText}>
                                                {`(${t("forms.talk.durationMinutes", { duration: talk.duration })})`}
                                            </ThemedText>
                                        )}
                                    </View>
                                    <View style={[styles.timelineLine, { backgroundColor: tintColor }]} />
                                    <View style={[styles.timelineDot, { backgroundColor: tintColor }]} />
                                    <View style={styles.talkContainer}>
                                        <ThemedText style={styles.talkTitle}>{talk.title}</ThemedText>
                                        <ThemedText style={styles.notesCount}>
                                            {`${getNotesCount(talk.id)} ${
                                                getNotesCount(talk.id) === 1 ? t("notes.note") : t("notes.notes")
                                            }`}
                                        </ThemedText>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : (
                        <ThemedView style={styles.emptyContainer}>
                            <ThemedText style={styles.emptyText}>No talks added yet</ThemedText>
                            {/* <TouchableOpacity
                                style={[styles.addTalkButton, { backgroundColor: tintColor }]}
                                onPress={() => router.push("/modals/new-talk")}
                            >
                                <ThemedText style={styles.addTalkButtonText}>Add First Talk</ThemedText>
                            </TouchableOpacity> */}
                        </ThemedView>
                    )}
                </ThemedView>
            </ScrollView>

            <View style={[styles.actionBar, { borderTopColor: borderLight }]}>
                {!isActive && (
                    <TouchableOpacity
                        style={[styles.actionButton, styles.makeActiveButton, { backgroundColor: tintColor }]}
                        onPress={handleMakeActive}
                    >
                        <Ionicons name="checkmark-circle-outline" size={20} color="black" />
                        <ThemedText style={styles.actionButtonText}>{t("conferences.makeActive")}</ThemedText>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: backgroundColor }]}
                    onPress={handleEditConference}
                >
                    <Ionicons name="pencil-outline" size={20} color={tintColor} />
                    <ThemedText style={[styles.actionButtonText, { color: tintColor }]}>{t("common.edit")}</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: backgroundColor }]}
                    onPress={handleExportConference}
                >
                    <Ionicons name="share-outline" size={20} color={tintColor} />
                    <ThemedText style={[styles.actionButtonText, { color: tintColor }]}>
                        {t("common.actions.export")}
                    </ThemedText>
                </TouchableOpacity>
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
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
    locationContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    location: {
        fontSize: 16,
        marginLeft: 4,
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
        color: "black",
        fontWeight: "bold",
        fontSize: 12,
        textTransform: "uppercase",
    },
    section: {
        padding: 16,
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
        width: 100,
        marginRight: 4,
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
        height: "90%",
        left: 109,
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
        color: "black",
        fontWeight: "bold",
    },
    actionBar: {
        flexDirection: "row",
        padding: 16,
        borderTopWidth: 1,
    },
    actionButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 12,
        borderRadius: 8,
        marginHorizontal: 4,
    },
    makeActiveButton: {
        flex: 1.5,
    },
    actionButtonText: {
        marginLeft: 8,
        fontWeight: "bold",
        color: "black",
    },
});
