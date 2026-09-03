import SwiftUI

struct SignupView: View {
    @Environment(AuthService.self) private var auth
    @Environment(AppSettings.self) private var settings
    @Environment(\.dismiss) private var dismiss

    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var error: String?
    @State private var pending = false

    var body: some View {
        let L = settings.lang
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                SectionTitle(L.t("アカウント作成", "Create account"), size: 26)
                MutedText(L.t("無料で始められます。", "Start for free."))

                GoogleSignInButton(label: L.t("Googleで登録", "Sign up with Google")) { message in
                    error = message
                }
                OrDivider()

                TextField(L.t("表示名", "Display name"), text: $name)
                    .textContentType(.name)
                    .softField()
                TextField("Email", text: $email)
                    .keyboardType(.emailAddress)
                    .textContentType(.emailAddress)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .softField()
                SecureField("Password", text: $password)
                    .textContentType(.newPassword)
                    .softField()
                MutedText(L.t("パスワードは6文字以上", "At least 6 characters"), size: 11)

                if let error {
                    ErrorBanner(message: error)
                }

                Button {
                    Task { await submit() }
                } label: {
                    Text(pending ? L.t("作成中...", "Creating...") : L.t("作成", "Create"))
                }
                .buttonStyle(PrimaryButtonStyle(fullWidth: true))
                .disabled(pending || email.isEmpty || password.count < 6)

                HStack(spacing: 4) {
                    MutedText(L.t("既にアカウントがある方は", "Already have an account?"))
                    Button(L.t("ログイン", "Log in")) { dismiss() }
                        .font(.system(size: 13, weight: .semibold))
                }
                .padding(.top, 4)

                MutedText(
                    L.t("作成すると利用規約とプライバシーポリシーに同意したものとみなされます。",
                        "By creating an account you agree to the Terms and Privacy Policy."),
                    size: 11
                )
            }
            .card(padding: 22)
            .padding(20)
        }
        .screenBackground()
        .navigationTitle(L.t("新規登録", "Sign up"))
        .navigationBarTitleDisplayMode(.inline)
    }

    private func submit() async {
        error = nil
        pending = true
        defer { pending = false }
        do {
            try await auth.signUp(email: email.trimmingCharacters(in: .whitespaces), password: password, name: name)
        } catch let e as AuthError {
            error = e.message(settings.lang)
        } catch {
            self.error = settings.lang.t("登録に失敗しました", "Failed to sign up")
        }
    }
}
