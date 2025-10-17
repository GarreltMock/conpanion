import React from "react";
import { StyleSheet, View, Pressable, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { WebView } from "react-native-webview";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useThemeColor } from "@/hooks/useThemeColor";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useI18n } from "@/hooks/useI18n";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WebViewModal() {
    const router = useRouter();
    const { url, title } = useLocalSearchParams<{ url: string; title?: string }>();
    const { t } = useI18n();

    const backgroundColor = useThemeColor({}, "background");
    const headerBackgroundColor = useThemeColor({}, "headerBackground");
    const borderLight = useThemeColor({}, "borderLight");
    const textColor = useThemeColor({}, "text");
    const tintColor = useThemeColor({}, "tint");

    const handleClose = () => {
        router.back();
    };

    if (!url) {
        return (
            <SafeAreaView style={{ flex: 1 }}>
                <ThemedView style={styles.container}>
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
                        <ThemedText style={styles.headerTitle}>Error</ThemedText>
                        <Pressable
                            style={({ pressed }) => [styles.closeButton, { opacity: pressed ? 0.7 : 1 }]}
                            onPress={handleClose}
                        >
                            <IconSymbol name="xmark" size={18} color={textColor} />
                        </Pressable>
                    </View>
                    <View style={styles.errorContainer}>
                        <ThemedText style={styles.errorText}>No URL provided</ThemedText>
                    </View>
                </ThemedView>
            </SafeAreaView>
        );
    }

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
                    <ThemedText style={styles.headerTitle} numberOfLines={1}>
                        {title || new URL(url).hostname}
                    </ThemedText>
                    <Pressable
                        style={({ pressed }) => [styles.closeButton, { opacity: pressed ? 0.7 : 1 }]}
                        onPress={handleClose}
                    >
                        <IconSymbol name="xmark" size={18} color={textColor} />
                    </Pressable>
                </View>

                {/* WebView */}
                <WebView
                    source={{ uri: url }}
                    style={[styles.webview, { backgroundColor }]}
                    startInLoadingState={true}
                    renderLoading={() => (
                        <View style={[styles.loadingContainer, { backgroundColor }]}>
                            <ActivityIndicator size="large" color={tintColor} />
                            <ThemedText style={styles.loadingText}>{t("common.loading")}</ThemedText>
                        </View>
                    )}
                    onError={(syntheticEvent) => {
                        const { nativeEvent } = syntheticEvent;
                        console.error("WebView error: ", nativeEvent);
                    }}
                    onHttpError={(syntheticEvent) => {
                        const { nativeEvent } = syntheticEvent;
                        console.error("WebView HTTP error: ", nativeEvent);
                    }}
                    allowsBackForwardNavigationGestures={true}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    scalesPageToFit={true}
                    bounces={false}
                />
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
        fontSize: 16,
        fontWeight: "600",
        flex: 1,
        textAlign: "center",
        paddingHorizontal: 8,
    },
    closeButton: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    webview: {
        flex: 1,
    },
    loadingContainer: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 32,
    },
    errorText: {
        fontSize: 16,
        textAlign: "center",
    },
});
