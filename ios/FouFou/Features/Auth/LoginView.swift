import SwiftUI

struct LoginView: View {
    @Environment(AuthService.self) private var auth
    @Environment(AppSettings.self) private var settings

    @State private var email = ""
    @State private var password = ""
    @State private var error: String?
    @State private var pending = false
    @State private var showReset = false
    @State private var resetEmail = ""
    @State private var resetSent = false

    var body: some View {
        let L = settings.lang
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    Image("Mascot")
                        .resizable()
                        .scaledToFit()
                        .frame(width: 120, height: 120)
                        .padding(.top, 24)

                    VStack(alignment: .leading, spacing: 14) {
                        SectionTitle(L.t("ログイン", "Log in"), size: 26)
                        MutedText(L.t("旅行の精算を続けましょう。", "Continue splitting your trip."))

                        GoogleSignInButton(label: L.t("Googleでログイン", "Continue with Google")) { message in
                            error = message
                        }
                        OrDivider()

                        TextField("Email", text: $email)
                            .keyboardType(.emailAddress)
                            .textContentType(.emailAddress)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .softField()
                        SecureField("Password", text: $password)
                            .textContentType(.password)
                            .softField()

                        if let error {
                            ErrorBanner(message: error)
                        }

                        Button {
                            Task { await submit() }
                        } label: {
                            Text(pending ? L.t("ログイン中...", "Logging in...") : L.t("ログイン", "Log in"))
                        }
                        .buttonStyle(PrimaryButtonStyle(fullWidth: true))
                        .disabled(pending || email.isEmpty || password.isEmpty)

                        Button(L.t("パスワードをお忘れですか？", "Forgot password?")) {
                            resetEmail = email
                            resetSent = false
                            showReset = true
                        }
                        .font(.system(size: 13))
                        .foregroundStyle(Color.ffInkMuted)

                        HStack(spacing: 4) {
                            MutedText(L.t("初めての方は", "New here?"))
                            NavigationLink(L.t("新規登録", "Sign up")) { SignupView() }
                                .font(.system(size: 13, weight: .semibold))
                        }
                        .padding(.top, 4)
                    }
                    .card(padding: 22)

                    LanguageToggle()
                }
                .padding(20)
            }
            .screenBackground()
            .alert(L.t("パスワード再設定", "Reset password"), isPresented: $showReset) {
                TextField("Email", text: $resetEmail)
                    .textInputAutocapitalization(.never)
                    .keyboardType(.emailAddress)
                Button(L.t("送信", "Send")) {
                    Task {
                        do {
                            try await auth.sendPasswordReset(email: resetEmail)
                            resetSent = true
                        } catch {
                            self.error = (error as? AuthError)?.message(L) ?? error.localizedDescription
                        }
                    }
                }
                Button(L.t("キャンセル", "Cancel"), role: .cancel) {}
            } message: {
                Text(L.t("再設定用のメールを送信します。", "We will email you a reset link."))
            }
            .alert(L.t("送信しました", "Email sent"), isPresented: $resetSent) {
                Button("OK") {}
            } message: {
                Text(L.t("メールをご確認ください。", "Please check your inbox."))
            }
        }
    }

    private func submit() async {
        error = nil
        pending = true
        defer { pending = false }
        do {
            try await auth.signIn(email: email.trimmingCharacters(in: .whitespaces), password: password)
        } catch let e as AuthError {
            error = e.message(settings.lang)
        } catch {
            self.error = settings.lang.t("ログインに失敗しました", "Failed to log in")
        }
    }
}

struct GoogleSignInButton: View {
    @Environment(AuthService.self) private var auth
    @Environment(AppSettings.self) private var settings
    let label: String
    var onError: (String) -> Void
    @State private var pending = false
    @State private var coordinator = GoogleSignInCoordinator()

    var body: some View {
        Button {
            Task { await run() }
        } label: {
            HStack(spacing: 8) {
                Image(systemName: "g.circle.fill").font(.system(size: 18))
                Text(pending ? settings.lang.t("認証中...", "Signing in...") : label)
            }
        }
        .buttonStyle(OutlineButtonStyle(fullWidth: true))
        .disabled(pending || !GoogleSignInCoordinator.isConfigured)
        .overlay(alignment: .bottom) {
            if !GoogleSignInCoordinator.isConfigured {
                MutedText(settings.lang.t("（GOOGLE_IOS_CLIENT_ID が未設定）", "(GOOGLE_IOS_CLIENT_ID not set)"), size: 10)
                    .offset(y: 16)
            }
        }
        .padding(.bottom, GoogleSignInCoordinator.isConfigured ? 0 : 12)
    }

    private func run() async {
        pending = true
        defer { pending = false }
        do {
            let tokens = try await coordinator.signIn()
            try await auth.signInWithGoogle(idToken: tokens.idToken, accessToken: tokens.accessToken)
        } catch let e as AuthError {
            if e.code != "CANCELLED" { onError(e.message(settings.lang)) }
        } catch {
            onError(settings.lang.t("Googleログインに失敗しました", "Google login failed"))
        }
    }
}

struct OrDivider: View {
    var body: some View {
        HStack(spacing: 10) {
            Rectangle().fill(Color.ffStroke).frame(height: 1)
            Text("or").font(.system(size: 11)).foregroundStyle(Color.ffInkMuted)
            Rectangle().fill(Color.ffStroke).frame(height: 1)
        }
    }
}

struct LanguageToggle: View {
    @Environment(AppSettings.self) private var settings

    var body: some View {
        @Bindable var settings = settings
        Picker("Language", selection: $settings.lang) {
            ForEach(Lang.allCases) { lang in
                Text(lang.label).tag(lang)
            }
        }
        .pickerStyle(.segmented)
        .frame(maxWidth: 220)
    }
}
