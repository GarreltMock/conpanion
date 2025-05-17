import React, { useState } from "react";
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Platform,
    ScrollView,
    TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
import { useApp } from "../../context/AppContext";
import { ThemedText } from "../../components/ThemedText";
import { ThemedView } from "../../components/ThemedView";
import { format } from "date-fns";
import { useThemeColor } from "../../hooks/useThemeColor";
import { useRouter } from "expo-router";

export default function NewConferenceModal() {
    const { createConference } = useApp();
    const [name, setName] = useState("");
    const [location, setLocation] = useState("");
    const [description, setDescription] = useState("");
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(
        new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    ); // Default to 3 days
    const [showStartCalendar, setShowStartCalendar] = useState(false);
    const [showEndCalendar, setShowEndCalendar] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const router = useRouter();
    const backgroundColor = useThemeColor({}, "background");
    const tintColor = useThemeColor({}, "tint");
    const textColor = useThemeColor({}, "text");
    const placeholderColor = useThemeColor({}, "tabIconDefault");

    const handleCreateConference = async () => {
        if (!name.trim()) {
            setError("Conference name is required");
            return;
        }

        try {
            setIsSubmitting(true);
            await createConference(
                name,
                startDate,
                endDate,
                location,
                description
            );
            router.back();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to create conference"
            );
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
        <ScrollView showsVerticalScrollIndicator={false}>
            <ThemedView style={styles.container}>
                {/* <ThemedText style={styles.title}>
                    Create New Conference
                </ThemedText> */}

                <ThemedView style={styles.formSection}>
                    <ThemedText style={styles.label}>
                        Conference Name *
                    </ThemedText>
                    <TextInput
                        style={[
                            styles.input,
                            {
                                color: textColor,
                                backgroundColor: backgroundColor,
                            },
                        ]}
                        value={name}
                        onChangeText={setName}
                        placeholder="Enter conference name"
                        placeholderTextColor={placeholderColor}
                    />

                    <ThemedText style={styles.label}>
                        Location (Optional)
                    </ThemedText>
                    <TextInput
                        style={[
                            styles.input,
                            {
                                color: textColor,
                                backgroundColor: backgroundColor,
                            },
                        ]}
                        value={location}
                        onChangeText={setLocation}
                        placeholder="Enter conference location"
                        placeholderTextColor={placeholderColor}
                    />

                    <ThemedText style={styles.label}>
                        Description (Optional)
                    </ThemedText>
                    <TextInput
                        style={[
                            styles.textArea,
                            {
                                color: textColor,
                                backgroundColor: backgroundColor,
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

                    <ThemedText style={styles.label}>Date Range *</ThemedText>

                    <TouchableOpacity
                        style={[
                            styles.dateButton,
                            { backgroundColor: backgroundColor },
                        ]}
                        onPress={() => {
                            setShowStartCalendar(!showStartCalendar);
                            setShowEndCalendar(false);
                        }}
                    >
                        <ThemedText>
                            Start: {formatDisplayDate(startDate)}
                        </ThemedText>
                        <Ionicons
                            name="calendar-outline"
                            size={20}
                            color={textColor}
                        />
                    </TouchableOpacity>

                    {showStartCalendar && (
                        <View style={styles.calendarContainer}>
                            <Calendar
                                onDayPress={(day) => {
                                    const selectedDate = new Date(
                                        day.timestamp
                                    );
                                    setStartDate(selectedDate);

                                    // If end date is before start date, adjust it
                                    if (endDate < selectedDate) {
                                        // Set end date to start date + 1 day
                                        const newEndDate = new Date(
                                            selectedDate
                                        );
                                        newEndDate.setDate(
                                            newEndDate.getDate() + 1
                                        );
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
                        style={[
                            styles.dateButton,
                            { backgroundColor: backgroundColor },
                        ]}
                        onPress={() => {
                            setShowEndCalendar(!showEndCalendar);
                            setShowStartCalendar(false);
                        }}
                    >
                        <ThemedText>
                            End: {formatDisplayDate(endDate)}
                        </ThemedText>
                        <Ionicons
                            name="calendar-outline"
                            size={20}
                            color={textColor}
                        />
                    </TouchableOpacity>

                    {showEndCalendar && (
                        <View style={styles.calendarContainer}>
                            <Calendar
                                minDate={formatCalendarDate(startDate)}
                                onDayPress={(day) => {
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
                        <ThemedText style={styles.errorText}>
                            {error}
                        </ThemedText>
                    ) : null}

                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={handleCancel}
                            disabled={isSubmitting}
                        >
                            <ThemedText style={styles.cancelButtonText}>
                                Cancel
                            </ThemedText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.button,
                                styles.createButton,
                                {
                                    backgroundColor: tintColor,
                                    opacity: isSubmitting ? 0.7 : 1,
                                },
                            ]}
                            onPress={handleCreateConference}
                            disabled={isSubmitting}
                        >
                            <ThemedText style={styles.createButtonText}>
                                {isSubmitting ? "Creating..." : "Create"}
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
                </ThemedView>
            </ThemedView>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
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
        borderColor: "rgba(150, 150, 150, 0.3)",
        borderRadius: 8,
        padding: Platform.OS === "ios" ? 12 : 8,
        fontSize: 16,
    },
    textArea: {
        borderWidth: 1,
        borderColor: "rgba(150, 150, 150, 0.3)",
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
        borderColor: "rgba(150, 150, 150, 0.3)",
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
    },
    calendarContainer: {
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "rgba(150, 150, 150, 0.3)",
        borderRadius: 8,
        overflow: "hidden",
    },
    errorText: {
        color: "red",
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
        borderColor: "rgba(150, 150, 150, 0.3)",
    },
    createButton: {
        marginLeft: 8,
    },
    cancelButtonText: {
        fontSize: 16,
    },
    createButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
    },
});
