import React, { useState, useCallback, useMemo } from "react";
import {
    StyleSheet,
    FlatList,
    View,
    TouchableOpacity,
    ActivityIndicator,
    useWindowDimensions,
    Text,
    ScrollView,
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
import { Talk } from "@/types";
import { useThemeColor } from "@/hooks/useThemeColor";
import { trackTalkAddedToAgenda, trackTalkRemovedFromAgenda } from "@/utils/analytics";

export default function TalksScreen() {
    const insets = useSafeAreaInsets();
    const {
        currentConference,
        activeTalk,
        getAllTalks,
        isLoading,
        getUserSelectedTalks,
        getAgendaTalks,
        toggleTalkSelection,
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
    const iconHighlightColor = useThemeColor({}, "iconHighlight");
    const textColor = useThemeColor({}, "text");
    const backgroundColor = useThemeColor({}, "background");
    const headerBackgroundColor = useThemeColor({}, "headerBackground");
    const borderLight = useThemeColor({}, "borderLight");
    const borderColor = useThemeColor({}, "border");

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

        // Check if there are user-created talks outside the conference days
        const allUserSelectedTalks = getUserSelectedTalks().filter(
            (talk) => talk.conferenceId === currentConference.id
        );
        const hasOtherDayTalks = allUserSelectedTalks.some((talk) => {
            return !days.some((day) => day.date && isSameDay(talk.startTime, day.date));
        });

        // Add "Other" day if there are talks outside conference days
        if (hasOtherDayTalks) {
            days.push({
                index: days.length,
                date: null, // Special case for "Other" day
                label: t("talks.otherDay"),
                isOtherDay: true,
            });
        }

        return days;
    }, [currentConference, dateFnsLocale, getUserSelectedTalks, t]);

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
            const loadTalks = async () => {
                try {
                    setRefreshing(true);
                    await getAllTalks();
                } catch (error) {
                    console.error("Error loading talks:", error);
                } finally {
                    setRefreshing(false);
                }
            };
            loadTalks();
            return () => {
                // Cleanup if needed
            };
        }, [getAllTalks])
    );

    const handleRefresh = useCallback(async () => {
        try {
            setRefreshing(true);
            await getAllTalks();
        } catch (error) {
            console.error("Error loading talks:", error);
        } finally {
            setRefreshing(false);
        }
    }, [getAllTalks]);

    const handleNewTalk = () => {
        router.push("/modals/new-agenda-talk");
    };

    const handleTalkPress = (talkId: string) => {
        router.push(`/talk?id=${talkId}`);
    };

    const renderTalkItem = ({ item }: { item: Talk }) => {
        const isActive = activeTalk?.id === item.id;

        const handleBookmarkPress = async (e: any) => {
            e.stopPropagation();
            try {
                const wasSelected = item.isUserSelected;
                await toggleTalkSelection(item.id);

                // Track the agenda action
                if (wasSelected) {
                    await trackTalkRemovedFromAgenda(item.id);
                } else {
                    await trackTalkAddedToAgenda(item.id);
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
                onPress={() => handleTalkPress(item.id)}
                activeOpacity={0.7}
            >
                <View style={styles.talkItemContent}>
                    <View style={styles.leftCol}>
                        <View style={styles.titleRow}>
                            <ThemedText style={styles.talkTitle}>{item.title}</ThemedText>
                        </View>
                        <ThemedText style={styles.talkDate}>
                            {`${format(item.startTime, "MMM d, yyyy • HH:mm", { locale: dateFnsLocale })}${
                                item.duration ? ` (${item.duration} min)` : ""
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
                                name={item.isUserSelected ? "bookmark.fill" : "bookmark"}
                                color={iconHighlightColor}
                            />
                        </TouchableOpacity>

                        {item.rating ? (
                            <View style={styles.ratingContainer}>
                                <ThemedText style={styles.ratingText}>{item.rating}/5</ThemedText>
                                <IconSymbol name="star.fill" size={12} color="#FFD700" />
                            </View>
                        ) : (
                            <></>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderTalksList = (talksData: Talk[], emptyTitle: string, emptyDescription?: string) => (
        <FlatList
            data={talksData}
            keyExtractor={(item) => item.id}
            renderItem={renderTalkItem}
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

        // Filter talks by selected day
        const filteredTalks = useMemo(() => {
            if (conferenceDays.length === 0) return allUserSelectedTalks;

            const selectedConferenceDay = conferenceDays[selectedDay];
            if (!selectedConferenceDay) return allUserSelectedTalks;

            // Handle "Other" day filter
            if (selectedConferenceDay.isOtherDay) {
                return allUserSelectedTalks.filter((talk) => {
                    // Show talks that don't match any conference day
                    return !conferenceDays
                        .filter((day) => !day.isOtherDay && day.date)
                        .some((day) => day.date && isSameDay(talk.startTime, day.date));
                });
            }

            // Handle regular conference days
            const selectedDate = selectedConferenceDay.date;
            if (!selectedDate) return allUserSelectedTalks;

            return allUserSelectedTalks.filter((talk) => isSameDay(talk.startTime, selectedDate));
        }, [allUserSelectedTalks]);

        const sortedTalks = filteredTalks.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

        return renderTalksList(sortedTalks, t("talks.noTalksSelected"), t("talks.browseTalks"));
    };

    const AgendaRoute = () => {
        const allAgendaTalks = getAgendaTalks();

        // Filter talks by selected day
        const filteredTalks = useMemo(() => {
            if (conferenceDays.length === 0) return allAgendaTalks;

            const selectedConferenceDay = conferenceDays[selectedDay];
            if (!selectedConferenceDay) return allAgendaTalks;

            // Handle "Other" day filter
            if (selectedConferenceDay.isOtherDay) {
                return allAgendaTalks.filter((talk) => {
                    // Show talks that don't match any conference day
                    return !conferenceDays
                        .filter((day) => !day.isOtherDay && day.date)
                        .some((day) => day.date && isSameDay(talk.startTime, day.date));
                });
            }

            // Handle regular conference days
            const selectedDate = selectedConferenceDay.date;
            if (!selectedDate) return allAgendaTalks;

            return allAgendaTalks.filter((talk) => isSameDay(talk.startTime, selectedDate));
        }, [allAgendaTalks]);

        const sortedTalks = filteredTalks.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

        return renderTalksList(sortedTalks, t("talks.noTalksScheduled"));
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
                    <Text style={[styles.buttonText, { color: tintContentColor }]}>{t("talks.addTalk")}</Text>
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
        flex: 1,
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
});
