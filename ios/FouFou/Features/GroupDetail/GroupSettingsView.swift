import SwiftUI
import UIKit

struct GroupSettingsView: View {
    @Environment(AppSettings.self) private var settings
    @Bindable var store: GroupStore
    var onDeleted: () -> Void

    @State private var title = ""
    @State private var icon = "🧳"
    @State private var memo = ""
    @State private var showEmoji = false
    @State private var saving = false
    @State private var saved = false
    @State private var error: String?
    @State private var copied = false
    @State private var confirmDelete = false
    @State private var csvURL: URL?
    @State private var transferTarget = ""
    @State private var transferSent = false

    var body: some View {
        let L = settings.lang
        VStack(alignment: .leading, spacing: 16) {
            if let error { ErrorBanner(message: error) }

            if store.isOwner {
                VStack(alignment: .leading, spacing: 12) {
                    Text(L.t("基本情報", "Basics")).font(.system(size: 15, weight: .bold))
                    FieldLabel(L.t("グループ名", "Group name"))
                    HStack(spacing: 10) {
                        Button { showEmoji = true } label: { EmojiTile(emoji: icon, size: 46) }.buttonStyle(.plain)
                        TextField(L.t("グループ名", "Group name"), text: $title).softField()
                    }
                    FieldLabel(L.t("メモ", "Memo"))
                    TextField(L.t("メモ（任意）", "Memo (optional)"), text: $memo, axis: .vertical).lineLimit(2...4).softField()
                    HStack(spacing: 10) {
                        Button {
                            Task { await save() }
                        } label: {
                            Text(saving ? L.t("更新中...", "Updating...") : L.t("更新する", "Update"))
                        }
                        .buttonStyle(PrimaryButtonStyle(compact: true))
                        .disabled(saving || title.trimmingCharacters(in: .whitespaces).isEmpty)
                        if saved { MutedText(L.t("更新しました", "Updated"), size: 12) }
                    }
                }
                .card()
            }

            VStack(alignment: .leading, spacing: 10) {
                Text(L.t("閲覧専用リンク", "View-only link")).font(.system(size: 15, weight: .bold))
                MutedText(L.t("リンクを共有すると、支払いと精算の内容を「閲覧のみ」で見られます（編集は不可）。", "Anyone with the link can view expenses and settlement (no editing)."), size: 12)
                if let url = store.shareURL {
                    Text(url.absoluteString).font(.system(size: 12, design: .monospaced)).foregroundStyle(Color.ffInkMuted).lineLimit(2).softField()
                    HStack(spacing: 8) {
                        Button(copied ? L.t("コピーしました", "Copied") : L.t("コピー", "Copy")) {
                            UIPasteboard.general.string = url.absoluteString
                            copied = true
                            Task { try? await Task.sleep(for: .seconds(2)); copied = false }
                        }
                        .buttonStyle(OutlineButtonStyle(compact: true))
                        ShareLink(item: url) { Label(L.t("共有", "Share"), systemImage: "square.and.arrow.up") }
                            .buttonStyle(OutlineButtonStyle(compact: true))
                        if store.isOwner {
                            Button(L.t("URL更新", "Regenerate")) { Task { await run { try await store.rotateShareToken() } } }
                                .buttonStyle(OutlineButtonStyle(compact: true))
                        }
                    }
                } else {
                    MutedText(L.t("リンクがありません。", "No link available."))
                }
            }
            .card()

            if store.canUsePro {
                VStack(alignment: .leading, spacing: 10) {
                    Text(L.t("データ", "Data")).font(.system(size: 15, weight: .bold))
                    Button {
                        Task { await run { csvURL = try await store.exportCSV() } }
                    } label: {
                        Label(L.t("CSV出力", "Export CSV"), systemImage: "tablecells")
                    }
                    .buttonStyle(OutlineButtonStyle(compact: true))
                }
                .card()
            }

            if store.isOwner && store.canUsePro && !store.editors.isEmpty {
                VStack(alignment: .leading, spacing: 10) {
                    Text(L.t("Owner移譲の申請", "Transfer ownership")).font(.system(size: 15, weight: .bold))
                    MutedText(L.t("編集者の中から移譲先を選びます。相手の承諾で完了します。", "Choose an editor. The transfer completes when they accept."), size: 12)
                    Picker(L.t("移譲先を選択", "Select"), selection: $transferTarget) {
                        Text(L.t("移譲先を選択", "Select")).tag("")
                        ForEach(store.editors) { Text($0.name ?? $0.email ?? $0.userId).tag($0.userId) }
                    }
                    .pickerStyle(.menu)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .softField()
                    Button(transferSent ? L.t("申請しました", "Requested") : L.t("移譲を申請", "Request transfer")) {
                        Task { await run { try await store.requestOwnershipTransfer(toUserId: transferTarget); transferSent = true } }
                    }
                    .buttonStyle(OutlineButtonStyle(compact: true))
                    .disabled(transferTarget.isEmpty || transferSent)
                }
                .card()
            }

            if store.isOwner {
                VStack(alignment: .leading, spacing: 10) {
                    Text(L.t("危険な操作", "Danger zone")).font(.system(size: 15, weight: .bold)).foregroundStyle(Color.ffDanger)
                    MutedText(L.t("アーカイブ・削除は慎重に。", "Archive and delete with care."), size: 12)
                    HStack(spacing: 8) {
                        Button(store.isArchived ? L.t("復元（Pro）", "Restore (Pro)") : L.t("アーカイブ（Proのみ）", "Archive (Pro)")) {
                            Task { await run { try await store.updateSettings(GroupSettingsPayload(status: store.isArchived ? "active" : "archived")) } }
                        }
                        .buttonStyle(OutlineButtonStyle(compact: true))
                        .disabled(!store.canUsePro)
                        Button(L.t("グループを削除", "Delete group")) { confirmDelete = true }
                            .buttonStyle(OutlineButtonStyle(compact: true, tint: .ffDanger))
                    }
                }
                .card()
            }
        }
        .onAppear {
            title = store.detail?.title ?? ""
            icon = store.detail?.icon ?? "🧳"
            memo = store.detail?.memo ?? ""
        }
        .task { await store.loadEditors() }
        .sheet(isPresented: $showEmoji) { EmojiPickerView(selected: $icon) }
        .sheet(isPresented: Binding(get: { csvURL != nil }, set: { if !$0 { csvURL = nil } })) {
            if let csvURL { ActivityView(items: [csvURL]) }
        }
        .alert(L.t("グループを削除", "Delete group"), isPresented: $confirmDelete) {
            Button(L.t("削除", "Delete"), role: .destructive) {
                Task { await run { try await store.deleteGroup(); onDeleted() } }
            }
            Button(L.t("キャンセル", "Cancel"), role: .cancel) {}
        } message: {
            Text(L.t("このグループを削除します。元に戻せません。続行しますか？", "This group will be deleted permanently. Continue?"))
        }
    }

    private func save() async {
        saving = true
        saved = false
        defer { saving = false }
        let trimmedMemo = memo.trimmingCharacters(in: .whitespacesAndNewlines)
        await run {
            try await store.updateSettings(GroupSettingsPayload(
                title: title.trimmingCharacters(in: .whitespaces),
                icon: icon,
                memo: .some(trimmedMemo.isEmpty ? nil : trimmedMemo)
            ))
            saved = true
        }
    }

    private func run(_ op: @escaping () async throws -> Void) async {
        error = nil
        do { try await op() }
        catch let e as APIError { error = e.message(settings.lang) }
        catch { self.error = settings.lang.t("エラーが発生しました", "Something went wrong") }
    }
}

struct ActivityView: UIViewControllerRepresentable {
    let items: [Any]
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
