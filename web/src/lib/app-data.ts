export type AppScene = "nest" | "battle" | "result";
export type WaveChoiceId = "heal-party" | "sharpen-claws" | "reinforce-guard";

export const nestRooms = [
  { id: "forge", name: "Forge", effect: "+1 attack aura" },
  { id: "hatchery", name: "Hatchery", effect: "+reinforcement potential" },
  { id: "trap", name: "Trap Hall", effect: "opening burst" },
  { id: "vault", name: "Treasure Vault", effect: "+gold retention" },
  { id: "roost", name: "War Roost", effect: "+tempo and morale" },
  { id: "archive", name: "Whisper Archive", effect: "+event knowledge" },
];

export const briefingLines = [
  "정찰대가 둥지 주변에 집결 중입니다.",
  "방 배치와 전투 템포를 함께 확인할 수 있는 웹 프로토입니다.",
  "던전키퍼식 상위뷰 둥지 운영감과 JRPG 전투 감각을 동시에 검증합니다.",
];

export const waveChoices: { id: WaveChoiceId; name: string; desc: string }[] = [
  { id: "heal-party", name: "재정비", desc: "모든 아군 HP를 6 회복" },
  { id: "sharpen-claws", name: "공세 준비", desc: "다음 웨이브 동안 아군 공격 +2" },
  { id: "reinforce-guard", name: "방어 보강", desc: "다음 웨이브 동안 피해 감소 +2" },
];
