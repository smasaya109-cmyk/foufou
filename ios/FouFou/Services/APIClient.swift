import Foundation

/// Error returned by the Next.js API (`{ error: "CODE" }`), or a transport/decoding failure.
struct APIError: LocalizedError, Equatable {
    let code: String
    let status: Int

    var errorDescription: String? { "\(code) (status \(status))" }
    var isPremiumRequired: Bool { code == "PREMIUM_REQUIRED" }
    var isAuthRequired: Bool { status == 401 || code == "AUTH_REQUIRED" || code == "UNAUTHORIZED" }
    var isForbidden: Bool { status == 403 && !isPremiumRequired }

    func message(_ lang: Lang) -> String {
        switch code {
        case "PREMIUM_REQUIRED": return lang.t("この機能はPro / Premiumで利用できます。", "This feature requires Pro / Premium.")
        case "LIMIT_REACHED": return lang.t("無料プラン上限です", "Free plan limit reached")
        case "FORBIDDEN": return lang.t("この操作を行う権限がありません。", "You do not have permission to do this.")
        case "UNAUTHORIZED", "AUTH_REQUIRED": return lang.t("ログインが必要です", "Login required")
        case "NOT_FOUND": return lang.t("見つかりませんでした", "Not found")
        case "USER_NOT_FOUND": return lang.t("そのメールアドレスのユーザーが見つかりません。", "No user with that email was found.")
        case "EDITOR_LIMIT": return lang.t("編集者は最大3名までです（Owner含む）。", "Up to 3 editors (including the owner).")
        case "SPLIT_MISMATCH": return lang.t("割り勘の合計が金額と一致しません。", "Split total does not match the amount.")
        case "INVALID_INPUT": return lang.t("入力内容を確認してください。", "Please check your input.")
        case "CANNOT_REMOVE_OWNER": return lang.t("Ownerは削除できません。", "The owner cannot be removed.")
        case "TARGET_NOT_EDITOR": return lang.t("移譲先は編集者である必要があります。", "The target must be an editor.")
        case "NETWORK": return lang.t("通信に失敗しました。接続を確認してください。", "Network error. Please check your connection.")
        case "DECODE": return lang.t("サーバーの応答を読み取れませんでした。", "Could not read the server response.")
        default: return lang.t("エラーが発生しました (\(code))", "Something went wrong (\(code))")
        }
    }
}

final class APIClient {
    static let shared = APIClient()

    private let baseURL: URL
    private let session: URLSession
    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()

    init(baseURL: URL = AppConfig.apiBaseURL, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
    }

    // MARK: Typed helpers

    func get<T: Decodable>(_ path: String, query: [URLQueryItem] = []) async throws -> T {
        try decode(await send("GET", path, query: query))
    }

    func post<T: Decodable>(_ path: String, body: (any Encodable)? = nil) async throws -> T {
        try decode(await send("POST", path, body: body))
    }

    func patch<T: Decodable>(_ path: String, body: (any Encodable)? = nil) async throws -> T {
        try decode(await send("PATCH", path, body: body))
    }

    func delete<T: Decodable>(_ path: String, body: (any Encodable)? = nil) async throws -> T {
        try decode(await send("DELETE", path, body: body))
    }

    /// Raw bytes (used for CSV export).
    func download(_ path: String) async throws -> Data {
        try await send("GET", path)
    }

    // MARK: Core

    @discardableResult
    func send(_ method: String, _ path: String, query: [URLQueryItem] = [], body: (any Encodable)? = nil, retryOnAuth: Bool = true) async throws -> Data {
        let token = try await AuthService.shared.validIdToken()
        var components = URLComponents(url: baseURL, resolvingAgainstBaseURL: false)!
        components.path = path
        components.queryItems = query.isEmpty ? nil : query
        guard let url = components.url else { throw APIError(code: "BAD_URL", status: 0) }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if let body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try encoder.encode(body)
        }

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: request)
        } catch {
            throw APIError(code: "NETWORK", status: 0)
        }
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        if (200..<300).contains(status) { return data }

        let code = Self.errorCode(from: data) ?? "REQUEST_FAILED"
        if status == 401, retryOnAuth {
            // Token may have been revoked server-side; refresh once and retry.
            _ = try await AuthService.shared.validIdToken(force: true)
            return try await send(method, path, query: query, body: body, retryOnAuth: false)
        }
        throw APIError(code: code, status: status)
    }

    private func decode<T: Decodable>(_ data: Data) throws -> T {
        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            #if DEBUG
            print("[APIClient] decode failed for \(T.self): \(error)\n\(String(data: data, encoding: .utf8) ?? "")")
            #endif
            throw APIError(code: "DECODE", status: 200)
        }
    }

    private static func errorCode(from data: Data) -> String? {
        if let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
           let error = obj["error"] as? String {
            return error
        }
        return nil
    }
}
