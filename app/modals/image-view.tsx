import React from "react";
import {
    StyleSheet,
    View,
    TouchableOpacity,
    Image,
    Dimensions,
    SafeAreaView,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { 
    PinchGestureHandler, 
    PanGestureHandler, 
    State 
} from "react-native-gesture-handler";
import Animated, { 
    useAnimatedStyle, 
    useSharedValue,
    withTiming,
    useAnimatedGestureHandler,
    runOnJS
} from "react-native-reanimated";

import { IconSymbol } from "@/components/ui/IconSymbol";
import { ThemedView } from "@/components/ThemedView";

export default function ImageViewModal() {
    const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
    const decodedUri = decodeURIComponent(imageUri as string);
    
    const scale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    const handleClose = () => {
        router.back();
    };

    const resetImage = () => {
        scale.value = withTiming(1);
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
    };

    // Pinch gesture handler
    const pinchHandler = useAnimatedGestureHandler({
        onStart: (_, ctx) => {
            ctx.startScale = scale.value;
        },
        onActive: (event, ctx) => {
            let newScale = ctx.startScale * event.scale;
            
            // Limit minimum scale to 1
            if (newScale < 1) {
                newScale = 1;
            }
            
            // Limit maximum scale to 5
            if (newScale > 5) {
                newScale = 5;
            }
            
            scale.value = newScale;
        },
        onEnd: () => {
            if (scale.value < 1) {
                scale.value = withTiming(1);
            }
        },
    });

    // Pan gesture handler
    const panHandler = useAnimatedGestureHandler({
        onStart: (_, ctx) => {
            ctx.startX = translateX.value;
            ctx.startY = translateY.value;
        },
        onActive: (event, ctx) => {
            // Only allow panning if zoomed in
            if (scale.value > 1) {
                translateX.value = ctx.startX + event.translationX;
                translateY.value = ctx.startY + event.translationY;
            }
        },
    });

    const animatedImageStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { scale: scale.value }
            ]
        };
    });

    const doubleTapHandler = () => {
        resetImage();
    };

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={handleClose}
                    >
                        <IconSymbol name="xmark" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                <PanGestureHandler onGestureEvent={panHandler}>
                    <Animated.View style={styles.imageContainer}>
                        <PinchGestureHandler onGestureEvent={pinchHandler}>
                            <Animated.Image
                                source={{ uri: decodedUri }}
                                style={[styles.image, animatedImageStyle]}
                                resizeMode="contain"
                                onTouchEnd={(e) => {
                                    // Double tap detection using timestamp
                                    const currentTime = new Date().getTime();
                                    const doubleTapTimeWindow = 300; // ms
                                    
                                    if (e.timeStamp - lastTapTimestamp < doubleTapTimeWindow) {
                                        doubleTapHandler();
                                    }
                                    
                                    lastTapTimestamp = e.timeStamp;
                                }}
                            />
                        </PinchGestureHandler>
                    </Animated.View>
                </PanGestureHandler>
            </SafeAreaView>
        </ThemedView>
    );
}

let lastTapTimestamp = 0;

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        justifyContent: "flex-end",
        padding: 16,
    },
    closeButton: {
        padding: 8,
    },
    imageContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    image: {
        width: width,
        height: height * 0.8,
    },
});
