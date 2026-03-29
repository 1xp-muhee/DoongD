"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { initialParty, skillLabels, type Fighter, type SkillId, wavePack } from "@/lib/battle-data";
import { briefingLines, nestRooms, waveChoices, type AppScene, type WaveChoiceId } from "@/lib/app-data";

type LogEntry = { id: number; text: string };
type DamagePopup = { id: number; team: "party" | "enemy"; targetId: string; value: number; kind: "damage" | "heal" };
type EffectLayer = { id: number; team: "party" | "enemy"; label: string; style: "slash" | "burst" | "guard" | "charge" };
type RewardState = { gold: number; essence: number; score: number };
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
  const [attackBuff, setAttackBuff] = useState(0);
  const [battleEnded, setBattleEnded] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [rewardState, setRewardState] = useState<RewardState>({ gold: 0, essence: 0, score: 0 });
  const [logId, setLogId] = useState(2);
  const [popupId, setPopupId] = useState(1);
  const [popups, setPopups] = useState<DamagePopup[]>([]);
  const [effectLayers, setEffectLayers] = useState<EffectLayer[]>([]);
  const [flashParty, setFlashParty] = useState<string | null>(null);
  const [flashEnemy, setFlashEnemy] = useState<string | null>(null);
  const [waveBanner, setWaveBanner] = useState<string>("Wave 1 - Raiders");
  const [combatPaused, setCombatPaused] = useState(false);
  const [showCutscene, setShowCutscene] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState("forge");
  const [pendingWaveChoice, setPendingWaveChoice] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);

  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const hitRef = useRef<HTMLAudioElement | null>(null);
  const burstRef = useRef<HTMLAudioElement | null>(null);
  const healRef = useRef<HTMLAudioElement | null>(null);
  const uiRef = useRef<HTMLAudioElement | null>(null);

  const currentWaveLabel = useMemo(() => ["Raiders", "Militia", "Investigators"][waveIndex] ?? "Final", [waveIndex]);
  const currentBriefing = useMemo(() => {
    const roomName = nestRooms.find((room) => room.id === selectedRoom)?.name ?? "Forge";
    const lines = [
      `정찰대가 둥지 주변에 집결 중입니다. ${roomName}를 중심으로 방어선을 구성하세요.`,
      `이번 웨이브는 ${currentWaveLabel} 세력입니다. 템포를 늦출지, 화력을 밀어붙일지 선택이 중요합니다.`,
      `원작의 감각대로, 짧은 준비-전투-선택의 리듬을 유지하는 것이 핵심입니다.`,
    ];
    return lines[Math.min(waveIndex, lines.length - 1)] || briefingLines[0];
  }, [selectedRoom, currentWaveLabel, waveIndex]);

  const playSfx = (type: "hit" | "burst" | "heal" | "ui") => {
    if (!audioEnabled) return;
    const ref = type === "hit" ? hitRef : type === "burst" ? burstRef : type === "heal" ? healRef : uiRef;
    if (!ref.current) return;
    ref.current.currentTime = 0;
    void ref.current.play().catch(() => {});
  };

  useEffect(() => {
    if (!bgmRef.current) return;
    bgmRef.current.volume = 0.25;
    if (audioEnabled) void bgmRef.current.play().catch(() => {});
    else {
      bgmRef.current.pause();
      bgmRef.current.currentTime = 0;
    }
  }, [audioEnabled]);

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

  const spawnEffect = (team: "party" | "enemy", label: string, style: EffectLayer["style"]) => {
    const id = Date.now() + Math.random();
    setEffectLayers((prev) => [...prev, { id, team, label, style }]);
    window.setTimeout(() => setEffectLayers((prev) => prev.filter((effect) => effect.id !== id)), 520);
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
    setAttackBuff(0);
    setBattleEnded(false);
    setResult(null);
    setRewardState({ gold: 0, essence: 0, score: 0 });
    setLogId(2);
    setPopupId(1);
    setPopups([]);
    setEffectLayers([]);
    setWaveBanner("Wave 1 - Raiders");
    setShowCutscene(true);
    setPendingWaveChoice(false);
  };

  const calculateDamage = (atk: number, def: number, extra = 0) => Math.max(1, atk + extra - def);

  const startBattle = () => {
    setScene("battle");
    setShowCutscene(true);
    appendLog(`선택된 둥지 핵심 방: ${nestRooms.find((room) => room.id === selectedRoom)?.name ?? "Forge"}`);
    showWaveBanner("Nest Defense Start");
    playSfx("ui");
  };

  const finalizeRoundResult = ({ result, victory }: RoundResult) => {
    setBattleEnded(true);
    setResult(result);
    const rewardGold = victory ? 40 + waveIndex * 20 : 12;
    const rewardEssence = victory ? 3 + waveIndex : 1;
    const rewardScore = alive(party).length * 120 + (victory ? 300 : 80) + waveIndex * 100;
    setRewardState({ gold: rewardGold, essence: rewardEssence, score: rewardScore });
    setScene("result");
    appendLog(victory ? `전 웨이브 방어 성공. 보상: Gold ${rewardGold}, Essence ${rewardEssence}` : "둥지 방어 실패. 전략 수정 필요.");
  };

  const applyWaveChoice = (choiceId: WaveChoiceId) => {
    if (!pendingWaveChoice) return;

    const nextParty = party.map(cloneFighter);
    if (choiceId === "heal-party") {
      nextParty.forEach((unit) => {
        if (unit.hp > 0) unit.hp = Math.min(unit.maxHp, unit.hp + 6);
      });
      appendLog("재정비 선택: 아군 전원 HP +6");
      showWaveBanner("Reorganize");
      playSfx("heal");
    } else if (choiceId === "sharpen-claws") {
      setAttackBuff(2);
      appendLog("공세 준비 선택: 다음 웨이브 아군 공격 +2");
      showWaveBanner("Sharpen Claws");
      playSfx("ui");
    } else if (choiceId === "reinforce-guard") {
      setGuardBuff(2);
      appendLog("방어 보강 선택: 다음 웨이브 피해 감소 +2");
      showWaveBanner("Reinforce Guard");
      playSfx("ui");
    }

    setParty(nextParty);
    setPendingWaveChoice(false);
    setScene("battle");
    setShowCutscene(true);
  };

  const runRound = (skill: SkillId) => {
    if (battleEnded || scene !== "battle" || pendingWaveChoice) return;

    let nextParty = party.map(cloneFighter);
    let nextEnemies = enemies.map(cloneFighter);
    let nextGuard = guardBuff > 0 ? guardBuff : 0;
    let nextFocus = 0;

    const frontAlly = alive(nextParty)[0];
    const frontEnemy = alive(nextEnemies)[0];
    if (!frontAlly || !frontEnemy) return;

    const dealer = alive(nextParty).find((unit) => unit.role === "Dealer") ?? frontAlly;
    const support = alive(nextParty).find((unit) => unit.role === "Support");

    if (skill === "guard") {
      nextGuard += 3;
      spawnEffect("party", "GUARD", "guard");
      appendLog("Aegis Drake가 Guard Roar로 진형을 굳혔습니다.");
      showWaveBanner("Guard Roar");
      playSfx("ui");
    } else if (skill === "focus") {
      nextFocus = 3;
      spawnEffect("party", "FOCUS", "charge");
      appendLog("Ash Fang가 Focus Breath로 다음 타격을 준비합니다.");
      showWaveBanner("Focus Breath");
      playSfx("ui");
    } else {
      const skillBonus = skill === "ember" ? 5 : 2;
      const target = alive(nextEnemies)[0];
      if (target) {
        const damage = calculateDamage(dealer.atk, target.def, skillBonus + focusBuff + attackBuff + (selectedRoom === "forge" ? 1 : 0));
        target.hp = clamp(target.hp - damage);
        spawnPopup("enemy", target.id, damage, "damage");
        spawnEffect("enemy", skillLabels[skill].label, skill === "ember" ? "burst" : "slash");
        triggerFlash("enemy", target.id);
        applyHitStop();
        appendLog(`${dealer.name}의 ${skillLabels[skill].label} → ${target.name} ${damage} 피해`);
        showWaveBanner(skillLabels[skill].label);
        playSfx(skill === "ember" ? "burst" : "hit");
      }
    }

    if (support) {
      const healBonus = selectedRoom === "hatchery" ? 2 : 0;
      const lowest = alive(nextParty).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
      if (lowest && lowest.hp < lowest.maxHp) {
        const heal = 4 + healBonus;
        lowest.hp = Math.min(lowest.maxHp, lowest.hp + heal);
        spawnPopup("party", lowest.id, heal, "heal");
        spawnEffect("party", "HEAL", "charge");
        appendLog(`${support.name}이(가) ${lowest.name} 회복 +${heal}`);
        playSfx("heal");
      }
    }

    for (const enemy of alive(nextEnemies)) {
      const target = alive(nextParty)[0];
      if (!target) break;
      const trapPenalty = selectedRoom === "trap" ? 1 : 0;
      const damage = calculateDamage(enemy.atk - trapPenalty, target.def, -nextGuard);
      target.hp = clamp(target.hp - damage);
      spawnPopup("party", target.id, damage, "damage");
      spawnEffect("party", "HIT", "slash");
      triggerFlash("party", target.id);
      applyHitStop();
      appendLog(`${enemy.name} 공격 → ${target.name} ${damage} 피해`);
      playSfx("hit");
    }

    nextEnemies = nextEnemies.map((unit) => ({ ...unit }));
    nextParty = nextParty.map((unit) => ({ ...unit }));

    const aliveEnemies = alive(nextEnemies);
    const aliveParty = alive(nextParty);

    if (aliveEnemies.length === 0) {
      if (waveIndex + 1 >= wavePack.length) {
        setParty(nextParty);
        setEnemies(nextEnemies);
        setAttackBuff(0);
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
      setPendingWaveChoice(true);
      setScene("result");
      appendLog(`웨이브 ${nextWaveIndex} 진입 전 선택지를 고르세요.`);
      showWaveBanner(`Wave ${nextWaveIndex + 1} Prep`);
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
    setGuardBuff(nextGuard > 0 ? Math.max(0, nextGuard - 1) : 0);
    setFocusBuff(nextFocus);
    if (attackBuff > 0) setAttackBuff(Math.max(0, attackBuff - 1));
  };

  useEffect(() => {
    if (!auto || battleEnded || scene !== "battle" || combatPaused || pendingWaveChoice) return;
    const delay = speed === 1 ? 1200 : speed === 2 ? 700 : 350;
    const id = window.setTimeout(() => runRound(selectedSkill), delay);
    return () => window.clearTimeout(id);
  }, [auto, battleEnded, selectedSkill, speed, party, enemies, scene, combatPaused, pendingWaveChoice]);

  const resultText = battleEnded
    ? result === "Victory"
      ? "모든 웨이브 방어 성공. 둥지 운영과 전투 흐름이 하나의 루프로 연결되었습니다."
      : "둥지 방어 실패. 배속/가드/포커스 타이밍과 방 선택 효과를 다시 조정해야 합니다."
    : "전투 진행 중. 오토와 배속을 조합해 감각을 확인하세요.";

  const skillButtonStyle = (skill: SkillId): CSSProperties => ({
    backgroundImage: `linear-gradient(rgba(34,24,44,0.82), rgba(34,24,44,0.82)), url('/assets/ui/jrpg-window-skin-sheet.png')`,
  });

  return (
    <div className="min-h-screen bg-[#120f19] text-[#f8eedc]">
      <audio ref={bgmRef} src="/assets/audio/prototype-bgm.wav" loop preload="auto" />
      <audio ref={hitRef} src="/assets/audio/hit.wav" preload="auto" />
      <audio ref={burstRef} src="/assets/audio/burst.wav" preload="auto" />
      <audio ref={healRef} src="/assets/audio/heal.wav" preload="auto" />
      <audio ref={uiRef} src="/assets/audio/ui-confirm.wav" preload="auto" />

      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-3 py-3 md:px-4 md:py-4 lg:grid lg:grid-cols-[1.5fr_0.9fr]">
        <section className="relative overflow-hidden rounded-2xl border border-[#7a5f36] bg-[#1d1623] shadow-2xl">
          {scene === "nest" ? (
            <Image src="/assets/maps/dragon-nest-map.png" alt="Nest map" fill className="object-cover opacity-55" priority />
          ) : (
            <Image src="/assets/backgrounds/battle-background.png" alt="Battle background" fill className={`object-cover opacity-50 transition-transform duration-100 ${combatPaused ? "scale-[1.012]" : "scale-100"}`} priority />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(8,6,12,0.35),rgba(8,6,12,0.78))]" />
          <div className="relative z-10 flex min-h-[720px] flex-col justify-between p-4 md:p-6">
            {waveBanner ? <div className="pointer-events-none absolute left-1/2 top-20 z-20 -translate-x-1/2 rounded-full border border-[#d8b16c] bg-[rgba(24,16,28,0.92)] px-5 py-2 text-sm font-bold text-[#f7d58a] md:text-lg battle-banner">{waveBanner}</div> : null}

            {showCutscene ? (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-[rgba(5,4,8,0.76)] p-4">
                <div className="max-w-4xl overflow-hidden rounded-2xl border border-[#8d7148] bg-[#140f1b] shadow-2xl lg:grid lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="relative min-h-[280px]">
                    <Image src={scene === "nest" ? "/assets/events/nest-command-event.png" : "/assets/events/investigator-event.png"} alt="Event cutscene" fill className="object-cover" />
                  </div>
                  <div className="flex flex-col justify-between gap-4 p-5">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-[#caa86a]">Secretary Event</p>
                      <h2 className="mt-2 text-2xl font-bold">둥지 방어 브리핑</h2>
                      <p className="mt-3 text-sm leading-7 text-[#eadcc0]">{currentBriefing}</p>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-xs text-[#d6c4a0]">현재 둥지 핵심 방: {nestRooms.find((room) => room.id === selectedRoom)?.name}</div>
                      <button onClick={() => { setShowCutscene(false); playSfx("ui"); }} className="rounded-lg bg-[#8b5b32] px-4 py-2 font-semibold text-white hover:bg-[#a76d3d]">계속</button>
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
                  <p className="mb-4 text-sm leading-7 text-[#eadcc0]">원작의 둥지 운영 골자를 기준으로, 상위뷰 둥지에서 핵심 방을 고르고 방 효과를 전투에 반영하는 흐름을 검증합니다.</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {nestRooms.map((room) => (
                      <button key={room.id} onClick={() => { setSelectedRoom(room.id); playSfx("ui"); }} className={`rounded-xl border p-3 text-left transition ${selectedRoom === room.id ? "border-[#f4d08b] bg-[#61461f]" : "border-[#5e4d2e] bg-[#211a29] hover:bg-[#2e2238]"}`}>
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
                    <p>Forge: 공격 보너스 / Hatchery: 회복 강화 / Trap Hall: 적 공격 감소 / War Roost: 템포 / Archive: 정보 감각</p>
                    <button onClick={() => setAudioEnabled((v) => !v)} className="w-full rounded-lg bg-[#355b88] px-4 py-2 font-semibold text-white hover:bg-[#4473ac]">오디오 {audioEnabled ? "끄기" : "켜기"}</button>
                    <button onClick={startBattle} className="w-full rounded-lg bg-[#b13f34] px-4 py-3 font-semibold text-white hover:bg-[#c54c40]">전투 시작</button>
                  </div>
                </div>
              </div>
            ) : scene === "result" ? (
              <div className="rounded-xl border border-[#9a7a46] bg-[rgba(10,8,15,0.74)] p-6 backdrop-blur-sm">
                <h2 className="mb-3 text-3xl font-bold text-[#f5c56f]">{pendingWaveChoice ? `Wave ${waveIndex + 1} 선택` : result}</h2>
                {pendingWaveChoice ? (
                  <div>
                    <p className="mb-4 text-sm leading-7 text-[#eadcc0]">원작의 웨이브 사이 선택 구조를 참고해, 다음 전투 전 짧은 운영 결정을 넣었습니다.</p>
                    <div className="grid gap-3 md:grid-cols-3">
                      {waveChoices.map((choice) => (
                        <button key={choice.id} onClick={() => applyWaveChoice(choice.id)} className="rounded-xl border border-[#7f6540] bg-[#211a29] p-4 text-left hover:bg-[#32243a]">
                          <div className="font-semibold text-[#f4d08b]">{choice.name}</div>
                          <div className="mt-1 text-xs text-[#d8c7a1]">{choice.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="mb-4 text-sm leading-7 text-[#eadcc0]">{resultText}</p>
                    <div className="mb-4 grid gap-3 sm:grid-cols-3">
                      <RewardCard label="Gold" value={rewardState.gold} />
                      <RewardCard label="Essence" value={rewardState.essence} />
                      <RewardCard label="Score" value={rewardState.score} />
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button onClick={resetBattle} className="rounded-lg bg-[#355b88] px-4 py-2 font-semibold text-white hover:bg-[#4473ac]">둥지로 돌아가기</button>
                      <button onClick={() => { setScene("battle"); setBattleEnded(false); setResult(null); playSfx("ui"); }} className="rounded-lg bg-[#5a4b68] px-4 py-2 font-semibold text-white hover:bg-[#715b82]">결과 화면 닫기</button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className={`relative grid grid-cols-1 gap-6 lg:grid-cols-2 transition-transform duration-75 ${combatPaused ? "scale-[0.996]" : "scale-100"}`}>
                <EffectStage effects={effectLayers.filter((effect) => effect.team === "party")} side="party" />
                <EffectStage effects={effectLayers.filter((effect) => effect.team === "enemy")} side="enemy" />
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
                      onClick={() => { setSelectedSkill(skill); playSfx("ui"); }}
                      className={`rounded-lg border px-4 py-3 text-sm transition bg-[length:cover] bg-center ${selectedSkill === skill ? "border-[#f4d08b] text-white shadow-[0_0_16px_rgba(244,208,139,0.25)]" : "border-[#6e5b3b] text-[#e9dbbd] hover:bg-[#3a2d43]"}`}
                      style={skillButtonStyle(skill)}
                    >
                      <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${skillLabels[skill].color} text-lg`}>{skillLabels[skill].icon}</div>
                      <div className="font-semibold">{skillLabels[skill].label}</div>
                      <div className="text-xs opacity-80">{skillLabels[skill].desc}</div>
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button onClick={() => runRound(selectedSkill)} disabled={battleEnded || combatPaused} className="rounded-lg bg-[#b13f34] px-4 py-2 font-semibold text-white hover:bg-[#c54c40] disabled:opacity-50">턴 진행</button>
                  <button onClick={() => setAuto((v) => !v)} className="rounded-lg bg-[#355b88] px-4 py-2 font-semibold text-white hover:bg-[#4473ac]">오토 {auto ? "끄기" : "켜기"}</button>
                  <button onClick={() => setSpeed((v) => (v === 1 ? 2 : v === 2 ? 4 : 1))} className="rounded-lg bg-[#4a6b3e] px-4 py-2 font-semibold text-white hover:bg-[#5f8650]">배속 변경 ({speed}x)</button>
                  <button onClick={() => { setShowCutscene(true); playSfx("ui"); }} className="rounded-lg bg-[#8b5b32] px-4 py-2 font-semibold text-white hover:bg-[#a76d3d]">컷신 보기</button>
                  <button onClick={resetBattle} className="rounded-lg bg-[#5a4b68] px-4 py-2 font-semibold text-white hover:bg-[#715b82]">전투 리셋</button>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <aside className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-2xl border border-[#7a5f36] bg-[#1a1420]">
            <div className="border-b border-[#7a5f36] px-4 py-3"><h2 className="text-lg font-bold">Secretary Briefing</h2></div>
            <div className="flex gap-3 p-4">
              <div className="relative h-36 w-28 shrink-0 overflow-hidden rounded-xl border border-[#8b6f47] md:h-40 md:w-32"><Image src={scene === "battle" ? "/assets/characters/secretary-portrait-serious.png" : "/assets/characters/secretary-portrait.png"} alt="Secretary portrait" fill className="object-cover" /></div>
              <div className="text-sm leading-6 text-[#ebdfc4]">
                <p className="mb-2">“기준선은 원작의 전투 감각과 둥지 운영 구조입니다. 웹에 맞게 압축하되, 리듬은 그쪽을 따라가겠습니다.”</p>
                <p>{currentBriefing}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#7a5f36] bg-[#1a1420] p-4">
            <h2 className="mb-3 text-lg font-bold">Battle Log</h2>
            <div className="space-y-2 text-sm text-[#f2e8cf]">
              {logs.map((entry) => <div key={entry.id} className="rounded-lg bg-[#241b2d] px-3 py-2">{entry.text}</div>)}
            </div>
          </div>

          <div className="rounded-2xl border border-[#7a5f36] bg-[#1a1420] p-4 text-sm text-[#eddcb5]">
            <h2 className="mb-2 text-lg font-bold">Status</h2>
            <p className="mb-2">현재 화면: {scene === "nest" ? "둥지" : scene === "battle" ? "전투" : "결과"}</p>
            <p className="mb-2">선택된 둥지 방: {nestRooms.find((room) => room.id === selectedRoom)?.name}</p>
            <p className="mb-2">공격 버프: +{attackBuff} / 방어 버프: +{guardBuff}</p>
            <p className="mb-2">오디오: {audioEnabled ? "ON" : "OFF"}</p>
            <p>{battleEnded ? (result === "Victory" ? "웹 전투 프로토 1차 승리 상태." : "재도전 및 밸런스 조정 필요.") : "전투 진행 중. 오토와 배속을 조합해 감각을 확인하세요."}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function RewardCard({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border border-[#7f6540] bg-[#1d1724] p-4"><div className="text-xs uppercase tracking-[0.25em] text-[#d8b16a]">{label}</div><div className="mt-2 text-2xl font-bold text-[#f6e3b3]">{value}</div></div>;
}

function EffectStage({ effects, side }: { effects: EffectLayer[]; side: "party" | "enemy" }) {
  return (
    <div className={`pointer-events-none absolute inset-y-0 ${side === "party" ? "left-0 right-1/2" : "left-1/2 right-0"}`}>
      {effects.map((effect) => (
        <div key={effect.id} className={`absolute top-1/2 ${side === "party" ? "left-[38%]" : "right-[38%]"} -translate-y-1/2 text-4xl font-black battle-effect ${effect.style === "burst" ? "text-orange-300" : effect.style === "guard" ? "text-sky-300" : effect.style === "charge" ? "text-violet-300" : "text-amber-200"}`}>{effect.label}</div>
      ))}
    </div>
  );
}

function TeamPanel({ title, team, accent, reverse = false, popups, flashedId }: { title: string; team: Fighter[]; accent: "emerald" | "rose"; reverse?: boolean; popups: DamagePopup[]; flashedId: string | null }) {
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
              {unitPopups.map((popup) => <div key={popup.id} className={`pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 text-xl font-bold battle-popup ${popup.kind === "heal" ? "text-emerald-300" : "text-rose-300"}`}>{popup.kind === "heal" ? `+${popup.value}` : `-${popup.value}`}</div>)}
              <div className={`mb-1 flex items-center justify-between gap-3 transition-transform duration-100 ${isFlashed ? (reverse ? "-translate-x-1" : "translate-x-1") : "translate-x-0"}`}>
                <div>
                  <div className="font-semibold text-[#f8edd5]">{fighter.name}</div>
                  <div className="text-xs text-[#d8c7a1]">{fighter.role ?? "Enemy"}</div>
                </div>
                <div className="text-sm text-[#e6d6b1]">{fighter.hp}/{fighter.maxHp}</div>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-[#3a2f44]"><div className={`h-full rounded-full transition-all duration-300 ${accent === "emerald" ? "bg-emerald-500" : "bg-rose-500"}`} style={{ width: `${percent}%` }} /></div>
              <div className="mt-2 text-xs text-[#cdb88b]">ATK {fighter.atk} · DEF {fighter.def} · SPD {fighter.speed}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
