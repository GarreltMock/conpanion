import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, Text } from "react-native";
import { format } from "date-fns";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useI18n } from "@/hooks/useI18n";
import { Talk } from "@/types";

interface TalkHeaderProps {
    conferenceName: string;
    talk: Talk | null;
    onPress: () => void;
}

export const TalkHeader: React.FC<TalkHeaderProps> = ({ conferenceName, talk, onPress }) => {
    const { t } = useI18n();

    const insets = useSafeAreaInsets();
    const router = useRouter();

    const tintColor = useThemeColor({}, "tint");
    const tintContentColor = useThemeColor({}, "tintContent");
    const headerBackgroundColor = useThemeColor({}, "headerBackground");
    const borderLightColor = useThemeColor({}, "borderLight");
    const textColor = useThemeColor({}, "text");
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        if (!talk || !talk.duration) {
            return;
        }

        const now = new Date();
        const endTime = new Date(talk.startTime.getTime() + talk.duration * 60 * 1000);
        const timeUntilEnd = endTime.getTime() - now.getTime();

        if (timeUntilEnd > 0) {
            const timeout = setTimeout(() => {
                setCurrentTime(new Date());
            }, timeUntilEnd);

            return () => clearTimeout(timeout);
        }
    }, [talk]);

    useEffect(() => {
        setCurrentTime(new Date());
    }, [talk]);

    const handlePress = () => {
        onPress();
    };

    const validSuffixes = ["arena", "studio"];
    const handleAskQuestion = () => {
        console.log(talk?.location);
        const suffix =
            talk?.location && validSuffixes.includes(talk.location.toLowerCase())
                ? `-${talk.location.toLowerCase()}`
                : "-arena";

        router.push({
            pathname: "/modals/webview",
            params: {
                url: `https://l.programmier.bar/pc-qa${suffix}`,
                title: t("talks.actions.askQuestion"),
                talkId: talk?.id,
            },
        });
    };

    // Calculate talk state once
    // const isScheduledTalk = talk?.duration !== undefined;
    const isTalkActive = talk?.duration
        ? new Date(talk.startTime.getTime() + talk.duration * 60 * 1000) > currentTime
        : true;

    return (
        <ThemedView
            style={[
                styles.container,
                {
                    borderBottomColor: borderLightColor,
                    backgroundColor: headerBackgroundColor,
                    paddingTop: insets.top + 10,
                    height: insets.top + 64,
                },
            ]}
        >
            <View style={styles.headerContent}>
                <View style={styles.titleContainer}>
                    {talk ? (
                        <>
                            <ThemedText style={styles.talkTitle} numberOfLines={1} ellipsizeMode="tail">
                                {talk.title}
                            </ThemedText>
                            <ThemedText style={styles.startTime}>
                                {t("talks.started")} {format(talk.startTime, "HH:mm, MMM d")}
                            </ThemedText>
                        </>
                    ) : (
                        <ThemedText style={styles.noTalk}>{t("talks.noActiveTalk")}</ThemedText>
                    )}
                </View>

                {/* TODO: after programmier.con */}
                {/* {!talk ? (
                    <Pressable
                        style={({ pressed }) => [
                            styles.newTalkButton,
                            {
                                backgroundColor: tintColor,
                                borderColor: "transparent",
                                opacity: pressed ? 0.8 : 1,
                            },
                        ]}
                        onPress={handlePress}
                    >
                        <IconSymbol name="plus" size={18} color={tintContentColor} />
                        <Text style={[styles.buttonText, { color: tintContentColor }]}>{t("talks.actions.new")}</Text>
                    </Pressable>
                ) : isScheduledTalk && isTalkActive ? (
                    <Pressable
                        style={({ pressed }) => [
                            styles.newTalkButton,
                            {
                                backgroundColor: "transparent",
                                borderWidth: 1,
                                borderColor: borderLightColor,
                                opacity: pressed ? 0.8 : 1,
                            },
                        ]}
                        onPress={handlePress}
                    >
                        <IconSymbol name="plus" size={18} color={textColor} />
                        <Text style={[styles.buttonText, { color: textColor }]}>{t("talks.actions.switch")}</Text>
                    </Pressable>
                ) : (
                    <Pressable
                        style={({ pressed }) => [
                            styles.newTalkButton,
                            {
                                backgroundColor: tintColor,
                                opacity: pressed ? 0.8 : 1,
                            },
                        ]}
                        onPress={handlePress}
                    >
                        <IconSymbol name="checkmark" size={18} color={tintContentColor} />
                        <Text style={[styles.buttonText, { color: tintContentColor }]}>{t("common.done")}</Text>
                    </Pressable>
                )} */}

                {!talk ? (
                    <></>
                ) : isTalkActive ? (
                    <Pressable
                        style={({ pressed }) => [
                            styles.newTalkButton,
                            {
                                backgroundColor: "transparent",
                                borderWidth: 1,
                                borderColor: borderLightColor,
                                opacity: pressed ? 0.8 : 1,
                            },
                        ]}
                        onPress={handleAskQuestion}
                    >
                        <IconSymbol name="questionmark" size={18} color={textColor} />
                        <Text style={[styles.buttonText, { color: textColor }]}>{t("talks.actions.askQuestion")}</Text>
                    </Pressable>
                ) : (
                    <Pressable
                        style={({ pressed }) => [
                            styles.newTalkButton,
                            {
                                backgroundColor: tintColor,
                                opacity: pressed ? 0.8 : 1,
                            },
                        ]}
                        onPress={handlePress}
                    >
                        <IconSymbol name="checkmark" size={18} color={tintContentColor} />
                        <Text style={[styles.buttonText, { color: tintContentColor }]}>{t("common.done")}</Text>
                    </Pressable>
                )}
            </View>
        </ThemedView>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingBottom: 8,
        borderBottomWidth: 1,
    },
    headerContent: {
        flex: 1,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    titleContainer: {
        flex: 1,
        marginRight: 16,
    },
    conferenceName: {
        fontSize: 12,
        opacity: 0.7,
        marginBottom: 0,
    },
    talkTitle: {
        fontSize: 22,
        fontWeight: "bold",
    },
    startTime: {
        fontSize: 12,
        opacity: 0.7,
    },
    noTalk: {
        fontSize: 18,
        fontWeight: "500",
        marginTop: 8,
        marginBottom: 8,
        opacity: 0.7,
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
});
