import React, { useEffect, useState } from "react";
import { View, StyleSheet, FlatList, Text, Pressable, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
import { useI18n } from "@/hooks/useI18n";

export default function ConferenceListModal() {
    const { conferences, currentConference, getConferences, hasConferences } = useApp();
    const insets = useSafeAreaInsets();

    const [loading, setLoading] = useState(true);
    const [hasAnyConferences, setHasAnyConferences] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const router = useRouter();
    const { t } = useI18n();
    const textColor = useThemeColor({}, "text");
    const tintColor = useThemeColor({}, "tint");
    const tintContentColor = useThemeColor({}, "tintContent");
    const headerBackgroundColor = useThemeColor({}, "headerBackground");
    const borderLightColor = useThemeColor({}, "borderLight");

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

    const handleViewConferenceDetails = (conference: Conference) => {
        // Make sure we have an ID to navigate with
        if (!conference || !conference.id) {
            console.error("Cannot navigate to conference details: Invalid conference");
            return;
        }

        router.push({
            pathname: "/conference-details",
            params: { id: conference.id },
        });
    };

    const handleClose = () => {
        router.back();
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ThemedText>{t("conferences.loading")}</ThemedText>
            </View>
        );
    }

    if (!hasAnyConferences) {
        return <FirstTimeConferencePrompt />;
    }

    return (
        <ThemedView style={styles.container}>
            <View
                style={[
                    styles.header,
                    {
                        backgroundColor: headerBackgroundColor,
                        borderColor: borderLightColor,
                        paddingTop: insets.top + 10,
                    },
                ]}
            >
                <TouchableOpacity style={styles.backButton} onPress={handleClose}>
                    <IconSymbol name="chevron.left" size={20} color={textColor} />
                    <ThemedText style={styles.backText}>{t("common.back")}</ThemedText>
                </TouchableOpacity>
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
                    <IconSymbol name="plus" size={18} color={tintContentColor} />
                    <Text style={[styles.buttonText, { color: tintContentColor }]}>{t("common.actions.add")}</Text>
                </Pressable>
            </View>

            <FlatList
                data={conferences}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={{ marginVertical: 8, marginHorizontal: 16 }}>
                        <ConferenceItem
                            conference={item}
                            isActive={currentConference?.id === item.id}
                            onPress={() => handleViewConferenceDetails(item)}
                            onExport={() => handleExportConference(item)}
                            onEdit={() => handleEditConference(item)}
                        />
                    </View>
                )}
                refreshing={refreshing}
                onRefresh={handleRefresh}
                ListEmptyComponent={
                    <ThemedView style={styles.emptyContainer}>
                        <Ionicons name="calendar-outline" size={64} color={tintColor} />
                        <ThemedText style={styles.emptyText}>{t("conferences.noConferences")}</ThemedText>
                        <ThemedText style={styles.emptySubtext}>{t("conferences.getStarted")}</ThemedText>
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
        marginBottom: 12,
        paddingHorizontal: 8,
        paddingBottom: 10,
        borderBottomWidth: 1,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    backButton: {
        flexDirection: "row",
        alignItems: "center",
    },
    backText: {
        fontSize: 17,
        marginLeft: 4,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: "bold",
        flex: 1,
        textAlign: "center",
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
