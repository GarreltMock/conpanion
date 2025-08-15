// This file is a fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight } from "expo-symbols";
import React from "react";
import { OpaqueColorValue, StyleProp, TextStyle } from "react-native";

// Add your SFSymbol to MaterialIcons mappings here.
const MAPPING = {
    // See MaterialIcons here: https://icons.expo.fyi
    // See SF Symbols in the SF Symbols app on Mac.
    "house.fill": "home",
    "paperplane.fill": "send",
    "chevron.left.forwardslash.chevron.right": "code",
    "chevron.right": "chevron-right",
    "chevron.left": "chevron-left",
    play: "play-arrow",
    pause: "pause",
    "play.fill": "play-arrow",
    "pause.fill": "pause",
    "xmark.circle.fill": "cancel",
    xmark: "close",
    "arrow.up": "arrow-upward",
    "camera.fill": "camera-alt",
    "mic.fill": "mic",
    "note.text": "speaker-notes",
    "list.bullet": "list",
    pencil: "edit",
    trash: "delete",
    plus: "add",
    "plus.circle.fill": "add-circle",
    checkmark: "check",
    calendar: "event",
    clock: "access-time",
    timer: "timer",
    star: "star-border",
    "star.fill": "star",
    "person.2": "group",
    location: "location-on",
    "doc.text": "description",
    "message.fill": "message",
    message: "chat-bubble-outline",
    "chevron.up": "keyboard-arrow-up",
    "chevron.down": "keyboard-arrow-down",
    "minus.circle.fill": "remove-circle",
    person: "person",
    photo: "photo",
    "bookmark.fill": "bookmark",
    eye: "visibility",
    "wand.and.stars": "auto-fix-high",
    link: "link",
} as Partial<
    Record<import("expo-symbols").SymbolViewProps["name"], React.ComponentProps<typeof MaterialIcons>["name"]>
>;

export type IconSymbolName = keyof typeof MAPPING;

/**
 * An icon component that uses native SFSymbols on iOS, and MaterialIcons on Android and web. This ensures a consistent look across platforms, and optimal resource usage.
 *
 * Icon `name`s are based on SFSymbols and require manual mapping to MaterialIcons.
 */
export function IconSymbol({
    name,
    size = 24,
    color,
    style,
}: {
    name: IconSymbolName;
    size?: number;
    color: string | OpaqueColorValue;
    style?: StyleProp<TextStyle>;
    weight?: SymbolWeight;
}) {
    return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
