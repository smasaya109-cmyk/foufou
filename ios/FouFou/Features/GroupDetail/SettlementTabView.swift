import SwiftUI

struct SettlementTabView: View {
    @Environment(AppSettings.self) private var settings
    @Bindable var store: GroupStore
    @State private var error: String?
    @State private var recomputing = false

    var body: some View {
        let L = settings.lang
        VStack(alignment: .leading, spacing: 16) {
            if let error { ErrorBanner(message: error) }
            if store.settlementLoading && store.settlement == nil {
                HStack(spacing: 10) { ProgressView(); MutedText(L.t("計算中...", "Computing...")) }
            }

            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    Text(L.t("送金提案", "Suggested transfers")).font(.system(size: 15, weight: .bold))
                    Spacer()
                    Button {
                        Task { await recompute() }
                    } label: {
                        Label(recomputing ? L.t("計算中", "Computing") : L.t("再計算", "Recompute"), systemImage: "arrow.clockwise")
                    }
                    .buttonStyle(OutlineButtonStyle(compact: true))
                    .disabled(recomputing)
                }
                let transfers = store.settlement?.transfers ?? []
                if transfers.isEmpty {
                    MutedText(L.t("送金提案がありません。", "No transfers needed."))
                } else {
                    ForEach(Array(transfers.enumerated()), id: \.offset) { _, t in
                        HStack(spacing: 8) {
                            Text(store.name(t.fromUserId)).font(.system(size: 14, weight: .semibold))
                            Image(systemName: "arrow.right").font(.system(size: 12, weight: .bold)).foregroundStyle(Color.ffAccentStrong)
                            Text(store.name(t.toUserId)).font(.system(size: 14, weight: .semibold))
                            Spacer()
                            Text(Money.format(t.amount, currency: store.currency)).font(.system(size: 15, weight: .bold))
                        }
                        .foregroundStyle(Color.ffInkStrong)
                        .padding(.vertical, 8)
                        .padding(.horizontal, 12)
                        .background(RoundedRectangle(cornerRadius: 14).fill(Color.ffBgSoft))
                    }
                }
            }
            .card()

            VStack(alignment: .leading, spacing: 10) {
                Text(L.t("メンバー別収支", "Balance by member")).font(.system(size: 15, weight: .bold))
                HStack {
                    MutedText(L.t("メンバー", "Member"), size: 11).frame(maxWidth: .infinity, alignment: .leading)
                    MutedText(L.t("立替", "Paid"), size: 11).frame(width: 90, alignment: .trailing)
                    MutedText(L.t("差額", "Net"), size: 11).frame(width: 90, alignment: .trailing)
                }
                let balances = store.settlement?.balances ?? []
                if balances.isEmpty {
                    MutedText(L.t("データがありません。", "No data."))
                } else {
                    ForEach(balances, id: \.userId) { b in
                        HStack {
                            Text(store.name(b.userId)).font(.system(size: 14, weight: .medium)).frame(maxWidth: .infinity, alignment: .leading)
                            Text(Money.grouped(b.paid ?? 0)).font(.system(size: 14)).frame(width: 90, alignment: .trailing)
                            Text(Money.signed(b.net ?? 0))
                                .font(.system(size: 14, weight: .bold))
                                .foregroundStyle((b.net ?? 0) >= 0 ? Color.ffPositive : Color.ffDanger)
                                .frame(width: 90, alignment: .trailing)
                        }
                        .foregroundStyle(Color.ffInkStrong)
                        Divider()
                    }
                }
            }
            .card()
        }
        .task { if store.settlement == nil { await store.loadSettlement() } }
    }

    private func recompute() async {
        recomputing = true
        error = nil
        defer { recomputing = false }
        do { try await store.computeSettlement() }
        catch let e as APIError { error = e.message(settings.lang) }
        catch { self.error = settings.lang.t("計算に失敗しました", "Failed to compute") }
    }
}
