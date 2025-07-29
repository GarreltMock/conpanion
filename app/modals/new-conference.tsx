import React, { useState } from "react";
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Platform,
    ScrollView,
    TextInput,
    SafeAreaView,
    Text,
    ActivityIndicator,
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
    const [endDate, setEndDate] = useState(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)); // Default to 3 days
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
            await createConference(name, startDate, endDate, location, description);
            router.back();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create conference");
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
                <View style={styles.header}>
                    <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} disabled={isSubmitting}>
                        <ThemedText style={styles.cancelText}>Cancel</ThemedText>
                    </TouchableOpacity>

                    <ThemedText style={styles.title}>New Conference</ThemedText>

                    <TouchableOpacity
                        style={[
                            styles.createButton,
                            { backgroundColor: tintColor },
                            !name.trim() && styles.disabledButton,
                        ]}
                        onPress={handleCreateConference}
                        disabled={!name.trim() || isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator size="small" color={backgroundColor} />
                        ) : (
                            <Text style={[styles.createText, { color: backgroundColor }]}>Create</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.formContainer}
                >
                    <ThemedView style={styles.formSection}>
                        {/* <ThemedText style={styles.label}>
                        Conference Name *
                    </ThemedText> */}
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
                            placeholder="Conference name"
                            placeholderTextColor={placeholderColor}
                        />

                        {/* <ThemedText style={styles.label}>
                        Location
                    </ThemedText> */}
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
                            placeholder="Location (optional)"
                            placeholderTextColor={placeholderColor}
                        />

                        {/* <ThemedText style={styles.label}>
                        Description
                    </ThemedText> */}
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
                            placeholder="Description (optional)"
                            placeholderTextColor={placeholderColor}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />

                        <ThemedText style={styles.label}>Date Range *</ThemedText>

                        <TouchableOpacity
                            style={[styles.dateButton, { backgroundColor: backgroundColor }]}
                            onPress={() => {
                                setShowStartCalendar(!showStartCalendar);
                                setShowEndCalendar(false);
                            }}
                        >
                            <ThemedText>Start: {formatDisplayDate(startDate)}</ThemedText>
                            <Ionicons name="calendar-outline" size={20} color={textColor} />
                        </TouchableOpacity>

                        {showStartCalendar && (
                            <View style={styles.calendarContainer}>
                                <Calendar
                                    onDayPress={(day) => {
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
                            style={[styles.dateButton, { backgroundColor: backgroundColor }]}
                            onPress={() => {
                                setShowEndCalendar(!showEndCalendar);
                                setShowStartCalendar(false);
                            }}
                        >
                            <ThemedText>End: {formatDisplayDate(endDate)}</ThemedText>
                            <Ionicons name="calendar-outline" size={20} color={textColor} />
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

                        {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}
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
        borderBottomColor: "rgba(150, 150, 150, 0.2)",
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
    createButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    createText: {
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
        borderColor: "rgba(150, 150, 150, 0.3)",
        borderRadius: 8,
        padding: Platform.OS === "ios" ? 12 : 8,
        fontSize: 16,
        marginBottom: 16,
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
});
