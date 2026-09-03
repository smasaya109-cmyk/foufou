import Foundation

enum Money {
    static func symbol(_ currency: String?) -> String {
        switch currency ?? "JPY" {
        case "JPY": return "¥"
        case "USD": return "$"
        case "EUR": return "€"
        default: return (currency ?? "") + " "
        }
    }

    private static let grouping: NumberFormatter = {
        let f = NumberFormatter()
        f.numberStyle = .decimal
        f.maximumFractionDigits = 0
        f.usesGroupingSeparator = true
        return f
    }()

    static func grouped(_ value: Double) -> String {
        grouping.string(from: NSNumber(value: value.rounded())) ?? String(Int(value.rounded()))
    }

    static func format(_ value: Double, currency: String?) -> String {
        symbol(currency) + grouped(value)
    }

    static func format(_ value: Int, currency: String?) -> String {
        format(Double(value), currency: currency)
    }

    static func signed(_ value: Double) -> String {
        (value >= 0 ? "+" : "-") + grouped(abs(value))
    }
}

enum ISODate {
    private static let withFraction: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()

    private static let plain: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime]
        return f
    }()

    static func parse(_ value: String?) -> Date? {
        guard let value, !value.isEmpty else { return nil }
        return withFraction.date(from: value) ?? plain.date(from: value)
    }

    /// Serialise the way the web does: `new Date(...).toISOString()` (UTC, milliseconds, trailing Z).
    static func string(_ date: Date) -> String {
        withFraction.string(from: date)
    }

    /// Web builds expense dates as `${yyyy-mm-dd}T00:00:00Z`; keep that convention.
    static func startOfDayUTC(_ date: Date) -> Date {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = TimeZone(identifier: "UTC")!
        let local = Calendar.current.dateComponents([.year, .month, .day], from: date)
        return cal.date(from: local) ?? date
    }

    static func display(_ value: String?, lang: Lang, style: DateFormatter.Style = .medium) -> String? {
        guard let date = parse(value) else { return nil }
        let f = DateFormatter()
        f.locale = lang.locale
        f.timeZone = TimeZone(identifier: "UTC")
        f.dateStyle = style
        f.timeStyle = .none
        return f.string(from: date)
    }

    static func shortDay(_ value: String?, lang: Lang) -> String? {
        guard let date = parse(value) else { return nil }
        let f = DateFormatter()
        f.locale = lang.locale
        f.timeZone = TimeZone(identifier: "UTC")
        f.setLocalizedDateFormatFromTemplate("MMMd")
        return f.string(from: date)
    }

    static func dayKey(_ value: String?) -> String {
        guard let date = parse(value) else { return "" }
        let f = DateFormatter()
        f.timeZone = TimeZone(identifier: "UTC")
        f.dateFormat = "yyyy-MM-dd"
        return f.string(from: date)
    }
}
