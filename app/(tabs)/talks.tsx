import React, { useState, useCallback, useMemo, useEffect } from "react";
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
import { AgendaItem as AgendaItemComponent } from "@/components/talks/AgendaItem";

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
        { key: "userAgenda", title: t("talks.userAgenda") },
        { key: "agenda", title: t("talks.fullAgenda") },
    ]);

    const layout = useWindowDimensions();
    const tintColor = useThemeColor({}, "tint");
    const tintContentColor = useThemeColor({}, "tintContent");
    const highlightColor = useThemeColor({}, "highlight");
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
    useEffect(() => {
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

    const handleTalkPress = useCallback((talkId: string) => {
        router.push(`/talk?id=${talkId}`);
    }, []);

    // Store latest context functions in refs to prevent unnecessary re-renders
    const toggleTalkSelectionRef = React.useRef(toggleTalkSelection);
    const toggleActivitySelectionRef = React.useRef(toggleActivitySelection);

    React.useEffect(() => {
        toggleTalkSelectionRef.current = toggleTalkSelection;
        toggleActivitySelectionRef.current = toggleActivitySelection;
    }, [toggleTalkSelection, toggleActivitySelection]);

    const handleBookmarkPress = useCallback(
        async (id: string, isTalk: boolean, wasSelected: boolean) => {
            // Flag that we need to restore scroll after the re-render
            shouldRestoreScroll.current = true;

            try {
                if (isTalk) {
                    await toggleTalkSelectionRef.current(id);

                    // Track the agenda action
                    if (wasSelected) {
                        await trackTalkRemovedFromAgenda(id);
                    } else {
                        await trackTalkAddedToAgenda(id);
                    }
                } else {
                    await toggleActivitySelectionRef.current(id);
                }
            } catch (error) {
                console.error(`Error toggling ${isTalk ? "talk" : "activity"} selection:`, error);
            }
        },
        [] // Empty deps - function is now stable
    );

    const handleRateTalk = useCallback((talkId: string) => {
        router.push(`/modals/talk-evaluation?talkId=${talkId}&source=talk-list`);
    }, []);

    const handleAskQuestion = useCallback((talkId: string, location?: string) => {
        const validSuffixes = ["arena", "studio"];
        const suffix =
            location && validSuffixes.includes(location.toLowerCase())
                ? `-${location.toLowerCase()}`
                : "-arena";

        router.push({
            pathname: "/modals/webview",
            params: {
                url: `https://l.programmier.bar/pc-qa${suffix}`,
                title: t("talks.actions.askQuestion"),
                talkId,
            },
        });
    }, [t]);

    // Refs to track scroll position for each list
    const userAgendaScrollY = React.useRef(0);
    const fullAgendaScrollY = React.useRef(0);
    const userAgendaFlatListRef = React.useRef<FlatList>(null);
    const fullAgendaFlatListRef = React.useRef<FlatList>(null);
    const shouldRestoreScroll = React.useRef(false);

    const renderAgendaList = (
        agendaData: AgendaItem[],
        emptyTitle: string,
        emptyAction?: React.ReactNode,
        listName?: string
    ) => {
        const isUserAgenda = listName === "UserAgenda";
        const flatListRef = isUserAgenda ? userAgendaFlatListRef : fullAgendaFlatListRef;
        const scrollYRef = isUserAgenda ? userAgendaScrollY : fullAgendaScrollY;

        // Check if this tab is currently active
        const isActiveTab = (isUserAgenda && index === 0) || (!isUserAgenda && index === 1);

        // Create stable extraData
        const extraDataKey = agendaData
            .map((item) => `${item.id}:${item.isUserSelected}:${(item as Talk).rating || ""}`)
            .join("|");

        return (
            <FlatList
                ref={flatListRef}
                data={agendaData}
                extraData={extraDataKey}
                keyExtractor={(item) => `${item.itemType}-${item.id}`}
                renderItem={renderAgendaItem}
                contentContainerStyle={styles.talksList}
                refreshing={refreshing}
                onRefresh={handleRefresh}
                removeClippedSubviews={false}
                initialNumToRender={agendaData.length}
                onScroll={(event) => {
                    // Only track scroll for active tab
                    if (isActiveTab && !shouldRestoreScroll.current) {
                        scrollYRef.current = event.nativeEvent.contentOffset.y;
                    }
                }}
                scrollEventThrottle={16}
                onContentSizeChange={(_width, _height) => {
                    if (shouldRestoreScroll.current && isActiveTab) {
                        const savedScrollY = scrollYRef.current;

                        shouldRestoreScroll.current = false;

                        if (flatListRef.current && savedScrollY > 0) {
                            flatListRef.current.scrollToOffset({
                                offset: savedScrollY,
                                animated: false,
                            });
                        }
                    }
                }}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <ThemedText style={styles.emptyTitle}>{emptyTitle}</ThemedText>
                        {emptyAction}
                    </View>
                )}
            />
        );
    };

    const renderAgendaItem = useCallback(
        ({ item }: { item: AgendaItem }) => {
            const isOtherDay = conferenceDays[selectedDay]?.isOtherDay || false;

            return (
                <AgendaItemComponent
                    item={item}
                    activeTalkId={activeTalk?.id || null}
                    isOtherDay={isOtherDay}
                    dateFnsLocale={dateFnsLocale}
                    onTalkPress={handleTalkPress}
                    onBookmarkPress={handleBookmarkPress}
                    onRateTalk={handleRateTalk}
                    onAskQuestion={handleAskQuestion}
                />
            );
        },
        [
            activeTalk?.id,
            conferenceDays,
            selectedDay,
            dateFnsLocale,
            handleTalkPress,
            handleBookmarkPress,
            handleRateTalk,
            handleAskQuestion,
        ]
    );

    const UserAgendaRoute = () => {
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
        }, [allUserSelectedTalks, allUserSelectedActivities]);

        // Calculate isOtherDay once for this route

        const exploreAgendaButton = (
            <TouchableOpacity style={styles.exploreAgendaButton} onPress={() => setIndex(1)} activeOpacity={0.7}>
                <ThemedText style={[styles.exploreAgendaText, { color: highlightColor }]}>
                    {t("talks.exploreAgenda")}
                </ThemedText>
                <IconSymbol name="arrow.right" size={16} color={highlightColor} style={styles.exploreArrow} />
            </TouchableOpacity>
        );

        return renderAgendaList(filteredItems, t("talks.noTalksSelected"), exploreAgendaButton, "UserAgenda");
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
        }, [allAgendaTalks, allAgendaActivities]);

        return renderAgendaList(filteredItems, t("talks.noTalksScheduled"), undefined, "Agenda");
    };

    const renderScene = SceneMap({
        userAgenda: UserAgendaRoute,
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
                        height: insets.top + 64,
                    },
                ]}
            >
                <View>
                    <ThemedText style={styles.conferenceLabel}>{t("talks.title")}</ThemedText>
                    <ThemedText style={styles.conferenceName}>
                        {currentConference?.name || t("conferences.myConference")}
                    </ThemedText>
                </View>

                {/* TODO: after programmier.con */}
                {/* <TouchableOpacity
                    style={[styles.newTalkButton, { backgroundColor: tintColor }]}
                    onPress={handleNewTalk}
                    activeOpacity={0.8}
                >
                    <IconSymbol name="plus" size={18} color={tintContentColor} />
                    <Text style={[styles.buttonText, { color: tintContentColor }]}>{t("talks.addTalk")}</Text>
                </TouchableOpacity> */}
            </View>

            {/* Sticky Day Selection - Between tabs and content */}
            {conferenceDays.length > 1 && (
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
                lazy
                lazyPreloadDistance={0}
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
        paddingHorizontal: 16,
        paddingBottom: 8,
        borderBottomWidth: 1,
    },
    conferenceLabel: {
        marginTop: -10,
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
    exploreAgendaButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "center",
    },
    exploreAgendaText: {
        fontSize: 16,
        fontWeight: "600",
    },
    exploreArrow: {
        marginLeft: 8,
    },
    stickyDaySelectionContainer: {
        backgroundColor: "transparent",
        paddingTop: 12,
    },
    dayButtonsContainer: {
        flexDirection: "row",
        marginVertical: 4,
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
});
