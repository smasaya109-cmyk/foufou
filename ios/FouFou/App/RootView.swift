import SwiftUI

struct RootView: View {
    @Environment(AuthService.self) private var auth

    var body: some View {
        Group {
            if auth.isSignedIn {
                MainTabView()
                    .transition(.opacity)
            } else {
                LoginView()
                    .transition(.opacity)
            }
        }
        .animation(.easeInOut(duration: 0.2), value: auth.isSignedIn)
    }
}

struct MainTabView: View {
    @Environment(AppSettings.self) private var settings
    @State private var groupsStore = GroupsStore()

    var body: some View {
        let L = settings.lang
        TabView {
            GroupsListView()
                .tabItem { Label(L.t("ホーム", "Home"), systemImage: "house.fill") }
            SubscriptionView()
                .tabItem { Label(L.t("プラン", "Plans"), systemImage: "sparkles") }
            ProfileView()
                .tabItem { Label(L.t("アカウント", "Account"), systemImage: "person.crop.circle.fill") }
        }
        .environment(groupsStore)
    }
}
