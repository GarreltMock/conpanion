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
import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import { toast } from "sonner-native";
import WebView from "react-native-webview";

export default function ConferencesScreen() {
    const { currentConference } = useApp();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { t } = useI18n();

    const headerBackgroundColor = useThemeColor({}, "headerBackground");
    const borderLight = useThemeColor({}, "borderLight");
    const backgroundOverlayLight = useThemeColor({}, "backgroundOverlayLight");
    const textColor = useThemeColor({}, "text");
    const mutedColor = useThemeColor({}, "muted");

    // const handleAllConferences = () => {
    //     router.push("/conference-list" as any);
    // };

    const handleSettings = () => {
        router.push("/modals/settings" as any);
    };

    const handleConferenceDetails = () => {
        if (currentConference?.id) {
            router.push({
                pathname: "/conference-details",
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

    const showLink = (url: string, title?: string) => {
        router.push({
            pathname: "/modals/webview",
            params: { url, title },
        });
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
                <View style={(styles.section, { marginBottom: 12, marginTop: 8 })}>
                    {/* TODO: after programmier.con */}
                    {/* <ThemedText style={styles.sectionTitle}>{t("conferences.dashboard.conference.title")}</ThemedText> */}
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
                                {t("conferences.dashboard.conference.noActive")}
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
                        {/* TODO: after programmier.con */}
                        {/* <Pressable
                            style={({ pressed }) => [
                                styles.linkItem,
                                { borderBottomColor: borderLight, opacity: pressed ? 0.7 : 1 },
                            ]}
                            onPress={handleAllConferences}
                        >
                            <ThemedText style={styles.linkText}>
                                {t("conferences.dashboard.conference.allConferences")}
                            </ThemedText>
                            <IconSymbol name="chevron.right" size={16} color={mutedColor} />
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => [
                                styles.linkItem,
                                { borderBottomColor: borderLight, opacity: pressed ? 0.7 : 1 },
                            ]}
                        >
                            <View style={styles.sectionTitleRow}>
                                <ThemedText style={styles.linkText}>
                                    {t("conferences.dashboard.conference.updates")}
                                </ThemedText>
                                <View style={[styles.badge, { backgroundColor: tintColor }]}>
                                    <ThemedText style={[styles.badgeText, { color: tintContentColor }]}>1</ThemedText>
                                </View>
                            </View>
                            <IconSymbol name="chevron.right" size={16} color={mutedColor} />
                        </Pressable> */}
                        <Pressable
                            style={({ pressed }) => [
                                styles.linkItem,
                                { borderBottomColor: borderLight, opacity: pressed ? 0.7 : 1 },
                            ]}
                            onPress={() =>
                                showLink(
                                    "https://l.programmier.bar/pcfeedback",
                                    t("conferences.dashboard.conference.feedback")
                                )
                            }
                        >
                            <View style={styles.linkTextContainer}>
                                <FontAwesome6 name="comment-dots" size={20} color={textColor} style={styles.linkIcon} />
                                <ThemedText style={styles.linkText}>
                                    {t("conferences.dashboard.conference.feedback")}
                                </ThemedText>
                            </View>
                            <IconSymbol name="chevron.right" size={16} color={mutedColor} />
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => [
                                styles.linkItem,
                                { borderBottomColor: borderLight, opacity: pressed ? 0.7 : 1 },
                            ]}
                            onPress={() =>
                                showLink("https://l.programmier.bar/pcquiz", t("conferences.dashboard.conference.quiz"))
                            }
                        >
                            <View style={styles.linkTextContainer}>
                                <FontAwesome6
                                    name="clipboard-question"
                                    size={20}
                                    color={textColor}
                                    style={styles.linkIcon}
                                />
                                <ThemedText style={styles.linkText}>
                                    {t("conferences.dashboard.conference.quiz")}
                                </ThemedText>
                            </View>
                            <IconSymbol name="chevron.right" size={16} color={mutedColor} />
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => [
                                styles.linkItem,
                                { borderBottomColor: borderLight, opacity: pressed ? 0.7 : 1 },
                            ]}
                            onPress={() => router.push("/modals/map-view" as any)}
                        >
                            <View style={styles.linkTextContainer}>
                                <FontAwesome6 name="map" size={20} color={textColor} style={styles.linkIcon} />
                                <ThemedText style={styles.linkText}>
                                    {t("conferences.dashboard.conference.map")}
                                </ThemedText>
                            </View>
                            <IconSymbol name="chevron.right" size={16} color={mutedColor} />
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => [
                                styles.linkItem,
                                { borderBottomColor: borderLight, opacity: pressed ? 0.7 : 1 },
                            ]}
                            onPress={() =>
                                showLink(
                                    "https://www.programmier.bar/verhaltensregeln",
                                    t("conferences.dashboard.conference.codeOfConduct")
                                )
                            }
                        >
                            <View style={styles.linkTextContainer}>
                                <FontAwesome6 name="gavel" size={20} color={textColor} style={styles.linkIcon} />
                                <ThemedText style={styles.linkText}>
                                    {t("conferences.dashboard.conference.codeOfConduct")}
                                </ThemedText>
                            </View>
                            <IconSymbol name="chevron.right" size={16} color={mutedColor} />
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => [
                                styles.linkItemLast,
                                { borderBottomColor: borderLight, opacity: pressed ? 0.7 : 1 },
                            ]}
                            onPress={() =>
                                showLink(
                                    "https://www.programmier.bar/aufnahmen",
                                    t("conferences.dashboard.conference.photoAndVideoPolicy")
                                )
                            }
                        >
                            <View style={styles.linkTextContainer}>
                                <FontAwesome6 name="camera" size={20} color={textColor} style={styles.linkIcon} />
                                <ThemedText style={styles.linkText}>
                                    {t("conferences.dashboard.conference.photoAndVideoPolicy")}
                                </ThemedText>
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
                            styles.socialLinkContainer,
                            { backgroundColor: backgroundOverlayLight, borderColor: borderLight },
                        ]}
                    >
                        <Pressable
                            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                            onPress={() => handleOpenLink("https://discord.gg/SvkGpjxSMe")}
                        >
                            <FontAwesome6 name="discord" size={26} color={textColor} />
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                            onPress={() =>
                                handleOpenLink(
                                    "https://open.spotify.com/show/0ik0sXv9paTQCeThcOLCCJ?si=fac1e831038b4b22"
                                )
                            }
                        >
                            <FontAwesome6 name="spotify" size={26} color={textColor} />
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                            onPress={() => handleOpenLink("https://www.programmier.bar/")}
                        >
                            <Ionicons name="globe-outline" size={26} color={textColor} />
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                            onPress={() => handleOpenLink("https://www.linkedin.com/company/68164372")}
                        >
                            <FontAwesome6 name="linkedin" size={26} color={textColor} />
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                            onPress={() => handleOpenLink("https://social.programmier.bar/@podcast")}
                        >
                            <FontAwesome6 name="mastodon" size={26} color={textColor} />
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                            onPress={() => handleOpenLink("https://www.instagram.com/programmier.bar")}
                        >
                            <FontAwesome6 name="instagram" size={26} color={textColor} />
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                            onPress={() => handleOpenLink("https://github.com/programmierbar")}
                        >
                            <FontAwesome6 name="github" size={26} color={textColor} />
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                            onPress={() => handleOpenLink("https://bsky.app/profile/programmier.bar")}
                        >
                            <FontAwesome6 name="bluesky" size={26} color={textColor} />
                        </Pressable>
                    </View>
                </View>

                <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>{t("conferences.dashboard.podcast.title")}</ThemedText>
                    <View style={styles.webviewContainer}>
                        <WebView
                            source={{
                                uri: "https://www.buzzsprout.com/176239?client_source=large_player&iframe=true&referrer=https%3A%2F%2Fwww.buzzsprout.com%2Fadmin%2F176239%2Fpodcast%2Fembed&tags=programmiercon",
                            }}
                            style={styles.webview}
                            javaScriptEnabled={true}
                            domStorageEnabled={true}
                        />
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
    linkTextContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    linkIcon: {
        marginRight: 8,
        width: 22,
        justifyContent: "center",
        alignItems: "center",
    },
    socialLinkContainer: {
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
    },
    webviewContainer: { borderRadius: 12, overflow: "hidden" },
    webview: { flex: 1, height: 375 },
});
