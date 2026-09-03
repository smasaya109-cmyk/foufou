import Foundation

/// Uploads photos to Firebase Storage over REST, matching the path the web app uses
/// (`groups/{groupId}/photos/{timestamp}-{name}`) and returning a download URL.
enum StorageService {
    struct UploadError: LocalizedError {
        let message: String
        var errorDescription: String? { message }
    }

    static func uploadPhoto(groupId: String, data: Data, fileName: String, contentType: String) async throws -> URL {
        let bucket = AppConfig.firebaseStorageBucket
        guard !bucket.isEmpty else { throw UploadError(message: "FIREBASE_STORAGE_BUCKET not configured") }
        let token = try await AuthService.shared.validIdToken()
        let objectPath = "groups/\(groupId)/photos/\(Int(Date().timeIntervalSince1970 * 1000))-\(fileName)"
        let encodedPath = objectPath.addingPercentEncoding(withAllowedCharacters: .alphanumerics) ?? objectPath

        var request = URLRequest(url: URL(string: "https://firebasestorage.googleapis.com/v0/b/\(bucket)/o?uploadType=media&name=\(encodedPath)")!)
        request.httpMethod = "POST"
        request.setValue("Firebase \(token)", forHTTPHeaderField: "Authorization")
        request.setValue(contentType, forHTTPHeaderField: "Content-Type")

        let (body, response) = try await URLSession.shared.upload(for: request, from: data)
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        guard (200..<300).contains(status) else {
            let text = String(data: body, encoding: .utf8) ?? ""
            throw UploadError(message: "Upload failed (\(status)) \(text.prefix(200))")
        }
        struct Meta: Decodable { var name: String; var downloadTokens: String? }
        let meta = try JSONDecoder().decode(Meta.self, from: body)
        let name = meta.name.addingPercentEncoding(withAllowedCharacters: .alphanumerics) ?? meta.name
        var url = "https://firebasestorage.googleapis.com/v0/b/\(bucket)/o/\(name)?alt=media"
        if let token = meta.downloadTokens?.split(separator: ",").first {
            url += "&token=\(token)"
        }
        guard let result = URL(string: url) else { throw UploadError(message: "Bad download URL") }
        return result
    }
}
