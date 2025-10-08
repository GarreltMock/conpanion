import { router } from "expo-router";
import React, { useState } from "react";
import { Dimensions, StyleSheet, TouchableOpacity, View, Pressable } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useI18n } from "@/hooks/useI18n";
import { SafeAreaView } from "react-native-safe-area-context";

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
    const textColor = useThemeColor({}, "text");
    const backgroundOverlayLight = useThemeColor({}, "backgroundOverlayLight");

    // View mode state for zoom and pan
    const scale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const savedScale = useSharedValue(1);
    const savedTranslateX = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);
    const focalX = useSharedValue(0);
    const focalY = useSharedValue(0);
    const isPinching = useSharedValue(false);

    const handleClose = () => {
        router.back();
    };

    const resetImage = () => {
        scale.value = withTiming(1);
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
    };

    const handleFloorChange = (floor: "eg" | "og") => {
        setSelectedFloor(floor);
        resetImage();
    };

    // Create a pinch gesture with focal point zooming
    const pinchGesture = Gesture.Pinch()
        .onStart((e) => {
            isPinching.value = true;
            savedScale.value = scale.value;
            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;

            // Save the focal point of the pinch
            focalX.value = e.focalX;
            focalY.value = e.focalY;
        })
        .onUpdate((e) => {
            // Calculate new scale
            let newScale = savedScale.value * e.scale;

            // Apply limits
            if (newScale < 1) newScale = 1;
            if (newScale > 5) newScale = 5;

            if (savedScale.value === 1 && newScale === 1) {
                // Don't adjust translation if we're at minimum scale
                return;
            }

            // Get the dimensions
            const centerX = width / 2;
            const centerY = height / 2;

            // Calculate scale factor difference
            const scaleFactor = newScale / savedScale.value;

            // Convert the focal point to be relative to the image's current center
            // This considers both the image center and the current translation
            const focusX = focalX.value - centerX - savedTranslateX.value;
            const focusY = focalY.value - centerY - savedTranslateY.value;

            // Calculate new translation to keep the focal point fixed on screen
            // This formula works for both zooming in and out
            translateX.value = savedTranslateX.value - (scaleFactor - 1) * focusX;
            translateY.value = savedTranslateY.value - (scaleFactor - 1) * focusY;

            // Apply the new scale
            scale.value = newScale;
        })
        .onEnd(() => {
            isPinching.value = false;

            if (scale.value <= 1) {
                // Reset if scale is less than 1
                runOnJS(resetImage)();
            }
        });

    // Create a pan gesture
    const panGesture = Gesture.Pan()
        .onStart(() => {
            // Don't start pan if we're pinching
            if (isPinching.value) return false;

            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;
            return true;
        })
        .onUpdate((e) => {
            // Only allow panning if zoomed in and not pinching
            if (scale.value > 1 && !isPinching.value) {
                translateX.value = savedTranslateX.value + e.translationX;
                translateY.value = savedTranslateY.value + e.translationY;
            }
        });

    // Combine gestures
    const combinedGestures = Gesture.Simultaneous(pinchGesture, panGesture);

    const animatedImageStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: scale.value }],
        };
    });

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

const { width, height } = Dimensions.get("window");

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
    },
    image: {
        width: width,
        height: height * 0.7,
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
