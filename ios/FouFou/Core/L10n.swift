import Foundation
import SwiftUI

enum Lang: String, CaseIterable, Codable, Identifiable {
    case ja, en

    var id: String { rawValue }

    /// Pick the string for the current language (same pattern as the web's `lang === "en" ? ... : ...`).
    func t(_ ja: String, _ en: String) -> String { self == .en ? en : ja }

    var locale: Locale { Locale(identifier: self == .en ? "en_US" : "ja_JP") }
    var label: String { self == .en ? "English" : "日本語" }
}

@Observable
final class AppSettings {
    private static let key = "foufou_lang"

    var lang: Lang {
        didSet { UserDefaults.standard.set(lang.rawValue, forKey: Self.key) }
    }

    init() {
        if let stored = UserDefaults.standard.string(forKey: Self.key), let value = Lang(rawValue: stored) {
            lang = value
        } else {
            let code = Locale.current.language.languageCode?.identifier ?? "ja"
            lang = code == "en" ? .en : .ja
        }
    }
}
