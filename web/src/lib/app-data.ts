export type AppScene = "nest" | "battle" | "result";

export const nestRooms = [
  { id: "forge", name: "Forge", effect: "+1 attack aura" },
  { id: "hatchery", name: "Hatchery", effect: "+reinforcement potential" },
  { id: "trap", name: "Trap Hall", effect: "opening burst" },
  { id: "vault", name: "Treasure Vault", effect: "+gold retention" },
];

export const briefingLines = [
  "정찰대가 둥지 주변에 집결 중입니다.",
  "방 배치와 전투 템포를 함께 확인할 수 있는 웹 프로토입니다.",
  "던전키퍼식 상위뷰 둥지 운영감과 JRPG 전투 감각을 동시에 검증합니다.",
];
