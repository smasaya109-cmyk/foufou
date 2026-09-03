import SwiftUI

/// Add / edit expense. Split math mirrors saveExpense() in the web group page.
struct ExpenseFormView: View {
    @Environment(AppSettings.self) private var settings
    @Environment(\.dismiss) private var dismiss
    @Bindable var store: GroupStore
    let editing: Expense?

    @State private var memo = ""
    @State private var amountText = ""
    @State private var currency = "JPY"
    @State private var payerUserId = ""
    @State private var date = Date()
    @State private var category = "food"
    @State private var splitType = "equal"
    @State private var selected: Set<String> = []
    @State private var ratios: [String: Double] = [:]
    @State private var roundingUnit = "none"
    @State private var roundingMode = "round"
    @State private var roundingTarget = "payer"
    @State private var error: String?
    @State private var pending = false
    @State private var showPaywall = false

    private let splitTypes = ["equal", "select", "ratio", "subgroup"]
    private let columns = Array(repeating: GridItem(.flexible(), spacing: 8), count: 3)

    var body: some View {
        let L = settings.lang
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    amountSection
                    detailsSection
                    categorySection
                    splitSection
                    if let error { ErrorBanner(message: error) }
                    HStack(spacing: 10) {
                        Button {
                            Task { await save() }
                        } label: {
                            Text(pending ? L.t("保存中...", "Saving...") : L.t("保存", "Save"))
                        }
                        .buttonStyle(PrimaryButtonStyle())
                        .disabled(pending)
                        Button(L.t("キャンセル", "Cancel")) { dismiss() }
                            .buttonStyle(OutlineButtonStyle())
                    }
                }
                .padding(20)
            }
            .screenBackground()
            .navigationTitle(editing == nil ? L.t("支払いを追加", "Add expense") : L.t("支払いを編集", "Edit expense"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .topBarLeading) { Button(L.t("閉じる", "Close")) { dismiss() } } }
            .onAppear(perform: prefill)
            .alert(L.t("Pro以上で解放", "Unlock with Pro"), isPresented: $showPaywall) {
                Button("OK") {}
            } message: {
                Text(L.t("割合・サブグループ・端数処理はPro / Premiumで利用できます。", "Ratio, subgroup and rounding are available on Pro / Premium."))
            }
        }
    }

    // MARK: Sections

    private var amountSection: some View {
        let L = settings.lang
        return VStack(alignment: .leading, spacing: 10) {
            FieldLabel(L.t("金額", "Amount"))
            HStack(spacing: 10) {
                Text(Money.symbol(currency)).font(.system(size: 28, weight: .heavy)).foregroundStyle(Color.ffInkStrong)
                TextField("0", text: $amountText)
                    .keyboardType(.numberPad)
                    .font(.system(size: 30, weight: .heavy))
                    .foregroundStyle(Color.ffInkStrong)
                Picker("", selection: $currency) {
                    ForEach(Currencies.all, id: \.self) { Text($0).tag($0) }
                }
                .pickerStyle(.menu)
            }
            .softField()
        }
        .card()
    }

    private var detailsSection: some View {
        let L = settings.lang
        return VStack(alignment: .leading, spacing: 14) {
            VStack(alignment: .leading, spacing: 6) {
                FieldLabel(L.t("タイトル", "Title"))
                TextField(L.t("例：飲み物", "e.g. Drinks"), text: $memo).softField()
            }
            VStack(alignment: .leading, spacing: 6) {
                FieldLabel(L.t("支払った人", "Paid by"))
                Picker("", selection: $payerUserId) {
                    ForEach(store.members) { Text($0.displayName).tag($0.userId) }
                }
                .pickerStyle(.menu)
                .frame(maxWidth: .infinity, alignment: .leading)
                .softField()
            }
            VStack(alignment: .leading, spacing: 6) {
                FieldLabel(L.t("日付", "Date"))
                DatePicker("", selection: $date, displayedComponents: .date)
                    .datePickerStyle(.compact)
                    .labelsHidden()
                    .environment(\.locale, L.locale)
            }
        }
        .card()
    }

    private var categorySection: some View {
        let L = settings.lang
        return VStack(alignment: .leading, spacing: 10) {
            FieldLabel(L.t("カテゴリーを選択", "Category"))
            LazyVGrid(columns: columns, spacing: 8) {
                ForEach(ExpenseCategory.all) { cat in
                    Button { category = cat.key } label: {
                        VStack(spacing: 4) {
                            Text(cat.emoji).font(.system(size: 22))
                            Text(cat.label(L)).font(.system(size: 11, weight: .semibold)).lineLimit(1).minimumScaleFactor(0.8)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(RoundedRectangle(cornerRadius: 14).fill(category == cat.key ? Color.ffAccentSoft : Color.white))
                        .overlay(RoundedRectangle(cornerRadius: 14).stroke(category == cat.key ? Color.ffAccent : Color.ffStroke, lineWidth: 2))
                        .foregroundStyle(Color.ffInkStrong)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .card()
    }

    private var splitSection: some View {
        let L = settings.lang
        return VStack(alignment: .leading, spacing: 12) {
            FieldLabel(L.t("割り勘", "Split"))
            HStack(spacing: 6) {
                ForEach(splitTypes, id: \.self) { type in
                    let locked = (type == "ratio" || type == "subgroup") && !store.canUsePro
                    Button {
                        if locked { showPaywall = true } else { splitType = type }
                    } label: {
                        HStack(spacing: 3) {
                            if locked { Image(systemName: "lock.fill").font(.system(size: 9)) }
                            Text(splitLabel(type)).font(.system(size: 12, weight: .bold)).lineLimit(1).minimumScaleFactor(0.7)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(Capsule().fill(splitType == type ? Color.ffAccent : Color.white))
                        .overlay(Capsule().stroke(splitType == type ? Color.ffAccent : Color.ffStroke, lineWidth: 2))
                        .foregroundStyle(splitType == type ? .white : (locked ? Color.ffInkMuted : Color.ffInkStrong))
                    }
                    .buttonStyle(.plain)
                }
            }

            if splitType != "equal" {
                VStack(spacing: 6) {
                    ForEach(store.members) { m in
                        HStack {
                            Button {
                                if selected.contains(m.userId) { selected.remove(m.userId) } else { selected.insert(m.userId) }
                            } label: {
                                HStack(spacing: 10) {
                                    Image(systemName: selected.contains(m.userId) ? "checkmark.circle.fill" : "circle")
                                        .foregroundStyle(selected.contains(m.userId) ? Color.ffAccent : Color.ffStroke)
                                        .font(.system(size: 20))
                                    Text(m.displayName).font(.system(size: 14, weight: .medium)).foregroundStyle(Color.ffInkStrong)
                                }
                            }
                            .buttonStyle(.plain)
                            Spacer()
                            if splitType == "ratio" && selected.contains(m.userId) {
                                HStack(spacing: 4) {
                                    TextField("0", value: Binding(
                                        get: { ratios[m.userId] ?? 0 },
                                        set: { ratios[m.userId] = max(0, $0) }
                                    ), format: .number)
                                    .keyboardType(.numberPad)
                                    .multilineTextAlignment(.trailing)
                                    .frame(width: 56)
                                    .softField()
                                    Text("%").foregroundStyle(Color.ffInkMuted)
                                }
                            } else {
                                MutedText(previewShare(for: m.userId), size: 12)
                            }
                        }
                    }
                }
                .padding(.top, 4)
            } else {
                VStack(spacing: 4) {
                    ForEach(store.members) { m in
                        HStack {
                            Text(m.displayName).font(.system(size: 14)).foregroundStyle(Color.ffInkStrong)
                            Spacer()
                            MutedText(previewShare(for: m.userId), size: 12)
                        }
                    }
                }
                .padding(.top, 4)
            }

            if store.canUsePro {
                Divider().padding(.vertical, 4)
                VStack(alignment: .leading, spacing: 8) {
                    FieldLabel(L.t("端数単位", "Rounding unit"))
                    Picker("", selection: $roundingUnit) {
                        Text(L.t("なし", "None")).tag("none")
                        Text(L.t("10円単位", "10s")).tag("10")
                        Text(L.t("100円単位", "100s")).tag("100")
                    }
                    .pickerStyle(.segmented)
                    if roundingUnit != "none" {
                        FieldLabel(L.t("丸め", "Mode"))
                        Picker("", selection: $roundingMode) {
                            Text(L.t("四捨五入", "Round")).tag("round")
                            Text(L.t("切り上げ", "Ceil")).tag("ceil")
                            Text(L.t("切り捨て", "Floor")).tag("floor")
                        }
                        .pickerStyle(.segmented)
                        FieldLabel(L.t("端数負担", "Remainder to"))
                        Picker("", selection: $roundingTarget) {
                            Text(L.t("支払った人", "Payer")).tag("payer")
                            Text("Owner").tag("owner")
                        }
                        .pickerStyle(.segmented)
                    }
                }
            } else {
                MutedText(L.t("Free: 均等 / 対象メンバー", "Free: equal / select"), size: 11)
            }
        }
        .card()
    }

    private func splitLabel(_ type: String) -> String {
        let L = settings.lang
        switch type {
        case "equal": return L.t("均等", "Equal")
        case "select": return L.t("対象メンバー", "Select")
        case "ratio": return L.t("割合", "Ratio")
        default: return L.t("サブグループ", "Subgroup")
        }
    }

    // MARK: Logic

    private func prefill() {
        currency = editing?.currency ?? store.currency
        let allIds = store.members.map(\.userId)
        if let e = editing {
            memo = e.memo ?? ""
            amountText = String(e.amount)
            payerUserId = e.payerUserId
            category = e.category ?? "food"
            splitType = e.splitType ?? "equal"
            date = ISODate.parse(e.date) ?? Date()
            let ids = e.splits?.map(\.userId) ?? []
            selected = Set(ids.isEmpty ? allIds : ids)
            if let r = e.splitMeta?.ratios { ratios = r }
            if let r = e.splitMeta?.rounding {
                roundingUnit = r.unit ?? "none"
                roundingMode = r.mode ?? "round"
                roundingTarget = r.target ?? "payer"
            }
        } else {
            payerUserId = store.currentUserId.flatMap { id in allIds.contains(id) ? id : nil } ?? allIds.first ?? ""
            selected = Set(allIds)
        }
        if ratios.isEmpty, !allIds.isEmpty {
            let base = Double(100 / allIds.count)
            for (i, id) in allIds.enumerated() {
                ratios[id] = base + (i == 0 ? 100 - base * Double(allIds.count) : 0)
            }
        }
    }

    private var targets: [String] {
        let all = store.members.map(\.userId)
        return splitType == "equal" ? all : all.filter { selected.contains($0) }
    }

    private func computeSplits(amount: Int) -> [Split]? {
        let t = targets
        guard !t.isEmpty else { return nil }
        var splits: [Split]
        if splitType == "ratio" {
            let total = t.reduce(0.0) { $0 + (ratios[$1] ?? 0) }
            guard total > 0 else { return nil }
            splits = t.map { Split(userId: $0, shareAmount: Int(floor(Double(amount) * (ratios[$0] ?? 0) / total))) }
            let remainder = amount - splits.reduce(0) { $0 + $1.shareAmount }
            splits[0].shareAmount += remainder
        } else {
            let base = amount / t.count
            let remainder = amount - base * t.count
            splits = t.enumerated().map { i, id in Split(userId: id, shareAmount: base + (i == 0 ? remainder : 0)) }
        }
        return applyRounding(splits, amount: amount)
    }

    private func applyRounding(_ splits: [Split], amount: Int) -> [Split] {
        guard roundingUnit != "none", let unit = Int(roundingUnit), unit > 1, store.canUsePro else { return splits }
        var rounded = splits.map { s -> Split in
            let v = Double(s.shareAmount) / Double(unit)
            let r: Double = roundingMode == "ceil" ? ceil(v) : (roundingMode == "floor" ? floor(v) : (v).rounded(.toNearestOrAwayFromZero))
            return Split(userId: s.userId, shareAmount: Int(r) * unit)
        }
        let diff = amount - rounded.reduce(0) { $0 + $1.shareAmount }
        guard diff != 0 else { return rounded }
        let targetId = roundingTarget == "owner" ? (store.detail?.ownerUserId ?? payerUserId) : payerUserId
        if let i = rounded.firstIndex(where: { $0.userId == targetId }) {
            rounded[i].shareAmount += diff
        } else {
            rounded[0].shareAmount += diff
        }
        return rounded
    }

    private func previewShare(for userId: String) -> String {
        guard let amount = Int(amountText), amount > 0, let splits = computeSplits(amount: amount),
              let s = splits.first(where: { $0.userId == userId }) else {
            return targets.contains(userId) ? Money.format(0, currency: currency) : "—"
        }
        return Money.format(s.shareAmount, currency: currency)
    }

    private func save() async {
        let L = settings.lang
        error = nil
        guard let amount = Int(amountText.filter(\.isNumber)), amount > 0 else {
            error = L.t("金額を入力してください", "Please enter an amount")
            return
        }
        guard !payerUserId.isEmpty else {
            error = L.t("支払った人を選択してください", "Please select who paid")
            return
        }
        guard let splits = computeSplits(amount: amount) else {
            error = L.t("割り勘の対象を選択してください", "Please select who shares this expense")
            return
        }
        let meta: SplitMeta? = {
            var m = SplitMeta()
            if splitType == "ratio" { m.ratios = ratios.filter { targets.contains($0.key) } }
            if splitType == "subgroup" { m.subgroup = targets }
            if roundingUnit != "none", store.canUsePro {
                m.rounding = Rounding(unit: roundingUnit, mode: roundingMode, target: roundingTarget)
            }
            return (m.ratios == nil && m.subgroup == nil && m.rounding == nil) ? nil : m
        }()
        let payload = ExpensePayload(
            payerUserId: payerUserId,
            amount: amount,
            currency: currency,
            date: ISODate.string(ISODate.startOfDayUTC(date)),
            category: category,
            memo: memo.trimmingCharacters(in: .whitespaces).isEmpty ? nil : memo.trimmingCharacters(in: .whitespaces),
            splitType: splitType,
            splits: splits,
            splitMeta: meta
        )
        pending = true
        defer { pending = false }
        do {
            try await store.saveExpense(payload, editing: editing)
            dismiss()
        } catch let e as APIError {
            error = e.message(L)
        } catch {
            self.error = L.t("保存に失敗しました", "Failed to save")
        }
    }
}
