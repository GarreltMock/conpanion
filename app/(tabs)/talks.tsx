import React, { useState, useCallback } from "react";
import {
    StyleSheet,
    FlatList,
    View,
    TouchableOpacity,
    ActivityIndicator,
    useWindowDimensions,
    Text,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { format } from "date-fns";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useApp } from "@/context/AppContext";
import { Talk } from "@/types";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function TalksScreen() {
    const {
        currentConference,
        activeTalk,
        getAllTalks,
        isLoading,
        getUserSelectedTalks,
        getAgendaTalks,
        toggleTalkSelection,
    } = useApp();

    const [refreshing, setRefreshing] = useState(false);
    const [index, setIndex] = useState(0);
    const [routes] = useState([
        { key: "myTalks", title: "My Talks" },
        { key: "agenda", title: "Agenda" },
    ]);

    const layout = useWindowDimensions();
    const tintColor = useThemeColor({}, "tint");
    const textColor = useThemeColor({}, "text");
    const backgroundColor = useThemeColor({}, "background");
    const borderLight = useThemeColor({}, "borderLight");

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
                await toggleTalkSelection(item.id);
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
                            {`${format(item.startTime, "MMM d, yyyy • HH:mm")}${
                                item.duration ? ` (${item.duration} min)` : ""
                            }`}
                        </ThemedText>
                    </View>

                    <View style={styles.middleCol}>
                        {isActive && (
                            <View style={[styles.activeIndicator, { backgroundColor: tintColor }]}>
                                <ThemedText style={styles.activeText} lightColor="#fff" darkColor={backgroundColor}>
                                    Active
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
                                color={tintColor}
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

    const renderTalksList = (talksData: Talk[], emptyTitle: string, emptyDescription: string) => (
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
                    <ThemedText style={styles.emptyDescription}>{emptyDescription}</ThemedText>
                </View>
            )}
        />
    );

    const MyTalksRoute = () => {
        const userSelectedTalks = getUserSelectedTalks()
            .filter((talk) => talk.conferenceId === currentConference?.id)
            .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

        return renderTalksList(userSelectedTalks, "No talks selected", "Browse the agenda to bookmark talks");
    };

    const AgendaRoute = () => {
        const agendaTalks = getAgendaTalks().sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

        return renderTalksList(agendaTalks, "No talks scheduled yet", "Create a new talk to start taking notes");
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
            <View style={[styles.header, { borderBottomColor: borderLight }]}>
                <View>
                    <ThemedText style={styles.conferenceLabel}>CONFERENCE</ThemedText>
                    <ThemedText style={styles.conferenceName}>{currentConference?.name || "My Conference"}</ThemedText>
                </View>

                <TouchableOpacity
                    style={[styles.newTalkButton, { backgroundColor: tintColor }]}
                    onPress={handleNewTalk}
                    activeOpacity={0.8}
                >
                    <IconSymbol name="plus" size={18} color={backgroundColor} />
                    <Text style={[styles.buttonText, { color: backgroundColor }]}>New Agenda</Text>
                </TouchableOpacity>
            </View>

            <TabView
                navigationState={{ index, routes }}
                renderScene={renderScene}
                renderTabBar={renderTabBar}
                onIndexChange={setIndex}
                initialLayout={{ width: layout.width }}
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
        paddingTop: 60,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    conferenceLabel: {
        fontSize: 12,
        opacity: 0.7,
        marginBottom: 4,
        letterSpacing: 0.5,
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
});
