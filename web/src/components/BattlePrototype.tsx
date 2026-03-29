"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { initialParty, skillLabels, type Fighter, type SkillId, wavePack } from "@/lib/battle-data";
import { briefingLines, nestRooms, type AppScene } from "@/lib/app-data";

type LogEntry = { id: number; text: string };
type DamagePopup = { id: number; team: "party" | "enemy"; targetId: string; value: number; kind: "damage" | "heal" };

type RoundResult = { result: string | null; victory: boolean };

const cloneFighter = (fighter: Fighter): Fighter => ({ ...fighter });
const alive = (team: Fighter[]) => team.filter((unit) => unit.hp > 0);
const clamp = (value: number, min = 0) => (value < min ? min : value);

export function BattlePrototype() {
  const [scene, setScene] = useState<AppScene>("nest");
  const [party, setParty] = useState<Fighter[]>(() => initialParty.map(cloneFighter));
  const [waveIndex, setWaveIndex] = useState(0);
  const [enemies, setEnemies] = useState<Fighter[]>(() => wavePack[0].map(cloneFighter));
  const [selectedSkill, setSelectedSkill] = useState<SkillId>("claw");
  const [logs, setLogs] = useState<LogEntry[]>([{ id: 1, text: "전투 시작 전, 둥지의 준비 상태를 확인하세요." }]);
  const [auto, setAuto] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [guardBuff, setGuardBuff] = useState(0);
  const [focusBuff, setFocusBuff] = useState(0);
  const [battleEnded, setBattleEnded] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [logId, setLogId] = useState(2);
  const [popupId, setPopupId] = useState(1);
  const [popups, setPopups] = useState<DamagePopup[]>([]);
  const [flashParty, setFlashParty] = useState<string | null>(null);
  const [flashEnemy, setFlashEnemy] = useState<string | null>(null);
  const [waveBanner, setWaveBanner] = useState<string>("Wave 1 - Raiders");
  const [combatPaused, setCombatPaused] = useState(false);
  const [showCutscene, setShowCutscene] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState("forge");

  const currentWaveLabel = useMemo(() => ["Raiders", "Militia", "Investigators"][waveIndex] ?? "Final", [waveIndex]);
  const currentBriefing = briefingLines[Math.min(waveIndex, briefingLines.length - 1)];

  const appendLog = (text: string) => {
    setLogs((prev) => [{ id: logId, text }, ...prev].slice(0, 10));
    setLogId((prev) => prev + 1);
  };

  const spawnPopup = (team: "party" | "enemy", targetId: string, value: number, kind: "damage" | "heal") => {
    const id = popupId;
    setPopupId((prev) => prev + 1);
    setPopups((prev) => [...prev, { id, team, targetId, value, kind }]);
    window.setTimeout(() => setPopups((prev) => prev.filter((popup) => popup.id !== id)), 650);
  };

  const triggerFlash = (team: "party" | "enemy", targetId: string) => {
    if (team === "party") {
      setFlashParty(targetId);
      window.setTimeout(() => setFlashParty(null), 180);
    } else {
      setFlashEnemy(targetId);
      window.setTimeout(() => setFlashEnemy(null), 180);
    }
  };

  const showWaveBanner = (text: string) => {
    setWaveBanner(text);
    window.setTimeout(() => setWaveBanner(""), 1400);
  };

  const applyHitStop = () => {
    setCombatPaused(true);
    window.setTimeout(() => setCombatPaused(false), 70);
  };

  const resetBattle = () => {
    setScene("nest");
    setParty(initialParty.map(cloneFighter));
    setWaveIndex(0);
    setEnemies(wavePack[0].map(cloneFighter));
    setSelectedSkill("claw");
    setLogs([{ id: 1, text: "전투 시작 전, 둥지의 준비 상태를 확인하세요." }]);
    setAuto(false);
    setSpeed(1);
    setGuardBuff(0);
    setFocusBuff(0);
    setBattleEnded(false);
    setResult(null);
    setLogId(2);
    setPopupId(1);
    setPopups([]);
    setWaveBanner("Wave 1 - Raiders");
    setShowCutscene(true);
  };

  const calculateDamage = (atk: number, def: number, extra = 0) => Math.max(1, atk + extra - def);

  const startBattle = () => {
    setScene("battle");
    setShowCutscene(true);
    appendLog(`선택된 둥지 핵심 방: ${nestRooms.find((room) => room.id === selectedRoom)?.name ?? "Forge"}`);
    showWaveBanner("Nest Defense Start");
  };

  const finalizeRoundResult = ({ result, victory }: RoundResult) => {
    setBattleEnded(true);
    setResult(result);
    setScene("result");
    appendLog(victory ? "전 웨이브 방어 성공." : "둥지 방어 실패. 전략 수정 필요.");
  };

  const runRound = (skill: SkillId) => {
    if (battleEnded || scene !== "battle") return;

    let nextParty = party.map(cloneFighter);
    let nextEnemies = enemies.map(cloneFighter);
    let nextGuard = 0;
    let nextFocus = 0;

    const frontAlly = alive(nextParty)[0];
    const frontEnemy = alive(nextEnemies)[0];
    if (!frontAlly || !frontEnemy) return;

    const dealer = alive(nextParty).find((unit) => unit.role === "Dealer") ?? frontAlly;
    const support = alive(nextParty).find((unit) => unit.role === "Support");

    if (skill === "guard") {
      nextGuard = 3;
      appendLog("Aegis Drake가 Guard Roar로 진형을 굳혔습니다.");
      showWaveBanner("Guard Roar");
    } else if (skill === "focus") {
      nextFocus = 3;
      appendLog("Ash Fang가 Focus Breath로 다음 타격을 준비합니다.");
      showWaveBanner("Focus Breath");
    } else {
      const skillBonus = skill === "ember" ? 6 : 2;
      const target = alive(nextEnemies)[0];
      if (target) {
        const damage = calculateDamage(dealer.atk, target.def, skillBonus + focusBuff + (selectedRoom === "forge" ? 1 : 0));
        target.hp = clamp(target.hp - damage);
        spawnPopup("enemy", target.id, damage, "damage");
        triggerFlash("enemy", target.id);
        applyHitStop();
        appendLog(`${dealer.name}의 ${skillLabels[skill].label} → ${target.name} ${damage} 피해`);
        showWaveBanner(skillLabels[skill].label);
      }
    }

    if (support) {
      const healBonus = selectedRoom === "hatchery" ? 2 : 0;
      const lowest = alive(nextParty).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
      if (lowest && lowest.hp < lowest.maxHp) {
        const heal = 4 + healBonus;
        lowest.hp = Math.min(lowest.maxHp, lowest.hp + heal);
        spawnPopup("party", lowest.id, heal, "heal");
        appendLog(`${support.name}이(가) ${lowest.name} 회복 +${heal}`);
      }
    }

    for (const enemy of alive(nextEnemies)) {
      const target = alive(nextParty)[0];
      if (!target) break;
      const trapPenalty = selectedRoom === "trap" ? 1 : 0;
      const damage = calculateDamage(enemy.atk - trapPenalty, target.def, -nextGuard);
      target.hp = clamp(target.hp - damage);
      spawnPopup("party", target.id, damage, "damage");
      triggerFlash("party", target.id);
      applyHitStop();
      appendLog(`${enemy.name} 공격 → ${target.name} ${damage} 피해`);
    }

    nextEnemies = nextEnemies.map((unit) => ({ ...unit }));
    nextParty = nextParty.map((unit) => ({ ...unit }));

    const aliveEnemies = alive(nextEnemies);
    const aliveParty = alive(nextParty);

    if (aliveEnemies.length === 0) {
      if (waveIndex + 1 >= wavePack.length) {
        setParty(nextParty);
        setEnemies(nextEnemies);
        showWaveBanner("Final Victory");
        finalizeRoundResult({ result: "Victory", victory: true });
        return;
      }

      const nextWaveIndex = waveIndex + 1;
      setWaveIndex(nextWaveIndex);
      setParty(nextParty);
      setEnemies(wavePack[nextWaveIndex].map(cloneFighter));
      setGuardBuff(nextGuard);
      setFocusBuff(nextFocus);
      appendLog(`다음 웨이브: ${["Raiders", "Militia", "Investigators"][nextWaveIndex]}`);
      showWaveBanner(`Wave ${nextWaveIndex + 1} - ${["Raiders", "Militia", "Investigators"][nextWaveIndex]}`);
      return;
    }

    if (aliveParty.length === 0) {
      setParty(nextParty);
      setEnemies(nextEnemies);
      showWaveBanner("Defeat");
      finalizeRoundResult({ result: "Defeat", victory: false });
      return;
    }

    setParty(nextParty);
    setEnemies(nextEnemies);
    setGuardBuff(nextGuard);
    setFocusBuff(nextFocus);
  };

  useEffect(() => {
    if (!auto || battleEnded || scene !== "battle" || combatPaused) return;
    const delay = speed === 1 ? 1200 : speed === 2 ? 700 : 350;
    const id = window.setTimeout(() => runRound(selectedSkill), delay);
    return () => window.clearTimeout(id);
  }, [auto, battleEnded, selectedSkill, speed, party, enemies, scene, combatPaused]);

  return (
    <div className="min-h-screen bg-[#120f19] text-[#f8eedc]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-3 py-3 md:px-4 md:py-4 lg:grid lg:grid-cols-[1.5fr_0.9fr]">
        <section className="relative overflow-hidden rounded-2xl border border-[#7a5f36] bg-[#1d1623] shadow-2xl">
          {scene === "nest" ? (
            <Image src="/assets/maps/dragon-nest-map.png" alt="Nest map" fill className="object-cover opacity-55" priority />
          ) : (
            <Image src="/assets/backgrounds/battle-background.png" alt="Battle background" fill className={`object-cover opacity-50 transition-transform duration-100 ${combatPaused ? "scale-[1.012]" : "scale-100"}`} priority />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(8,6,12,0.35),rgba(8,6,12,0.78))]" />
          <div className="relative z-10 flex min-h-[720px] flex-col justify-between p-4 md:p-6">
            {waveBanner ? (
              <div className="pointer-events-none absolute left-1/2 top-20 z-20 -translate-x-1/2 rounded-full border border-[#d8b16c] bg-[rgba(24,16,28,0.92)] px-5 py-2 text-sm font-bold text-[#f7d58a] md:text-lg battle-banner">
                {waveBanner}
              </div>
            ) : null}

            {showCutscene ? (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-[rgba(5,4,8,0.76)] p-4">
                <div className="max-w-4xl overflow-hidden rounded-2xl border border-[#8d7148] bg-[#140f1b] shadow-2xl lg:grid lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="relative min-h-[280px]">
                    <Image src="/assets/events/investigator-event.png" alt="Event cutscene" fill className="object-cover" />
                  </div>
                  <div className="flex flex-col justify-between gap-4 p-5">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-[#caa86a]">Secretary Event</p>
                      <h2 className="mt-2 text-2xl font-bold">둥지 방어 브리핑</h2>
                      <p className="mt-3 text-sm leading-7 text-[#eadcc0]">{currentBriefing}</p>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-xs text-[#d6c4a0]">현재 둥지 핵심 방: {nestRooms.find((room) => room.id === selectedRoom)?.name}</div>
                      <button onClick={() => setShowCutscene(false)} className="rounded-lg bg-[#8b5b32] px-4 py-2 font-semibold text-white hover:bg-[#a76d3d]">계속</button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#9a7a46] bg-[rgba(16,12,22,0.86)] px-4 py-3 backdrop-blur-sm">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#caa86a] md:text-xs">DoongD Web Prototype</p>
                <h1 className="text-xl font-bold md:text-2xl">{scene === "nest" ? "Dragon Nest Command" : `${currentWaveLabel} Wave Defense`}</h1>
              </div>
              <div className="text-right text-xs text-[#e5d5b0] md:text-sm">
                <div>배속: {speed}x</div>
                <div>오토: {auto ? "ON" : "OFF"}</div>
                <div>선택 스킬: {skillLabels[selectedSkill].label}</div>
              </div>
            </header>

            {scene === "nest" ? (
              <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-xl border border-[#9a7a46] bg-[rgba(10,8,15,0.72)] p-4 backdrop-blur-sm">
                  <h2 className="mb-3 text-lg font-bold">Nest Overview</h2>
                  <p className="mb-4 text-sm leading-7 text-[#eadcc0]">Dungeon Keeper Mobile처럼 둥지 상위뷰에서 핵심 방을 고르고, 이후 방 효과를 전투에 반영하는 흐름을 검증합니다.</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {nestRooms.map((room) => (
                      <button key={room.id} onClick={() => setSelectedRoom(room.id)} className={`rounded-xl border p-3 text-left transition ${selectedRoom === room.id ? "border-[#f4d08b] bg-[#61461f]" : "border-[#5e4d2e] bg-[#211a29] hover:bg-[#2e2238]"}`}>
                        <div className="font-semibold">{room.name}</div>
                        <div className="mt-1 text-xs text-[#d8c7a1]">{room.effect}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-[#9a7a46] bg-[rgba(12,10,18,0.82)] p-4 backdrop-blur-sm">
                  <h2 className="mb-3 text-lg font-bold">Action</h2>
                  <div className="space-y-3 text-sm text-[#ebdfc4]">
                    <p>선택한 둥지 방 효과가 전투에 반영됩니다.</p>
                    <p>Forge: 공격 보너스 / Hatchery: 회복 강화 / Trap Hall: 적 공격 감소</p>
                    <button onClick={startBattle} className="w-full rounded-lg bg-[#b13f34] px-4 py-3 font-semibold text-white hover:bg-[#c54c40]">전투 시작</button>
                  </div>
                </div>
              </div>
            ) : scene === "result" ? (
              <div className="rounded-xl border border-[#9a7a46] bg-[rgba(10,8,15,0.74)] p-6 backdrop-blur-sm">
                <h2 className="mb-3 text-3xl font-bold text-[#f5c56f]">{result}</h2>
                <p className="mb-4 text-sm leading-7 text-[#eadcc0]">
                  {result === "Victory" ? "모든 웨이브 방어 성공. 둥지 운영과 전투 흐름이 하나의 루프로 연결되었습니다." : "둥지 방어 실패. 배속/가드/포커스 타이밍과 방 선택 효과를 다시 조정해야 합니다."}
                </p>
                <div className="flex flex-wrap gap-3">
                  <button onClick={resetBattle} className="rounded-lg bg-[#355b88] px-4 py-2 font-semibold text-white hover:bg-[#4473ac]">둥지로 돌아가기</button>
                  <button onClick={() => { setScene("battle"); setBattleEnded(false); setResult(null); }} className="rounded-lg bg-[#5a4b68] px-4 py-2 font-semibold text-white hover:bg-[#715b82]">결과 화면 닫기</button>
                </div>
              </div>
            ) : (
              <div className={`grid grid-cols-1 gap-6 lg:grid-cols-2 transition-transform duration-75 ${combatPaused ? "scale-[0.996]" : "scale-100"}`}>
                <TeamPanel title="Nest Defenders" team={party} accent="emerald" popups={popups.filter((p) => p.team === "party")} flashedId={flashParty} />
                <TeamPanel title="Invaders" team={enemies} accent="rose" reverse popups={popups.filter((p) => p.team === "enemy")} flashedId={flashEnemy} />
              </div>
            )}

            {scene === "battle" ? (
              <div className="rounded-xl border border-[#9a7a46] bg-[rgba(12,10,18,0.82)] p-4 backdrop-blur-sm">
                <div className="mb-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  {(["claw", "ember", "guard", "focus"] as SkillId[]).map((skill) => (
                    <button
                      key={skill}
                      onClick={() => setSelectedSkill(skill)}
                      className={`rounded-lg border px-4 py-2 text-sm transition bg-[length:cover] bg-center ${selectedSkill === skill ? "border-[#f4d08b] bg-[#6e4d1f] text-white shadow-[0_0_16px_rgba(244,208,139,0.25)]" : "border-[#6e5b3b] bg-[#2a2231] text-[#e9dbbd] hover:bg-[#3a2d43]"}`}
                      style={{ backgroundImage: "linear-gradient(rgba(34,24,44,0.82), rgba(34,24,44,0.82)), url('/assets/ui/jrpg-window-skin-sheet.png')" }}
                    >
                      <div className="font-semibold">{skillLabels[skill].label}</div>
                      <div className="text-xs opacity-80">{skillLabels[skill].desc}</div>
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button onClick={() => runRound(selectedSkill)} disabled={battleEnded || combatPaused} className="rounded-lg bg-[#b13f34] px-4 py-2 font-semibold text-white hover:bg-[#c54c40] disabled:opacity-50">턴 진행</button>
                  <button onClick={() => setAuto((v) => !v)} className="rounded-lg bg-[#355b88] px-4 py-2 font-semibold text-white hover:bg-[#4473ac]">오토 {auto ? "끄기" : "켜기"}</button>
                  <button onClick={() => setSpeed((v) => (v === 1 ? 2 : v === 2 ? 4 : 1))} className="rounded-lg bg-[#4a6b3e] px-4 py-2 font-semibold text-white hover:bg-[#5f8650]">배속 변경 ({speed}x)</button>
                  <button onClick={() => setShowCutscene(true)} className="rounded-lg bg-[#8b5b32] px-4 py-2 font-semibold text-white hover:bg-[#a76d3d]">컷신 보기</button>
                  <button onClick={resetBattle} className="rounded-lg bg-[#5a4b68] px-4 py-2 font-semibold text-white hover:bg-[#715b82]">전투 리셋</button>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <aside className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-2xl border border-[#7a5f36] bg-[#1a1420]">
            <div className="border-b border-[#7a5f36] px-4 py-3">
              <h2 className="text-lg font-bold">Secretary Briefing</h2>
            </div>
            <div className="flex gap-3 p-4">
              <div className="relative h-36 w-28 shrink-0 overflow-hidden rounded-xl border border-[#8b6f47] md:h-40 md:w-32">
                <Image src="/assets/characters/secretary-portrait.png" alt="Secretary portrait" fill className="object-cover" />
              </div>
              <div className="text-sm leading-6 text-[#ebdfc4]">
                <p className="mb-2">“이번 웹 프로토는 둥지 방어 전투의 손맛과 배속 시뮬레이션을 빠르게 검증하기 위한 전투 전용 빌드입니다.”</p>
                <p>{currentBriefing}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#7a5f36] bg-[#1a1420] p-4">
            <h2 className="mb-3 text-lg font-bold">Battle Log</h2>
            <div className="space-y-2 text-sm text-[#f2e8cf]">
              {logs.map((entry) => (
                <div key={entry.id} className="rounded-lg bg-[#241b2d] px-3 py-2">{entry.text}</div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#7a5f36] bg-[#1a1420] p-4 text-sm text-[#eddcb5]">
            <h2 className="mb-2 text-lg font-bold">Status</h2>
            <p className="mb-2">현재 화면: {scene === "nest" ? "둥지" : scene === "battle" ? "전투" : "결과"}</p>
            <p className="mb-2">선택된 둥지 방: {nestRooms.find((room) => room.id === selectedRoom)?.name}</p>
            <p>{battleEnded ? (result === "Victory" ? "웹 전투 프로토 1차 승리 상태." : "재도전 및 밸런스 조정 필요.") : "전투 진행 중. 오토와 배속을 조합해 감각을 확인하세요."}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function TeamPanel({
  title,
  team,
  accent,
  reverse = false,
  popups,
  flashedId,
}: {
  title: string;
  team: Fighter[];
  accent: "emerald" | "rose";
  reverse?: boolean;
  popups: DamagePopup[];
  flashedId: string | null;
}) {
  return (
    <div className="rounded-xl border border-[#9a7a46] bg-[rgba(10,8,15,0.72)] p-4 backdrop-blur-sm">
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      <div className="space-y-3">
        {team.map((fighter) => {
          const percent = Math.max(0, (fighter.hp / fighter.maxHp) * 100);
          const unitPopups = popups.filter((popup) => popup.targetId === fighter.id);
          const isFlashed = flashedId === fighter.id;
          const isDead = fighter.hp <= 0;
          return (
            <div key={fighter.id} className={`relative rounded-xl border border-[#5e4d2e] bg-[#211a29] p-3 transition ${reverse ? "text-right" : ""} ${isFlashed ? "battle-hit-flash" : ""} ${isDead ? "opacity-40 saturate-0" : ""}`}>
              {unitPopups.map((popup) => (
                <div
                  key={popup.id}
                  className={`pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 text-xl font-bold battle-popup ${popup.kind === "heal" ? "text-emerald-300" : "text-rose-300"}`}
                >
                  {popup.kind === "heal" ? `+${popup.value}` : `-${popup.value}`}
                </div>
              ))}
              <div className={`mb-1 flex items-center justify-between gap-3 transition-transform duration-100 ${isFlashed ? (reverse ? "-translate-x-1" : "translate-x-1") : "translate-x-0"}`}>
                <div>
                  <div className="font-semibold text-[#f8edd5]">{fighter.name}</div>
                  <div className="text-xs text-[#d8c7a1]">{fighter.role ?? "Enemy"}</div>
                </div>
                <div className="text-sm text-[#e6d6b1]">{fighter.hp}/{fighter.maxHp}</div>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-[#3a2f44]">
                <div className={`h-full rounded-full transition-all duration-300 ${accent === "emerald" ? "bg-emerald-500" : "bg-rose-500"}`} style={{ width: `${percent}%` }} />
              </div>
              <div className="mt-2 text-xs text-[#cdb88b]">ATK {fighter.atk} · DEF {fighter.def} · SPD {fighter.speed}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
