import React from "react";
import { StyleSheet, Share } from "react-native";
import { ExportOptionsForm } from "../../components/conference/ExportOptionsForm";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ThemedView } from "../../components/ThemedView";
import { ThemedText } from "../../components/ThemedText";
import * as FileSystem from "expo-file-system";
import { toast } from "sonner-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ExportOptionsModal() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    const handleCancel = () => {
        router.back();
    };

    const handleExport = async (filePath: string) => {
        try {
            // Check if the file exists
            const fileInfo = await FileSystem.getInfoAsync(filePath);
            if (!fileInfo.exists) {
                toast.error("Export file not found");
                return;
            }

            // Share the file
            const result = await Share.share({
                title: "Conference Export",
                url: filePath,
                message: "Here is your conference export from Conpanion",
            });

            if (result.action === Share.sharedAction) {
                // Export was shared successfully
                router.back();
            }
        } catch (error) {
            toast.error("Failed to share the export file");
            console.error("Share error:", error);
        }
    };

    // If no conference ID provided, show error
    if (!id) {
        return (
            <ThemedView style={styles.centered}>
                <ThemedText>No conference selected for export</ThemedText>
            </ThemedView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ThemedView style={styles.container}>
                <ExportOptionsForm conferenceId={id} onCancel={handleCancel} onExport={handleExport} />
            </ThemedView>
        </SafeAreaView>
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
        padding: 20,
    },
});
