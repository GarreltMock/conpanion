import { router } from "expo-router";
import React, { useState } from "react";
import { Dimensions, StyleSheet, TouchableOpacity, View, Pressable } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useI18n } from "@/hooks/useI18n";
import { SafeAreaView } from "react-native-safe-area-context";
import { useImageZoomPan } from "@/hooks/useImageZoomPan";

const MAP_IMAGES = {
    eg: require("@/assets/images/map/map_eg.png"),
    og: require("@/assets/images/map/map_og.png"),
};

export default function MapViewModal() {
    const [selectedFloor, setSelectedFloor] = useState<"eg" | "og">("eg");
    const { t } = useI18n();

    // Theme colors
    const whiteColor = useThemeColor({}, "white");
    const backgroundColor = useThemeColor({}, "background");
    const tintColor = useThemeColor({}, "tint");
    const tintContentColor = useThemeColor({}, "tintContent");
    const backgroundOverlayLight = useThemeColor({}, "backgroundOverlayLight");

    // Image zoom and pan functionality
    const { combinedGestures, animatedImageStyle, resetImage } = useImageZoomPan();

    const handleClose = () => {
        router.back();
    };

    const handleFloorChange = (floor: "eg" | "og") => {
        setSelectedFloor(floor);
        resetImage();
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ThemedView style={[styles.container, { backgroundColor: backgroundColor }]}>
                <View style={styles.header}>
                    <ThemedText style={styles.title}>{t("conferences.dashboard.conference.map")}</ThemedText>
                    <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                        <IconSymbol name="xmark" size={24} color={whiteColor} />
                    </TouchableOpacity>
                </View>

                <GestureDetector gesture={combinedGestures}>
                    <Animated.View style={styles.imageContainer}>
                        <Animated.Image
                            source={MAP_IMAGES[selectedFloor]}
                            style={[styles.image, animatedImageStyle]}
                            resizeMode="contain"
                        />
                    </Animated.View>
                </GestureDetector>

                <View style={[styles.floorSelector, { backgroundColor: backgroundOverlayLight }]}>
                    <Pressable
                        style={[styles.floorButton, selectedFloor === "eg" && { backgroundColor: tintColor }]}
                        onPress={() => handleFloorChange("eg")}
                    >
                        <ThemedText
                            style={[styles.floorButtonText, selectedFloor === "eg" && { color: tintContentColor }]}
                        >
                            EG
                        </ThemedText>
                    </Pressable>
                    <Pressable
                        style={[styles.floorButton, selectedFloor === "og" && { backgroundColor: tintColor }]}
                        onPress={() => handleFloorChange("og")}
                    >
                        <ThemedText
                            style={[styles.floorButtonText, selectedFloor === "og" && { color: tintContentColor }]}
                        >
                            OG
                        </ThemedText>
                    </Pressable>
                </View>
            </ThemedView>
        </SafeAreaView>
    );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        zIndex: 100,
        position: "relative",
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
    },
    closeButton: {
        padding: 8,
        zIndex: 101,
    },
    imageContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
    },
    image: {
        width: width,
        height: "100%",
    },
    floorSelector: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
        paddingVertical: 16,
        paddingHorizontal: 24,
        paddingBottom: 32,
    },
    floorButton: {
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 8,
        minWidth: 80,
        alignItems: "center",
    },
    floorButtonText: {
        fontSize: 16,
        fontWeight: "600",
    },
});
