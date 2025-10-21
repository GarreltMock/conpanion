import React, { memo } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { format } from "date-fns";
import type { Locale } from "date-fns";

import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useI18n } from "@/hooks/useI18n";
import { Talk, Activity } from "@/types";
import { useThemeColor } from "@/hooks/useThemeColor";

type AgendaItemType = (Talk & { itemType: "talk" }) | (Activity & { itemType: "activity" });

interface AgendaItemProps {
    item: AgendaItemType;
    activeTalkId: string | null;
    isOtherDay: boolean;
    dateFnsLocale: Locale;
    onTalkPress: (id: string) => void;
    onBookmarkPress: (id: string, isTalk: boolean, wasSelected: boolean) => void;
    onRateTalk: (id: string) => void;
    onAskQuestion: (id: string, location?: string) => void;
}

const AgendaItemComponent: React.FC<AgendaItemProps> = ({
    item,
    activeTalkId,
    isOtherDay,
    dateFnsLocale,
    onTalkPress,
    onBookmarkPress,
    onRateTalk,
    onAskQuestion,
}) => {
    const { t } = useI18n();
    const tintColor = useThemeColor({}, "tint");
    const tintContentColor = useThemeColor({}, "tintContent");
    const iconColor = useThemeColor({}, "icon");
    const highlightColor = useThemeColor({}, "highlight");
    const borderLight = useThemeColor({}, "borderLight");
    const backgroundOverlayLightColor = useThemeColor({}, "backgroundOverlayLight");

    const isTalk = item.itemType === "talk";
    const talk = isTalk ? (item as Talk) : null;
    const isActive = isTalk && activeTalkId === item.id;

    // Check if talk is in the past
    const isPastTalk = isTalk && item.startTime < new Date();

    // Check if talk is currently running
    const now = new Date();
    const isTalkRunning = isTalk && talk?.duration
        ? now >= item.startTime && now < new Date(item.startTime.getTime() + talk.duration * 60 * 1000)
        : false;

    // Show rate button if: user selected, in the past, and not already rated
    const showRateButton = isTalk && item.isUserSelected && isPastTalk && !talk?.rating;

    // Show ask question button if: talk is currently running
    const showAskQuestionButton = isTalkRunning;

    // Extract hour and minute from startTime
    const timeString = format(item.startTime, "HH:mm", { locale: dateFnsLocale });
    const [hours, minutes] = timeString.split(":");

    const handleBookmarkPress = (e: any) => {
        e.stopPropagation();
        onBookmarkPress(item.id, isTalk, item.isUserSelected || false);
    };

    const handleRateTalk = (e: any) => {
        e.stopPropagation();
        onRateTalk(item.id);
    };

    const handleAskQuestion = (e: any) => {
        e.stopPropagation();
        onAskQuestion(item.id, item.location);
    };

    const handleTalkPress = () => {
        if (isTalk) {
            onTalkPress(item.id);
        }
    };

    return (
        <TouchableOpacity
            style={[
                styles.talkItem,
                { borderColor: borderLight },
                !isTalk && { backgroundColor: borderLight },
                isActive && { borderColor: tintColor, borderWidth: 2 },
            ]}
            onPress={handleTalkPress}
            activeOpacity={0.7}
            disabled={!isTalk}
        >
            <View
                style={[
                    styles.talkItemContent,
                    showRateButton && { borderWidth: 1, borderColor: backgroundOverlayLightColor },
                ]}
            >
                {/* Time Display Block */}
                <View style={[styles.timeBlock, { backgroundColor: backgroundOverlayLightColor }]}>
                    <ThemedText style={styles.timeBlockHours}>{hours}</ThemedText>
                    <ThemedText style={styles.timeBlockMinutes}>{minutes}</ThemedText>
                </View>

                <View style={[styles.leftCol, !isTalk && { paddingVertical: 6 }]}>
                    <View style={styles.titleRow}>
                        <ThemedText style={styles.talkTitle}>{item.title}</ThemedText>
                    </View>
                    <View style={[styles.metaContainer, !isTalk && { marginTop: 0 }]}>
                        {isOtherDay && (
                            <View style={styles.timeRow}>
                                <IconSymbol name="calendar" size={14} color={iconColor} style={styles.timeIcon} />
                                <ThemedText style={styles.talkDate}>
                                    {format(item.startTime, "MMM d, yyyy", { locale: dateFnsLocale })}
                                </ThemedText>
                            </View>
                        )}
                        {item.duration && (
                            <View style={styles.timeRow}>
                                <IconSymbol name="clock" size={14} color={iconColor} style={styles.timeIcon} />
                                <ThemedText style={styles.talkDate}>{item.duration} min</ThemedText>
                            </View>
                        )}
                        {item.location && (
                            <View style={styles.locationRow}>
                                <IconSymbol name="location" size={14} color={iconColor} style={styles.locationIcon} />
                                <ThemedText style={styles.locationText}>{item.location}</ThemedText>
                            </View>
                        )}
                    </View>
                </View>

                {isTalk && (
                    <View style={styles.middleCol}>
                        {isActive && (
                            <View style={[styles.activeIndicator, { backgroundColor: tintColor }]}>
                                <ThemedText style={[styles.activeText, { color: tintContentColor }]}>
                                    {t("status.active")}
                                </ThemedText>
                            </View>
                        )}
                    </View>
                )}

                <View style={styles.rightCol}>
                    <TouchableOpacity style={styles.bookmarkButton} onPress={handleBookmarkPress} activeOpacity={0.7}>
                        <IconSymbol
                            size={20}
                            name={item.isUserSelected ? "bookmark.fill" : "bookmark"}
                            color={highlightColor}
                        />
                    </TouchableOpacity>

                    {isTalk && !!talk?.rating && (
                        <View style={styles.ratingContainer}>
                            <ThemedText style={styles.ratingText}>{talk.rating}/5</ThemedText>
                            <IconSymbol name="star.fill" size={12} color="#FFD700" />
                        </View>
                    )}
                </View>
            </View>

            {(showRateButton || showAskQuestionButton) && (
                <View style={[styles.actions]}>
                    {showAskQuestionButton && (
                        <TouchableOpacity style={styles.actionButton} onPress={handleAskQuestion}>
                            <IconSymbol name="questionmark" size={20} color={iconColor} />
                            <ThemedText style={styles.actionText}>{t("talks.actions.askQuestion")}</ThemedText>
                        </TouchableOpacity>
                    )}
                    {showRateButton && (
                        <TouchableOpacity style={styles.actionButton} onPress={handleRateTalk}>
                            <IconSymbol name="star" size={20} color={iconColor} />
                            <ThemedText style={styles.actionText}>{t("talks.actions.rateTalk")}</ThemedText>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </TouchableOpacity>
    );
};

// Custom comparison function for React.memo
const areEqual = (prevProps: AgendaItemProps, nextProps: AgendaItemProps) => {
    const idSame = prevProps.item.id === nextProps.item.id;
    const selectedSame = prevProps.item.isUserSelected === nextProps.item.isUserSelected;
    const activeSame = prevProps.activeTalkId === nextProps.activeTalkId;
    const otherDaySame = prevProps.isOtherDay === nextProps.isOtherDay;
    const callbacksSame =
        prevProps.onTalkPress === nextProps.onTalkPress &&
        prevProps.onBookmarkPress === nextProps.onBookmarkPress &&
        prevProps.onRateTalk === nextProps.onRateTalk &&
        prevProps.onAskQuestion === nextProps.onAskQuestion;

    const ratingSame = prevProps.item.itemType === "activity" ||
        (prevProps.item as Talk).rating === (nextProps.item as Talk).rating;

    const shouldSkipRender = idSame && selectedSame && activeSame && otherDaySame && ratingSame && callbacksSame;

    return shouldSkipRender;
};

export const AgendaItem = memo(AgendaItemComponent, areEqual);

const styles = StyleSheet.create({
    talkItem: {
        alignItems: "center",
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    talkItemContent: {
        flex: 1,
        display: "flex",
        flexDirection: "row",
        borderRadius: 12,
    },
    timeBlock: {
        width: 64,
        paddingVertical: 12,
        paddingHorizontal: 8,
        alignItems: "center",
        justifyContent: "center",
        borderTopLeftRadius: 12,
        borderBottomLeftRadius: 12,
    },
    timeBlockHours: {
        fontSize: 24,
        fontWeight: "700",
        lineHeight: 28,
        fontVariant: ["tabular-nums"],
    },
    timeBlockMinutes: {
        fontSize: 24,
        fontWeight: "700",
        lineHeight: 28,
        fontVariant: ["tabular-nums"],
        opacity: 0.6,
    },
    leftCol: {
        padding: 16,
        paddingLeft: 12,
        flex: 1,
        flexDirection: "column",
        justifyContent: "center",
    },
    middleCol: {
        justifyContent: "center",
    },
    titleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    rightCol: {
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "flex-end",
    },
    talkTitle: {
        fontSize: 18,
        fontWeight: "600",
        flex: 1,
        marginRight: 8,
    },
    talkDate: {
        fontSize: 14,
        opacity: 0.7,
        lineHeight: 20,
    },
    activeIndicator: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 8,
    },
    activeText: {
        fontSize: 12,
        fontWeight: "600",
    },
    bookmarkButton: {
        padding: 4,
        paddingTop: 8,
    },
    ratingContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginRight: 7,
    },
    ratingText: {
        fontSize: 12,
        opacity: 0.7,
        marginRight: 4,
    },
    metaContainer: {
        marginTop: 6,
        flexDirection: "row",
        gap: 12,
    },
    locationRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    locationText: {
        fontSize: 14,
        opacity: 0.7,
        lineHeight: 20,
    },
    locationIcon: {
        width: 14,
        height: 14,
        marginRight: 2,
    },
    timeRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    timeIcon: {
        width: 14,
        height: 14,
        marginRight: 4,
    },
    actions: {
        width: "100%",
        flexDirection: "row",
        justifyContent: "flex-end",
        paddingHorizontal: 16,
        paddingVertical: 12,
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
