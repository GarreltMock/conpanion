import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Platform, ScrollView, TextInput } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
import { useApp } from "../../context/AppContext";
import { ThemedText } from "../../components/ThemedText";
import { ThemedView } from "../../components/ThemedView";
import { format } from "date-fns";
import { useThemeColor } from "../../hooks/useThemeColor";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getAvailableTransformers } from "../../services/apiTransformers";
import { Picker } from "@react-native-picker/picker";

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
    const backgroundColor = useThemeColor({}, "background");
    const tintColor = useThemeColor({}, "tint");
    const textColor = useThemeColor({}, "text");
    const placeholderColor = useThemeColor({}, "tabIconDefault");
    const errorColor = useThemeColor({}, "error");
    const borderColor = useThemeColor({}, "border");

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
            setError("Conference name is required");
            return;
        }

        if (!id) {
            setError("Conference ID is missing");
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
            setError(err instanceof Error ? err.message : "Failed to update conference");
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
            <ScrollView showsVerticalScrollIndicator={false}>
                <ThemedView style={styles.container}>
                    {/* <ThemedText style={styles.title}>Edit Conference</ThemedText> */}

                    <ThemedView style={styles.formSection}>
                        <ThemedText style={styles.label}>Conference Name *</ThemedText>
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
                            placeholder="Enter conference name"
                            placeholderTextColor={placeholderColor}
                        />

                        <ThemedText style={styles.label}>Location (Optional)</ThemedText>
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
                            placeholder="Enter conference location"
                            placeholderTextColor={placeholderColor}
                        />

                        <ThemedText style={styles.label}>Description (Optional)</ThemedText>
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
                            placeholder="Enter conference description"
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
                            <ThemedText style={styles.advancedToggleText}>API Configuration (Optional)</ThemedText>
                            <Ionicons
                                name={showAdvancedOptions ? "chevron-up" : "chevron-down"}
                                size={20}
                                color={textColor}
                            />
                        </TouchableOpacity>

                        {showAdvancedOptions && (
                            <View style={styles.advancedSection}>
                                <ThemedText style={styles.label}>API URL</ThemedText>
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
                                    placeholder="https://api.example.com/agenda"
                                    placeholderTextColor={placeholderColor}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />

                                <ThemedText style={styles.label}>Data Format</ThemedText>
                                <View
                                    style={[
                                        styles.pickerContainer,
                                        { borderColor: borderColor, backgroundColor: backgroundColor },
                                    ]}
                                >
                                    <Picker
                                        selectedValue={apiTransformer}
                                        onValueChange={setApiTransformer}
                                        style={[styles.picker, { color: textColor }]}
                                        itemStyle={{ color: textColor }}
                                    >
                                        {getAvailableTransformers().map((transformer) => (
                                            <Picker.Item
                                                key={transformer.id}
                                                label={`${transformer.name} - ${transformer.description}`}
                                                value={transformer.id}
                                            />
                                        ))}
                                    </Picker>
                                </View>

                                <ThemedText style={styles.helpText}>
                                    Configure an API endpoint to automatically sync conference agenda. The system will
                                    fetch talk information from the provided URL.
                                </ThemedText>
                            </View>
                        )}

                        <ThemedText style={styles.label}>Date Range *</ThemedText>

                        <TouchableOpacity
                            style={[styles.dateButton, { backgroundColor: backgroundColor, borderColor: borderColor }]}
                            onPress={() => {
                                setShowStartCalendar(!showStartCalendar);
                                setShowEndCalendar(false);
                            }}
                        >
                            <ThemedText>Start: {formatDisplayDate(startDate)}</ThemedText>
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
                            <ThemedText>End: {formatDisplayDate(endDate)}</ThemedText>
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

                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton, { borderColor: borderColor }]}
                                onPress={handleCancel}
                                disabled={isSubmitting}
                            >
                                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.button,
                                    styles.saveButton,
                                    {
                                        backgroundColor: tintColor,
                                        opacity: isSubmitting ? 0.7 : 1,
                                    },
                                ]}
                                onPress={handleUpdateConference}
                                disabled={isSubmitting}
                            >
                                <ThemedText style={[styles.saveButtonText, { color: "white" }]}>
                                    {isSubmitting ? "Saving..." : "Save Changes"}
                                </ThemedText>
                            </TouchableOpacity>
                        </View>
                    </ThemedView>
                </ThemedView>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 24,
        textAlign: "center",
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
    buttonRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 24,
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
    },
    saveButton: {
        marginLeft: 8,
    },
    cancelButtonText: {
        fontSize: 16,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: "bold",
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
        marginTop: 12,
        padding: 16,
        backgroundColor: "rgba(0,0,0,0.02)",
        borderRadius: 8,
    },
    pickerContainer: {
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 8,
    },
    picker: {
        height: 50,
    },
    helpText: {
        fontSize: 14,
        opacity: 0.7,
        marginTop: 8,
        lineHeight: 20,
    },
});
