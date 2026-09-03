import SwiftUI

struct MembersTabView: View {
    @Environment(AppSettings.self) private var settings
    @Bindable var store: GroupStore

    @State private var newName = ""
    @State private var editorEmail = ""
    @State private var renameTarget: Member?
    @State private var renameText = ""
    @State private var removeTarget: Member?
    @State private var error: String?
    @State private var busy = false

    var body: some View {
        let L = settings.lang
        VStack(alignment: .leading, spacing: 16) {
            if let error { ErrorBanner(message: error) }

            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    Text(L.t("メンバー", "Members")).font(.system(size: 15, weight: .bold))
                    Spacer()
                    MutedText("\(store.members.count)", size: 12)
                }
                if store.members.isEmpty {
                    MutedText(L.t("メンバーがいません。", "No members yet."))
                }
                ForEach(store.members) { m in
                    HStack(spacing: 10) {
                        Text(String(m.displayName.prefix(1)).uppercased())
                            .font(.system(size: 14, weight: .bold))
                            .frame(width: 36, height: 36)
                            .background(Circle().fill(Color.ffAccentSoft))
                            .foregroundStyle(Color.ffAccentStrong)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(m.displayName).font(.system(size: 14, weight: .semibold)).foregroundStyle(Color.ffInkStrong)
                            if let joined = ISODate.display(m.joinedAt, lang: L) {
                                MutedText(L.t("追加日 \(joined)", "Added \(joined)"), size: 11)
                            }
                        }
                        Spacer()
                        rolePill(m)
                        if store.isOwner {
                            Menu {
                                Button(L.t("名前を変更", "Rename")) {
                                    renameText = m.name ?? ""
                                    renameTarget = m
                                }
                                if m.userId != store.detail?.ownerUserId {
                                    Button(L.t("削除", "Remove"), role: .destructive) { removeTarget = m }
                                }
                            } label: {
                                Image(systemName: "ellipsis.circle").foregroundStyle(Color.ffInkMuted)
                            }
                        }
                    }
                    .padding(.vertical, 4)
                }
            }
            .card()

            if store.isOwner {
                VStack(alignment: .leading, spacing: 10) {
                    Text(L.t("メンバーを追加", "Add member")).font(.system(size: 15, weight: .bold))
                    MutedText(L.t("ログイン不要の参加者を追加します。", "Add a participant who does not need an account."), size: 12)
                    HStack(spacing: 8) {
                        TextField(L.t("例: 佐藤さん", "e.g. Sato"), text: $newName).softField()
                        Button(L.t("追加", "Add")) {
                            let name = newName.trimmingCharacters(in: .whitespaces)
                            guard !name.isEmpty else { return }
                            Task { await run { try await store.addLocalMember(name: name); newName = "" } }
                        }
                        .buttonStyle(PrimaryButtonStyle(compact: true))
                        .disabled(busy || newName.trimmingCharacters(in: .whitespaces).isEmpty)
                    }
                }
                .card()

                VStack(alignment: .leading, spacing: 10) {
                    Text(L.t("編集者の管理", "Editors")).font(.system(size: 15, weight: .bold))
                    MutedText(L.t("共同編集はPro以上で有効です。編集者はログイン必須です。", "Co-editing requires Pro. Editors must have an account."), size: 12)
                    if store.editors.isEmpty {
                        MutedText(L.t("編集者はまだいません。", "No editors yet."))
                    }
                    ForEach(store.editors) { e in
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(e.name ?? "—").font(.system(size: 14, weight: .semibold)).foregroundStyle(Color.ffInkStrong)
                                if let email = e.email { MutedText(email, size: 11) }
                            }
                            Spacer()
                            Button(L.t("外す", "Remove")) {
                                Task { await run { try await store.removeEditor(userId: e.userId) } }
                            }
                            .buttonStyle(OutlineButtonStyle(compact: true, tint: .ffDanger))
                        }
                    }
                    HStack(spacing: 8) {
                        TextField(L.t("編集者のメールアドレス", "Editor's email"), text: $editorEmail)
                            .keyboardType(.emailAddress)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .softField()
                        Button(L.t("追加", "Add")) {
                            let email = editorEmail.trimmingCharacters(in: .whitespaces)
                            guard !email.isEmpty else { return }
                            Task { await run { try await store.addEditor(email: email); editorEmail = "" } }
                        }
                        .buttonStyle(PrimaryButtonStyle(compact: true))
                        .disabled(busy || !store.canUsePro || editorEmail.isEmpty)
                    }
                    if !store.canUsePro {
                        MutedText(L.t("Proにアップグレードすると編集者を追加できます。", "Upgrade to Pro to add editors."), size: 11)
                    }
                }
                .card()
            }
        }
        .task { await store.loadEditors() }
        .alert(L.t("名前を変更", "Rename"), isPresented: Binding(get: { renameTarget != nil }, set: { if !$0 { renameTarget = nil } })) {
            TextField(L.t("名前", "Name"), text: $renameText)
            Button(L.t("保存", "Save")) {
                if let m = renameTarget {
                    let name = renameText.trimmingCharacters(in: .whitespaces)
                    if !name.isEmpty { Task { await run { try await store.renameMember(userId: m.userId, name: name) } } }
                }
            }
            Button(L.t("キャンセル", "Cancel"), role: .cancel) {}
        }
        .alert(L.t("メンバーを削除", "Remove member"), isPresented: Binding(get: { removeTarget != nil }, set: { if !$0 { removeTarget = nil } })) {
            Button(L.t("削除", "Remove"), role: .destructive) {
                if let m = removeTarget { Task { await run { try await store.removeMember(userId: m.userId) } } }
            }
            Button(L.t("キャンセル", "Cancel"), role: .cancel) {}
        } message: {
            Text(L.t("\(removeTarget?.displayName ?? "") をグループから削除します。", "Remove \(removeTarget?.displayName ?? "") from this group?"))
        }
    }

    private func rolePill(_ m: Member) -> some View {
        let L = settings.lang
        let isOwner = m.userId == store.detail?.ownerUserId
        let isEditor = store.editors.contains { $0.userId == m.userId }
        if isOwner {
            return Pill(text: "Owner", background: .ffAccentSoft, foreground: .ffAccentStrong)
        } else if isEditor {
            return Pill(text: L.t("編集者", "Editor"), background: .ffAccentSoft, foreground: .ffAccentStrong)
        } else if m.isLocal {
            return Pill(text: L.t("ゲスト", "Guest"))
        }
        return Pill(text: L.t("メンバー", "Member"))
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
