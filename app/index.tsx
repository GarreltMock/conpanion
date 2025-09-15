import React, { useEffect, useState } from "react";
import { StyleSheet, View, ActivityIndicator, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useI18n } from "@/hooks/useI18n";
import { useApp } from "@/context/AppContext";

export default function SplashScreen() {
    const textColor = useThemeColor({}, "text");
    const backgroundColor = useThemeColor({}, "background");
    const insets = useSafeAreaInsets();
    const { t } = useI18n();
    const { activeTalk, isLoading } = useApp();

    const [showLoadingContainer, setShowLoadingContainer] = useState(false);

    // Show loading container only after 200ms delay
    useEffect(() => {
        const timer = setTimeout(() => {
            if (isLoading) {
                setShowLoadingContainer(true);
            }
        }, 200);

        return () => clearTimeout(timer);
    }, [isLoading]);

    // Handle navigation when loading is complete
    useEffect(() => {
        if (!isLoading) {
            // Add a small delay to ensure smooth transition
            console.log("Navigating away from splash screen...");
            setTimeout(() => {
                if (activeTalk) {
                    router.replace("/(tabs)"); // Go to notes tab (index)
                } else {
                    router.replace("/(tabs)/talks"); // Go to talks tab
                }
            }, 100);
        }
    }, [isLoading, activeTalk]);

    return (
        <ThemedView style={[styles.container, { backgroundColor, paddingTop: insets.top }]}>
            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    <Image source={require("@/assets/images/icon.png")} style={styles.logo} resizeMode="contain" />
                    <ThemedText style={styles.appName}>Conpanion</ThemedText>
                </View>

                {showLoadingContainer && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={textColor} style={styles.spinner} />
                        <ThemedText style={[styles.loadingText, { color: textColor }]}>
                            {t("common.loading")}
                        </ThemedText>
                    </View>
                )}
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    content: {
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 40,
        paddingBottom: 60,
    },
    logoContainer: {
        alignItems: "center",
        marginBottom: 80,
        minHeight: 200,
        justifyContent: "center",
    },
    logo: {
        width: 120,
        height: 120,
        marginBottom: 24,
        borderRadius: 20,
    },
    appName: {
        fontSize: 28,
        lineHeight: 34,
        fontWeight: "bold",
        textAlign: "center",
        maxWidth: 300,
        flexWrap: "wrap",
    },
    loadingContainer: {
        alignItems: "center",
    },
    spinner: {
        marginBottom: 16,
    },
    loadingText: {
        fontSize: 16,
        opacity: 0.7,
    },
});
