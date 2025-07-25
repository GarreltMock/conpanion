import React, { useEffect, useState, useCallback } from "react";
import {
    StyleSheet,
    FlatList,
    View,
    TouchableOpacity,
    ActivityIndicator,
    Text,
    useWindowDimensions,
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
                style={[styles.talkItem, isActive && { borderColor: tintColor, borderWidth: 2 }]}
                onPress={() => handleTalkPress(item.id)}
                activeOpacity={0.7}
            >
                <View style={styles.talkContent}>
                    <ThemedText style={styles.talkTitle}>{item.title}</ThemedText>
                    <ThemedText style={styles.talkDate}>
                        {format(item.startTime, "MMM d, yyyy • HH:mm")}
                        {item.endTime && ` - ${format(item.endTime, "HH:mm")}`}
                    </ThemedText>
                </View>

                {isActive && (
                    <View style={[styles.activeIndicator, { backgroundColor: tintColor }]}>
                        <ThemedText style={styles.activeText} lightColor="#fff" darkColor={backgroundColor}>
                            Active
                        </ThemedText>
                    </View>
                )}

                <TouchableOpacity style={styles.bookmarkButton} onPress={handleBookmarkPress} activeOpacity={0.7}>
                    <IconSymbol size={20} name={item.isUserSelected ? "bookmark.fill" : "bookmark"} color={tintColor} />
                </TouchableOpacity>

                {/* <IconSymbol size={20} name="chevron.right" color={textColor + "80"} style={styles.chevron} /> */}
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
            <View style={styles.header}>
                <View>
                    <ThemedText style={styles.conferenceLabel}>CONFERENCE</ThemedText>
                    <ThemedText style={styles.conferenceName}>{currentConference?.name || "My Conference"}</ThemedText>
                </View>

                <TouchableOpacity
                    style={[styles.newTalkButton, { backgroundColor: tintColor }]}
                    onPress={handleNewTalk}
                    activeOpacity={0.8}
                >
                    <IconSymbol name="plus" size={22} color={backgroundColor} />
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
        borderBottomColor: "rgba(150, 150, 150, 0.2)",
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
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(150, 150, 150, 0.2)",
    },
    talkContent: {
        flex: 1,
    },
    talkTitle: {
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 4,
    },
    talkDate: {
        fontSize: 14,
        opacity: 0.7,
        marginBottom: 2,
    },
    talkType: {
        fontSize: 12,
        opacity: 0.6,
        fontWeight: "500",
    },
    activeIndicator: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 8,
    },
    activeText: {
        fontSize: 12,
        fontWeight: "600",
    },
    chevron: {
        marginLeft: 4,
    },
    bookmarkButton: {
        marginLeft: 4,
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
