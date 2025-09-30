import React from "react";
import { View, StyleSheet, ScrollView, Pressable, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ConferenceItem } from "@/components/conference/ConferenceItem";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useI18n } from "@/hooks/useI18n";
import { Ionicons } from "@expo/vector-icons";
import { toast } from "sonner-native";

export default function ConferencesScreen() {
    const { currentConference } = useApp();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { t } = useI18n();

    const tintColor = useThemeColor({}, "tint");
    const tintContentColor = useThemeColor({}, "tintContent");
    const headerBackgroundColor = useThemeColor({}, "headerBackground");
    const borderLight = useThemeColor({}, "borderLight");
    const backgroundOverlayLight = useThemeColor({}, "backgroundOverlayLight");
    const textColor = useThemeColor({}, "text");
    const mutedColor = useThemeColor({}, "muted");

    const handleAllConferences = () => {
        router.push("/conference-list" as any);
    };

    const handleSettings = () => {
        router.push("/modals/settings" as any);
    };

    const handleConferenceDetails = () => {
        if (currentConference?.id) {
            router.push({
                pathname: "/conference",
                params: { id: currentConference.id },
            });
        }
    };

    const handleEditConference = () => {
        if (currentConference?.id) {
            router.push({
                pathname: "/modals/edit-conference",
                params: { id: currentConference.id },
            });
        }
    };

    const handleExportConference = () => {
        if (currentConference?.id) {
            router.push({
                pathname: "/modals/export-options",
                params: { id: currentConference.id },
            });
        }
    };

    const handleOpenLink = async (url: string) => {
        try {
            const canOpen = await Linking.canOpenURL(url);
            if (canOpen) {
                await Linking.openURL(url);
            } else {
                toast.error("Cannot open this URL");
            }
        } catch (error) {
            console.error("Error opening URL:", error);
            toast.error("Failed to open URL");
        }
    };

    return (
        <ThemedView style={styles.container}>
            {/* Header */}
            <View
                style={[
                    styles.header,
                    {
                        borderBottomColor: borderLight,
                        backgroundColor: headerBackgroundColor,
                        paddingTop: insets.top + 10,
                        height: insets.top + 64,
                    },
                ]}
            >
                <ThemedText style={styles.headerTitle}>{t("conferences.dashboard.title")}</ThemedText>
                <Pressable
                    style={({ pressed }) => [
                        styles.settingsButton,
                        {
                            opacity: pressed ? 0.7 : 1,
                        },
                    ]}
                    onPress={handleSettings}
                >
                    <IconSymbol name="gearshape" size={24} color={textColor} />
                </Pressable>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Active Conference Section */}
                <View style={(styles.section, { marginBottom: 12 })}>
                    <ThemedText style={styles.sectionTitle}>{t("conferences.dashboard.activeConference")}</ThemedText>
                    {currentConference ? (
                        <ConferenceItem
                            conference={currentConference}
                            isActive={true}
                            onPress={handleConferenceDetails}
                            onEdit={handleEditConference}
                            onExport={handleExportConference}
                        />
                    ) : (
                        <View style={[styles.emptyCard, { borderColor: borderLight }]}>
                            <Ionicons name="calendar-outline" size={48} color={mutedColor} />
                            <ThemedText style={[styles.emptyText, { color: mutedColor }]}>
                                {t("conferences.dashboard.noActiveConference")}
                            </ThemedText>
                        </View>
                    )}
                </View>

                {/* All Conferences Button */}
                <View style={styles.section}>
                    <View
                        style={[
                            styles.sectionContainer,
                            { backgroundColor: backgroundOverlayLight, borderColor: borderLight },
                        ]}
                    >
                        <Pressable
                            style={({ pressed }) => [
                                styles.linkItem,
                                { borderBottomColor: borderLight, opacity: pressed ? 0.7 : 1 },
                            ]}
                            onPress={handleAllConferences}
                        >
                            <ThemedText style={styles.linkText}>{t("conferences.dashboard.allConferences")}</ThemedText>
                            <IconSymbol name="chevron.right" size={16} color={mutedColor} />
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => [styles.linkItemLast, { opacity: pressed ? 0.7 : 1 }]}
                            onPress={() => handleOpenLink("https://feedback.example.com")}
                        >
                            <View style={styles.sectionTitleRow}>
                                <ThemedText style={styles.linkText}>
                                    {t("conferences.dashboard.updates.title")}
                                </ThemedText>
                                <View style={[styles.badge, { backgroundColor: tintColor }]}>
                                    <ThemedText style={[styles.badgeText, { color: tintContentColor }]}>1</ThemedText>
                                </View>
                            </View>
                            <IconSymbol name="chevron.right" size={16} color={mutedColor} />
                        </Pressable>
                    </View>
                </View>

                {/* Links Section */}
                <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>{t("conferences.dashboard.socials.title")}</ThemedText>
                    <View
                        style={[
                            styles.sectionContainer,
                            { backgroundColor: backgroundOverlayLight, borderColor: borderLight },
                        ]}
                    >
                        <Pressable
                            style={({ pressed }) => [
                                styles.linkItem,
                                { borderBottomColor: borderLight, opacity: pressed ? 0.7 : 1 },
                            ]}
                            onPress={() => handleOpenLink("https://feedback.example.com")}
                        >
                            <ThemedText style={styles.linkText}>
                                {t("conferences.dashboard.socials.feedback")}
                            </ThemedText>
                            <IconSymbol name="arrow.up.right.square" size={16} color={mutedColor} />
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => [
                                styles.linkItem,
                                { borderBottomColor: borderLight, opacity: pressed ? 0.7 : 1 },
                            ]}
                            onPress={() => handleOpenLink("https://quiz.example.com")}
                        >
                            <ThemedText style={styles.linkText}>{t("conferences.dashboard.socials.quiz")}</ThemedText>
                            <IconSymbol name="arrow.up.right.square" size={16} color={mutedColor} />
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => [styles.linkItemLast, { opacity: pressed ? 0.7 : 1 }]}
                            onPress={() => handleOpenLink("https://discord.gg/SvkGpjxSMe")}
                        >
                            <ThemedText style={styles.linkText}>
                                {t("conferences.dashboard.socials.discord")}
                            </ThemedText>
                            <IconSymbol name="arrow.up.right.square" size={16} color={mutedColor} />
                        </Pressable>
                    </View>
                </View>
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingBottom: 8,
        marginBottom: 6,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: "bold",
    },
    settingsButton: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 12,
        marginBottom: 4,
        marginLeft: 18,
        opacity: 0.7,
        textTransform: "uppercase",
    },
    sectionTitleRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    badge: {
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 8,
    },
    badgeText: {
        marginTop: -2,
        fontSize: 12,
        fontFamily: "MuseoSans-Black",
    },
    emptyCard: {
        borderRadius: 12,
        padding: 32,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderStyle: "dashed",
    },
    emptyText: {
        marginTop: 12,
        fontSize: 16,
        textAlign: "center",
    },
    sectionContainer: {
        borderRadius: 12,
        borderWidth: 1,
        overflow: "hidden",
    },
    linkItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    linkItemLast: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    linkText: {
        fontSize: 16,
    },
});
