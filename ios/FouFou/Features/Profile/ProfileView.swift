import SwiftUI

struct ProfileView: View {
    @Environment(AppSettings.self) private var settings
    @Environment(AuthService.self) private var auth
    @Environment(GroupsStore.self) private var groupsStore
    @Environment(\.openURL) private var openURL

    @State private var name = ""
    @State private var saving = false
    @State private var saved = false
    @State private var error: String?
    @State private var confirmSignOut = false

    var body: some View {
        let L = settings.lang
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    HStack(spacing: 14) {
                        Image("Mascot").resizable().scaledToFit().frame(width: 64, height: 64)
                        VStack(alignment: .leading, spacing: 4) {
                            Text(auth.session?.displayName?.isEmpty == false ? auth.session!.displayName! : L.t("名前未設定", "No name set"))
                                .font(.system(size: 18, weight: .heavy)).foregroundStyle(Color.ffInkStrong)
                            MutedText(auth.session?.email ?? "")
                            Pill(text: groupsStore.plan.label, background: groupsStore.plan.isPaid ? .ffAccentSoft : .ffPillBg, foreground: groupsStore.plan.isPaid ? .ffAccentStrong : .ffInkStrong)
                        }
                        Spacer(minLength: 0)
                    }
                    .card(padding: 20)

                    VStack(alignment: .leading, spacing: 10) {
                        Text(L.t("プロフィール", "Profile")).font(.system(size: 15, weight: .bold))
                        FieldLabel(L.t("表示名", "Display name"))
                        HStack(spacing: 8) {
                            TextField(L.t("表示名", "Display name"), text: $name).softField()
                            Button(saving ? L.t("保存中...", "Saving...") : L.t("保存", "Save")) {
                                Task { await saveName() }
                            }
                            .buttonStyle(PrimaryButtonStyle(compact: true))
                            .disabled(saving || name.trimmingCharacters(in: .whitespaces).isEmpty)
                        }
                        if saved { MutedText(L.t("更新しました", "Updated"), size: 12) }
                        if let error { ErrorBanner(message: error) }
                    }
                    .card()

                    VStack(alignment: .leading, spacing: 10) {
                        Text(L.t("言語", "Language")).font(.system(size: 15, weight: .bold))
                        LanguageToggle()
                    }
                    .card()

                    VStack(alignment: .leading, spacing: 10) {
                        Text(L.t("プランと課金", "Plan & billing")).font(.system(size: 15, weight: .bold))
                        MutedText(L.t("プランの購入・変更・解約はWebで行えます。", "Purchase, change or cancel your plan on the web."), size: 12)
                        HStack(spacing: 8) {
                            Button(L.t("料金プランを見る", "See plans")) {
                                openURL(AppConfig.webBaseURL.appending(path: "app/subscription"))
                            }
                            .buttonStyle(OutlineButtonStyle(compact: true))
                            if groupsStore.plan.isPaid {
                                Button(L.t("課金を管理", "Manage billing")) {
                                    openURL(AppConfig.webBaseURL.appending(path: "app/billing"))
                                }
                                .buttonStyle(OutlineButtonStyle(compact: true))
                            }
                        }
                    }
                    .card()

                    VStack(alignment: .leading, spacing: 10) {
                        Text(L.t("その他", "More")).font(.system(size: 15, weight: .bold))
                        HStack(spacing: 8) {
                            Button(L.t("ガイド", "Guide")) { openURL(AppConfig.webBaseURL.appending(path: "app/description")) }
                                .buttonStyle(OutlineButtonStyle(compact: true))
                            Button(L.t("利用規約", "Terms")) { openURL(AppConfig.webBaseURL.appending(path: "terms")) }
                                .buttonStyle(OutlineButtonStyle(compact: true))
                            Button(L.t("プライバシー", "Privacy")) { openURL(AppConfig.webBaseURL.appending(path: "privacy")) }
                                .buttonStyle(OutlineButtonStyle(compact: true))
                        }
                    }
                    .card()

                    Button(L.t("ログアウト", "Log out")) { confirmSignOut = true }
                        .buttonStyle(OutlineButtonStyle(fullWidth: true, tint: .ffDanger))

                    MutedText("FouFou iOS \(Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "")", size: 11)
                        .frame(maxWidth: .infinity)
                }
                .padding(20)
            }
            .screenBackground()
            .navigationTitle(L.t("アカウント", "Account"))
            .navigationBarTitleDisplayMode(.inline)
            .onAppear { name = auth.session?.displayName ?? "" }
            .task { await auth.refreshProfile(); name = auth.session?.displayName ?? "" }
            .alert(L.t("ログアウトしますか？", "Log out?"), isPresented: $confirmSignOut) {
                Button(L.t("ログアウト", "Log out"), role: .destructive) { auth.signOut() }
                Button(L.t("キャンセル", "Cancel"), role: .cancel) {}
            }
        }
    }

    private func saveName() async {
        saving = true
        saved = false
        error = nil
        defer { saving = false }
        do {
            try await auth.updateDisplayName(name.trimmingCharacters(in: .whitespaces))
            saved = true
        } catch let e as AuthError {
            error = e.message(settings.lang)
        } catch {
            self.error = settings.lang.t("更新に失敗しました", "Failed to update")
        }
    }
}
