import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { i18n } from "@/i8n/i18n";
import * as Localization from "expo-localization";

const LANGUAGE_KEY = "conpanion_language";

interface I18nContextType {
    locale: string;
    changeLocale: (newLocale: string) => Promise<void>;
    availableLocales: string[];
    t: (key: string, options?: Record<string, any>) => string;
    isLoaded: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
    children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
    const [locale, setLocale] = useState<string>(i18n.locale);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load user preference from storage on mount
    useEffect(() => {
        const loadLocale = async () => {
            try {
                const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
                if (saved && Object.keys(i18n.translations).includes(saved)) {
                    i18n.locale = saved;
                    setLocale(saved);
                } else {
                    // Use device locale if no preference saved
                    const deviceLocale = Localization.getLocales()[0].languageCode || "en";
                    const supportedLocale = Object.keys(i18n.translations).includes(deviceLocale) ? deviceLocale : "en";
                    i18n.locale = supportedLocale;
                    setLocale(supportedLocale);
                }
            } catch (error) {
                console.error("Error loading language preference:", error);
            } finally {
                setIsLoaded(true);
            }
        };

        loadLocale();
    }, []);

    // Save preference to storage when it changes
    const changeLocale = useCallback(async (newLocale: string) => {
        try {
            i18n.locale = newLocale;
            setLocale(newLocale);
            await AsyncStorage.setItem(LANGUAGE_KEY, newLocale);
        } catch (error) {
            console.error("Error saving language preference:", error);
        }
    }, []);

    const t = useCallback(
        (key: string, options?: Record<string, any>) => {
            return i18n.t(key, options);
        },
        [locale] // Re-create when locale changes to trigger re-renders
    );

    const availableLocales = useMemo(() => Object.keys(i18n.translations), []);

    // Memoize the context value
    const contextValue = useMemo(
        () => ({
            locale,
            changeLocale,
            availableLocales,
            t,
            isLoaded,
        }),
        [locale, changeLocale, availableLocales, t, isLoaded]
    );

    return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
}

export function useI18n() {
    const context = useContext(I18nContext);
    if (context === undefined) {
        throw new Error("useI18n must be used within an I18nProvider");
    }

    return context;
}
