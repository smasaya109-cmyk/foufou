import SwiftUI

@main
struct FouFouApp: App {
    @State private var settings = AppSettings()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(settings)
                .environment(AuthService.shared)
                .tint(Color.ffAccentStrong)
        }
    }
}
