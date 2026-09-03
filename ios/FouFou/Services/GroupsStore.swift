import Foundation

@Observable
@MainActor
final class GroupsStore {
    var groups: [GroupSummary] = []
    var plan: Plan = .free
    var pendingTransfers: [PendingTransfer] = []
    var isLoading = false
    var hasLoaded = false
    var error: APIError?

    private let api = APIClient.shared

    var active: [GroupSummary] { groups.filter { !$0.isArchived } }
    var archived: [GroupSummary] { groups.filter { $0.isArchived } }

    func load() async {
        if groups.isEmpty { isLoading = true }
        error = nil
        do {
            let r: GroupsResponse = try await api.get("/api/groups")
            groups = r.groups
            plan = r.plan ?? .free
            hasLoaded = true
        } catch let e as APIError {
            error = e
        } catch {
            self.error = APIError(code: "UNKNOWN", status: 0)
        }
        isLoading = false
        if let p: PendingTransfersResponse = try? await api.get("/api/ownership/pending") {
            pendingTransfers = p.transfers
        }
    }

    func create(_ payload: CreateGroupPayload) async throws -> String {
        let r: IdResponse = try await api.post("/api/groups", body: payload)
        await load()
        return r.id
    }

    func setArchived(_ group: GroupSummary, _ archived: Bool) async throws {
        let status = archived ? "archived" : "active"
        let _: OkResponse = try await api.patch("/api/groups/\(group.id)/settings", body: GroupSettingsPayload(status: status))
        if let i = groups.firstIndex(where: { $0.id == group.id }) {
            groups[i].status = status
        }
    }

    func delete(_ group: GroupSummary) async throws {
        let _: OkResponse = try await api.delete("/api/groups/\(group.id)")
        groups.removeAll { $0.id == group.id }
    }

    func duplicate(_ group: GroupSummary) async throws -> String {
        let r: IdResponse = try await api.post("/api/groups/\(group.id)/duplicate")
        await load()
        return r.id
    }

    func acceptTransfer(_ transfer: PendingTransfer) async throws {
        let _: OkResponse = try await api.post("/api/ownership/accept", body: ["transferId": transfer.id])
        await load()
    }
}
