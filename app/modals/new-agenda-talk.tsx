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
    ScrollView,
} from "react-native";
import { router } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format, differenceInDays, addDays } from "date-fns";
import RNPickerSelect from "react-native-picker-select";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { MyKeyboardAvoidingView } from "@/components/MyKeyboardAvoidingView";
import { useApp } from "@/context/AppContext";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Speaker } from "@/types";

const roundToNearestFiveMinutes = (date: Date): Date => {
    const rounded = new Date(date);
    const minutes = rounded.getMinutes();
    const remainder = minutes % 5;

    if (remainder === 0) {
        return rounded; // Already rounded
    } else if (remainder < 3) {
        // Round down
        rounded.setMinutes(minutes - remainder);
    } else {
        // Round up
        rounded.setMinutes(minutes + (5 - remainder));
    }

    rounded.setSeconds(0);
    rounded.setMilliseconds(0);
    return rounded;
};

export default function NewAgendaTalkModal() {
    const [title, setTitle] = useState("");
    const [selectedDay, setSelectedDay] = useState(0); // Index of selected conference day
    const [startTime, setStartTime] = useState(roundToNearestFiveMinutes(new Date()));
    const [duration, setDuration] = useState(45); // Duration in minutes
    const [speakers, setSpeakers] = useState<Speaker[]>([]);
    const [stage, setStage] = useState("");
    const [description, setDescription] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const { createAgendaTalk, currentConference } = useApp();
    const textColor = useThemeColor({}, "text");
    const tintColor = useThemeColor({}, "tint");
    const backgroundColor = useThemeColor({}, "background");
    const errorColor = useThemeColor({}, "error");
    const borderColor = useThemeColor({}, "border");
    const borderLightColor = useThemeColor({}, "borderLight");

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

            // Combine selected day with start time
            const selectedDate = conferenceDays[selectedDay].date;
            const startDateTime = new Date(
                selectedDate.getFullYear(),
                selectedDate.getMonth(),
                selectedDate.getDate(),
                startTime.getHours(),
                startTime.getMinutes()
            );

            await createAgendaTalk(
                title.trim(),
                startDateTime,
                duration,
                speakers.length > 0 ? speakers : undefined,
                stage.trim() || undefined,
                description.trim() || undefined
            );
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

    const addSpeaker = () => {
        setSpeakers([...speakers, { name: "", photo: undefined, bio: undefined }]);
    };

    const updateSpeaker = (index: number, field: keyof Speaker, value: string) => {
        const updatedSpeakers = [...speakers];
        updatedSpeakers[index] = { ...updatedSpeakers[index], [field]: value };
        setSpeakers(updatedSpeakers);
    };

    const removeSpeaker = (index: number) => {
        setSpeakers(speakers.filter((_, i) => i !== index));
    };

    return (
        <MyKeyboardAvoidingView>
            <ThemedView style={styles.container}>
                <View style={[styles.header, { borderBottomColor: borderLightColor }]}>
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

                <ScrollView
                    style={styles.scrollContainer}
                    contentContainerStyle={styles.formContainer}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <ThemedText style={styles.helpText}>
                        Create a scheduled talk for your agenda. The talk will become active when its start time
                        arrives.
                    </ThemedText>

                    <View style={[styles.inputContainer, { borderColor: borderColor }]}>
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
                            <ScrollView
                                horizontal
                                style={styles.dayButtonsContainer}
                                showsHorizontalScrollIndicator={false}
                            >
                                {conferenceDays.map((day) => (
                                    <TouchableOpacity
                                        key={day.index}
                                        style={[
                                            styles.dayButton,
                                            { borderColor: borderColor },
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
                            </ScrollView>
                            {conferenceDays.length > 0 && (
                                <ThemedText style={styles.selectedDayText}>
                                    {conferenceDays[selectedDay]?.label}
                                </ThemedText>
                            )}
                        </View>

                        <View style={[styles.timePickerContainer, { borderColor: borderColor }]}>
                            <View
                                style={[
                                    styles.timePickerButton,
                                    styles.startTimeButton,
                                    { borderBottomColor: borderLightColor },
                                ]}
                            >
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
                                    <IconSymbol
                                        name="timer"
                                        size={20}
                                        color={textColor + "80"}
                                        style={styles.dateIcon}
                                    />
                                    <ThemedText style={styles.dateLabel}>Duration</ThemedText>
                                    <ThemedText style={styles.dateValue}>{duration} minutes</ThemedText>
                                </View>
                            </RNPickerSelect>
                        </View>
                    </View>

                    {/* Stage Field */}
                    <View style={[styles.inputContainer, { borderColor: borderColor }]}>
                        <IconSymbol name="location" size={22} color={textColor + "80"} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, { color: textColor }]}
                            placeholder="Stage (optional)"
                            placeholderTextColor={textColor + "60"}
                            value={stage}
                            onChangeText={setStage}
                            maxLength={50}
                            returnKeyType="done"
                        />
                    </View>

                    {/* Description Field */}
                    <View style={[styles.inputContainer, { borderColor: borderColor }]}>
                        <IconSymbol name="doc.text" size={22} color={textColor + "80"} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, styles.multilineInput, { color: textColor }]}
                            placeholder="Description (optional)"
                            placeholderTextColor={textColor + "60"}
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={3}
                            maxLength={500}
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Speakers Section */}
                    <View style={styles.speakersSection}>
                        <View style={styles.speakersHeader}>
                            <ThemedText style={styles.sectionTitle}>Speakers (optional)</ThemedText>
                            <TouchableOpacity style={styles.addButton} onPress={addSpeaker}>
                                <IconSymbol name="plus.circle.fill" size={24} color={tintColor} />
                            </TouchableOpacity>
                        </View>

                        {speakers.map((speaker, index) => (
                            <View key={index} style={[styles.speakerContainer, { borderColor: borderColor }]}>
                                <View style={styles.speakerHeader}>
                                    <ThemedText style={styles.speakerLabel}>Speaker {index + 1}</ThemedText>
                                    <TouchableOpacity onPress={() => removeSpeaker(index)}>
                                        <IconSymbol name="minus.circle.fill" size={20} color={errorColor} />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.speakerInputContainer}>
                                    <IconSymbol
                                        name="person"
                                        size={18}
                                        color={textColor + "80"}
                                        style={styles.speakerInputIcon}
                                    />
                                    <TextInput
                                        style={[
                                            styles.speakerInput,
                                            { color: textColor, borderColor: borderLightColor },
                                        ]}
                                        placeholder="Speaker name"
                                        placeholderTextColor={textColor + "60"}
                                        value={speaker.name}
                                        onChangeText={(text) => updateSpeaker(index, "name", text)}
                                        maxLength={100}
                                    />
                                </View>

                                <View style={styles.speakerInputContainer}>
                                    <IconSymbol
                                        name="photo"
                                        size={18}
                                        color={textColor + "80"}
                                        style={styles.speakerInputIcon}
                                    />
                                    <TextInput
                                        style={[
                                            styles.speakerInput,
                                            { color: textColor, borderColor: borderLightColor },
                                        ]}
                                        placeholder="Photo URL (optional)"
                                        placeholderTextColor={textColor + "60"}
                                        value={speaker.photo || ""}
                                        onChangeText={(text) => updateSpeaker(index, "photo", text)}
                                        maxLength={500}
                                        keyboardType="url"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                </View>

                                <View style={styles.speakerInputContainer}>
                                    <IconSymbol
                                        name="doc.text"
                                        size={18}
                                        color={textColor + "80"}
                                        style={styles.speakerInputIcon}
                                    />
                                    <TextInput
                                        style={[
                                            styles.speakerInput,
                                            styles.bioInput,
                                            { color: textColor, borderColor: borderLightColor },
                                        ]}
                                        placeholder="Bio (optional)"
                                        placeholderTextColor={textColor + "60"}
                                        value={speaker.bio || ""}
                                        onChangeText={(text) => updateSpeaker(index, "bio", text)}
                                        multiline
                                        numberOfLines={2}
                                        maxLength={200}
                                        textAlignVertical="top"
                                    />
                                </View>
                            </View>
                        ))}
                    </View>
                </ScrollView>
            </ThemedView>
        </MyKeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingBottom: 22,
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
        paddingBottom: 32, // Extra padding at bottom for scrolling
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
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
        borderRadius: 8,
    },
    timePickerButton: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
    },
    startTimeButton: {
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
    multilineInput: {
        height: 80,
        textAlignVertical: "top",
        paddingTop: 12,
    },
    speakersSection: {
        marginTop: 8,
    },
    speakersHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    addButton: {
        padding: 4,
    },
    speakerContainer: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
    },
    speakerHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    speakerLabel: {
        fontSize: 14,
        fontWeight: "600",
    },
    speakerInputContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    speakerInputIcon: {
        marginRight: 8,
    },
    speakerInput: {
        flex: 1,
        fontSize: 14,
        paddingVertical: 8,
        paddingHorizontal: 8,
        borderWidth: 1,
        borderRadius: 6,
    },
    bioInput: {
        height: 60,
        textAlignVertical: "top",
        paddingTop: 8,
    },
});
