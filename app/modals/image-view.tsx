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

import { IconSymbol } from "@/components/ui/IconSymbol";
import { ThemedView } from "@/components/ThemedView";

export default function ImageViewModal() {
    const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
    const decodedUri = decodeURIComponent(imageUri as string);

    const handleClose = () => {
        router.back();
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

                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: decodedUri }}
                        style={styles.image}
                        resizeMode="contain"
                    />
                </View>
            </SafeAreaView>
        </ThemedView>
    );
}

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
