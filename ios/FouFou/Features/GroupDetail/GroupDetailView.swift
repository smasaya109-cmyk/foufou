import SwiftUI

enum GroupTab: String, CaseIterable, Identifiable {
    case expenses, settlement, members, insights, photos, settings
    var id: String { rawValue }

    func label(_ L: Lang) -> String {
        switch self {
        case .expenses: return L.t("支払い", "Expenses")
        case .settlement: return L.t("精算", "Settlement")
        case .members: return L.t("メンバー", "Members")
        case .insights: return L.t("分析", "Insights")
        case .photos: return L.t("思い出", "Memories")
        case .settings: return L.t("設定", "Settings")
        }
    }
}

struct GroupDetailView: View {
    @Environment(AppSettings.self) private var settings
    @Environment(GroupsStore.self) private var groupsStore
    @Environment(\.dismiss) private var dismiss

    @State private var store: GroupStore
    @State private var tab: GroupTab = .expenses
    @State private var showForm = false
    @State private var editingExpense: Expense?

    init(groupId: String) {
        _store = State(initialValue: GroupStore(groupId: groupId))
    }

    var body: some View {
        let L = settings.lang
        ScrollView {
            VStack(spacing: 18) {
                header
                tabBar
                if store.isLoading && store.detail == nil {
                    HStack(spacing: 10) {
                        ProgressView()
                        MutedText(L.t("読み込み中...", "Loading..."))
                    }
                    .padding(.top, 30)
                } else if let error = store.error, store.detail == nil {
                    VStack(spacing: 12) {
                        ErrorBanner(message: error.message(L))
                        Button(L.t("再読み込み", "Retry")) { Task { await store.load() } }
                            .buttonStyle(OutlineButtonStyle())
                    }
                } else {
                    content
                }
            }
            .padding(20)
            .padding(.bottom, 90)
        }
        .screenBackground()
        .refreshable { await store.load() }
        .navigationTitle(store.title)
        .navigationBarTitleDisplayMode(.inline)
        .overlay(alignment: .bottomTrailing) {
            if tab == .expenses, store.detail != nil, store.canEdit {
                Button {
                    editingExpense = nil
                    showForm = true
                } label: {
                    Image(systemName: "plus")
                        .font(.system(size: 22, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(width: 56, height: 56)
                        .background(Circle().fill(Color.ffAccent))
                        .shadow(color: Color.ffAccentStrong.opacity(0.35), radius: 8, y: 4)
                }
                .padding(24)
            }
        }
        .sheet(isPresented: $showForm) {
            ExpenseFormView(store: store, editing: editingExpense)
        }
        .task { await store.load() }
    }

    private var header: some View {
        let L = settings.lang
        return HStack(spacing: 14) {
            EmojiTile(emoji: store.icon, size: 56)
            VStack(alignment: .leading, spacing: 4) {
                Text(store.title).font(.system(size: 20, weight: .heavy)).foregroundStyle(Color.ffInkStrong).lineLimit(2)
                if let s = ISODate.display(store.detail?.startDate, lang: L), let e = ISODate.display(store.detail?.endDate, lang: L) {
                    MutedText("\(s) - \(e)")
                } else {
                    MutedText(L.t("メンバー \(store.members.count)名", "\(store.members.count) members"))
                }
            }
            Spacer(minLength: 0)
            Pill(text: store.planLabel, background: store.canUsePro ? .ffAccentSoft : .ffPillBg, foreground: store.canUsePro ? .ffAccentStrong : .ffInkStrong)
        }
        .card(padding: 18)
    }

    private var tabBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(GroupTab.allCases) { t in
                    Button {
                        withAnimation(.easeInOut(duration: 0.15)) { tab = t }
                    } label: {
                        Text(t.label(settings.lang))
                            .font(.system(size: 13, weight: .bold))
                            .padding(.horizontal, 14)
                            .padding(.vertical, 8)
                            .background(Capsule().fill(tab == t ? Color.ffAccent : Color.white))
                            .overlay(Capsule().stroke(tab == t ? Color.ffAccent : Color.ffStroke, lineWidth: 2))
                            .foregroundStyle(tab == t ? .white : Color.ffInkStrong)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 2)
            .padding(.vertical, 4)
        }
    }

    @ViewBuilder
    private var content: some View {
        switch tab {
        case .expenses:
            ExpensesTabView(store: store) { expense in
                editingExpense = expense
                showForm = true
            }
        case .settlement:
            SettlementTabView(store: store)
        case .members:
            MembersTabView(store: store)
        case .insights:
            InsightsTabView(store: store)
        case .photos:
            PhotosTabView(store: store)
        case .settings:
            GroupSettingsView(store: store) {
                Task { await groupsStore.load() }
                dismiss()
            }
        }
    }
}
