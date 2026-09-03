import SwiftUI

struct GroupsListView: View {
    @Environment(AppSettings.self) private var settings
    @Environment(GroupsStore.self) private var store
    @Environment(AuthService.self) private var auth

    @State private var showCreate = false
    @State private var path: [GroupSummary] = []
    @State private var actionGroup: GroupSummary?
    @State private var confirmDelete: GroupSummary?
    @State private var busy = false
    @State private var toast: String?
    @State private var navigateToPlans = false

    var body: some View {
        let L = settings.lang
        NavigationStack(path: $path) {
            ScrollView {
                VStack(spacing: 20) {
                    header
                    banner
                    if let t = store.pendingTransfers.first {
                        ownershipBanner(t)
                    }
                    if let toast {
                        ErrorBanner(message: toast)
                    }
                    if store.isLoading && !store.hasLoaded {
                        HStack(spacing: 10) {
                            ProgressView()
                            MutedText(L.t("読み込み中...", "Loading..."))
                        }
                        .padding(.top, 20)
                    } else if let error = store.error, !store.hasLoaded {
                        VStack(spacing: 12) {
                            ErrorBanner(message: error.message(L))
                            if error.isAuthRequired {
                                Button(L.t("ログアウトして再ログイン", "Log out and sign in again")) { auth.signOut() }
                                    .buttonStyle(OutlineButtonStyle())
                            } else {
                                Button(L.t("再読み込み", "Retry")) { Task { await store.load() } }
                                    .buttonStyle(OutlineButtonStyle())
                            }
                        }
                    } else {
                        section(title: L.t("アクティブ", "Active"), groups: store.active, emptyText: L.t("まだ旅行がありません。", "No trips yet."))
                        if !store.archived.isEmpty {
                            section(title: L.t("アーカイブ済み", "Archived"), groups: store.archived, emptyText: nil)
                        }
                    }
                }
                .padding(20)
                .padding(.bottom, 40)
            }
            .screenBackground()
            .refreshable { await store.load() }
            .navigationTitle("FouFou")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { showCreate = true } label: { Image(systemName: "plus.circle.fill").font(.title3) }
                }
            }
            .navigationDestination(for: GroupSummary.self) { group in
                GroupDetailView(groupId: group.id)
            }
            .sheet(isPresented: $showCreate) {
                NewGroupView { newId in
                    path = [GroupSummary(id: newId)]
                }
            }
            .confirmationDialog(actionGroup?.displayTitle ?? "", isPresented: Binding(get: { actionGroup != nil }, set: { if !$0 { actionGroup = nil } }), titleVisibility: .visible) {
                if let g = actionGroup { actionButtons(g) }
            }
            .alert(L.t("グループを削除", "Delete group"), isPresented: Binding(get: { confirmDelete != nil }, set: { if !$0 { confirmDelete = nil } })) {
                Button(L.t("削除", "Delete"), role: .destructive) {
                    if let g = confirmDelete { Task { await run { try await store.delete(g) } } }
                }
                Button(L.t("キャンセル", "Cancel"), role: .cancel) {}
            } message: {
                Text(L.t("このグループを削除します。元に戻せません。続行しますか？", "This group will be deleted permanently. Continue?"))
            }
            .task { if !store.hasLoaded { await store.load() } }
        }
    }

    // MARK: Sections

    private var header: some View {
        let L = settings.lang
        return VStack(alignment: .leading, spacing: 8) {
            Text("DASHBOARD").font(.system(size: 11, weight: .semibold)).tracking(2).foregroundStyle(Color.ffInkMuted)
            SectionTitle(L.t("あなたの旅行", "Your trips"), size: 28)
            MutedText(L.t("Owner / 参加中の旅行を一覧表示", "Trips you own or joined"))
            Button { showCreate = true } label: {
                Label(L.t("グループを作成", "Create group"), systemImage: "plus")
            }
            .buttonStyle(PrimaryButtonStyle())
            .padding(.top, 6)
        }
        .card(padding: 22)
    }

    @ViewBuilder
    private var banner: some View {
        let L = settings.lang
        switch store.plan {
        case .free:
            PaywallBanner(
                title: L.t("無料枠は2グループまで", "Free plan: up to 2 groups"),
                description: L.t("3件目からはProで無制限に作成できます。", "Upgrade to Pro for unlimited groups."),
                actionLabel: L.t("プランを見る →", "See plans →"),
                action: { navigateToPlans = true }
            )
        case .pro:
            PaywallBanner(
                title: L.t("Premiumを解放", "Unlock Premium"),
                description: L.t("写真共有と共同編集無制限はPremiumで利用できます。", "Photo memories and unlimited editors are available on Premium.")
            )
        case .premium:
            PaywallBanner(
                title: L.t("写真共有を使ってみる", "Try Photo Memories"),
                description: L.t("旅行を開いて、思い出タブから写真を共有できます。", "Open a trip and share photos from the Memories tab.")
            )
        }
    }

    private func ownershipBanner(_ t: PendingTransfer) -> some View {
        let L = settings.lang
        return VStack(alignment: .leading, spacing: 8) {
            Text(L.t("Owner移譲の申請", "Ownership transfer request")).font(.system(size: 15, weight: .bold))
            MutedText(L.t("\(t.fromUserName ?? "Owner") から申請があります。承諾するとあなたがOwnerになります。", "\(t.fromUserName ?? "Owner") wants to transfer ownership to you."))
            Button(L.t("承諾する", "Accept")) {
                Task { await run { try await store.acceptTransfer(t) } }
            }
            .buttonStyle(PrimaryButtonStyle(compact: true))
        }
        .card()
    }

    private func section(title: String, groups: [GroupSummary], emptyText: String?) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(title).font(.system(size: 14, weight: .semibold)).foregroundStyle(Color.ffInkStrong)
                Spacer()
                MutedText("\(groups.count)", size: 12)
            }
            if groups.isEmpty, let emptyText {
                MutedText(emptyText)
            }
            ForEach(groups) { group in
                NavigationLink(value: group) {
                    GroupCardView(group: group, planLabel: group.isArchived ? settings.lang.t("アーカイブ", "Archived") : store.plan.label)
                }
                .buttonStyle(.plain)
                .contextMenu { actionButtons(group) }
            }
        }
    }

    @ViewBuilder
    private func actionButtons(_ g: GroupSummary) -> some View {
        let L = settings.lang
        let owner = g.role == "owner"
        if g.isArchived {
            Button(L.t("復元（Pro）", "Restore (Pro)")) { Task { await run { try await store.setArchived(g, false) } } }
                .disabled(!owner)
        } else {
            Button(L.t("アーカイブ（Proのみ）", "Archive (Pro)")) { Task { await run { try await store.setArchived(g, true) } } }
                .disabled(!owner)
        }
        Button(L.t("複製（Pro）", "Duplicate (Pro)")) {
            Task { await run { let id = try await store.duplicate(g); path = [GroupSummary(id: id)] } }
        }
        .disabled(!owner)
        Button(L.t("削除", "Delete"), role: .destructive) { confirmDelete = g }
            .disabled(!owner)
        Button(L.t("キャンセル", "Cancel"), role: .cancel) {}
    }

    private func run(_ op: @escaping () async throws -> Void) async {
        busy = true
        toast = nil
        defer { busy = false }
        do {
            try await op()
        } catch let e as APIError {
            toast = e.message(settings.lang)
            if e.isPremiumRequired { navigateToPlans = true }
        } catch {
            toast = settings.lang.t("エラーが発生しました", "Something went wrong")
        }
    }
}

struct GroupCardView: View {
    @Environment(AppSettings.self) private var settings
    let group: GroupSummary
    let planLabel: String

    var body: some View {
        let L = settings.lang
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .top, spacing: 12) {
                EmojiTile(emoji: group.icon ?? "🧳")
                VStack(alignment: .leading, spacing: 3) {
                    Text(group.displayTitle).font(.system(size: 17, weight: .semibold)).foregroundStyle(Color.ffInkStrong)
                    if let s = ISODate.display(group.startDate, lang: L), let e = ISODate.display(group.endDate, lang: L) {
                        MutedText("\(s) - \(e)")
                    }
                }
                Spacer(minLength: 0)
                Pill(text: planLabel)
            }
            MutedText(L.t("メンバー \(group.membersCount ?? 0)名", "\(group.membersCount ?? 0) members"))
        }
        .card(padding: 18)
    }
}

extension GroupSummary {
    /// Lightweight placeholder used for navigation before the list refreshes.
    init(id: String) {
        self.init(id: id, title: nil, startDate: nil, endDate: nil, status: nil, icon: nil, currency: nil, membersCount: nil, role: nil, ownerUserId: nil)
    }
}
