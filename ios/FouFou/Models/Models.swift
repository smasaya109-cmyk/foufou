import Foundation

// Wire models for the existing Next.js API (src/app/api/**). Fields are optional wherever the
// server spreads raw Firestore documents so unexpected/missing keys never break decoding.

enum Plan: String, Codable {
    case free, pro, premium

    init(from decoder: Decoder) throws {
        let raw = try decoder.singleValueContainer().decode(String.self)
        self = Plan(rawValue: raw) ?? .free
    }

    var label: String {
        switch self {
        case .free: return "Free"
        case .pro: return "Pro"
        case .premium: return "Premium"
        }
    }

    var isPaid: Bool { self != .free }
}

/// Decodes a JSON number that may arrive as Int or Double.
struct FlexInt: Codable, Hashable {
    var value: Int
    init(_ value: Int) { self.value = value }
    init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        if let i = try? c.decode(Int.self) { value = i }
        else if let d = try? c.decode(Double.self) { value = Int(d.rounded()) }
        else if let s = try? c.decode(String.self), let i = Int(s) { value = i }
        else { value = 0 }
    }
    func encode(to encoder: Encoder) throws {
        var c = encoder.singleValueContainer()
        try c.encode(value)
    }
}

// MARK: Groups

struct GroupSummary: Codable, Identifiable, Hashable {
    let id: String
    var title: String?
    var startDate: String?
    var endDate: String?
    var status: String?
    var icon: String?
    var currency: String?
    var membersCount: Int?
    var role: String?
    var ownerUserId: String?

    var isArchived: Bool { status == "archived" }
    var displayTitle: String { (title?.isEmpty == false) ? title! : "—" }
}

struct GroupsResponse: Codable {
    var groups: [GroupSummary]
    var plan: Plan?
}

struct Member: Codable, Identifiable, Hashable {
    var userId: String
    var role: String?
    var name: String?
    var joinedAt: String?
    var local: Bool?

    var id: String { userId }
    var displayName: String { (name?.isEmpty == false) ? name! : userId }
    var isLocal: Bool { local == true || userId.hasPrefix("local_") }
}

struct GroupDetail: Codable, Hashable {
    let id: String
    var title: String?
    var icon: String?
    var currency: String?
    var startDate: String?
    var endDate: String?
    var memo: String?
    var status: String?
    var ownerUserId: String?
    var shareToken: String?
    var members: [Member]?
}

struct Entitlements: Codable, Hashable {
    var plan: Plan?
    var canUsePremium: Bool?
    var canUsePhotos: Bool?
    var label: String?
}

struct GroupDetailResponse: Codable {
    var group: GroupDetail
    var entitlements: Entitlements?
    var expenses: [Expense]?
}

struct CreateGroupPayload: Encodable {
    var title: String
    var icon: String
    var currency: String
    var myName: String?
    var participants: [String]
}

struct GroupSettingsPayload: Encodable {
    var title: String?
    var icon: String?
    var memo: String??
    var status: String?

    enum CodingKeys: String, CodingKey { case title, icon, memo, status }

    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        if let title { try c.encode(title, forKey: .title) }
        if let icon { try c.encode(icon, forKey: .icon) }
        if let memo {
            // Outer optional set -> send key; inner nil -> JSON null (clears memo).
            if let value = memo { try c.encode(value, forKey: .memo) } else { try c.encodeNil(forKey: .memo) }
        }
        if let status { try c.encode(status, forKey: .status) }
    }
}

// MARK: Expenses

struct Split: Codable, Hashable {
    var userId: String
    var shareAmount: Int

    enum CodingKeys: String, CodingKey { case userId, shareAmount }

    init(userId: String, shareAmount: Int) {
        self.userId = userId
        self.shareAmount = shareAmount
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        userId = try c.decode(String.self, forKey: .userId)
        shareAmount = (try? c.decode(FlexInt.self, forKey: .shareAmount))?.value ?? 0
    }
}

struct Rounding: Codable, Hashable {
    var unit: String?
    var mode: String?
    var target: String?
}

struct SplitMeta: Codable, Hashable {
    var ratios: [String: Double]?
    var subgroup: [String]?
    var rounding: Rounding?
}

struct Expense: Codable, Identifiable, Hashable {
    var id: String
    var payerUserId: String
    var amount: Int
    var currency: String?
    var date: String?
    var category: String?
    var memo: String?
    var splitType: String?
    var splits: [Split]?
    var splitMeta: SplitMeta?
    var createdByUserId: String?

    enum CodingKeys: String, CodingKey {
        case id, payerUserId, amount, currency, date, category, memo, splitType, splits, splitMeta, createdByUserId
    }

    init(id: String, payerUserId: String, amount: Int, currency: String?, date: String?, category: String?,
         memo: String?, splitType: String?, splits: [Split]?, splitMeta: SplitMeta?, createdByUserId: String?) {
        self.id = id
        self.payerUserId = payerUserId
        self.amount = amount
        self.currency = currency
        self.date = date
        self.category = category
        self.memo = memo
        self.splitType = splitType
        self.splits = splits
        self.splitMeta = splitMeta
        self.createdByUserId = createdByUserId
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        payerUserId = (try? c.decode(String.self, forKey: .payerUserId)) ?? ""
        amount = (try? c.decode(FlexInt.self, forKey: .amount))?.value ?? 0
        currency = try? c.decode(String.self, forKey: .currency)
        date = try? c.decode(String.self, forKey: .date)
        category = try? c.decode(String.self, forKey: .category)
        memo = try? c.decode(String.self, forKey: .memo)
        splitType = try? c.decode(String.self, forKey: .splitType)
        splits = try? c.decode([Split].self, forKey: .splits)
        splitMeta = try? c.decode(SplitMeta.self, forKey: .splitMeta)
        createdByUserId = try? c.decode(String.self, forKey: .createdByUserId)
    }

    var categoryInfo: ExpenseCategory { ExpenseCategory.lookup(category) }
}

struct ExpensePayload: Encodable {
    var payerUserId: String
    var amount: Int
    var currency: String
    var date: String
    var category: String
    var memo: String?
    var splitType: String
    var splits: [Split]
    var splitMeta: SplitMeta?
}

struct ExpensesResponse: Codable {
    var expenses: [Expense]
}

// MARK: Settlement

struct Balance: Codable, Hashable {
    var userId: String
    var paid: Double?
    var owed: Double?
    var net: Double?
}

struct Transfer: Codable, Hashable {
    var fromUserId: String
    var toUserId: String
    var amount: Double
}

struct SettlementPayload: Codable, Hashable {
    var balances: [Balance]?
    var transfers: [Transfer]?
}

struct Settlement: Codable {
    var id: String?
    var version: Int?
    var payloadJson: SettlementPayload?
    var computedAt: String?
}

struct SettlementLatestResponse: Codable {
    var settlement: Settlement?
}

struct SettlementComputeResponse: Codable {
    var id: String?
    var balances: [Balance]
    var transfers: [Transfer]
}

// MARK: Members / editors / ownership

struct MembersResponse: Codable {
    var members: [Member]
}

struct Editor: Codable, Identifiable, Hashable {
    var userId: String
    var name: String?
    var email: String?
    var id: String { userId }
}

struct EditorsResponse: Codable {
    var editors: [Editor]
}

struct PendingTransfer: Codable, Identifiable, Hashable {
    var id: String
    var groupId: String?
    var fromUserName: String?
}

struct PendingTransfersResponse: Codable {
    var transfers: [PendingTransfer]
}

// MARK: Photos

struct Photo: Codable, Identifiable, Hashable {
    var id: String
    var url: String
    var name: String?
    var createdAt: String?
}

struct PhotosResponse: Codable {
    var photos: [Photo]
}

// MARK: Misc

struct IdResponse: Codable {
    var id: String
}

struct OkResponse: Codable {
    var ok: Bool?
}

struct ShareRotateResponse: Codable {
    var shareToken: String
}

struct URLResponseBody: Codable {
    var url: String?
}

struct NotificationItem: Codable, Identifiable, Hashable {
    var id: String
    var type: String?
    var groupId: String?
    var expenseId: String?
    var title: String?
    var createdAt: String?
    var read: Bool?
}

struct NotificationsResponse: Codable {
    var notifications: [NotificationItem]
}
