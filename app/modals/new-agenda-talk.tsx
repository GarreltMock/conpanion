import React, { useState, useMemo } from "react";
import {
    StyleSheet,
    View,
    TextInput,
    TouchableOpacity,
    Keyboard,
    ActivityIndicator,
    Alert,
    Text,
    Platform,
} from "react-native";
import { router } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format, differenceInDays, addDays } from "date-fns";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useApp } from "@/context/AppContext";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function NewAgendaTalkModal() {
    const [title, setTitle] = useState("");
    const [selectedDay, setSelectedDay] = useState(0); // Index of selected conference day
    const [startTime, setStartTime] = useState(new Date());
    const [endTime, setEndTime] = useState(new Date(Date.now() + 60 * 60 * 1000)); // Default 1 hour from now
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const { createAgendaTalk, currentConference } = useApp();
    const textColor = useThemeColor({}, "text");
    const tintColor = useThemeColor({}, "tint");
    const backgroundColor = useThemeColor({}, "background");

    const conferenceDays = useMemo(() => {
        if (!currentConference) return [];
        
        const days = [];
        const durationInDays = differenceInDays(currentConference.endDate, currentConference.startDate) + 1;
        
        for (let i = 0; i < durationInDays; i++) {
            const day = addDays(currentConference.startDate, i);
            days.push({
                index: i,
                date: day,
                label: format(day, "EEEE, MMMM d")
            });
        }
        
        return days;
    }, [currentConference]);

    const handleCreate = async () => {
        if (!title.trim()) {
            Alert.alert("Error", "Please enter a talk title");
            return;
        }

        if (!currentConference) {
            Alert.alert("Error", "No active conference found");
            return;
        }

        if (endTime <= startTime) {
            Alert.alert("Error", "End time must be after start time");
            return;
        }

        try {
            setIsCreating(true);
            Keyboard.dismiss();

            // Combine selected day with start/end times
            const selectedDate = conferenceDays[selectedDay].date;
            const startDateTime = new Date(
                selectedDate.getFullYear(),
                selectedDate.getMonth(),
                selectedDate.getDate(),
                startTime.getHours(),
                startTime.getMinutes()
            );
            const endDateTime = new Date(
                selectedDate.getFullYear(),
                selectedDate.getMonth(),
                selectedDate.getDate(),
                endTime.getHours(),
                endTime.getMinutes()
            );

            await createAgendaTalk(title.trim(), startDateTime, endDateTime);
            router.back();
        } catch (error) {
            console.error("Error creating agenda talk:", error);
            const errorMessage =
                error instanceof Error ? error.message : "Failed to create agenda talk. Please try again.";
            Alert.alert("Error", errorMessage);
        } finally {
            setIsCreating(false);
        }
    };

    const handleCancel = () => {
        router.back();
    };

    const handleStartTimeChange = (_event: any, selectedTime?: Date) => {
        setShowStartTimePicker(Platform.OS === "ios");
        if (selectedTime) {
            setStartTime(selectedTime);
            // Automatically adjust end time if it's now before start time
            if (endTime <= selectedTime) {
                setEndTime(new Date(selectedTime.getTime() + 60 * 60 * 1000));
            }
        }
    };

    const handleEndTimeChange = (_event: any, selectedTime?: Date) => {
        setShowEndTimePicker(Platform.OS === "ios");
        if (selectedTime) {
            setEndTime(selectedTime);
        }
    };

    const formatTime = (time: Date) => {
        return time.toLocaleString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <ThemedView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} disabled={isCreating}>
                    <ThemedText style={styles.cancelText}>Cancel</ThemedText>
                </TouchableOpacity>

                <ThemedText style={styles.title}>New Agenda Talk</ThemedText>

                <TouchableOpacity
                    style={[
                        styles.createButton,
                        { backgroundColor: tintColor },
                        !title.trim() && styles.disabledButton,
                    ]}
                    onPress={handleCreate}
                    disabled={!title.trim() || isCreating}
                >
                    {isCreating ? (
                        <ActivityIndicator size="small" color={backgroundColor} />
                    ) : (
                        <Text style={[styles.createText, { color: backgroundColor }]}>Create</Text>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
                <ThemedText style={styles.helpText}>
                    Create a scheduled talk for your agenda. The talk will become active when its start time arrives.
                </ThemedText>

                <View style={styles.inputContainer}>
                    <IconSymbol name="mic.fill" size={22} color={textColor + "80"} style={styles.inputIcon} />
                    <TextInput
                        style={[styles.input, { color: textColor }]}
                        placeholder="Enter talk title"
                        placeholderTextColor={textColor + "60"}
                        value={title}
                        onChangeText={setTitle}
                        autoFocus
                        maxLength={100}
                        returnKeyType="done"
                    />
                </View>

                <View style={styles.dateContainer}>
                    <ThemedText style={styles.sectionTitle}>Schedule</ThemedText>

                    <View style={styles.dayContainer}>
                        <ThemedText style={styles.dayLabel}>Conference Day</ThemedText>
                        <View style={styles.dayButtonsContainer}>
                            {conferenceDays.map((day) => (
                                <TouchableOpacity
                                    key={day.index}
                                    style={[
                                        styles.dayButton,
                                        selectedDay === day.index && { backgroundColor: tintColor },
                                    ]}
                                    onPress={() => setSelectedDay(day.index)}
                                >
                                    <Text
                                        style={[
                                            styles.dayButtonText,
                                            { color: selectedDay === day.index ? backgroundColor : textColor },
                                        ]}
                                    >
                                        {format(day.date, "EEE d")}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        {conferenceDays.length > 0 && (
                            <ThemedText style={styles.selectedDayText}>
                                {conferenceDays[selectedDay]?.label}
                            </ThemedText>
                        )}
                    </View>

                    <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartTimePicker(true)}>
                        <IconSymbol name="clock" size={20} color={textColor + "80"} style={styles.dateIcon} />
                        <View style={styles.dateInfo}>
                            <ThemedText style={styles.dateLabel}>Start Time</ThemedText>
                            <ThemedText style={styles.dateValue}>{formatTime(startTime)}</ThemedText>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndTimePicker(true)}>
                        <IconSymbol name="clock" size={20} color={textColor + "80"} style={styles.dateIcon} />
                        <View style={styles.dateInfo}>
                            <ThemedText style={styles.dateLabel}>End Time</ThemedText>
                            <ThemedText style={styles.dateValue}>{formatTime(endTime)}</ThemedText>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            {showStartTimePicker && (
                <DateTimePicker value={startTime} mode="time" display="default" onChange={handleStartTimeChange} />
            )}

            {showEndTimePicker && (
                <DateTimePicker value={endTime} mode="time" display="default" onChange={handleEndTimeChange} />
            )}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
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
    formContainer: {
        padding: 16,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(150, 150, 150, 0.3)",
        borderRadius: 8,
        paddingHorizontal: 12,
        marginBottom: 24,
    },
    inputIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        height: 48,
        fontSize: 16,
    },
    dateContainer: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 12,
    },
    dateButton: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(150, 150, 150, 0.3)",
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
    },
    dateIcon: {
        marginRight: 12,
    },
    dateInfo: {
        flex: 1,
    },
    dateLabel: {
        fontSize: 14,
        opacity: 0.7,
        marginBottom: 2,
    },
    dateValue: {
        fontSize: 16,
        fontWeight: "500",
    },
    helpText: {
        fontSize: 14,
        opacity: 0.6,
        lineHeight: 20,
        marginBottom: 16,
    },
    dayContainer: {
        marginBottom: 16,
    },
    dayLabel: {
        fontSize: 14,
        opacity: 0.7,
        marginBottom: 8,
    },
    dayButtonsContainer: {
        flexDirection: "row",
        marginBottom: 8,
    },
    dayButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        marginRight: 8,
        borderWidth: 1,
        borderColor: "rgba(150, 150, 150, 0.3)",
    },
    dayButtonText: {
        fontSize: 14,
        fontWeight: "500",
    },
    selectedDayText: {
        fontSize: 12,
        opacity: 0.6,
        fontStyle: "italic",
    },
});
