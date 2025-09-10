import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { format } from "date-fns";
import { enUS, de } from "date-fns/locale";
import { Conference } from "../../types";
import { useApp } from "../../context/AppContext";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";
import { useThemeColor } from "../../hooks/useThemeColor";
import { useI18n } from "../../hooks/useI18n";

interface ConferenceItemProps {
    conference: Conference;
    isActive?: boolean;
    onPress?: () => void;
    onExport?: () => void;
    onEdit?: () => void;
}

export const ConferenceItem: React.FC<ConferenceItemProps> = ({
    conference,
    isActive = false,
    onPress,
    onExport,
    onEdit,
}) => {
    const { talks } = useApp();
    const { t, locale } = useI18n();

    // Calculate current status based on dates
    const calculateCurrentStatus = (startDate: Date, endDate: Date) => {
        const now = new Date();
        if (startDate <= now && endDate >= now) {
            return "ongoing";
        } else if (endDate < now) {
            return "past";
        }
        return "upcoming";
    };

    const currentStatus = calculateCurrentStatus(conference.startDate, conference.endDate);

    // Get appropriate date-fns locale based on current i18n locale
    const dateFnsLocale = React.useMemo(() => {
        switch (locale) {
            case "de":
                return de;
            case "en":
            default:
                return enUS;
        }
    }, [locale]);
    const conferenceTalks = talks.filter((talk) => talk.conferenceId === conference.id);
    const dateFormat = "MMM d, yyyy";
    const tintColor = useThemeColor({}, "tint");
    const tintContentColor = useThemeColor({}, "tintContent");
    const iconColor = useThemeColor({}, "icon");
    const mutedColor = useThemeColor({}, "tabIconDefault");
    const backgroundColor = useThemeColor({}, "background");
    const borderLightColor = useThemeColor({}, "borderLight");
    const backgroundOverlayLightColor = useThemeColor({}, "backgroundOverlayLight");

    const getStatusBadge = (status: string) => {
        return (
            <View style={[styles.statusBadge, { backgroundColor: status === "ongoing" ? tintColor : mutedColor }]}>
                <ThemedText
                    style={[styles.statusText, { color: status === "ongoing" ? tintContentColor : backgroundColor }]}
                >
                    {t(`status.${status}`)}
                </ThemedText>
            </View>
        );
    };

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
            <ThemedView
                style={[
                    styles.container,
                    { borderColor: borderLightColor },
                    isActive && styles.activeContainer,
                    isActive && { borderColor: tintColor },
                ]}
            >
                <View style={styles.contentContainer}>
                    <View style={styles.mainContent}>
                        <ThemedText style={styles.title}>{conference.name}</ThemedText>
                        <ThemedText style={styles.date}>
                            {format(conference.startDate, dateFormat, { locale: dateFnsLocale })} -{" "}
                            {format(conference.endDate, dateFormat, { locale: dateFnsLocale })}
                        </ThemedText>
                        {conference.location ? (
                            <View style={styles.locationContainer}>
                                <Ionicons name="location-outline" size={14} color={mutedColor} />
                                <ThemedText style={styles.location}>{conference.location}</ThemedText>
                            </View>
                        ) : null}
                        <View style={styles.talksCountContainer}>
                            <Ionicons name="calendar-outline" size={14} color={mutedColor} />
                            <ThemedText style={styles.talksCount}>
                                {`${conferenceTalks.length} ${
                                    conferenceTalks.length === 1 ? t("talks.talk") : t("common.talks")
                                }`}
                            </ThemedText>
                        </View>
                    </View>
                    <View style={styles.statusContainer}>{getStatusBadge(currentStatus)}</View>
                </View>

                <View style={[styles.actions, { borderTopColor: backgroundOverlayLightColor }]}>
                    {onExport && (
                        <TouchableOpacity style={styles.actionButton} onPress={onExport}>
                            <Ionicons name="share-outline" size={20} color={iconColor} />
                            <ThemedText style={styles.actionText}>{t("common.actions.export")}</ThemedText>
                        </TouchableOpacity>
                    )}
                    {onEdit && (
                        <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
                            <Ionicons name="pencil-outline" size={20} color={iconColor} />
                            <ThemedText style={styles.actionText}>{t("common.edit")}</ThemedText>
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
    locationContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
    },
    location: {
        fontSize: 14,
        marginLeft: 4,
    },
    talksCountContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    talksCount: {
        fontSize: 14,
        marginLeft: 4,
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
