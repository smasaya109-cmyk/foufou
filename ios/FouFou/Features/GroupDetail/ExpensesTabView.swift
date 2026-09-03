import SwiftUI

struct ExpensesTabView: View {
    @Environment(AppSettings.self) private var settings
    @Bindable var store: GroupStore
    var onEdit: (Expense) -> Void

    @State private var actionExpense: Expense?
    @State private var confirmDelete: Expense?
    @State private var error: String?
    @State private var busy = false

    var body: some View {
        let L = settings.lang
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                MutedText(L.t("支払い一覧", "Expenses"))
                Spacer()
                MutedText("\(store.expenses.count)", size: 12)
            }
            if let error { ErrorBanner(message: error) }
            if store.expenses.isEmpty {
                VStack(spacing: 8) {
                    Image("Mascot").resizable().scaledToFit().frame(width: 80, height: 80).opacity(0.9)
                    MutedText(L.t("まだ支払いがありません。", "No expenses yet."))
                    if store.canEdit {
                        MutedText(L.t("右下の＋から追加できます。", "Tap + to add one."), size: 11)
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 30)
            } else {
                ForEach(groupedByDay, id: \.key) { day in
                    VStack(alignment: .leading, spacing: 8) {
                        MutedText(day.label, size: 12).padding(.top, 6)
                        ForEach(day.items) { expense in
                            Button { actionExpense = expense } label: {
                                ExpenseRowView(expense: expense, payerName: store.name(expense.payerUserId))
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            }
        }
        .confirmationDialog(actionTitle, isPresented: Binding(get: { actionExpense != nil }, set: { if !$0 { actionExpense = nil } }), titleVisibility: .visible) {
            if let e = actionExpense {
                Button(L.t("編集", "Edit")) { onEdit(e) }
                if store.canUsePro {
                    Button(L.t("複製（Pro）", "Duplicate (Pro)")) { Task { await run { try await store.duplicateExpense(e) } } }
                }
                Button(L.t("削除", "Delete"), role: .destructive) { confirmDelete = e }
                Button(L.t("キャンセル", "Cancel"), role: .cancel) {}
            }
        }
        .alert(L.t("支払いを削除", "Delete expense"), isPresented: Binding(get: { confirmDelete != nil }, set: { if !$0 { confirmDelete = nil } })) {
            Button(L.t("削除", "Delete"), role: .destructive) {
                if let e = confirmDelete { Task { await run { try await store.deleteExpense(e) } } }
            }
            Button(L.t("キャンセル", "Cancel"), role: .cancel) {}
        }
    }

    private var actionTitle: String {
        guard let e = actionExpense else { return "" }
        let memo = e.memo?.isEmpty == false ? e.memo! : e.categoryInfo.label(settings.lang)
        return "\(memo) · \(Money.format(e.amount, currency: e.currency ?? store.currency))"
    }

    private struct DayGroup {
        let key: String
        let label: String
        let items: [Expense]
    }

    private var groupedByDay: [DayGroup] {
        let L = settings.lang
        var order: [String] = []
        var map: [String: [Expense]] = [:]
        for e in store.expenses {
            let key = ISODate.dayKey(e.date)
            if map[key] == nil { order.append(key) }
            map[key, default: []].append(e)
        }
        return order.map { key in
            let first = map[key]?.first
            let label = ISODate.display(first?.date, lang: L) ?? L.t("日付未設定", "No date")
            return DayGroup(key: key, label: label, items: map[key] ?? [])
        }
    }

    private func run(_ op: @escaping () async throws -> Void) async {
        error = nil
        busy = true
        defer { busy = false }
        do { try await op() }
        catch let e as APIError { error = e.message(settings.lang) }
        catch { self.error = settings.lang.t("エラーが発生しました", "Something went wrong") }
    }
}

struct ExpenseRowView: View {
    @Environment(AppSettings.self) private var settings
    let expense: Expense
    let payerName: String

    var body: some View {
        let L = settings.lang
        let cat = expense.categoryInfo
        HStack(spacing: 12) {
            Text(cat.emoji)
                .font(.system(size: 26))
                .frame(width: 52, height: 52)
                .background(RoundedRectangle(cornerRadius: 16, style: .continuous).fill(Color.ffBgSoft))
            VStack(alignment: .leading, spacing: 2) {
                Text(expense.memo?.isEmpty == false ? expense.memo! : cat.label(L))
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(Color.ffInkStrong)
                    .lineLimit(1)
                if expense.memo?.isEmpty == false {
                    MutedText(cat.label(L), size: 11)
                }
            }
            Spacer(minLength: 8)
            VStack(alignment: .trailing, spacing: 2) {
                Text(Money.format(expense.amount, currency: expense.currency))
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(Color.ffInkStrong)
                MutedText(L.t("\(payerName) が支払い", "Paid by \(payerName)"), size: 11)
            }
        }
        .padding(12)
        .background(RoundedRectangle(cornerRadius: 18, style: .continuous).fill(Color.white)
            .shadow(color: Color.ffAccent.opacity(0.08), radius: 0, y: 6))
        .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous).stroke(Color.ffStroke, lineWidth: 1.5))
    }
}
