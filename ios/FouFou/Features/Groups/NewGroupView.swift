import SwiftUI

struct NewGroupView: View {
    @Environment(AppSettings.self) private var settings
    @Environment(GroupsStore.self) private var store
    @Environment(\.dismiss) private var dismiss

    var onCreated: (String) -> Void

    @State private var title = ""
    @State private var icon = "🧳"
    @State private var currency = "JPY"
    @State private var myName = ""
    @State private var participants: [String] = [""]
    @State private var error: String?
    @State private var pending = false
    @State private var showEmoji = false

    var body: some View {
        let L = settings.lang
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    VStack(alignment: .leading, spacing: 6) {
                        SectionTitle(L.t("グループを作成", "Create group"), size: 24)
                        MutedText(L.t("Freeの場合はOwnerアクティブ2件まで。", "Free plan: up to 2 active groups as owner."))
                    }
                    .card(padding: 20)

                    VStack(alignment: .leading, spacing: 16) {
                        VStack(alignment: .leading, spacing: 6) {
                            FieldLabel(L.t("タイトル", "Title"))
                            HStack(spacing: 10) {
                                Button { showEmoji = true } label: { EmojiTile(emoji: icon, size: 46) }
                                    .buttonStyle(.plain)
                                TextField(L.t("例：City Trip", "e.g. City Trip"), text: $title).softField()
                            }
                            MutedText(L.t("アイコンをタップして絵文字を選択します。", "Tap the icon to pick an emoji."), size: 11)
                        }

                        VStack(alignment: .leading, spacing: 6) {
                            FieldLabel(L.t("通貨", "Currency"))
                            Picker("", selection: $currency) {
                                ForEach(Currencies.all, id: \.self) { Text(Currencies.label($0, lang: L)).tag($0) }
                            }
                            .pickerStyle(.segmented)
                        }

                        VStack(alignment: .leading, spacing: 8) {
                            FieldLabel(L.t("参加メンバー", "Participants"))
                            HStack(spacing: 8) {
                                TextField(L.t("自分の表示名", "Your display name"), text: $myName).softField()
                                Pill(text: "Me", background: .ffAccentSoft, foreground: .ffAccentStrong)
                            }
                            ForEach(participants.indices, id: \.self) { i in
                                HStack(spacing: 8) {
                                    TextField(L.t("参加者名", "Participant name"), text: $participants[i]).softField()
                                    Button {
                                        participants.remove(at: i)
                                    } label: {
                                        Image(systemName: "minus.circle.fill").foregroundStyle(Color.ffInkMuted)
                                    }
                                }
                            }
                            Button {
                                participants.append("")
                            } label: {
                                Label(L.t("参加者を追加", "Add participant"), systemImage: "plus")
                            }
                            .buttonStyle(OutlineButtonStyle(compact: true))
                        }

                        if let error { ErrorBanner(message: error) }

                        HStack(spacing: 10) {
                            Button {
                                Task { await submit() }
                            } label: {
                                Text(pending ? L.t("処理中...", "Processing...") : L.t("作成", "Create"))
                            }
                            .buttonStyle(PrimaryButtonStyle())
                            .disabled(pending || title.trimmingCharacters(in: .whitespaces).isEmpty)
                            Button(L.t("キャンセル", "Cancel")) { dismiss() }
                                .buttonStyle(OutlineButtonStyle())
                        }
                    }
                    .card(padding: 20)
                }
                .padding(20)
            }
            .screenBackground()
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) { Button(L.t("閉じる", "Close")) { dismiss() } }
            }
            .sheet(isPresented: $showEmoji) {
                EmojiPickerView(selected: $icon)
            }
        }
    }

    private func submit() async {
        let L = settings.lang
        error = nil
        let names = participants.map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }
        let me = myName.trimmingCharacters(in: .whitespaces)
        if !me.isEmpty, names.contains(me) {
            error = L.t("自分の名前と同じ参加者がいます。名前を調整してください。", "A participant has the same name as you. Please adjust.")
            return
        }
        if Set(names).count != names.count {
            error = L.t("同じ名前の参加者がいます。名前を調整してください。", "Duplicate participant names. Please adjust.")
            return
        }
        pending = true
        defer { pending = false }
        do {
            let id = try await store.create(CreateGroupPayload(
                title: title.trimmingCharacters(in: .whitespaces),
                icon: icon,
                currency: currency,
                myName: me.isEmpty ? nil : me,
                participants: names
            ))
            dismiss()
            onCreated(id)
        } catch let e as APIError {
            error = e.message(L)
        } catch {
            self.error = L.t("作成に失敗しました", "Failed to create")
        }
    }
}

struct EmojiPickerView: View {
    @Environment(AppSettings.self) private var settings
    @Environment(\.dismiss) private var dismiss
    @Binding var selected: String
    @State private var category = GroupIcons.groups[0].key

    private let columns = Array(repeating: GridItem(.flexible(), spacing: 8), count: 6)

    var body: some View {
        let L = settings.lang
        NavigationStack {
            VStack(spacing: 12) {
                Picker("", selection: $category) {
                    ForEach(GroupIcons.groups) { Text(L.t($0.ja, $0.en)).tag($0.key) }
                }
                .pickerStyle(.segmented)
                .padding(.horizontal)
                ScrollView {
                    LazyVGrid(columns: columns, spacing: 8) {
                        ForEach(GroupIcons.groups.first { $0.key == category }?.items ?? [], id: \.self) { emoji in
                            Button {
                                selected = emoji
                                dismiss()
                            } label: {
                                Text(emoji)
                                    .font(.system(size: 28))
                                    .frame(maxWidth: .infinity, minHeight: 52)
                                    .background(RoundedRectangle(cornerRadius: 14).fill(selected == emoji ? Color.ffAccentSoft : Color.white))
                                    .overlay(RoundedRectangle(cornerRadius: 14).stroke(selected == emoji ? Color.ffAccent : Color.ffStroke, lineWidth: 2))
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding()
                }
            }
            .screenBackground()
            .navigationTitle(L.t("アイコンを選択", "Pick an icon"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .topBarTrailing) { Button(L.t("閉じる", "Close")) { dismiss() } } }
        }
        .presentationDetents([.medium, .large])
    }
}
