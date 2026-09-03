import SwiftUI

struct InsightsTabView: View {
    @Environment(AppSettings.self) private var settings
    @Bindable var store: GroupStore

    var body: some View {
        let L = settings.lang
        if !store.canUsePro {
            PaywallBanner(
                title: L.t("Pro以上で解放", "Unlock with Pro"),
                description: L.t("分析タブはPro / Premiumで利用できます。", "Insights are available on Pro/Premium.")
            )
        } else {
            VStack(alignment: .leading, spacing: 16) {
                summaryCard
                categoryCard
                memberCard
                dailyCard
            }
        }
    }

    private var total: Int { store.expenses.reduce(0) { $0 + $1.amount } }

    private var summaryCard: some View {
        let L = settings.lang
        return HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                MutedText(L.t("合計", "Total"), size: 12)
                Text(Money.format(total, currency: store.currency)).font(.system(size: 26, weight: .heavy)).foregroundStyle(Color.ffInkStrong)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 4) {
                MutedText(L.t("件数", "Count"), size: 12)
                Text("\(store.expenses.count)").font(.system(size: 22, weight: .bold)).foregroundStyle(Color.ffInkStrong)
            }
            VStack(alignment: .trailing, spacing: 4) {
                MutedText(L.t("1人あたり", "Per person"), size: 12)
                Text(Money.format(store.members.isEmpty ? 0 : total / store.members.count, currency: store.currency))
                    .font(.system(size: 22, weight: .bold)).foregroundStyle(Color.ffInkStrong)
            }
        }
        .card()
    }

    private var categoryCard: some View {
        let L = settings.lang
        var sums: [String: Int] = [:]
        for e in store.expenses { sums[e.category ?? "general", default: 0] += e.amount }
        let rows = sums.sorted { $0.value > $1.value }
        return VStack(alignment: .leading, spacing: 10) {
            Text(L.t("カテゴリ別", "By category")).font(.system(size: 15, weight: .bold))
            if rows.isEmpty { MutedText(L.t("データがありません。", "No data.")) }
            ForEach(rows, id: \.key) { key, value in
                let cat = ExpenseCategory.lookup(key)
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text("\(cat.emoji) \(cat.label(L))").font(.system(size: 13, weight: .semibold))
                        Spacer()
                        Text(Money.format(value, currency: store.currency)).font(.system(size: 13, weight: .bold))
                        MutedText(total > 0 ? "\(value * 100 / total)%" : "0%", size: 11).frame(width: 40, alignment: .trailing)
                    }
                    GeometryReader { geo in
                        Capsule().fill(Color.ffBgSoft)
                            .overlay(alignment: .leading) {
                                Capsule().fill(Color.ffAccent).frame(width: total > 0 ? geo.size.width * CGFloat(value) / CGFloat(total) : 0)
                            }
                    }
                    .frame(height: 8)
                }
                .foregroundStyle(Color.ffInkStrong)
            }
        }
        .card()
    }

    private var memberCard: some View {
        let L = settings.lang
        var paid: [String: Int] = [:]
        for e in store.expenses { paid[e.payerUserId, default: 0] += e.amount }
        let rows = store.members.map { ($0.displayName, paid[$0.userId] ?? 0) }.sorted { $0.1 > $1.1 }
        return VStack(alignment: .leading, spacing: 8) {
            Text(L.t("メンバー別立替", "Paid by member")).font(.system(size: 15, weight: .bold))
            ForEach(Array(rows.enumerated()), id: \.offset) { _, row in
                HStack {
                    Text(row.0).font(.system(size: 13, weight: .medium))
                    Spacer()
                    Text(Money.format(row.1, currency: store.currency)).font(.system(size: 13, weight: .bold))
                }
                .foregroundStyle(Color.ffInkStrong)
            }
        }
        .card()
    }

    private var dailyCard: some View {
        let L = settings.lang
        var sums: [String: Int] = [:]
        var sample: [String: String] = [:]
        for e in store.expenses {
            let key = ISODate.dayKey(e.date)
            sums[key, default: 0] += e.amount
            sample[key] = e.date
        }
        let rows = sums.sorted { $0.key > $1.key }
        let maxValue = rows.map(\.value).max() ?? 0
        return VStack(alignment: .leading, spacing: 8) {
            Text(L.t("日別推移", "Daily")).font(.system(size: 15, weight: .bold))
            ForEach(rows, id: \.key) { key, value in
                HStack(spacing: 10) {
                    MutedText(ISODate.shortDay(sample[key], lang: L) ?? L.t("未設定", "None"), size: 12).frame(width: 54, alignment: .leading)
                    GeometryReader { geo in
                        Capsule().fill(Color.ffAccentSoft)
                            .frame(width: maxValue > 0 ? max(6, geo.size.width * CGFloat(value) / CGFloat(maxValue)) : 6)
                    }
                    .frame(height: 10)
                    Text(Money.format(value, currency: store.currency)).font(.system(size: 12, weight: .bold)).foregroundStyle(Color.ffInkStrong)
                        .frame(width: 84, alignment: .trailing)
                }
            }
        }
        .card()
    }
}
