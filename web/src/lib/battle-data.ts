export type Fighter = {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  speed: number;
  role?: string;
};

export type SkillId = "claw" | "ember" | "guard" | "focus";

export const initialParty: Fighter[] = [
  { id: "tank", name: "Aegis Drake", hp: 42, maxHp: 42, atk: 8, def: 5, speed: 2, role: "Tanker" },
  { id: "dealer", name: "Ash Fang", hp: 28, maxHp: 28, atk: 12, def: 2, speed: 4, role: "Dealer" },
  { id: "support", name: "Eilin", hp: 24, maxHp: 24, atk: 6, def: 2, speed: 5, role: "Support" },
];

export const wavePack: Fighter[][] = [
  [
    { id: "r1", name: "Raider Scout", hp: 18, maxHp: 18, atk: 7, def: 1, speed: 3 },
    { id: "r2", name: "Raider Slinger", hp: 15, maxHp: 15, atk: 8, def: 0, speed: 4 },
  ],
  [
    { id: "m1", name: "Militia Shield", hp: 26, maxHp: 26, atk: 7, def: 3, speed: 2 },
    { id: "m2", name: "Militia Bow", hp: 18, maxHp: 18, atk: 9, def: 1, speed: 4 },
  ],
  [
    { id: "i1", name: "Investigator Hunter", hp: 24, maxHp: 24, atk: 10, def: 2, speed: 4 },
    { id: "i2", name: "Exorcist", hp: 20, maxHp: 20, atk: 9, def: 2, speed: 3 },
  ],
];

export const skillLabels: Record<SkillId, { label: string; desc: string; icon: string; color: string; effectText: string }> = {
  claw: { label: "Claw", desc: "기본 공격. 안정적인 단일 타격", icon: "🗡️", color: "from-amber-700 to-red-800", effectText: "single-hit" },
  ember: { label: "Ember Burst", desc: "강한 화염 타격. 높은 피해", icon: "🔥", color: "from-orange-500 to-red-700", effectText: "burst" },
  guard: { label: "Guard Roar", desc: "이번 턴 받는 피해를 감소", icon: "🛡️", color: "from-sky-600 to-indigo-800", effectText: "guard" },
  focus: { label: "Focus Breath", desc: "다음 행동을 위해 기세를 올림", icon: "✨", color: "from-violet-500 to-fuchsia-700", effectText: "charge" },
};
