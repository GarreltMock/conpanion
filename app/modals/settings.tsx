import React from "react";
import { StyleSheet, ScrollView, View, Pressable, Switch, Linking } from "react-native";
import { useRouter } from "expo-router";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useThemeColor } from "@/hooks/useThemeColor";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useI18n } from "@/hooks/useI18n";
import { useColorScheme } from "@/context/ColorSchemeContext";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsModal() {
    const router = useRouter();
    const { t, locale, changeLocale } = useI18n();
    const { colorScheme, userPreference, setColorScheme } = useColorScheme();

    const headerBackgroundColor = useThemeColor({}, "headerBackground");
    const borderLight = useThemeColor({}, "borderLight");
    const backgroundOverlayLight = useThemeColor({}, "backgroundOverlayLight");
    const backgroundOverlay = useThemeColor({}, "backgroundOverlay");
    const tintColor = useThemeColor({}, "tint");
    const textColor = useThemeColor({}, "text");
    const mutedColor = useThemeColor({}, "muted");

    const handleClose = () => {
        router.back();
    };

    const toggleDarkMode = () => {
        if (userPreference === "system") {
            // If currently following system, toggle to opposite of current system setting
            const newPreference = colorScheme === "dark" ? "light" : "dark";
            setColorScheme(newPreference);
        } else if (userPreference === "dark") {
            // If currently dark, go to light
            setColorScheme("light");
        } else {
            // If currently light, go to dark
            setColorScheme("dark");
        }
    };

    const toggleLanguage = () => {
        changeLocale(locale === "en" ? "de" : "en");
    };

    const handleExternalLink = (url: string, title?: string) => {
        router.push({
            pathname: "/modals/webview",
            params: { url, title },
        });
    };

    const sendMail = (url: string) => {
        Linking.openURL(url).catch((error) => {
            console.error("Failed to open email app:", error);
        });
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ThemedView style={styles.container}>
                {/* Header */}
                <View
                    style={[
                        styles.header,
                        {
                            backgroundColor: headerBackgroundColor,
                            borderBottomColor: borderLight,
                        },
                    ]}
                >
                    <View style={styles.headerLeft} />
                    <ThemedText style={styles.headerTitle}>{t("settings.title")}</ThemedText>
                    <Pressable
                        style={({ pressed }) => [styles.closeButton, { opacity: pressed ? 0.7 : 1 }]}
                        onPress={handleClose}
                    >
                        <IconSymbol name="xmark" size={18} color={textColor} />
                    </Pressable>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* App Section */}
                    <View style={styles.section}>
                        <ThemedText style={styles.sectionTitle}>{t("settings.app.title")}</ThemedText>
                        <View
                            style={[
                                styles.settingsGroup,
                                {
                                    backgroundColor: backgroundOverlayLight,
                                    borderColor: borderLight,
                                },
                            ]}
                        >
                            <View style={[styles.settingItem, { borderBottomColor: borderLight }]}>
                                <ThemedText style={styles.settingLabel}>{t("settings.app.darkMode")}</ThemedText>
                                <Switch
                                    style={{ marginVertical: -2 }}
                                    value={colorScheme === "dark"}
                                    onValueChange={toggleDarkMode}
                                    trackColor={{ false: mutedColor, true: tintColor }}
                                    thumbColor="#ffffff"
                                />
                            </View>
                            <Pressable
                                style={({ pressed }) => [styles.settingItemLast, { opacity: pressed ? 0.7 : 1 }]}
                                onPress={toggleLanguage}
                            >
                                <ThemedText style={styles.settingLabel}>{t("settings.app.language")}</ThemedText>
                                <View style={[styles.languageButton, { backgroundColor: backgroundOverlay }]}>
                                    <ThemedText style={[styles.languageText, { color: textColor }]}>
                                        {locale.toUpperCase()}
                                    </ThemedText>
                                </View>
                            </Pressable>
                        </View>
                    </View>

                    {/* Legal Section */}
                    <View style={styles.section}>
                        <ThemedText style={styles.sectionTitle}>{t("settings.legal.title")}</ThemedText>
                        <View
                            style={[
                                styles.settingsGroup,
                                {
                                    backgroundColor: backgroundOverlayLight,
                                    borderColor: borderLight,
                                },
                            ]}
                        >
                            <Pressable
                                style={({ pressed }) => [
                                    styles.settingItem,
                                    {
                                        borderBottomColor: borderLight,
                                        opacity: pressed ? 0.7 : 1,
                                    },
                                ]}
                                onPress={() =>
                                    handleExternalLink("https://privacy.example.com", t("settings.legal.dataPrivacy"))
                                }
                            >
                                <ThemedText style={styles.settingLabel}>{t("settings.legal.dataPrivacy")}</ThemedText>
                                <IconSymbol name="chevron.right" size={16} color={mutedColor} />
                            </Pressable>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.settingItem,
                                    {
                                        borderBottomColor: borderLight,
                                        opacity: pressed ? 0.7 : 1,
                                    },
                                ]}
                                onPress={() =>
                                    handleExternalLink("https://lotum.com/de/legal-info", t("settings.legal.impressum"))
                                }
                            >
                                <ThemedText style={styles.settingLabel}>{t("settings.legal.impressum")}</ThemedText>
                                <IconSymbol name="chevron.right" size={16} color={mutedColor} />
                            </Pressable>
                            <Pressable
                                style={({ pressed }) => [styles.settingItemLast, { opacity: pressed ? 0.7 : 1 }]}
                                onPress={() => sendMail("mailto:podcast@programmier.bar")}
                            >
                                <ThemedText style={styles.settingLabel}>
                                    {t("settings.legal.contactSupport")}
                                </ThemedText>
                                <IconSymbol name="chevron.right" size={16} color={mutedColor} />
                            </Pressable>
                        </View>
                    </View>
                </ScrollView>
            </ThemedView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    headerLeft: {
        width: 40,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "600",
        flex: 1,
        textAlign: "center",
    },
    closeButton: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 24,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 12,
        marginBottom: 4,
        marginLeft: 12,
        paddingHorizontal: 4,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        opacity: 0.7,
    },
    settingsGroup: {
        borderRadius: 12,
        borderWidth: 1,
        overflow: "hidden",
    },
    settingItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    settingItemLast: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    settingLabel: {
        fontSize: 16,
        flex: 1,
    },
    languageButton: {
        borderRadius: 8,
        marginVertical: -4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        minWidth: 40,
        alignItems: "center",
    },
    languageText: {
        fontSize: 14,
        fontFamily: "MuseoSans-Bold",
    },
});
