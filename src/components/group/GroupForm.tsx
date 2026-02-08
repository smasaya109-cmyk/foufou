import { useRef, useState } from "react";
import { getCopy } from "@/lib/i18n";
import { useLang } from "@/hooks/useLang";

export default function GroupForm({
  title,
  setTitle,
  icon,
  setIcon,
  currency,
  setCurrency,
  myName,
  setMyName,
  participants,
  setParticipants
}: {
  title: string;
  setTitle: (value: string) => void;
  icon: string;
  setIcon: (value: string) => void;
  currency: string;
  setCurrency: (value: string) => void;
  myName: string;
  setMyName: (value: string) => void;
  participants: string[];
  setParticipants: (value: string[]) => void;
}) {
  const lang = useLang();
  const copy = getCopy(lang);
  const iconInputRef = useRef<HTMLInputElement | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [participantError, setParticipantError] = useState<string | null>(null);
  const [emojiCategory, setEmojiCategory] = useState<keyof typeof emojiGroups>("travel");
  const emojiGroups = {
    travel: {
      label: lang === "en" ? "Travel" : "旅行",
      items: [
        "🧳",
        "🏝️",
        "🏖️",
        "🏕️",
        "🏔️",
        "🏙️",
        "🗼",
        "🗽",
        "🎡",
        "🎢",
        "🎠",
        "🛳️",
        "✈️",
        "🚆",
        "🚗",
        "🚕",
        "🚲",
        "🛵",
        "🚌",
        "🚢",
        "🚁",
        "🛶",
        "🛺",
        "🛫",
        "🛬",
        "🗺️",
        "🧭",
        "🏨",
        "🏯",
        "🏰",
        "🕌",
        "⛩️",
        "🕍"
      ]
    },
    food: {
      label: lang === "en" ? "Food" : "食事",
      items: [
        "🍜",
        "🍣",
        "🍔",
        "🍕",
        "🍛",
        "🍱",
        "🍰",
        "🍙",
        "🥟",
        "🍻",
        "☕",
        "🍷",
        "🍦",
        "🍩",
        "🥐",
        "🥗",
        "🍖",
        "🍝",
        "🍤",
        "🍺",
        "🧋",
        "🧃"
      ]
    },
    fun: {
      label: lang === "en" ? "Fun" : "楽しみ",
      items: [
        "🎉",
        "🎈",
        "🎵",
        "🎮",
        "🎬",
        "🎤",
        "🎨",
        "🎯",
        "🏟️",
        "⚽",
        "🎾",
        "🏀",
        "🎳",
        "🏓",
        "🎣",
        "🧩",
        "🎸",
        "🎹",
        "🎧",
        "🎮",
        "🎭",
        "🎪"
      ]
    },
    nature: {
      label: lang === "en" ? "Scenery" : "風景",
      items: [
        "🌅",
        "🌄",
        "🌆",
        "🌌",
        "🌠",
        "🌈",
        "⛺",
        "🏞️",
        "🌊",
        "🌋",
        "🌳",
        "🍁",
        "❄️",
        "☀️",
        "⛅",
        "🌧️",
        "⛈️",
        "🌲",
        "🌴",
        "🌾",
        "🌸",
        "🏝️"
      ]
    },
    misc: {
      label: lang === "en" ? "Other" : "その他",
      items: [
        "📸",
        "🛍️",
        "🎁",
        "🧼",
        "🧢",
        "🕶️",
        "🧴",
        "🧻",
        "🪪",
        "📍",
        "⭐",
        "❤️",
        "💡",
        "📌",
        "🧾",
        "🧳",
        "🪙",
        "💳",
        "🪄",
        "📦",
        "🔔",
        "🧩"
      ]
    }
  } as const;

  const filteredEmojis = emojiGroups[emojiCategory].items;
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-semibold">{copy.groupForm.title}</label>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              type="button"
              className="flex h-12 w-14 items-center justify-center rounded-xl border border-[var(--stroke)] bg-white text-2xl"
              onClick={() => setPickerOpen((prev) => !prev)}
              aria-label={copy.groupForm.iconSelect}
            >
              {icon}
            </button>
            {pickerOpen ? (
              <div className="absolute left-0 top-14 z-20 w-64 rounded-2xl border border-[var(--stroke)] bg-white p-3 shadow-xl">
                <div className="flex flex-wrap gap-2 text-xs">
                  {Object.entries(emojiGroups).map(([key, group]) => (
                    <button
                      type="button"
                      key={key}
                      className={`rounded-full px-3 py-1 ${
                        emojiCategory === key ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-soft)]"
                      }`}
                      onClick={() => {
                        setEmojiCategory(key as keyof typeof emojiGroups);
                      }}
                    >
                      {group.label}
                    </button>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-6 gap-2">
                  {filteredEmojis.map((emoji) => (
                    <button
                      type="button"
                      key={emoji}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-xl hover:bg-[var(--bg-soft)]"
                      onClick={() => {
                        setIcon(emoji);
                        setPickerOpen(false);
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                  {!filteredEmojis.length ? (
                    <span className="col-span-6 text-center text-xs text-muted">
                      {copy.groupForm.emojiNotFound}
                    </span>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="mt-3 w-full rounded-full border border-[var(--stroke)] px-3 py-2 text-xs text-muted"
                  onClick={() => setPickerOpen(false)}
                >
                  {copy.groupForm.emojiClose}
                </button>
              </div>
            ) : null}
          </div>
          <input
            className="flex-1 rounded-xl border border-[var(--stroke)] bg-[var(--bg-soft)] px-3 py-3"
            placeholder={copy.groupForm.titlePlaceholder}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>
        <p className="text-xs text-muted">{copy.groupForm.iconHint}</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold">{copy.groupForm.currency}</label>
        <select
          className="h-12 w-full rounded-xl border border-[var(--stroke)] bg-white px-3"
          value={currency}
          onChange={(event) => setCurrency(event.target.value)}
        >
          <option value="JPY">{copy.groupForm.currencyJPY}</option>
          <option value="USD">{copy.groupForm.currencyUSD}</option>
          <option value="EUR">{copy.groupForm.currencyEUR}</option>
        </select>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-semibold">{copy.groupForm.participants}</label>
        <div className="rounded-2xl border border-[var(--stroke)] bg-[var(--bg-soft)]">
          <div className="flex items-center justify-between border-b border-[var(--stroke)] px-4 py-3">
            <input
              className="flex-1 bg-transparent text-sm outline-none"
              type="text"
              autoComplete="off"
              placeholder={copy.groupForm.myNamePlaceholder}
              value={myName}
              onChange={(event) => {
                setParticipantError(null);
                setMyName(event.target.value);
              }}
            />
            <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs text-white">
              {copy.groupForm.meBadge}
            </span>
          </div>
          {participants.map((name, index) => (
            <div
              key={`participant-${index}`}
              className="flex items-center justify-between border-b border-[var(--stroke)] px-4 py-3 last:border-b-0"
            >
              <input
                className="flex-1 bg-transparent text-sm outline-none"
                type="text"
                autoComplete="off"
                value={name}
                onChange={(event) => {
                  const next = [...participants];
                  next[index] = event.target.value;
                  setParticipantError(null);
                  setParticipants(next);
                }}
                placeholder={copy.groupForm.participantPlaceholder}
              />
              <button
                type="button"
                className="rounded-full border border-[var(--stroke)] px-2 py-1 text-xs text-muted"
                onClick={() => setParticipants(participants.filter((_, i) => i !== index))}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            className="w-full px-4 py-3 text-left text-sm text-[var(--accent)]"
            onClick={() => {
              const normalized = participants.map((p) => p.trim()).filter(Boolean);
              const myNormalized = myName.trim();
              if (myNormalized && normalized.includes(myNormalized)) {
                setParticipantError(copy.groupForm.duplicateSelf);
                return;
              }
              const hasDuplicate = normalized.length !== new Set(normalized).size;
              if (hasDuplicate) {
                setParticipantError(copy.groupForm.duplicateName);
                return;
              }
              setParticipantError(null);
              setParticipants([...participants, ""]);
            }}
          >
            {copy.groupForm.addParticipant}
          </button>
        </div>
        {participantError ? (
          <p className="text-xs text-red-600">{participantError}</p>
        ) : null}
      </div>
    </div>
  );
}
