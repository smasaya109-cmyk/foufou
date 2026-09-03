import SwiftUI
import PhotosUI

struct PhotosTabView: View {
    @Environment(AppSettings.self) private var settings
    @Bindable var store: GroupStore
    @State private var pickerItem: PhotosPickerItem?
    @State private var uploading = false
    @State private var error: String?

    private let columns = [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)]

    var body: some View {
        let L = settings.lang
        if !store.canUsePhotos {
            PaywallBanner(
                title: L.t("Premiumで解放", "Unlock with Premium"),
                description: L.t("写真共有はPremiumで利用できます。", "Photo sharing is available on Premium.")
            )
        } else {
            VStack(alignment: .leading, spacing: 14) {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(L.t("写真共有", "Photo sharing")).font(.system(size: 15, weight: .bold))
                        MutedText(L.t("旅行の思い出を共有できます。", "Share your trip memories."), size: 12)
                    }
                    Spacer()
                    PhotosPicker(selection: $pickerItem, matching: .images) {
                        Text(uploading ? L.t("アップロード中...", "Uploading...") : L.t("アップロード", "Upload"))
                    }
                    .buttonStyle(PrimaryButtonStyle(compact: true))
                    .disabled(uploading)
                }
                if let error { ErrorBanner(message: error) }
                if store.photos.isEmpty {
                    MutedText(L.t("写真がまだありません。", "No photos yet.")).frame(maxWidth: .infinity).padding(.vertical, 20)
                } else {
                    LazyVGrid(columns: columns, spacing: 10) {
                        ForEach(store.photos) { photo in
                            VStack(alignment: .leading, spacing: 4) {
                                AsyncImage(url: URL(string: photo.url)) { phase in
                                    switch phase {
                                    case .success(let image): image.resizable().scaledToFill()
                                    case .failure: Color.ffBgSoft.overlay(Image(systemName: "photo").foregroundStyle(Color.ffInkMuted))
                                    default: Color.ffBgSoft.overlay(ProgressView())
                                    }
                                }
                                .frame(height: 150)
                                .clipped()
                                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                                MutedText(photo.name ?? L.t("写真", "Photo"), size: 11).lineLimit(1)
                            }
                        }
                    }
                }
            }
            .card()
            .task { await store.loadPhotos() }
            .onChange(of: pickerItem) { _, item in
                guard let item else { return }
                Task { await upload(item) }
            }
        }
    }

    private func upload(_ item: PhotosPickerItem) async {
        uploading = true
        error = nil
        defer { uploading = false; pickerItem = nil }
        do {
            guard let data = try await item.loadTransferable(type: Data.self) else { return }
            let isPNG = data.starts(with: [0x89, 0x50, 0x4E, 0x47])
            let name = "photo-\(Int(Date().timeIntervalSince1970)).\(isPNG ? "png" : "jpg")"
            try await store.uploadPhoto(data: data, fileName: name, contentType: isPNG ? "image/png" : "image/jpeg")
        } catch let e as APIError {
            error = e.message(settings.lang)
        } catch {
            self.error = error.localizedDescription
        }
    }
}
