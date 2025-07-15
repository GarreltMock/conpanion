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
import RNPickerSelect from "react-native-picker-select";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useApp } from "@/context/AppContext";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function NewAgendaTalkModal() {
    const [title, setTitle] = useState("");
    const [selectedDay, setSelectedDay] = useState(0); // Index of selected conference day
    const [startTime, setStartTime] = useState(new Date());
    const [duration, setDuration] = useState(45); // Duration in minutes
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
                label: format(day, "EEEE, MMMM d"),
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

        if (duration <= 0) {
            Alert.alert("Error", "Duration must be greater than 0 minutes");
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
            const endDateTime = new Date(startDateTime.getTime() + duration * 60 * 1000);

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
        if (selectedTime) {
            setStartTime(selectedTime);
        }
    };

    const durationOptions = useMemo(() => {
        const options = [];
        for (let i = 5; i <= 60; i += 5) {
            options.push({ label: `${i} minutes`, value: i });
        }
        return options;
    }, []);

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
                    <View style={styles.dayContainer}>
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
                            <ThemedText style={styles.selectedDayText}>{conferenceDays[selectedDay]?.label}</ThemedText>
                        )}
                    </View>

                    <View style={styles.timePickerContainer}>
                        <View style={[styles.timePickerButton, styles.startTimeButton]}>
                            <IconSymbol name="clock" size={20} color={textColor + "80"} style={styles.dateIcon} />
                            <ThemedText style={styles.dateLabel}>Start Time</ThemedText>
                            <DateTimePicker
                                value={startTime}
                                mode="time"
                                display={Platform.OS === "ios" ? "compact" : "default"}
                                onChange={handleStartTimeChange}
                                style={styles.timePicker}
                            />
                        </View>

                        <RNPickerSelect
                            onValueChange={(value) => setDuration(value)}
                            items={durationOptions}
                            value={duration}
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
                            <View style={[styles.timePickerButton, styles.durationButton]}>
                                <IconSymbol name="timer" size={20} color={textColor + "80"} style={styles.dateIcon} />
                                <ThemedText style={styles.dateLabel}>Duration</ThemedText>
                                <ThemedText style={styles.dateValue}>{duration} minutes</ThemedText>
                            </View>
                        </RNPickerSelect>
                    </View>
                </View>
            </View>
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
    timePickerContainer: {
        borderWidth: 1,
        borderColor: "rgba(150, 150, 150, 0.3)",
        borderRadius: 8,
    },
    timePickerButton: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
    },
    startTimeButton: {
        borderBottomColor: "rgba(150, 150, 150, 0.2)",
        borderBottomWidth: 1,
    },
    durationButton: {
        paddingVertical: 16,
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
        flex: 1,
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
    timePicker: {
        alignSelf: "flex-end",
        fontFamily: "MuseoSans-Medium",
    },
});
