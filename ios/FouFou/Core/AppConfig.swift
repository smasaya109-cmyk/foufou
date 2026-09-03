import Foundation

/// Values come from Config/Secrets.xcconfig via Info.plist.
enum AppConfig {
    private static func string(_ key: String) -> String? {
        guard let value = Bundle.main.object(forInfoDictionaryKey: key) as? String,
              !value.isEmpty, !value.hasPrefix("$(") else { return nil }
        return value
    }

    /// Base URL of the existing Next.js API (e.g. https://foufou.jp).
    static var apiBaseURL: URL {
        URL(string: string("API_BASE_URL") ?? "https://foufou.jp")!
    }

    /// Base URL of the web app, used for share links and billing pages.
    static var webBaseURL: URL {
        URL(string: string("WEB_BASE_URL") ?? "https://foufou.jp")!
    }

    static var firebaseAPIKey: String { string("FIREBASE_API_KEY") ?? "" }
    static var firebaseStorageBucket: String { string("FIREBASE_STORAGE_BUCKET") ?? "" }
    /// iOS OAuth client ID (…apps.googleusercontent.com) for "Sign in with Google". Empty = button hidden.
    static var googleIOSClientID: String { string("GOOGLE_IOS_CLIENT_ID") ?? "" }
}
