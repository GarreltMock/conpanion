import React, { useState, useEffect, useMemo } from "react";
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Platform,
    ScrollView,
    Switch,
    Text,
    ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../../context/AppContext";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";
import { TextInput } from "react-native-gesture-handler";
import { useThemeColor } from "../../hooks/useThemeColor";
import { useI18n } from "../../hooks/useI18n";
import { Talk, ExportOptions } from "../../types";
import { format } from "date-fns";

interface ExportOptionsFormProps {
    conferenceId: string;
    onCancel?: () => void;
    onExport?: (exportPath: string) => void;
}

export const ExportOptionsForm: React.FC<ExportOptionsFormProps> = ({ conferenceId, onCancel, onExport }) => {
    const { conferences, talks, saveExportOptions, getExportOptions, exportToPDF, exportToMarkdown } = useApp();
    const { t } = useI18n();

    const conference = useMemo(() => conferences.find((conf) => conf.id === conferenceId), [conferences, conferenceId]);
    const conferenceTalks = useMemo(
        () =>
            talks
                .filter((talk) => talk.conferenceId === conferenceId)
                .sort((a, b) => a.startTime.getTime() - b.startTime.getTime()),
        [talks, conferenceId]
    );

    const [options, setOptions] = useState<ExportOptions>({
        format: "md",
        includeImages: true,
        includeTalkIds: conferenceTalks.map((talk) => talk.id),
        filename: "",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const backgroundColor = useThemeColor({}, "background");
    const tintColor = useThemeColor({}, "tint");
    const tintContentColor = useThemeColor({}, "tintContent");
    const iconHighlightColor = useThemeColor({}, "iconHighlight");
    const textColor = useThemeColor({}, "text");
    const placeholderColor = useThemeColor({}, "muted");
    const errorColor = useThemeColor({}, "error");
    const borderColor = useThemeColor({}, "border");
    const borderLightColor = useThemeColor({}, "borderLight");

    useEffect(() => {
        if (conference && conferenceTalks.length > 0) {
            const defaultFilename = `${conference.name.replace(/\s+/g, "-")}-${Date.now()}`;

            setOptions((prev) => ({
                ...prev,
                includeTalkIds: conferenceTalks.map((talk) => talk.id),
                filename: prev.filename || defaultFilename, // Only set filename if not already set
            }));
        }
    }, [conference, conferenceTalks]);

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
            setError(t("forms.export.errors.filenameRequired"));
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
            setError(err instanceof Error ? err.message : t("forms.export.errors.exportFailed"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatTalkTime = (talk: Talk) => {
        return format(talk.startTime, "MMM d, HH:mm");
    };

    if (!conference) {
        return (
            <ThemedView style={styles.errorContainer}>
                <ThemedText style={styles.errorText}>{t("errors.conferenceNotFound")}</ThemedText>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <View style={[styles.header, { borderBottomColor: borderLightColor }]}>
                {onCancel && (
                    <TouchableOpacity style={styles.cancelButton} onPress={onCancel} disabled={isSubmitting}>
                        <ThemedText style={styles.cancelText}>{t("common.cancel")}</ThemedText>
                    </TouchableOpacity>
                )}

                <ThemedText style={styles.title}>{t("forms.export.title")}</ThemedText>

                <TouchableOpacity
                    style={[
                        styles.exportButton,
                        { backgroundColor: tintColor },
                        (isSubmitting || options.includeTalkIds.length === 0) && styles.disabledButton,
                    ]}
                    onPress={handleExport}
                    disabled={isSubmitting || options.includeTalkIds.length === 0}
                >
                    {isSubmitting ? (
                        <ActivityIndicator size="small" color={tintContentColor} />
                    ) : (
                        <Text style={[styles.exportButtonText, { color: tintContentColor }]}>
                            {t("common.actions.export")}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.formContainer}
            >
                <ThemedView style={styles.formSection}>
                    <ThemedText style={styles.sectionTitle}>{t("forms.export.format.title")}</ThemedText>

                    <View style={styles.formatOptions}>
                        {/* <TouchableOpacity
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
                                {t("forms.export.format.pdf")}
                            </ThemedText>
                        </TouchableOpacity> */}

                        <TouchableOpacity
                            style={[
                                styles.formatOption,
                                options.format === "md" && styles.selectedFormat,
                                { borderColor: options.format === "md" ? iconHighlightColor : textColor },
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
                                color={options.format === "md" ? iconHighlightColor : textColor}
                            />
                            <ThemedText
                                style={[
                                    styles.formatLabel,
                                    options.format === "md" && {
                                        color: iconHighlightColor,
                                        fontWeight: "bold",
                                    },
                                ]}
                            >
                                {t("forms.export.format.markdown")}
                            </ThemedText>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.optionRow}>
                        <ThemedText style={styles.optionLabel}>{t("forms.export.includeImages")}</ThemedText>
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

                    <ThemedText style={styles.label}>{t("forms.export.filename")}</ThemedText>
                    <TextInput
                        style={[
                            styles.input,
                            {
                                color: textColor,
                                backgroundColor: backgroundColor,
                                borderColor: borderColor,
                            },
                        ]}
                        value={options.filename}
                        onChangeText={(text) => setOptions((prev) => ({ ...prev, filename: text }))}
                        placeholder={t("forms.export.filenamePlaceholder")}
                        placeholderTextColor={placeholderColor}
                    />
                    <ThemedText style={styles.helperText}>
                        {t("forms.export.saveAsHelp", { filename: options.filename, format: options.format })}
                    </ThemedText>

                    <ThemedText style={styles.sectionTitle}>{t("forms.export.selectTalks")}</ThemedText>

                    <View style={styles.selectAllRow}>
                        <TouchableOpacity style={styles.selectButton} onPress={handleSelectAll}>
                            <ThemedText style={styles.selectButtonText}>{t("forms.export.selectAll")}</ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.selectButton} onPress={handleSelectNone}>
                            <ThemedText style={styles.selectButtonText}>{t("forms.export.selectNone")}</ThemedText>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.talksContainer}>
                        {conferenceTalks.length === 0 ? (
                            <ThemedText style={styles.noTalksText}>{t("forms.export.noTalks")}</ThemedText>
                        ) : (
                            conferenceTalks.map((talk) => (
                                <TouchableOpacity
                                    key={talk.id}
                                    style={[styles.talkItem, { borderBottomColor: borderLightColor }]}
                                    onPress={() => toggleTalkSelection(talk.id)}
                                >
                                    <View style={styles.talkCheckbox}>
                                        {options.includeTalkIds.includes(talk.id) ? (
                                            <Ionicons name="checkbox" size={24} color={iconHighlightColor} />
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

                    {error ? (
                        <ThemedText style={[styles.errorMessage, { color: errorColor }]}>{error}</ThemedText>
                    ) : null}
                </ThemedView>
            </ScrollView>
        </ThemedView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 17,
        fontWeight: "600",
    },
    cancelButton: {
        padding: 8,
    },
    cancelText: {
        fontSize: 17,
    },
    scrollContainer: {
        flex: 1,
    },
    formContainer: {
        padding: 16,
        paddingBottom: 32,
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
    exportButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    exportButtonText: {
        fontSize: 17,
        fontWeight: "600",
    },
    disabledButton: {
        opacity: 0.5,
    },
    errorMessage: {
        marginBottom: 16,
    },
    noTalksText: {
        fontStyle: "italic",
        textAlign: "center",
        marginVertical: 16,
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
