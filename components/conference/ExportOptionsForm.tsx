import React, { useState, useEffect, useMemo } from "react";
import { View, StyleSheet, TouchableOpacity, Platform, ScrollView, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../../context/AppContext";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";
import { TextInput } from "react-native-gesture-handler";
import { useThemeColor } from "../../hooks/useThemeColor";
import { Talk, ExportOptions } from "../../types";
import { format } from "date-fns";

interface ExportOptionsFormProps {
    conferenceId: string;
    onCancel?: () => void;
    onExport?: (exportPath: string) => void;
}

export const ExportOptionsForm: React.FC<ExportOptionsFormProps> = ({ conferenceId, onCancel, onExport }) => {
    const { conferences, talks, saveExportOptions, getExportOptions, exportToPDF, exportToMarkdown } = useApp();

    const conference = useMemo(() => conferences.find((conf) => conf.id === conferenceId), [conferences, conferenceId]);
    const conferenceTalks = useMemo(
        () =>
            talks
                .filter((talk) => talk.conferenceId === conferenceId)
                .sort((a, b) => a.startTime.getTime() - b.startTime.getTime()),
        [talks, conferenceId]
    );

    const [options, setOptions] = useState<ExportOptions>({
        format: "pdf",
        includeImages: true,
        includeTalkIds: conferenceTalks.map((talk) => talk.id),
        filename: conference ? `${conference.name.replace(/\s+/g, "-")}-${Date.now()}` : "conference-export",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const backgroundColor = useThemeColor({}, "background");
    const tintColor = useThemeColor({}, "tint");
    const textColor = useThemeColor({}, "text");
    const placeholderColor = useThemeColor({}, "tabIconDefault");

    useEffect(() => {
        const loadSavedOptions = async () => {
            try {
                console.log("Loading saved export options...");
                const savedOptions = await getExportOptions();
                if (savedOptions) {
                    // Use saved options but always update the talks list and filename
                    setOptions({
                        ...savedOptions,
                        includeTalkIds: conferenceTalks.map((talk) => talk.id),
                        filename: conference
                            ? `${conference.name.replace(/\s+/g, "-")}-${Date.now()}`
                            : "conference-export",
                    });
                }
            } catch (error) {
                console.error("Error loading saved export options:", error);
            }
        };

        if (conference && conferenceTalks.length > 0) {
            loadSavedOptions();
        }
    }, [conference, conferenceTalks, getExportOptions]);

    const toggleTalkSelection = (talkId: string) => {
        setOptions((prevOptions) => {
            const isIncluded = prevOptions.includeTalkIds.includes(talkId);
            let updatedTalkIds;

            if (isIncluded) {
                updatedTalkIds = prevOptions.includeTalkIds.filter((id) => id !== talkId);
            } else {
                updatedTalkIds = [...prevOptions.includeTalkIds, talkId];
            }

            return {
                ...prevOptions,
                includeTalkIds: updatedTalkIds,
            };
        });
    };

    const handleSelectAll = () => {
        setOptions((prevOptions) => ({
            ...prevOptions,
            includeTalkIds: conferenceTalks.map((talk) => talk.id),
        }));
    };

    const handleSelectNone = () => {
        setOptions((prevOptions) => ({
            ...prevOptions,
            includeTalkIds: [],
        }));
    };

    const handleExport = async () => {
        if (!options.filename.trim()) {
            setError("Filename is required");
            return;
        }

        try {
            setIsSubmitting(true);
            setError("");

            // Save the export options for future use
            await saveExportOptions({
                ...options,
                // Don't save the specific talk IDs or filename
                includeTalkIds: [],
            });

            // Generate the export
            const exportPath =
                options.format === "pdf"
                    ? await exportToPDF(conferenceId, options)
                    : await exportToMarkdown(conferenceId, options);

            if (onExport) {
                onExport(exportPath);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Export failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatTalkTime = (talk: Talk) => {
        return format(talk.startTime, "MMM d, h:mm a");
    };

    if (!conference) {
        return (
            <ThemedView style={styles.errorContainer}>
                <ThemedText style={styles.errorText}>Conference not found</ThemedText>
            </ThemedView>
        );
    }

    return (
        <ScrollView showsVerticalScrollIndicator={false}>
            <ThemedView style={styles.container}>
                <ThemedText style={styles.title}>Export {conference.name}</ThemedText>

                <ThemedView style={styles.formSection}>
                    <ThemedText style={styles.sectionTitle}>Export Format</ThemedText>

                    <View style={styles.formatOptions}>
                        <TouchableOpacity
                            style={[
                                styles.formatOption,
                                options.format === "pdf" && styles.selectedFormat,
                                { borderColor: options.format === "pdf" ? tintColor : textColor },
                            ]}
                            onPress={() =>
                                setOptions((prev) => ({
                                    ...prev,
                                    format: "pdf",
                                }))
                            }
                        >
                            <Ionicons
                                name="document-text-outline"
                                size={24}
                                color={options.format === "pdf" ? tintColor : textColor}
                            />
                            <ThemedText
                                style={[
                                    styles.formatLabel,
                                    options.format === "pdf" && {
                                        color: tintColor,
                                        fontWeight: "bold",
                                    },
                                ]}
                            >
                                PDF
                            </ThemedText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.formatOption,
                                options.format === "md" && styles.selectedFormat,
                                { borderColor: options.format === "md" ? tintColor : textColor },
                            ]}
                            onPress={() =>
                                setOptions((prev) => ({
                                    ...prev,
                                    format: "md",
                                }))
                            }
                        >
                            <Ionicons
                                name="code-outline"
                                size={24}
                                color={options.format === "md" ? tintColor : textColor}
                            />
                            <ThemedText
                                style={[
                                    styles.formatLabel,
                                    options.format === "md" && {
                                        color: tintColor,
                                        fontWeight: "bold",
                                    },
                                ]}
                            >
                                Markdown
                            </ThemedText>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.optionRow}>
                        <ThemedText style={styles.optionLabel}>Include Images</ThemedText>
                        <Switch
                            value={options.includeImages}
                            onValueChange={(value) =>
                                setOptions((prev) => ({
                                    ...prev,
                                    includeImages: value,
                                }))
                            }
                            trackColor={{
                                false: placeholderColor,
                                true: tintColor,
                            }}
                        />
                    </View>

                    <ThemedText style={styles.label}>Filename</ThemedText>
                    <TextInput
                        style={[
                            styles.input,
                            {
                                color: textColor,
                                backgroundColor: backgroundColor,
                            },
                        ]}
                        value={options.filename}
                        onChangeText={(text) => setOptions((prev) => ({ ...prev, filename: text }))}
                        placeholder="Enter export filename"
                        placeholderTextColor={placeholderColor}
                    />
                    <ThemedText style={styles.helperText}>
                        Export will be saved as {options.filename}.{options.format}
                    </ThemedText>

                    <ThemedText style={styles.sectionTitle}>Select Talks to Include</ThemedText>

                    <View style={styles.selectAllRow}>
                        <TouchableOpacity style={styles.selectButton} onPress={handleSelectAll}>
                            <ThemedText style={styles.selectButtonText}>Select All</ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.selectButton} onPress={handleSelectNone}>
                            <ThemedText style={styles.selectButtonText}>Select None</ThemedText>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.talksContainer}>
                        {conferenceTalks.length === 0 ? (
                            <ThemedText style={styles.noTalksText}>No talks found in this conference</ThemedText>
                        ) : (
                            conferenceTalks.map((talk) => (
                                <TouchableOpacity
                                    key={talk.id}
                                    style={styles.talkItem}
                                    onPress={() => toggleTalkSelection(talk.id)}
                                >
                                    <View style={styles.talkCheckbox}>
                                        {options.includeTalkIds.includes(talk.id) ? (
                                            <Ionicons name="checkbox" size={24} color={tintColor} />
                                        ) : (
                                            <Ionicons name="square-outline" size={24} color={textColor} />
                                        )}
                                    </View>
                                    <View style={styles.talkDetails}>
                                        <ThemedText style={styles.talkTitle}>{talk.title}</ThemedText>
                                        <ThemedText style={styles.talkTime}>{formatTalkTime(talk)}</ThemedText>
                                    </View>
                                </TouchableOpacity>
                            ))
                        )}
                    </View>

                    {error ? <ThemedText style={styles.errorMessage}>{error}</ThemedText> : null}

                    <View style={styles.buttonRow}>
                        {onCancel && (
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={onCancel}
                                disabled={isSubmitting}
                            >
                                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[
                                styles.button,
                                styles.exportButton,
                                {
                                    backgroundColor: tintColor,
                                    opacity: isSubmitting ? 0.7 : 1,
                                },
                            ]}
                            onPress={handleExport}
                            disabled={isSubmitting || options.includeTalkIds.length === 0}
                        >
                            <ThemedText style={styles.exportButtonText}>
                                {isSubmitting ? "Exporting..." : "Export"}
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
                </ThemedView>
            </ThemedView>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 16,
        textAlign: "center",
    },
    formSection: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 12,
        marginTop: 16,
    },
    formatOptions: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginBottom: 16,
    },
    formatOption: {
        flex: 1,
        alignItems: "center",
        padding: 16,
        borderWidth: 2,
        borderRadius: 8,
        marginHorizontal: 8,
    },
    selectedFormat: {
        borderWidth: 2,
    },
    formatLabel: {
        marginTop: 8,
        fontSize: 16,
    },
    optionRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
        paddingVertical: 8,
    },
    optionLabel: {
        fontSize: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        padding: Platform.OS === "ios" ? 12 : 8,
        fontSize: 16,
    },
    helperText: {
        fontSize: 12,
        marginTop: 4,
        marginBottom: 16,
    },
    selectAllRow: {
        flexDirection: "row",
        marginBottom: 12,
    },
    selectButton: {
        marginRight: 16,
    },
    selectButtonText: {
        fontSize: 14,
        fontWeight: "bold",
    },
    talksContainer: {
        marginBottom: 20,
    },
    talkItem: {
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
        paddingVertical: 12,
    },
    talkCheckbox: {
        marginRight: 12,
    },
    talkDetails: {
        flex: 1,
    },
    talkTitle: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 4,
    },
    talkTime: {
        fontSize: 14,
    },
    errorMessage: {
        color: "red",
        marginBottom: 16,
    },
    noTalksText: {
        fontStyle: "italic",
        textAlign: "center",
        marginVertical: 16,
    },
    buttonRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 16,
    },
    button: {
        flex: 1,
        borderRadius: 8,
        padding: 16,
        alignItems: "center",
    },
    cancelButton: {
        marginRight: 8,
        borderWidth: 1,
        borderColor: "#ddd",
    },
    cancelButtonText: {
        fontSize: 16,
    },
    exportButton: {
        marginLeft: 8,
    },
    exportButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
    },
    errorContainer: {
        padding: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    errorText: {
        fontSize: 16,
        textAlign: "center",
    },
});
