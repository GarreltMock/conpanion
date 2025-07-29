import React, { useEffect, useState } from "react";
import { View, StyleSheet, FlatList, Alert, Text, Pressable } from "react-native";
import { useApp } from "@/context/AppContext";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ConferenceItem } from "@/components/conference/ConferenceItem";
import { FirstTimeConferencePrompt } from "@/components/conference/FirstTimeConferencePrompt";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useRouter } from "expo-router";
import { Conference } from "@/types";
import { IconSymbol } from "@/components/ui/IconSymbol";

export default function ConferencesScreen() {
    const { conferences, currentConference, getConferences, switchActiveConference, deleteConference, hasConferences } =
        useApp();

    const [loading, setLoading] = useState(true);
    const [hasAnyConferences, setHasAnyConferences] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const router = useRouter();
    const tintColor = useThemeColor({}, "tint");
    const backgroundColor = useThemeColor({}, "background");
    const borderLight = useThemeColor({}, "borderLight");

    useEffect(() => {
        const checkConferencesAndLoad = async () => {
            setLoading(true);
            try {
                const hasConfs = await hasConferences();
                setHasAnyConferences(hasConfs);

                // Always try to load conferences regardless of hasConfs
                // This ensures we have the latest data
                await getConferences();
            } catch (error) {
                console.error("Error loading conferences:", error);
            } finally {
                setLoading(false);
            }
        };

        checkConferencesAndLoad();

        // Only run this once on component mount by using empty dependency array
    }, [getConferences, hasConferences]);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            const hasConfs = await hasConferences();
            setHasAnyConferences(hasConfs);

            // Always try to load conferences
            await getConferences();
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

    const handleViewConferenceDetails = (conference: Conference) => {
        // Make sure we have an ID to navigate with
        if (!conference || !conference.id) {
            console.error("Cannot navigate to conference details: Invalid conference");
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
            <View style={[styles.header, { borderBottomColor: borderLight }]}>
                <ThemedText style={styles.headerTitle}>Conferences</ThemedText>
                <Pressable
                    style={({ pressed }) => [
                        styles.addButton,
                        {
                            backgroundColor: tintColor,
                            opacity: pressed ? 0.8 : 1,
                        },
                    ]}
                    onPress={handleCreateNewConference}
                >
                    <IconSymbol name="plus" size={18} color={backgroundColor} />
                    <Text style={[styles.buttonText, { color: backgroundColor }]}>Add</Text>
                </Pressable>
            </View>
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
                refreshing={refreshing}
                onRefresh={handleRefresh}
                ListEmptyComponent={
                    <ThemedView style={styles.emptyContainer}>
                        <Ionicons name="calendar-outline" size={64} color={tintColor} />
                        <ThemedText style={styles.emptyText}>No conferences found</ThemedText>
                        <ThemedText style={styles.emptySubtext}>
                            Tap the "New Conference" button to get started
                        </ThemedText>
                    </ThemedView>
                }
                contentContainerStyle={conferences.length === 0 ? { flex: 1 } : undefined}
            />
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
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: "bold",
    },
    addButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    buttonText: {
        marginLeft: 6,
        fontWeight: "600",
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
