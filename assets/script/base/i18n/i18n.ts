import { evaluateExpression } from "../../share/common/expression";

// /**
//  * 英语
//  */
// const en = "en";
// /**
//  * 简体中文
//  */
// const zh_Hans = "zh_CN";
// /**
//  * 繁体中文
//  */
// const zh_Hant = "zh_TW";
// /**
//  * 朝鲜语
//  */
// const ko = "ko";
// /**
//  * 日本语
//  */
// const ja = "ja";

export enum LocaleType {
    en,
    zh_Hans,
    zh_Hant,
    ko,
    ja,
}

/**
 * 支持的本地化语言列表
 */
export const supportLanguages = [LocaleType.zh_Hans, LocaleType.zh_Hant, LocaleType.ko, LocaleType.ja, LocaleType.en]

/**
 * 可用 {name} 进行表达式替换
 */
let defaultTokenRegex = /\{(.*?)\}/g;
const LANGUAGE_KEY = "LANGUAGE_KEY";

type Dictionary = { [key: string]: string }
/**
 * 所有的本地化字典
 */
let localizations: { [language: string]: Dictionary };
/**
 * 当前语言的本地化字典
 */
let currentLocaliztion: Dictionary;
/**
 * 当前语言
 */
let currentLanguage: string;

function translate(key: string, context: any): string {
    let result: string = currentLocaliztion[key]
    if (!result) {
        return key
    }
    return replaceTag(result, context);
}

function getPreferLanguage() {
    const languageCode = cc.sys.languageCode;
    switch (languageCode) {
        case "zh-cn":
        case "zh-sg":
        case "zh":
            return LocaleType[LocaleType.zh_Hans];
        case "zh-tw":
        case "zh-hk":
        case "zh-mo":
            return LocaleType[LocaleType.zh_Hant]
    }

    if (languageCode == "ko") {
        return LocaleType[LocaleType.ko];
    }
    if (languageCode == "ja") {
        return LocaleType[LocaleType.ja];
    }
    return LocaleType[LocaleType.en];
}

function _setLanguage(language: string) {
    cc.sys.localStorage.setItem(LANGUAGE_KEY, language);
    currentLocaliztion = localizations[language]
}

/**
 * 初始化
 * @param dicts 翻译表
 */
export function initLocale(dicts: typeof localizations) {
    localizations = dicts;
    let language = cc.sys.localStorage.getItem(LANGUAGE_KEY) || getPreferLanguage();

    _setLanguage(language);
}

export function setLocale(language: string) {
    if (!currentLanguage) {
        console.error("本地化模块未初始化")
        return;
    }
    if (supportLanguages.indexOf(LocaleType[language as keyof typeof LocaleType]) == -1) {
        console.error(`不支持语言包${language}`);
        return;
    }
    if (currentLanguage === language) {
        return
    }

    _setLanguage(language);

    cc.game.emit("locale-changed", language)
}

export function getCurrentLanguage() {
    return currentLanguage;
}

export function localize(key: string, options?: any): string {
    if (!key) {
        return ''
    }

    if (currentLocaliztion) {
        try {
            return translate(key, options) || key
        }
        catch (e) {
            console.error(e, "语言包错误 " + key, options)
        }
    }
    else {
        console.error("本地化字典未加载")
    }
    return key
}

/**
 * 求值替换表达式 
 * 支持 {name} 方式来进行表达式替换
 * @param value 
 * @param context 求值的context
 * @returns 
 */
export function replaceTag(value: string, context?: any): string {
    // Interpolate: Creates a `RegExp` object for each interpolation placeholder.
    return value.replace(defaultTokenRegex, function (expression, argument) {
        var re = evaluateExpression(argument, context);
        if (typeof (re) === "undefined") { return expression; }
        return `${re}`;
    });
}