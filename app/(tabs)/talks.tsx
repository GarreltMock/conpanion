import React, { useState, useCallback, useMemo } from "react";
import {
    StyleSheet,
    FlatList,
    View,
    TouchableOpacity,
    ActivityIndicator,
    useWindowDimensions,
    ScrollView,
    Text,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { format, differenceInDays, addDays, isSameDay } from "date-fns";
import { enUS, de } from "date-fns/locale";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useApp } from "@/context/AppContext";
import { useI18n } from "@/hooks/useI18n";
import { Talk, Activity } from "@/types";
import { useThemeColor } from "@/hooks/useThemeColor";
import { trackTalkAddedToAgenda, trackTalkRemovedFromAgenda } from "@/utils/analytics";

type AgendaItem = (Talk & { itemType: "talk" }) | (Activity & { itemType: "activity" });

export default function TalksScreen() {
    const insets = useSafeAreaInsets();
    const {
        currentConference,
        activeTalk,
        getAllTalks,
        getAllActivities,
        isLoading,
        getUserSelectedTalks,
        getUserSelectedActivities,
        getAgendaTalks,
        getAgendaActivities,
        toggleTalkSelection,
        toggleActivitySelection,
    } = useApp();

    const { t, locale } = useI18n();

    // Get appropriate date-fns locale based on current i18n locale
    const dateFnsLocale = useMemo(() => {
        switch (locale) {
            case "de":
                return de;
            case "en":
            default:
                return enUS;
        }
    }, [locale]);
    const [refreshing, setRefreshing] = useState(false);
    const [index, setIndex] = useState(0);
    const [selectedDay, setSelectedDay] = useState(0); // Index of selected conference day
    const [routes] = useState([
        { key: "myTalks", title: t("talks.myTalks") },
        { key: "agenda", title: t("talks.fullAgenda") },
    ]);

    const layout = useWindowDimensions();
    const tintColor = useThemeColor({}, "tint");
    const tintContentColor = useThemeColor({}, "tintContent");
    const iconColor = useThemeColor({}, "icon");
    const iconHighlightColor = useThemeColor({}, "iconHighlight");
    const textColor = useThemeColor({}, "text");
    const backgroundColor = useThemeColor({}, "background");
    const headerBackgroundColor = useThemeColor({}, "headerBackground");
    const borderLight = useThemeColor({}, "borderLight");
    const borderColor = useThemeColor({}, "border");

    // Helper function to combine talks and activities with type info
    const combineAgendaItems = useCallback((talks: Talk[], activities: Activity[]): AgendaItem[] => {
        const talksWithType: AgendaItem[] = talks.map((talk) => ({ ...talk, itemType: "talk" as const }));
        const activitiesWithType: AgendaItem[] = activities.map((activity) => ({
            ...activity,
            itemType: "activity" as const,
        }));
        return [...talksWithType, ...activitiesWithType].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    }, []);

    // Generate conference days and set current day as default
    const conferenceDays = useMemo(() => {
        if (!currentConference) return [];

        const days: {
            index: number;
            date: Date | null;
            label: string;
            isOtherDay: boolean;
        }[] = [];
        const durationInDays = differenceInDays(currentConference.endDate, currentConference.startDate) + 1;

        for (let i = 0; i < durationInDays; i++) {
            const day = addDays(currentConference.startDate, i);
            days.push({
                index: i,
                date: day,
                label: format(day, "EEEE, MMMM d", { locale: dateFnsLocale }),
                isOtherDay: false,
            });
        }

        // Check if there are user-created talks or activities outside the conference days
        const allUserSelectedTalks = getUserSelectedTalks().filter(
            (talk) => talk.conferenceId === currentConference.id
        );
        const allUserSelectedActivities = getUserSelectedActivities().filter(
            (activity) => activity.conferenceId === currentConference.id
        );
        const allUserSelectedItems = combineAgendaItems(allUserSelectedTalks, allUserSelectedActivities);
        const hasOtherDayItems = allUserSelectedItems.some((item) => {
            return !days.some((day) => day.date && isSameDay(item.startTime, day.date));
        });

        // Add "Other" day if there are items outside conference days
        if (hasOtherDayItems) {
            days.push({
                index: days.length,
                date: null, // Special case for "Other" day
                label: t("talks.otherDay"),
                isOtherDay: true,
            });
        }

        return days;
    }, [currentConference, dateFnsLocale, getUserSelectedTalks, getUserSelectedActivities, t, combineAgendaItems]);

    // Set current day as default when conference days change
    useMemo(() => {
        if (conferenceDays.length > 0) {
            const today = new Date();
            const currentDayIndex = conferenceDays.findIndex((day) => day.date && isSameDay(day.date, today));
            if (currentDayIndex !== -1) {
                setSelectedDay(currentDayIndex);
            }
        }
    }, [conferenceDays]);

    // Reload talks when the screen comes into focus
    useFocusEffect(
        useCallback(() => {
            const loadData = async () => {
                try {
                    setRefreshing(true);
                    await getAllTalks();
                    await getAllActivities();
                } catch (error) {
                    console.error("Error loading data:", error);
                } finally {
                    setRefreshing(false);
                }
            };
            loadData();
            return () => {
                // Cleanup if needed
            };
        }, [getAllTalks, getAllActivities])
    );

    const handleRefresh = useCallback(async () => {
        try {
            setRefreshing(true);
            await getAllTalks();
            await getAllActivities();
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setRefreshing(false);
        }
    }, [getAllTalks, getAllActivities]);

    const handleNewTalk = () => {
        router.push("/modals/new-agenda-item");
    };

    const handleTalkPress = (talkId: string) => {
        router.push(`/talk?id=${talkId}`);
    };

    const renderTalkItem = (talk: Talk) => {
        const isActive = activeTalk?.id === talk.id;

        const handleBookmarkPress = async (e: any) => {
            e.stopPropagation();
            try {
                const wasSelected = talk.isUserSelected;
                await toggleTalkSelection(talk.id);

                // Track the agenda action
                if (wasSelected) {
                    await trackTalkRemovedFromAgenda(talk.id);
                } else {
                    await trackTalkAddedToAgenda(talk.id);
                }
            } catch (error) {
                console.error("Error toggling talk selection:", error);
            }
        };

        return (
            <TouchableOpacity
                style={[
                    styles.talkItem,
                    { borderColor: borderLight },
                    isActive && { borderColor: tintColor, borderWidth: 2 },
                ]}
                onPress={() => handleTalkPress(talk.id)}
                activeOpacity={0.7}
            >
                <View style={styles.talkItemContent}>
                    <View style={styles.leftCol}>
                        <View style={styles.titleRow}>
                            <ThemedText style={styles.talkTitle}>{talk.title}</ThemedText>
                        </View>
                        <ThemedText style={styles.talkDate}>
                            {`${format(talk.startTime, "MMM d, yyyy • HH:mm", { locale: dateFnsLocale })}${
                                talk.duration ? ` (${talk.duration} min)` : ""
                            }`}
                        </ThemedText>
                    </View>

                    <View style={styles.middleCol}>
                        {isActive && (
                            <View style={[styles.activeIndicator, { backgroundColor: tintColor }]}>
                                <ThemedText style={[styles.activeText, { color: tintContentColor }]}>
                                    {t("status.active")}
                                </ThemedText>
                            </View>
                        )}
                    </View>

                    <View style={styles.rightCol}>
                        <TouchableOpacity
                            style={styles.bookmarkButton}
                            onPress={handleBookmarkPress}
                            activeOpacity={0.7}
                        >
                            <IconSymbol
                                size={20}
                                name={talk.isUserSelected ? "bookmark.fill" : "bookmark"}
                                color={iconHighlightColor}
                            />
                        </TouchableOpacity>

                        {!!talk.rating && (
                            <View style={styles.ratingContainer}>
                                <ThemedText style={styles.ratingText}>{talk.rating}/5</ThemedText>
                                <IconSymbol name="star.fill" size={12} color="#FFD700" />
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderActivityItem = (activity: Activity) => {
        const handleBookmarkPress = async (e: any) => {
            e.stopPropagation();
            try {
                await toggleActivitySelection(activity.id);
            } catch (error) {
                console.error("Error toggling activity selection:", error);
            }
        };

        return (
            <TouchableOpacity
                style={[styles.talkItem, { borderColor: borderLight, backgroundColor: borderLight }]}
                activeOpacity={0.7}
                disabled
            >
                <View style={styles.talkItemContent}>
                    <View style={[styles.leftCol, { paddingVertical: 6 }]}>
                        <View style={styles.titleRow}>
                            {/* <IconSymbol name="clock" size={18} color={iconHighlightColor} style={styles.itemTypeIcon} /> */}
                            <ThemedText style={styles.talkTitle}>{activity.title}</ThemedText>
                        </View>
                        <View style={styles.metaContainer}>
                            <ThemedText style={styles.talkDate}>
                                {`${format(activity.startTime, "MMM d, yyyy • HH:mm", { locale: dateFnsLocale })}${
                                    activity.duration ? ` (${activity.duration} min)` : ""
                                }`}
                            </ThemedText>
                            {activity.location && (
                                <View style={styles.locationRow}>
                                    <IconSymbol
                                        name="location"
                                        size={14}
                                        color={iconColor}
                                        style={styles.locationIcon}
                                    />
                                    <ThemedText style={styles.locationText}>{activity.location}</ThemedText>
                                </View>
                            )}
                        </View>
                    </View>

                    <View style={styles.rightCol}>
                        <TouchableOpacity
                            style={styles.bookmarkButton}
                            onPress={handleBookmarkPress}
                            activeOpacity={0.7}
                        >
                            <IconSymbol
                                size={20}
                                name={activity.isUserSelected ? "bookmark.fill" : "bookmark"}
                                color={iconHighlightColor}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderAgendaItem = ({ item }: { item: AgendaItem }) => {
        if (item.itemType === "talk") {
            return renderTalkItem(item as Talk);
        } else {
            return renderActivityItem(item as Activity);
        }
    };

    const renderAgendaList = (agendaData: AgendaItem[], emptyTitle: string, emptyDescription?: string) => (
        <FlatList
            data={agendaData}
            keyExtractor={(item) => `${item.itemType}-${item.id}`}
            renderItem={renderAgendaItem}
            contentContainerStyle={styles.talksList}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                    <ThemedText style={styles.emptyTitle}>{emptyTitle}</ThemedText>
                    {emptyDescription && <ThemedText style={styles.emptyDescription}>{emptyDescription}</ThemedText>}
                </View>
            )}
        />
    );

    const MyTalksRoute = () => {
        const allUserSelectedTalks = getUserSelectedTalks().filter(
            (talk) => talk.conferenceId === currentConference?.id
        );
        const allUserSelectedActivities = getUserSelectedActivities().filter(
            (activity) => activity.conferenceId === currentConference?.id
        );

        // Filter by selected day
        const filteredItems = useMemo(() => {
            const combinedItems = combineAgendaItems(allUserSelectedTalks, allUserSelectedActivities);

            if (conferenceDays.length === 0) return combinedItems;

            const selectedConferenceDay = conferenceDays[selectedDay];
            if (!selectedConferenceDay) return combinedItems;

            // Handle "Other" day filter
            if (selectedConferenceDay.isOtherDay) {
                return combinedItems.filter((item) => {
                    // Show items that don't match any conference day
                    return !conferenceDays
                        .filter((day) => !day.isOtherDay && day.date)
                        .some((day) => day.date && isSameDay(item.startTime, day.date));
                });
            }

            // Handle regular conference days
            const selectedDate = selectedConferenceDay.date;
            if (!selectedDate) return combinedItems;

            return combinedItems.filter((item) => isSameDay(item.startTime, selectedDate));
        }, [allUserSelectedTalks, allUserSelectedActivities]); // eslint-disable-line react-hooks/exhaustive-deps

        return renderAgendaList(filteredItems, t("talks.noTalksSelected"), t("talks.browseTalks"));
    };

    const AgendaRoute = () => {
        const allAgendaTalks = getAgendaTalks();
        const allAgendaActivities = getAgendaActivities();

        // Filter by selected day
        const filteredItems = useMemo(() => {
            const combinedItems = combineAgendaItems(allAgendaTalks, allAgendaActivities);

            if (conferenceDays.length === 0) return combinedItems;

            const selectedConferenceDay = conferenceDays[selectedDay];
            if (!selectedConferenceDay) return combinedItems;

            // Handle "Other" day filter
            if (selectedConferenceDay.isOtherDay) {
                return combinedItems.filter((item) => {
                    // Show items that don't match any conference day
                    return !conferenceDays
                        .filter((day) => !day.isOtherDay && day.date)
                        .some((day) => day.date && isSameDay(item.startTime, day.date));
                });
            }

            // Handle regular conference days
            const selectedDate = selectedConferenceDay.date;
            if (!selectedDate) return combinedItems;

            return combinedItems.filter((item) => isSameDay(item.startTime, selectedDate));
        }, [allAgendaTalks, allAgendaActivities]); // eslint-disable-line react-hooks/exhaustive-deps

        return renderAgendaList(filteredItems, t("talks.noTalksScheduled"));
    };

    const renderScene = SceneMap({
        myTalks: MyTalksRoute,
        agenda: AgendaRoute,
    });

    const renderTabBar = (props: any) => (
        <TabBar
            {...props}
            indicatorStyle={{ backgroundColor: textColor + "40" }}
            style={{ backgroundColor: backgroundColor }}
            labelStyle={{ color: textColor, fontWeight: "600" }}
            inactiveColor={textColor + "80"}
            activeColor={textColor}
        />
    );

    if (isLoading) {
        return (
            <ThemedView style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <View
                style={[
                    styles.header,
                    {
                        borderBottomColor: borderLight,
                        backgroundColor: headerBackgroundColor,
                        paddingTop: insets.top + 10,
                    },
                ]}
            >
                <View>
                    <ThemedText style={styles.conferenceLabel}>{t("talks.title")}</ThemedText>
                    <ThemedText style={styles.conferenceName}>
                        {currentConference?.name || t("conferences.myConference")}
                    </ThemedText>
                </View>

                <TouchableOpacity
                    style={[styles.newTalkButton, { backgroundColor: tintColor }]}
                    onPress={handleNewTalk}
                    activeOpacity={0.8}
                >
                    <IconSymbol name="plus" size={18} color={tintContentColor} />
                    <ThemedText style={[styles.buttonText, { color: tintContentColor }]}>
                        {t("talks.addTalk")}
                    </ThemedText>
                </TouchableOpacity>
            </View>

            {/* Sticky Day Selection - Between tabs and content */}
            {conferenceDays.length > 0 && (
                <View style={[styles.stickyDaySelectionContainer]}>
                    <ScrollView
                        horizontal
                        style={styles.dayButtonsContainer}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.dayButtonsContent}
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
                                        { color: selectedDay === day.index ? tintContentColor : textColor },
                                    ]}
                                >
                                    {day.isOtherDay
                                        ? day.label
                                        : day.date
                                        ? format(day.date, "EEE d", { locale: dateFnsLocale })
                                        : ""}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            <TabView
                navigationState={{ index, routes }}
                renderScene={renderScene}
                renderTabBar={renderTabBar}
                onIndexChange={setIndex}
                initialLayout={{ width: layout.width }}
                swipeEnabled={false}
            />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingBottom: 8,
        marginBottom: 6,
        borderBottomWidth: 1,
    },
    conferenceLabel: {
        fontSize: 12,
        opacity: 0.7,
    },
    conferenceName: {
        fontSize: 22,
        fontWeight: "bold",
    },
    newTalkButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    buttonText: {
        marginLeft: 6,
        fontWeight: "600",
    },
    talksList: {
        flexGrow: 1,
        paddingBottom: 16,
    },
    talkItem: {
        flexDirection: "row",
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
    },
    leftCol: {
        padding: 16,
        flex: 1,
        flexDirection: "column",
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
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
        marginTop: 80,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 8,
        textAlign: "center",
    },
    emptyDescription: {
        fontSize: 16,
        textAlign: "center",
        opacity: 0.7,
    },
    daySelectionContainer: {
        backgroundColor: "transparent",
        paddingVertical: 12,
    },
    stickyDaySelectionContainer: {
        backgroundColor: "transparent",
        paddingTop: 12,
    },
    dayButtonsContainer: {
        flexDirection: "row",
        marginBottom: 4,
        paddingHorizontal: 16,
    },
    dayButtonsContent: {
        paddingRight: 16,
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
        marginHorizontal: 16,
        fontSize: 12,
        opacity: 0.6,
        fontStyle: "italic",
    },
    metaContainer: {
        flexDirection: "column",
    },
    locationText: {
        fontSize: 12,
        opacity: 0.7,
    },
    itemTypeIcon: {
        width: 16,
        height: 16,
        marginRight: 8,
        marginTop: 4,
    },
    locationRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    locationIcon: {
        width: 14,
        height: 14,
        marginRight: 4,
    },
});
