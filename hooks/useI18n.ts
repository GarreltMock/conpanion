import { useState } from "react";
import { i18n } from "@/i8n/i18n";

export function useI18n() {
    const [locale, setLocale] = useState(i18n.locale);

    const t = (key: string, options?: Record<string, any>) => {
        return i18n.t(key, options);
    };

    const changeLocale = (newLocale: string) => {
        i18n.locale = newLocale;
        setLocale(newLocale);
    };

    return {
        t,
        locale,
        changeLocale,
        availableLocales: Object.keys(i18n.translations),
    };
}
