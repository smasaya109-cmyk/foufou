import SwiftUI

struct SubscriptionView: View {
    @Environment(AppSettings.self) private var settings
    @Environment(GroupsStore.self) private var groupsStore
    @Environment(\.openURL) private var openURL

    var body: some View {
        let L = settings.lang
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    VStack(alignment: .leading, spacing: 6) {
                        SectionTitle(L.t("料金プラン", "Plans"), size: 26)
                        MutedText(L.t("あなたの旅行に合わせたプランを選べます。", "Pick the plan that fits your trips."))
                        MutedText(L.t("現在のプラン: \(groupsStore.plan.label)", "Current plan: \(groupsStore.plan.label)"), size: 12)
                    }
                    .card(padding: 20)

                    planCard(
                        name: L.t("Freeプラン", "Free"),
                        price: L.t("ずっと無料", "Free forever"),
                        highlight: false,
                        current: groupsStore.plan == .free,
                        features: [
                            L.t("グループ作成2件まで", "Up to 2 groups"),
                            L.t("支払い登録・自動精算", "Expenses & auto settlement"),
                            L.t("基本の割り勘", "Basic splits (equal / select)"),
                            L.t("共有（支払い/精算）", "View-only share link")
                        ]
                    )
                    planCard(
                        name: L.t("Proプラン", "Pro"),
                        price: L.t("¥6,600/年（¥550/月相当）", "¥6,600/yr (≈¥550/mo)"),
                        highlight: true,
                        current: groupsStore.plan == .pro,
                        features: [
                            L.t("グループ作成無制限", "Unlimited groups"),
                            L.t("高度な割り勘（割合/端数/グループ別）", "Advanced splits (ratio / rounding / subgroup)"),
                            L.t("集計・分析", "Insights"),
                            L.t("CSV出力", "CSV export"),
                            L.t("共同編集3名まで", "Up to 3 editors")
                        ]
                    )
                    planCard(
                        name: "Premium",
                        price: L.t("¥11,880/年（¥990/月相当）", "¥11,880/yr (≈¥990/mo)"),
                        highlight: false,
                        current: groupsStore.plan == .premium,
                        features: [
                            L.t("Proの全機能", "Everything in Pro"),
                            L.t("写真共有", "Photo memories"),
                            L.t("共同編集無制限", "Unlimited editors")
                        ]
                    )

                    VStack(alignment: .leading, spacing: 8) {
                        MutedText(L.t("プランの購入・変更はWebサイト（foufou.jp）で行います。購入後はこのアプリに自動で反映されます。",
                                      "Plans are purchased on the website (foufou.jp). Your plan is reflected in this app automatically."), size: 12)
                        Button(L.t("Webでプランを選ぶ", "Choose a plan on the web")) {
                            openURL(AppConfig.webBaseURL.appending(path: "app/subscription"))
                        }
                        .buttonStyle(PrimaryButtonStyle(fullWidth: true))
                        Button(L.t("プラン情報を更新", "Refresh plan status")) {
                            Task { await groupsStore.load() }
                        }
                        .buttonStyle(OutlineButtonStyle(fullWidth: true))
                    }
                    .card()
                }
                .padding(20)
            }
            .screenBackground()
            .navigationTitle(L.t("プラン", "Plans"))
            .navigationBarTitleDisplayMode(.inline)
        }
    }

    private func planCard(name: String, price: String, highlight: Bool, current: Bool, features: [String]) -> some View {
        let L = settings.lang
        return VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text(name).font(.system(size: 18, weight: .heavy)).foregroundStyle(Color.ffInkStrong)
                if highlight { Pill(text: L.t("おすすめ", "Popular"), background: .ffAccent, foreground: .white) }
                Spacer()
                if current { Pill(text: L.t("現在のプラン", "Current"), background: .ffAccentSoft, foreground: .ffAccentStrong) }
            }
            Text(price).font(.system(size: 14, weight: .semibold)).foregroundStyle(Color.ffAccentStrong)
            ForEach(features, id: \.self) { f in
                HStack(alignment: .top, spacing: 8) {
                    Image(systemName: "checkmark.circle.fill").foregroundStyle(Color.ffPositive).font(.system(size: 14))
                    Text(f).font(.system(size: 13)).foregroundStyle(Color.ffInkStrong)
                }
            }
        }
        .card(padding: 18)
        .overlay(RoundedRectangle(cornerRadius: 20, style: .continuous).stroke(highlight ? Color.ffAccent : .clear, lineWidth: 2))
    }
}
