import Foundation

@Observable
@MainActor
final class GroupStore {
    let groupId: String

    var detail: GroupDetail?
    var entitlements: Entitlements?
    var expenses: [Expense] = []
    var settlement: SettlementPayload?
    var settlementLoading = false
    var editors: [Editor] = []
    var photos: [Photo] = []
    var isLoading = false
    var error: APIError?

    private let api = APIClient.shared

    init(groupId: String) {
        self.groupId = groupId
    }

    // MARK: Derived

    var members: [Member] { detail?.members ?? [] }
    var currency: String { detail?.currency ?? "JPY" }
    var title: String { (detail?.title?.isEmpty == false) ? detail!.title! : "—" }
    var icon: String { detail?.icon ?? "🧳" }
    var canUsePro: Bool { entitlements?.canUsePremium ?? false }
    var canUsePhotos: Bool { entitlements?.canUsePhotos ?? false }
    var planLabel: String { entitlements?.label ?? "Free" }
    var currentUserId: String? { AuthService.shared.userId }
    var isOwner: Bool {
        guard let owner = detail?.ownerUserId, let me = currentUserId else { return false }
        return owner == me
    }
    var myMember: Member? { members.first { $0.userId == currentUserId } }
    /// Best-effort: the server is the source of truth (requireGroupEdit) and returns FORBIDDEN otherwise.
    var canEdit: Bool { isOwner || myMember?.role == "member" }
    var isArchived: Bool { detail?.status == "archived" }

    var shareURL: URL? {
        guard let token = detail?.shareToken, !token.isEmpty else { return nil }
        return AppConfig.webBaseURL.appending(path: "share/\(token)")
    }

    func name(_ userId: String) -> String {
        members.first { $0.userId == userId }?.displayName ?? userId
    }

    // MARK: Loading

    func load() async {
        if detail == nil { isLoading = true }
        error = nil
        do {
            let r: GroupDetailResponse = try await api.get("/api/groups/\(groupId)", query: [URLQueryItem(name: "include", value: "expenses")])
            detail = r.group
            entitlements = r.entitlements
            expenses = r.expenses ?? []
        } catch let e as APIError {
            error = e
        } catch {
            self.error = APIError(code: "UNKNOWN", status: 0)
        }
        isLoading = false
    }

    // MARK: Expenses

    func saveExpense(_ payload: ExpensePayload, editing: Expense?) async throws {
        if let editing {
            let _: OkResponse = try await api.patch("/api/expenses/\(editing.id)", body: payload)
        } else {
            let _: IdResponse = try await api.post("/api/groups/\(groupId)/expenses", body: payload)
        }
        await load()
        settlement = nil // recomputed from the saved data when the settlement tab opens
    }

    func deleteExpense(_ expense: Expense) async throws {
        let _: OkResponse = try await api.delete("/api/expenses/\(expense.id)")
        expenses.removeAll { $0.id == expense.id }
        settlement = nil
    }

    func duplicateExpense(_ expense: Expense) async throws {
        let _: IdResponse = try await api.post("/api/expenses/\(expense.id)/duplicate")
        await load()
        settlement = nil
    }

    // MARK: Settlement

    func loadSettlement() async {
        settlementLoading = settlement == nil
        defer { settlementLoading = false }
        do {
            try await computeSettlement()
        } catch {
            // Fall back to the last stored version (e.g. offline / viewer without compute rights).
            if let r: SettlementLatestResponse = try? await api.get("/api/groups/\(groupId)/settlements/latest"),
               let payload = r.settlement?.payloadJson {
                settlement = payload
            }
        }
    }

    func computeSettlement() async throws {
        let r: SettlementComputeResponse = try await api.post("/api/groups/\(groupId)/settlements/compute")
        settlement = SettlementPayload(balances: r.balances, transfers: r.transfers)
    }

    // MARK: Members

    func addLocalMember(name: String) async throws {
        let _: IdResponse = try await api.post("/api/groups/\(groupId)/local-members", body: ["name": name])
        await load()
    }

    func renameMember(userId: String, name: String) async throws {
        let _: OkResponse = try await api.patch("/api/groups/\(groupId)/members", body: ["userId": userId, "name": name])
        if var d = detail, let i = d.members?.firstIndex(where: { $0.userId == userId }) {
            d.members?[i].name = name
            detail = d
        }
    }

    func removeMember(userId: String) async throws {
        let _: OkResponse = try await api.delete("/api/groups/\(groupId)/members", body: ["userId": userId])
        await load()
    }

    func loadEditors() async {
        guard isOwner else { return }
        if let r: EditorsResponse = try? await api.get("/api/groups/\(groupId)/editors") {
            editors = r.editors
        }
    }

    func addEditor(email: String) async throws {
        struct R: Decodable { var ok: Bool?; var userId: String? }
        let _: R = try await api.post("/api/groups/\(groupId)/editors", body: ["email": email])
        await loadEditors()
        await load()
    }

    func removeEditor(userId: String) async throws {
        let _: OkResponse = try await api.delete("/api/groups/\(groupId)/editors", body: ["userId": userId])
        await loadEditors()
    }

    func requestOwnershipTransfer(toUserId: String) async throws {
        let _: IdResponse = try await api.post("/api/groups/\(groupId)/ownership/transfer", body: ["toUserId": toUserId])
    }

    // MARK: Settings

    func updateSettings(_ payload: GroupSettingsPayload) async throws {
        let _: OkResponse = try await api.patch("/api/groups/\(groupId)/settings", body: payload)
        await load()
    }

    func rotateShareToken() async throws {
        let r: ShareRotateResponse = try await api.post("/api/groups/\(groupId)/share/rotate")
        detail?.shareToken = r.shareToken
    }

    func deleteGroup() async throws {
        let _: OkResponse = try await api.delete("/api/groups/\(groupId)")
    }

    func exportCSV() async throws -> URL {
        let data = try await api.download("/api/groups/\(groupId)/exports/csv")
        let url = FileManager.default.temporaryDirectory.appending(path: "foufou-expenses-\(groupId).csv")
        try data.write(to: url, options: .atomic)
        return url
    }

    // MARK: Photos

    func loadPhotos() async {
        if let r: PhotosResponse = try? await api.get("/api/groups/\(groupId)/photos") {
            photos = r.photos
        }
    }

    func uploadPhoto(data: Data, fileName: String, contentType: String) async throws {
        let url = try await StorageService.uploadPhoto(groupId: groupId, data: data, fileName: fileName, contentType: contentType)
        let _: IdResponse = try await api.post("/api/groups/\(groupId)/photos", body: ["url": url.absoluteString, "name": fileName])
        await loadPhotos()
    }
}
