import React, { useEffect, useState } from "react";
import {
    View,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
} from "react-native";
import { useApp } from "../../context/AppContext";
import { ThemedText } from "../../components/ThemedText";
import { ThemedView } from "../../components/ThemedView";
import { ConferenceItem } from "../../components/conference/ConferenceItem";
import { FirstTimeConferencePrompt } from "../../components/conference/FirstTimeConferencePrompt";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "../../hooks/useThemeColor";
import { useRouter } from "expo-router";
import { Conference } from "../../types";

export default function ConferencesScreen() {
    const {
        conferences,
        currentConference,
        getConferences,
        switchActiveConference,
        deleteConference,
        hasConferences,
    } = useApp();

    const [loading, setLoading] = useState(true);
    const [hasAnyConferences, setHasAnyConferences] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const router = useRouter();
    const tintColor = useThemeColor({}, "tint");

    useEffect(() => {
        const checkConferencesAndLoad = async () => {
            console.log("Conferences screen - loading data");
            setLoading(true);
            try {
                const hasConfs = await hasConferences();
                console.log("Has conferences check:", hasConfs);
                setHasAnyConferences(hasConfs);

                // Always try to load conferences regardless of hasConfs
                // This ensures we have the latest data
                const loadedConferences = await getConferences();
                console.log("Loaded conferences:", loadedConferences);
            } catch (error) {
                console.error("Error loading conferences:", error);
            } finally {
                setLoading(false);
            }
        };

        checkConferencesAndLoad();

        // Only run this once on component mount by using empty dependency array
    }, []);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            console.log("Refreshing conferences list");
            const hasConfs = await hasConferences();
            console.log("Has conferences check (refresh):", hasConfs);
            setHasAnyConferences(hasConfs);

            // Always try to load conferences
            const loadedConferences = await getConferences();
            console.log("Refreshed conferences:", loadedConferences);
        } catch (error) {
            console.error("Error refreshing conferences:", error);
        } finally {
            setRefreshing(false);
        }
    };

    const handleCreateNewConference = () => {
        router.push("/modals/new-conference");
    };

    const handleEditConference = (conference: Conference) => {
        router.push({
            pathname: "/modals/edit-conference",
            params: { id: conference.id },
        });
    };

    const handleExportConference = (conference: Conference) => {
        router.push({
            pathname: "/modals/export-options",
            params: { id: conference.id },
        });
    };

    const handleDeleteConference = (conference: Conference) => {
        Alert.alert(
            "Delete Conference",
            `Are you sure you want to delete "${conference.name}"? This will delete all talks and notes associated with this conference and cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteConference(conference.id);
                            // Check if we have any conferences left
                            const hasConfs = await hasConferences();
                            setHasAnyConferences(hasConfs);
                        } catch {
                            Alert.alert("Error", "Failed to delete conference");
                        }
                    },
                },
            ]
        );
    };

    const handleSwitchConference = async (conference: Conference) => {
        if (currentConference?.id !== conference.id) {
            try {
                await switchActiveConference(conference.id);
                Alert.alert("Success", `Switched to ${conference.name}`);
            } catch {
                Alert.alert("Error", "Failed to switch conference");
            }
        }
    };

    const handleViewConferenceDetails = (conference: Conference) => {
        console.log("Navigating to conference details:", conference.id);

        // Make sure we have an ID to navigate with
        if (!conference || !conference.id) {
            console.error(
                "Cannot navigate to conference details: Invalid conference"
            );
            return;
        }

        router.push({
            pathname: "/conference",
            params: { id: conference.id },
        });
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ThemedText>Loading conferences...</ThemedText>
            </View>
        );
    }

    if (!hasAnyConferences) {
        return <FirstTimeConferencePrompt />;
    }

    return (
        <ThemedView style={styles.container}>
            <FlatList
                data={conferences}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <ConferenceItem
                        conference={item}
                        isActive={currentConference?.id === item.id}
                        onPress={() => handleViewConferenceDetails(item)}
                        onExport={() => handleExportConference(item)}
                        onEdit={() => handleEditConference(item)}
                        onDelete={() => handleDeleteConference(item)}
                    />
                )}
                ListHeaderComponent={
                    <View style={styles.header}>
                        <ThemedText style={styles.headerTitle}>
                            Your Conferences
                        </ThemedText>
                        <TouchableOpacity
                            style={[
                                styles.addButton,
                                { backgroundColor: tintColor },
                            ]}
                            onPress={handleCreateNewConference}
                        >
                            <Ionicons name="add" size={24} color="white" />
                            <ThemedText style={styles.addButtonText}>
                                New Conference
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
                }
                refreshing={refreshing}
                onRefresh={handleRefresh}
                ListEmptyComponent={
                    <ThemedView style={styles.emptyContainer}>
                        <Ionicons
                            name="calendar-outline"
                            size={64}
                            color={tintColor}
                        />
                        <ThemedText style={styles.emptyText}>
                            No conferences found
                        </ThemedText>
                        <ThemedText style={styles.emptySubtext}>
                            Tap the "New Conference" button to get started
                        </ThemedText>
                    </ThemedView>
                }
                contentContainerStyle={
                    conferences.length === 0 ? { flex: 1 } : undefined
                }
            />
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
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 60, // Match the padding used in talks.tsx
        paddingBottom: 8,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 16,
    },
    addButton: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        borderRadius: 8,
        justifyContent: "center",
    },
    addButtonText: {
        color: "white",
        fontWeight: "bold",
        marginLeft: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: "bold",
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 16,
        textAlign: "center",
        opacity: 0.7,
    },
});
