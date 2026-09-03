import AuthenticationServices
import CryptoKit
import Foundation
import UIKit

/// "Sign in with Google" without the Firebase / GoogleSignIn SDKs:
/// OAuth 2.0 authorization-code flow with PKCE in ASWebAuthenticationSession,
/// then the resulting Google ID token is exchanged for a Firebase session
/// via `accounts:signInWithIdp` (see AuthService.signInWithGoogle).
///
/// Requires an iOS OAuth client ID for the Firebase project (GOOGLE_IOS_CLIENT_ID in Secrets.xcconfig).
@MainActor
final class GoogleSignInCoordinator: NSObject, ASWebAuthenticationPresentationContextProviding {
    struct Tokens {
        let idToken: String
        let accessToken: String?
    }

    static var isConfigured: Bool { !AppConfig.googleIOSClientID.isEmpty }

    private var session: ASWebAuthenticationSession?

    func signIn() async throws -> Tokens {
        let clientID = AppConfig.googleIOSClientID
        guard !clientID.isEmpty else { throw AuthError(code: "GOOGLE_NOT_CONFIGURED") }

        // 123-abc.apps.googleusercontent.com -> com.googleusercontent.apps.123-abc
        let scheme = clientID.split(separator: ".").reversed().joined(separator: ".")
        let redirectURI = "\(scheme):/oauth2redirect"
        let verifier = Self.randomString(64)
        let state = Self.randomString(24)

        var components = URLComponents(string: "https://accounts.google.com/o/oauth2/v2/auth")!
        components.queryItems = [
            URLQueryItem(name: "client_id", value: clientID),
            URLQueryItem(name: "redirect_uri", value: redirectURI),
            URLQueryItem(name: "response_type", value: "code"),
            URLQueryItem(name: "scope", value: "openid email profile"),
            URLQueryItem(name: "code_challenge", value: Self.s256(verifier)),
            URLQueryItem(name: "code_challenge_method", value: "S256"),
            URLQueryItem(name: "state", value: state),
            URLQueryItem(name: "prompt", value: "select_account")
        ]
        guard let authURL = components.url else { throw AuthError(code: "GOOGLE_BAD_URL") }

        let callback: URL = try await withCheckedThrowingContinuation { continuation in
            let session = ASWebAuthenticationSession(url: authURL, callbackURLScheme: scheme) { url, error in
                if let error {
                    if let e = error as? ASWebAuthenticationSessionError, e.code == .canceledLogin {
                        continuation.resume(throwing: AuthError(code: "CANCELLED"))
                    } else {
                        continuation.resume(throwing: AuthError(code: "GOOGLE_AUTH_FAILED"))
                    }
                    return
                }
                guard let url else {
                    continuation.resume(throwing: AuthError(code: "GOOGLE_AUTH_FAILED"))
                    return
                }
                continuation.resume(returning: url)
            }
            session.presentationContextProvider = self
            session.prefersEphemeralWebBrowserSession = false
            self.session = session
            if !session.start() {
                continuation.resume(throwing: AuthError(code: "GOOGLE_AUTH_FAILED"))
            }
        }
        session = nil

        let items = URLComponents(url: callback, resolvingAgainstBaseURL: false)?.queryItems ?? []
        guard items.first(where: { $0.name == "state" })?.value == state,
              let code = items.first(where: { $0.name == "code" })?.value else {
            throw AuthError(code: items.first(where: { $0.name == "error" })?.value ?? "GOOGLE_AUTH_FAILED")
        }

        // Exchange the code for tokens (iOS OAuth clients have no client secret; PKCE protects the exchange).
        var request = URLRequest(url: URL(string: "https://oauth2.googleapis.com/token")!)
        request.httpMethod = "POST"
        request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
        request.httpBody = Self.formEncode([
            "code": code,
            "client_id": clientID,
            "redirect_uri": redirectURI,
            "grant_type": "authorization_code",
            "code_verifier": verifier
        ]).data(using: .utf8)
        let (data, response) = try await URLSession.shared.data(for: request)
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        struct TokenBody: Decodable {
            var id_token: String?
            var access_token: String?
            var error: String?
            var error_description: String?
        }
        let body = try JSONDecoder().decode(TokenBody.self, from: data)
        guard (200..<300).contains(status), let idToken = body.id_token else {
            throw AuthError(code: body.error ?? "GOOGLE_TOKEN_FAILED")
        }
        return Tokens(idToken: idToken, accessToken: body.access_token)
    }

    // MARK: ASWebAuthenticationPresentationContextProviding

    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
        return scenes.flatMap(\.windows).first { $0.isKeyWindow } ?? scenes.first?.windows.first ?? ASPresentationAnchor()
    }

    // MARK: Helpers

    private static func randomString(_ length: Int) -> String {
        let chars = Array("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~")
        return String((0..<length).map { _ in chars.randomElement()! })
    }

    private static func s256(_ verifier: String) -> String {
        let digest = SHA256.hash(data: Data(verifier.utf8))
        return Data(digest).base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")
    }

    private static func formEncode(_ params: [String: String]) -> String {
        var allowed = CharacterSet.alphanumerics
        allowed.insert(charactersIn: "-._~")
        return params.map { key, value in
            "\(key)=\(value.addingPercentEncoding(withAllowedCharacters: allowed) ?? value)"
        }.joined(separator: "&")
    }
}
