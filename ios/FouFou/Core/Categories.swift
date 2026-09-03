import Foundation

struct ExpenseCategory: Identifiable, Hashable {
    let key: String
    let emoji: String
    let ja: String
    let en: String

    var id: String { key }
    func label(_ lang: Lang) -> String { lang.t(ja, en) }

    // Same list/order as src/app/(app)/app/groups/[groupId]/page.tsx
    static let all: [ExpenseCategory] = [
        .init(key: "accommodation", emoji: "🛏️", ja: "宿泊", en: "Accommodation"),
        .init(key: "entertainment", emoji: "🎤", ja: "エンタメ", en: "Entertainment"),
        .init(key: "groceries", emoji: "🛒", ja: "食材・買い物", en: "Groceries"),
        .init(key: "healthcare", emoji: "🦷", ja: "医療", en: "Healthcare"),
        .init(key: "insurance", emoji: "🧯", ja: "保険", en: "Insurance"),
        .init(key: "rent", emoji: "🏠", ja: "宿代・チャージ", en: "Rent & Charges"),
        .init(key: "food", emoji: "🍔", ja: "飲食", en: "Food & Drinks"),
        .init(key: "shopping", emoji: "🛍️", ja: "ショッピング", en: "Shopping"),
        .init(key: "transport", emoji: "🚖", ja: "交通", en: "Transport")
    ]

    static let general = ExpenseCategory(key: "general", emoji: "✦", ja: "一般", en: "General")

    static func lookup(_ key: String?) -> ExpenseCategory {
        all.first { $0.key == key } ?? ExpenseCategory(key: key ?? "general", emoji: "✦", ja: key ?? "一般", en: key ?? "General")
    }
}

enum GroupIcons {
    struct Group: Identifiable {
        let key: String
        let ja: String
        let en: String
        let items: [String]
        var id: String { key }
    }

    static let groups: [Group] = [
        .init(key: "travel", ja: "旅行", en: "Travel", items: [
            "🧳", "🏝️", "🏖️", "🏕️", "🏔️", "🏙️", "🗼", "🗽", "🎡", "🎢", "🎠", "🛳️", "✈️", "🚆", "🚗", "🚕",
            "🚲", "🛵", "🚌", "🚢", "🚁", "🛶", "🛺", "🛫", "🛬", "🗺️", "🧭", "🏨", "🏯", "🏰", "🕌", "⛩️", "🕍"
        ]),
        .init(key: "food", ja: "食事", en: "Food", items: [
            "🍜", "🍣", "🍔", "🍕", "🍛", "🍱", "🍰", "🍙", "🥟", "🍻", "☕", "🍷", "🍦", "🍩", "🥐", "🥗", "🍖", "🍝", "🍤", "🍺", "🧋", "🧃"
        ]),
        .init(key: "fun", ja: "楽しみ", en: "Fun", items: [
            "🎉", "🎈", "🎵", "🎮", "🎬", "🎤", "🎨", "🎯", "🏟️", "⚽", "🎾", "🏀", "🎳", "🏓", "🎣", "🧩", "🎸", "🎹", "🎿", "🏄", "🧗", "🎭"
        ])
    ]
}

enum Currencies {
    static let all = ["JPY", "USD", "EUR"]
    static func label(_ code: String, lang: Lang) -> String {
        switch code {
        case "JPY": return lang.t("日本円 (JPY)", "Japanese Yen (JPY)")
        case "USD": return lang.t("米ドル (USD)", "US Dollar (USD)")
        case "EUR": return lang.t("ユーロ (EUR)", "Euro (EUR)")
        default: return code
        }
    }
}
