import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Platform, ScrollView, TextInput, Text, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
import { useApp } from "../../context/AppContext";
import { ThemedText } from "../../components/ThemedText";
import { ThemedView } from "../../components/ThemedView";
import { format } from "date-fns";
import { useThemeColor } from "../../hooks/useThemeColor";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getAvailableTransformers } from "../../services/apiTransformers";
import RNPickerSelect from "react-native-picker-select";
import { useI18n } from "../../hooks/useI18n";

export default function EditConferenceModal() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { conferences, updateConference } = useApp();

    const [name, setName] = useState("");
    const [location, setLocation] = useState("");
    const [description, setDescription] = useState("");
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [createdAt, setCreatedAt] = useState<Date>(new Date());
    const [showStartCalendar, setShowStartCalendar] = useState(false);
    const [showEndCalendar, setShowEndCalendar] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [apiUrl, setApiUrl] = useState("");
    const [apiTransformer, setApiTransformer] = useState("generic");
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

    const router = useRouter();
    const { t } = useI18n();
    const backgroundColor = useThemeColor({}, "background");
    const tintColor = useThemeColor({}, "tint");
    const tintContentColor = useThemeColor({}, "tintContent");
    const textColor = useThemeColor({}, "text");
    const placeholderColor = useThemeColor({}, "muted");
    const errorColor = useThemeColor({}, "error");
    const borderColor = useThemeColor({}, "border");
    const borderLightColor = useThemeColor({}, "borderLight");

    useEffect(() => {
        if (id) {
            const conference = conferences.find((conf) => conf.id === id);
            if (conference) {
                setName(conference.name);
                setLocation(conference.location || "");
                setDescription(conference.description || "");
                setStartDate(conference.startDate);
                setEndDate(conference.endDate);
                setCreatedAt(conference.createdAt);
                setApiUrl(conference.apiUrl || "");
                setApiTransformer(conference.apiTransformer || "generic");
                setShowAdvancedOptions(!!conference.apiUrl);
            }
        }
    }, [id, conferences]);

    const handleUpdateConference = async () => {
        if (!name.trim()) {
            setError(t("forms.conference.conferenceNameRequired"));
            return;
        }

        if (!id) {
            setError(t("forms.conference.conferenceIdMissing"));
            return;
        }

        try {
            setIsSubmitting(true);

            const oldConference = conferences.find((c) => c.id === id);
            const updatedConference = {
                id,
                name,
                startDate,
                endDate,
                location: location || undefined,
                description: description || undefined,
                createdAt,
                updatedAt: new Date(),
                apiUrl: apiUrl || undefined,
                apiTransformer: apiUrl ? apiTransformer : undefined,
                // Preserve existing API sync timestamp
                lastApiSync: oldConference?.lastApiSync,
            };

            await updateConference(updatedConference);
            router.back();
        } catch (err) {
            setError(err instanceof Error ? err.message : t("forms.conference.updateFailed"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDisplayDate = (date: Date) => {
        return format(date, "MMM d, yyyy");
    };

    const formatCalendarDate = (date: Date) => {
        return format(date, "yyyy-MM-dd");
    };

    const handleCancel = () => {
        router.back();
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ThemedView style={styles.container}>
                <View style={[styles.header, { borderBottomColor: borderLightColor }]}>
                    <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} disabled={isSubmitting}>
                        <ThemedText style={styles.cancelText}>{t("common.cancel")}</ThemedText>
                    </TouchableOpacity>

                    <ThemedText style={styles.title}>{t("modals.editConference")}</ThemedText>

                    <TouchableOpacity
                        style={[
                            styles.saveButton,
                            { backgroundColor: tintColor },
                            !name.trim() && styles.disabledButton,
                        ]}
                        onPress={handleUpdateConference}
                        disabled={!name.trim() || isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator size="small" color={tintContentColor} />
                        ) : (
                            <Text style={[styles.saveText, { color: tintContentColor }]}>
                                {t("forms.conference.saveChanges")}
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
                        <ThemedText style={styles.label}>{t("forms.conference.nameRequired")}</ThemedText>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    color: textColor,
                                    backgroundColor: backgroundColor,
                                    borderColor: borderColor,
                                },
                            ]}
                            value={name}
                            onChangeText={setName}
                            placeholder={t("forms.conference.namePlaceholder")}
                            placeholderTextColor={placeholderColor}
                        />

                        <ThemedText style={styles.label}>{t("forms.conference.locationOptional")}</ThemedText>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    color: textColor,
                                    backgroundColor: backgroundColor,
                                    borderColor: borderColor,
                                },
                            ]}
                            value={location}
                            onChangeText={setLocation}
                            placeholder={t("forms.conference.locationPlaceholder")}
                            placeholderTextColor={placeholderColor}
                        />

                        <ThemedText style={styles.label}>{t("forms.conference.descriptionOptional")}</ThemedText>
                        <TextInput
                            style={[
                                styles.textArea,
                                {
                                    color: textColor,
                                    backgroundColor: backgroundColor,
                                    borderColor: borderColor,
                                },
                            ]}
                            value={description}
                            onChangeText={setDescription}
                            placeholder={t("forms.conference.descriptionPlaceholder")}
                            placeholderTextColor={placeholderColor}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />

                        {/* Advanced Options Toggle */}
                        <TouchableOpacity
                            style={styles.advancedToggle}
                            onPress={() => setShowAdvancedOptions(!showAdvancedOptions)}
                        >
                            <ThemedText style={styles.advancedToggleText}>{t("forms.conference.apiConfiguration")}</ThemedText>
                            <Ionicons
                                name={showAdvancedOptions ? "chevron-up" : "chevron-down"}
                                size={20}
                                color={textColor}
                            />
                        </TouchableOpacity>

                        {showAdvancedOptions && (
                            <View style={styles.advancedSection}>
                                <ThemedText style={styles.label}>{t("forms.conference.apiUrl")}</ThemedText>
                                <TextInput
                                    style={[
                                        styles.input,
                                        {
                                            color: textColor,
                                            backgroundColor: backgroundColor,
                                            borderColor: borderColor,
                                        },
                                    ]}
                                    value={apiUrl}
                                    onChangeText={setApiUrl}
                                    placeholder={t("forms.conference.apiUrlPlaceholder")}
                                    placeholderTextColor={placeholderColor}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />

                                <ThemedText style={styles.label}>{t("forms.conference.dataFormat")}</ThemedText>
                                <RNPickerSelect
                                    onValueChange={setApiTransformer}
                                    items={getAvailableTransformers().map((transformer) => ({
                                        label: transformer.name,
                                        value: transformer.id,
                                    }))}
                                    value={apiTransformer}
                                    style={{
                                        inputIOS: {
                                            fontFamily: "MuseoSans-Medium",
                                            fontSize: 16,
                                            fontWeight: "500",
                                            color: textColor,
                                        },
                                        inputAndroid: {
                                            fontFamily: "MuseoSans-Medium",
                                            fontSize: 16,
                                            fontWeight: "500",
                                            color: textColor,
                                        },
                                    }}
                                    useNativeAndroidPickerStyle={false}
                                    darkTheme={true}
                                >
                                    <View
                                        style={[
                                            styles.pickerContainer,
                                            { borderColor: borderColor, backgroundColor: backgroundColor },
                                        ]}
                                    >
                                        <ThemedText style={styles.pickerText}>
                                            {getAvailableTransformers().find((t) => t.id === apiTransformer)?.name}
                                        </ThemedText>
                                        <Ionicons name="chevron-down" size={20} color={textColor} />
                                    </View>
                                </RNPickerSelect>

                                <ThemedText style={styles.helpText}>
                                    {t("forms.conference.apiConfigurationHelp")}
                                </ThemedText>
                            </View>
                        )}

                        <ThemedText style={styles.label}>{t("forms.conference.dateRangeRequired")}</ThemedText>

                        <TouchableOpacity
                            style={[styles.dateButton, { backgroundColor: backgroundColor, borderColor: borderColor }]}
                            onPress={() => {
                                setShowStartCalendar(!showStartCalendar);
                                setShowEndCalendar(false);
                            }}
                        >
                            <ThemedText>{t("common.dateRange.start")} {formatDisplayDate(startDate)}</ThemedText>
                            <Ionicons name="calendar-outline" size={20} color={textColor} />
                        </TouchableOpacity>

                        {showStartCalendar && (
                            <View style={[styles.calendarContainer, { borderColor: borderColor }]}>
                                <Calendar
                                    onDayPress={(day: any) => {
                                        const selectedDate = new Date(day.timestamp);
                                        setStartDate(selectedDate);

                                        // If end date is before start date, adjust it
                                        if (endDate < selectedDate) {
                                            // Set end date to start date + 1 day
                                            const newEndDate = new Date(selectedDate);
                                            newEndDate.setDate(newEndDate.getDate() + 1);
                                            setEndDate(newEndDate);
                                        }

                                        setShowStartCalendar(false);
                                    }}
                                    markedDates={{
                                        [formatCalendarDate(startDate)]: {
                                            selected: true,
                                            selectedColor: tintColor,
                                        },
                                    }}
                                    theme={{
                                        todayTextColor: tintColor,
                                        selectedDayBackgroundColor: tintColor,
                                        arrowColor: tintColor,
                                    }}
                                />
                            </View>
                        )}

                        <TouchableOpacity
                            style={[styles.dateButton, { backgroundColor: backgroundColor, borderColor: borderColor }]}
                            onPress={() => {
                                setShowEndCalendar(!showEndCalendar);
                                setShowStartCalendar(false);
                            }}
                        >
                            <ThemedText>{t("common.dateRange.end")} {formatDisplayDate(endDate)}</ThemedText>
                            <Ionicons name="calendar-outline" size={20} color={textColor} />
                        </TouchableOpacity>

                        {showEndCalendar && (
                            <View style={[styles.calendarContainer, { borderColor: borderColor }]}>
                                <Calendar
                                    minDate={formatCalendarDate(startDate)}
                                    onDayPress={(day: any) => {
                                        setEndDate(new Date(day.timestamp));
                                        setShowEndCalendar(false);
                                    }}
                                    markedDates={{
                                        [formatCalendarDate(endDate)]: {
                                            selected: true,
                                            selectedColor: tintColor,
                                        },
                                    }}
                                    theme={{
                                        todayTextColor: tintColor,
                                        selectedDayBackgroundColor: tintColor,
                                        arrowColor: tintColor,
                                    }}
                                />
                            </View>
                        )}

                        {error ? (
                            <ThemedText style={[styles.errorText, { color: errorColor }]}>{error}</ThemedText>
                        ) : null}
                    </ThemedView>
                </ScrollView>
            </ThemedView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
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
    saveButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    saveText: {
        fontSize: 17,
        fontWeight: "600",
    },
    disabledButton: {
        opacity: 0.5,
    },
    scrollContainer: {
        flex: 1,
    },
    formContainer: {
        padding: 16,
        paddingBottom: 32,
    },
    formSection: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: Platform.OS === "ios" ? 12 : 8,
        fontSize: 16,
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 8,
        padding: Platform.OS === "ios" ? 12 : 8,
        fontSize: 16,
        minHeight: 100,
    },
    dateButton: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
    },
    calendarContainer: {
        marginBottom: 16,
        borderWidth: 1,
        borderRadius: 8,
        overflow: "hidden",
    },
    statusOptionsContainer: {
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        overflow: "hidden",
    },
    statusOption: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    statusOptionText: {
        fontSize: 16,
    },
    errorText: {
        marginTop: 16,
    },
    advancedToggle: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        marginTop: 16,
    },
    advancedToggleText: {
        fontSize: 16,
        fontWeight: "600",
    },
    advancedSection: {
        padding: 16,
        paddingTop: 0,
        backgroundColor: "rgba(0,0,0,0.02)",
        borderRadius: 8,
    },
    pickerContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    pickerText: {
        fontSize: 16,
        fontWeight: "500",
        flex: 1,
    },
    helpText: {
        fontSize: 14,
        opacity: 0.7,
        marginTop: 8,
        lineHeight: 20,
    },
});
