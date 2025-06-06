import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { format } from "date-fns";
import { Conference } from "../../types";
import { useApp } from "../../context/AppContext";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";
import { useThemeColor } from "../../hooks/useThemeColor";

interface ConferenceItemProps {
    conference: Conference;
    isActive?: boolean;
    onPress?: () => void;
    onExport?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
}

export const ConferenceItem: React.FC<ConferenceItemProps> = ({
    conference,
    isActive = false,
    onPress,
    onExport,
    onEdit,
    onDelete,
}) => {
    const { talks } = useApp();
    const conferenceTalks = talks.filter((talk) => talk.conferenceId === conference.id);
    const dateFormat = "MMM d, yyyy";
    const tintColor = useThemeColor({}, "tint");
    const mutedColor = useThemeColor({}, "tabIconDefault");
    const backgroundColor = useThemeColor({}, "background");

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active":
                return tintColor;
            case "upcoming":
                return mutedColor;
            case "past":
                return "transparent";
            default:
                return mutedColor;
        }
    };

    const getStatusBadge = (status: string) => {
        return (
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
                <ThemedText style={[styles.statusText, { color: backgroundColor }]}>{status}</ThemedText>
            </View>
        );
    };

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
            <ThemedView
                style={[styles.container, isActive && styles.activeContainer, isActive && { borderColor: tintColor }]}
            >
                <View style={styles.contentContainer}>
                    <View style={styles.mainContent}>
                        <ThemedText style={styles.title}>{conference.name}</ThemedText>
                        <ThemedText style={styles.date}>
                            {format(conference.startDate, dateFormat)} - {format(conference.endDate, dateFormat)}
                        </ThemedText>
                        {conference.location && (
                            <ThemedText style={styles.location}>
                                <Ionicons name="location-outline" size={14} /> {conference.location}
                            </ThemedText>
                        )}
                        <ThemedText style={styles.talksCount}>
                            <Ionicons name="calendar-outline" size={14} /> {conferenceTalks.length} talks
                        </ThemedText>
                    </View>
                    <View style={styles.statusContainer}>{getStatusBadge(conference.status)}</View>
                </View>

                <View style={styles.actions}>
                    {onExport && (
                        <TouchableOpacity style={styles.actionButton} onPress={onExport}>
                            <Ionicons name="share-outline" size={20} color={tintColor} />
                            <ThemedText style={styles.actionText}>Export</ThemedText>
                        </TouchableOpacity>
                    )}
                    {onEdit && (
                        <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
                            <Ionicons name="pencil-outline" size={20} color={tintColor} />
                            <ThemedText style={styles.actionText}>Edit</ThemedText>
                        </TouchableOpacity>
                    )}
                    {onDelete && (
                        <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
                            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                            <ThemedText style={styles.actionText}>Delete</ThemedText>
                        </TouchableOpacity>
                    )}
                </View>
            </ThemedView>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        padding: 16,
        marginVertical: 8,
        marginHorizontal: 16,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: "rgba(150, 150, 150, 0.2)",
    },
    activeContainer: {
        borderWidth: 2,
    },
    contentContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    mainContent: {
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 4,
    },
    date: {
        fontSize: 14,
        marginBottom: 4,
    },
    location: {
        fontSize: 14,
        marginBottom: 4,
    },
    talksCount: {
        fontSize: 14,
    },
    statusContainer: {
        alignItems: "flex-end",
        justifyContent: "space-between",
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: "bold",
        textTransform: "capitalize",
    },
    actions: {
        marginTop: 12,
        flexDirection: "row",
        justifyContent: "flex-end",
        borderTopWidth: 1,
        borderTopColor: "rgba(0,0,0,0.1)",
        paddingTop: 12,
    },
    actionButton: {
        flexDirection: "row",
        alignItems: "center",
        marginLeft: 16,
    },
    actionText: {
        marginLeft: 4,
        fontSize: 14,
    },
});
