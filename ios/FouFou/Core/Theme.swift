import SwiftUI

// Mirrors the CSS variables in src/app/globals.css (Duolingo-ish light blue theme).
extension Color {
    init(hex: UInt32) {
        self.init(
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255
        )
    }

    static let ffBgBase = Color(hex: 0xF7FBFF)
    static let ffBgSoft = Color(hex: 0xEEF6FC)
    static let ffInkStrong = Color(hex: 0x0F1C2B)
    static let ffInkMuted = Color(hex: 0x5A6B7A)
    static let ffAccent = Color(hex: 0x5DB3E6)
    static let ffAccentStrong = Color(hex: 0x3A93C7)
    static let ffAccentSoft = Color(hex: 0xD9EEFB)
    static let ffPositive = Color(hex: 0x11A372)
    static let ffCard = Color.white
    static let ffStroke = Color(hex: 0xD7E8F5)
    static let ffDanger = Color(hex: 0xDC2626)
    static let ffPillBg = Color(hex: 0xF1F3F5)
}

// MARK: - Card

struct CardStyle: ViewModifier {
    var padding: CGFloat

    func body(content: Content) -> some View {
        content
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .fill(Color.ffCard)
                    .shadow(color: Color.ffAccent.opacity(0.08), radius: 0, x: 0, y: 10)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .stroke(Color.ffStroke, lineWidth: 2)
            )
    }
}

extension View {
    func card(padding: CGFloat = 16) -> some View {
        modifier(CardStyle(padding: padding))
    }

    func softSection(padding: CGFloat = 16) -> some View {
        self
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(RoundedRectangle(cornerRadius: 20, style: .continuous).fill(Color.ffBgSoft))
    }
}

// MARK: - Buttons

struct PrimaryButtonStyle: ButtonStyle {
    var fullWidth = false
    var compact = false
    @Environment(\.isEnabled) private var isEnabled

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: compact ? 13 : 15, weight: .bold))
            .foregroundStyle(.white)
            .padding(.horizontal, compact ? 14 : 20)
            .padding(.vertical, compact ? 8 : 12)
            .frame(maxWidth: fullWidth ? .infinity : nil)
            .background(Capsule().fill(Color.ffAccent))
            .shadow(color: Color.ffAccentStrong.opacity(0.35), radius: 0, x: 0, y: configuration.isPressed ? 2 : 6)
            .offset(y: configuration.isPressed ? 2 : 0)
            .opacity(isEnabled ? 1 : 0.55)
            .animation(.easeOut(duration: 0.08), value: configuration.isPressed)
    }
}

struct OutlineButtonStyle: ButtonStyle {
    var fullWidth = false
    var compact = false
    var tint: Color = .ffInkStrong
    @Environment(\.isEnabled) private var isEnabled

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: compact ? 13 : 15, weight: .semibold))
            .foregroundStyle(tint)
            .padding(.horizontal, compact ? 12 : 18)
            .padding(.vertical, compact ? 6 : 10)
            .frame(maxWidth: fullWidth ? .infinity : nil)
            .background(Capsule().fill(Color.white))
            .overlay(Capsule().stroke(Color.ffStroke, lineWidth: 2))
            .opacity(configuration.isPressed ? 0.7 : (isEnabled ? 1 : 0.55))
    }
}

struct DangerButtonStyle: ButtonStyle {
    var fullWidth = false
    @Environment(\.isEnabled) private var isEnabled

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 15, weight: .bold))
            .foregroundStyle(.white)
            .padding(.horizontal, 20)
            .padding(.vertical, 12)
            .frame(maxWidth: fullWidth ? .infinity : nil)
            .background(Capsule().fill(Color.ffDanger))
            .opacity(configuration.isPressed ? 0.8 : (isEnabled ? 1 : 0.55))
    }
}

// MARK: - Small components

struct Pill: View {
    let text: String
    var background: Color = .ffPillBg
    var foreground: Color = .ffInkStrong

    var body: some View {
        Text(text)
            .font(.system(size: 11, weight: .semibold))
            .tracking(0.3)
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .background(Capsule().fill(background))
            .foregroundStyle(foreground)
    }
}

struct SoftField: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding(.horizontal, 12)
            .padding(.vertical, 11)
            .background(RoundedRectangle(cornerRadius: 16, style: .continuous).fill(Color.white))
            .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).stroke(Color.ffStroke, lineWidth: 2))
    }
}

extension View {
    func softField() -> some View { modifier(SoftField()) }
}

struct FieldLabel: View {
    let text: String
    init(_ text: String) { self.text = text }
    var body: some View {
        Text(text).font(.system(size: 13, weight: .semibold)).foregroundStyle(Color.ffInkStrong)
    }
}

struct SectionTitle: View {
    let text: String
    var size: CGFloat = 22
    init(_ text: String, size: CGFloat = 22) { self.text = text; self.size = size }
    var body: some View {
        Text(text).font(.system(size: size, weight: .heavy)).tracking(-0.4).foregroundStyle(Color.ffInkStrong)
    }
}

struct MutedText: View {
    let text: String
    var size: CGFloat = 13
    init(_ text: String, size: CGFloat = 13) { self.text = text; self.size = size }
    var body: some View {
        Text(text).font(.system(size: size)).foregroundStyle(Color.ffInkMuted)
    }
}

struct ErrorBanner: View {
    let message: String
    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            Image(systemName: "exclamationmark.triangle.fill")
            Text(message)
        }
        .font(.system(size: 13, weight: .medium))
        .foregroundStyle(Color.ffDanger)
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 14, style: .continuous).fill(Color.ffDanger.opacity(0.08)))
    }
}

struct EmojiTile: View {
    let emoji: String
    var size: CGFloat = 48
    var body: some View {
        Text(emoji)
            .font(.system(size: size * 0.45))
            .frame(width: size, height: size)
            .background(RoundedRectangle(cornerRadius: size * 0.33, style: .continuous).fill(Color.white))
            .overlay(RoundedRectangle(cornerRadius: size * 0.33, style: .continuous).stroke(Color.ffStroke, lineWidth: 2))
    }
}

struct PaywallBanner: View {
    let title: String
    let description: String
    var actionLabel: String? = nil
    var action: (() -> Void)? = nil

    var body: some View {
        HStack(alignment: .center, spacing: 14) {
            Image("Mascot")
                .resizable()
                .scaledToFit()
                .frame(width: 56, height: 56)
            VStack(alignment: .leading, spacing: 4) {
                Text(title).font(.system(size: 15, weight: .bold)).foregroundStyle(Color.ffInkStrong)
                Text(description).font(.system(size: 12)).foregroundStyle(Color.ffInkMuted)
                if let actionLabel, let action {
                    Button(actionLabel, action: action)
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(Color.ffAccentStrong)
                        .padding(.top, 2)
                }
            }
            Spacer(minLength: 0)
        }
        .softSection(padding: 14)
    }
}

struct ScreenBackground: ViewModifier {
    func body(content: Content) -> some View {
        content
            .background(
                LinearGradient(
                    colors: [Color.ffBgBase, Color.white, Color.ffBgBase],
                    startPoint: .top, endPoint: .bottom
                )
                .ignoresSafeArea()
            )
    }
}

extension View {
    func screenBackground() -> some View { modifier(ScreenBackground()) }
}
