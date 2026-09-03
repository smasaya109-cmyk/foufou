import Foundation

/// Firebase Authentication via the Identity Toolkit REST API (no Firebase SDK needed).
/// The resulting ID token is sent as `Authorization: Bearer` to the existing Next.js API,
/// which verifies it with firebase-admin (see src/lib/auth.ts).
struct AuthSession: Codable, Equatable {
    var idToken: String
    var refreshToken: String
    var expiresAt: Date
    var userId: String
    var email: String?
    var displayName: String?
}

struct AuthError: LocalizedError, Equatable {
    let code: String
    var errorDescription: String? { code }

    func message(_ lang: Lang) -> String {
        switch code {
        case "INVALID_LOGIN_CREDENTIALS", "INVALID_PASSWORD", "EMAIL_NOT_FOUND", "INVALID_EMAIL":
            return lang.t("メールアドレスまたはパスワードが正しくありません。", "Incorrect email or password.")
        case "EMAIL_EXISTS":
            return lang.t("このメールアドレスは既に登録されています。", "This email is already registered.")
        case "TOO_MANY_ATTEMPTS_TRY_LATER":
            return lang.t("試行回数が多すぎます。しばらくしてからお試しください。", "Too many attempts. Please try again later.")
        case "USER_DISABLED":
            return lang.t("このアカウントは無効化されています。", "This account has been disabled.")
        case "AUTH_REQUIRED":
            return lang.t("ログインが必要です", "Login required")
        case "GOOGLE_NOT_CONFIGURED":
            return lang.t("Googleログインが未設定です（GOOGLE_IOS_CLIENT_ID）。", "Google sign-in is not configured (GOOGLE_IOS_CLIENT_ID).")
        case "GOOGLE_AUTH_FAILED", "GOOGLE_TOKEN_FAILED", "access_denied", "invalid_grant", "invalid_client":
            return lang.t("Googleログインに失敗しました (\(code))", "Google login failed (\(code))")
        case "FEDERATED_USER_ID_ALREADY_LINKED", "EMAIL_EXISTS_WITH_DIFFERENT_CREDENTIAL":
            return lang.t("このメールアドレスは別のログイン方法で登録されています。", "This email is registered with a different sign-in method.")
        case "MISSING_API_KEY":
            return lang.t("Firebase API キーが設定されていません（Config/Secrets.xcconfig）。", "Firebase API key is not configured (Config/Secrets.xcconfig).")
        default:
            if code.hasPrefix("WEAK_PASSWORD") {
                return lang.t("パスワードは6文字以上にしてください。", "Password should be at least 6 characters.")
            }
            return lang.t("認証に失敗しました (\(code))", "Authentication failed (\(code))")
        }
    }
}

@Observable
@MainActor
final class AuthService {
    static let shared = AuthService()

    private(set) var session: AuthSession?
    private let keychainKey = "auth.session"
    private var refreshTask: Task<String, Error>?

    var isSignedIn: Bool { session != nil }
    var userId: String? { session?.userId }

    init() {
        session = KeychainStore.load(AuthSession.self, key: keychainKey)
    }

    // MARK: Public API

    func signIn(email: String, password: String) async throws {
        let r: TokenResponse = try await identity("accounts:signInWithPassword", [
            "email": email, "password": password, "returnSecureToken": true
        ])
        apply(r)
    }

    func signUp(email: String, password: String, name: String) async throws {
        let r: TokenResponse = try await identity("accounts:signUp", [
            "email": email, "password": password, "returnSecureToken": true
        ])
        apply(r)
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        if !trimmed.isEmpty {
            // Re-issue the token so the `name` claim is present on the first API call
            // (src/lib/auth.ts copies decoded.name into users/{uid} on first contact).
            let updated: TokenResponse = try await identity("accounts:update", [
                "idToken": r.idToken, "displayName": trimmed, "returnSecureToken": true
            ])
            var merged = updated
            if merged.refreshToken == nil { merged.refreshToken = r.refreshToken }
            merged.displayName = trimmed
            merged.localId = merged.localId ?? r.localId
            merged.email = merged.email ?? r.email
            apply(merged)
        }
    }

    /// Exchange a Google ID token (from GoogleSignInCoordinator) for a Firebase session.
    func signInWithGoogle(idToken: String, accessToken: String? = nil) async throws {
        var postBody = "id_token=\(idToken)&providerId=google.com"
        if let accessToken { postBody += "&access_token=\(accessToken)" }
        let r: TokenResponse = try await identity("accounts:signInWithIdp", [
            "postBody": postBody,
            "requestUri": "http://localhost",
            "returnIdpCredential": true,
            "returnSecureToken": true
        ])
        apply(r)
    }

    func sendPasswordReset(email: String) async throws {
        let _: EmptyResponse = try await identity("accounts:sendOobCode", [
            "requestType": "PASSWORD_RESET", "email": email
        ])
    }

    func updateDisplayName(_ name: String) async throws {
        let token = try await validIdToken()
        let updated: TokenResponse = try await identity("accounts:update", [
            "idToken": token, "displayName": name, "returnSecureToken": true
        ])
        var merged = updated
        merged.displayName = name
        if merged.refreshToken == nil { merged.refreshToken = session?.refreshToken }
        merged.localId = merged.localId ?? session?.userId
        merged.email = merged.email ?? session?.email
        apply(merged)
    }

    func refreshProfile() async {
        guard let token = try? await validIdToken() else { return }
        struct Lookup: Decodable {
            struct User: Decodable { var localId: String?; var email: String?; var displayName: String? }
            var users: [User]?
        }
        guard let r: Lookup = try? await identity("accounts:lookup", ["idToken": token]),
              let user = r.users?.first, var current = session else { return }
        current.email = user.email ?? current.email
        current.displayName = user.displayName ?? current.displayName
        session = current
        KeychainStore.save(current, key: keychainKey)
    }

    func signOut() {
        session = nil
        refreshTask = nil
        KeychainStore.delete(key: keychainKey)
    }

    /// Returns a non-expired ID token, refreshing it when needed.
    func validIdToken(force: Bool = false) async throws -> String {
        guard let current = session else { throw AuthError(code: "AUTH_REQUIRED") }
        if !force, current.expiresAt.timeIntervalSinceNow > 60 {
            return current.idToken
        }
        if let task = refreshTask { return try await task.value }
        let task = Task<String, Error> { [refreshToken = current.refreshToken] in
            try await self.refresh(refreshToken: refreshToken)
        }
        refreshTask = task
        defer { refreshTask = nil }
        return try await task.value
    }

    // MARK: Internals

    private struct TokenResponse: Decodable {
        var idToken: String
        var refreshToken: String?
        var expiresIn: String?
        var localId: String?
        var email: String?
        var displayName: String?
    }

    private struct EmptyResponse: Decodable {}

    private func apply(_ r: TokenResponse) {
        let ttl = Double(r.expiresIn ?? "3600") ?? 3600
        let next = AuthSession(
            idToken: r.idToken,
            refreshToken: r.refreshToken ?? session?.refreshToken ?? "",
            expiresAt: Date().addingTimeInterval(ttl),
            userId: r.localId ?? session?.userId ?? "",
            email: r.email ?? session?.email,
            displayName: r.displayName ?? session?.displayName
        )
        session = next
        KeychainStore.save(next, key: keychainKey)
    }

    private func refresh(refreshToken: String) async throws -> String {
        let key = AppConfig.firebaseAPIKey
        guard !key.isEmpty else { throw AuthError(code: "MISSING_API_KEY") }
        var req = URLRequest(url: URL(string: "https://securetoken.googleapis.com/v1/token?key=\(key)")!)
        req.httpMethod = "POST"
        req.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
        req.httpBody = "grant_type=refresh_token&refresh_token=\(refreshToken)".data(using: .utf8)
        let (data, response) = try await URLSession.shared.data(for: req)
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        guard (200..<300).contains(status) else {
            let code = Self.errorCode(from: data)
            if status == 400 || status == 401 {
                // Refresh token revoked/expired: force a fresh login.
                signOut()
                throw AuthError(code: "AUTH_REQUIRED")
            }
            throw AuthError(code: code)
        }
        struct R: Decodable {
            var id_token: String
            var refresh_token: String
            var expires_in: String
            var user_id: String?
        }
        let r = try JSONDecoder().decode(R.self, from: data)
        var next = session ?? AuthSession(idToken: "", refreshToken: "", expiresAt: .distantPast, userId: r.user_id ?? "")
        next.idToken = r.id_token
        next.refreshToken = r.refresh_token
        next.expiresAt = Date().addingTimeInterval(Double(r.expires_in) ?? 3600)
        if let uid = r.user_id { next.userId = uid }
        session = next
        KeychainStore.save(next, key: keychainKey)
        return r.id_token
    }

    private func identity<T: Decodable>(_ method: String, _ body: [String: Any]) async throws -> T {
        let key = AppConfig.firebaseAPIKey
        guard !key.isEmpty else { throw AuthError(code: "MISSING_API_KEY") }
        var req = URLRequest(url: URL(string: "https://identitytoolkit.googleapis.com/v1/\(method)?key=\(key)")!)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try JSONSerialization.data(withJSONObject: body)
        let (data, response) = try await URLSession.shared.data(for: req)
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        guard (200..<300).contains(status) else {
            throw AuthError(code: Self.errorCode(from: data))
        }
        if T.self == EmptyResponse.self { return EmptyResponse() as! T }
        return try JSONDecoder().decode(T.self, from: data)
    }

    private static func errorCode(from data: Data) -> String {
        if let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
           let error = obj["error"] as? [String: Any] {
            if let message = error["message"] as? String { return message }
            if let message = error["error"] as? String { return message }
        }
        return "UNKNOWN"
    }
}
