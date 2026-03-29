"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { initialParty, skillLabels, type Fighter, type SkillId, wavePack } from "@/lib/battle-data";

type LogEntry = { id: number; text: string };

const cloneFighter = (fighter: Fighter): Fighter => ({ ...fighter });
const alive = (team: Fighter[]) => team.filter((unit) => unit.hp > 0);
const clamp = (value: number, min = 0) => (value < min ? min : value);

export function BattlePrototype() {
  const [party, setParty] = useState<Fighter[]>(() => initialParty.map(cloneFighter));
  const [waveIndex, setWaveIndex] = useState(0);
  const [enemies, setEnemies] = useState<Fighter[]>(() => wavePack[0].map(cloneFighter));
  const [selectedSkill, setSelectedSkill] = useState<SkillId>("claw");
  const [logs, setLogs] = useState<LogEntry[]>([{ id: 1, text: "전투 시작. 둥지를 방어하세요." }]);
  const [auto, setAuto] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [guardBuff, setGuardBuff] = useState(0);
  const [focusBuff, setFocusBuff] = useState(0);
  const [battleEnded, setBattleEnded] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [logId, setLogId] = useState(2);

  const currentWaveLabel = useMemo(() => ["Raiders", "Militia", "Investigators"][waveIndex] ?? "Final", [waveIndex]);

  const appendLog = (text: string) => {
    setLogs((prev) => [{ id: logId, text }, ...prev].slice(0, 8));
    setLogId((prev) => prev + 1);
  };

  const resetBattle = () => {
    setParty(initialParty.map(cloneFighter));
    setWaveIndex(0);
    setEnemies(wavePack[0].map(cloneFighter));
    setSelectedSkill("claw");
    setLogs([{ id: 1, text: "전투 시작. 둥지를 방어하세요." }]);
    setAuto(false);
    setSpeed(1);
    setGuardBuff(0);
    setFocusBuff(0);
    setBattleEnded(false);
    setResult(null);
    setLogId(2);
  };

  const calculateDamage = (atk: number, def: number, extra = 0) => Math.max(1, atk + extra - def);

  const runRound = (skill: SkillId) => {
    if (battleEnded) return;

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
    } else if (skill === "focus") {
      nextFocus = 3;
      appendLog("Ash Fang가 Focus Breath로 다음 타격을 준비합니다.");
    } else {
      const skillBonus = skill === "ember" ? 6 : 2;
      const target = alive(nextEnemies)[0];
      if (target) {
        const damage = calculateDamage(dealer.atk, target.def, skillBonus + focusBuff);
        target.hp = clamp(target.hp - damage);
        appendLog(`${dealer.name}의 ${skillLabels[skill].label} → ${target.name} ${damage} 피해`);
      }
    }

    if (support) {
      const lowest = alive(nextParty).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
      if (lowest && lowest.hp < lowest.maxHp) {
        lowest.hp = Math.min(lowest.maxHp, lowest.hp + 4);
        appendLog(`${support.name}이(가) ${lowest.name} 회복 +4`);
      }
    }

    for (const enemy of alive(nextEnemies)) {
      const target = alive(nextParty)[0];
      if (!target) break;
      const damage = calculateDamage(enemy.atk, target.def, -nextGuard);
      target.hp = clamp(target.hp - damage);
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
        setBattleEnded(true);
        setResult("Victory");
        appendLog("모든 웨이브를 막아냈습니다.");
        return;
      }

      const nextWaveIndex = waveIndex + 1;
      setWaveIndex(nextWaveIndex);
      setParty(nextParty);
      setEnemies(wavePack[nextWaveIndex].map(cloneFighter));
      setGuardBuff(nextGuard);
      setFocusBuff(nextFocus);
      appendLog(`다음 웨이브: ${["Raiders", "Militia", "Investigators"][nextWaveIndex]}`);
      return;
    }

    if (aliveParty.length === 0) {
      setParty(nextParty);
      setEnemies(nextEnemies);
      setBattleEnded(true);
      setResult("Defeat");
      appendLog("둥지 방어에 실패했습니다.");
      return;
    }

    setParty(nextParty);
    setEnemies(nextEnemies);
    setGuardBuff(nextGuard);
    setFocusBuff(nextFocus);
  };

  useEffect(() => {
    if (!auto || battleEnded) return;
    const delay = speed === 1 ? 1200 : speed === 2 ? 700 : 350;
    const id = window.setTimeout(() => runRound(selectedSkill), delay);
    return () => window.clearTimeout(id);
  }, [auto, battleEnded, selectedSkill, speed, party, enemies]);

  return (
    <div className="min-h-screen bg-[#120f19] text-[#f8eedc]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-4 lg:grid lg:grid-cols-[1.5fr_0.9fr]">
        <section className="relative overflow-hidden rounded-2xl border border-[#7a5f36] bg-[#1d1623] shadow-2xl">
          <Image src="/assets/backgrounds/battle-background.png" alt="Battle background" fill className="object-cover opacity-50" priority />
          <div className="relative z-10 flex min-h-[620px] flex-col justify-between p-6">
            <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#9a7a46] bg-[rgba(16,12,22,0.8)] px-4 py-3 backdrop-blur-sm">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[#caa86a]">DoongD Web Battle Prototype</p>
                <h1 className="text-2xl font-bold">{currentWaveLabel} Wave Defense</h1>
              </div>
              <div className="text-right text-sm text-[#e5d5b0]">
                <div>배속: {speed}x</div>
                <div>오토: {auto ? "ON" : "OFF"}</div>
                <div>선택 스킬: {skillLabels[selectedSkill].label}</div>
              </div>
            </header>

            <div className="grid grid-cols-2 gap-6">
              <TeamPanel title="Nest Defenders" team={party} accent="emerald" />
              <TeamPanel title="Invaders" team={enemies} accent="rose" reverse />
            </div>

            <div className="rounded-xl border border-[#9a7a46] bg-[rgba(12,10,18,0.82)] p-4 backdrop-blur-sm">
              <div className="mb-3 flex flex-wrap gap-2">
                {(["claw", "ember", "guard", "focus"] as SkillId[]).map((skill) => (
                  <button
                    key={skill}
                    onClick={() => setSelectedSkill(skill)}
                    className={`rounded-lg border px-4 py-2 text-sm transition ${selectedSkill === skill ? "border-[#f4d08b] bg-[#6e4d1f] text-white" : "border-[#6e5b3b] bg-[#2a2231] text-[#e9dbbd] hover:bg-[#3a2d43]"}`}
                  >
                    <div className="font-semibold">{skillLabels[skill].label}</div>
                    <div className="text-xs opacity-80">{skillLabels[skill].desc}</div>
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <button onClick={() => runRound(selectedSkill)} disabled={battleEnded} className="rounded-lg bg-[#b13f34] px-4 py-2 font-semibold text-white hover:bg-[#c54c40] disabled:opacity-50">턴 진행</button>
                <button onClick={() => setAuto((v) => !v)} className="rounded-lg bg-[#355b88] px-4 py-2 font-semibold text-white hover:bg-[#4473ac]">오토 {auto ? "끄기" : "켜기"}</button>
                <button onClick={() => setSpeed((v) => (v === 1 ? 2 : v === 2 ? 4 : 1))} className="rounded-lg bg-[#4a6b3e] px-4 py-2 font-semibold text-white hover:bg-[#5f8650]">배속 변경 ({speed}x)</button>
                <button onClick={resetBattle} className="rounded-lg bg-[#5a4b68] px-4 py-2 font-semibold text-white hover:bg-[#715b82]">전투 리셋</button>
              </div>
            </div>
          </div>
        </section>

        <aside className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-2xl border border-[#7a5f36] bg-[#1a1420]">
            <div className="border-b border-[#7a5f36] px-4 py-3">
              <h2 className="text-lg font-bold">Secretary Briefing</h2>
            </div>
            <div className="flex gap-3 p-4">
              <div className="relative h-40 w-32 shrink-0 overflow-hidden rounded-xl border border-[#8b6f47]">
                <Image src="/assets/characters/secretary-portrait.png" alt="Secretary portrait" fill className="object-cover" />
              </div>
              <div className="text-sm leading-6 text-[#ebdfc4]">
                <p className="mb-2">“이번 웹 프로토는 둥지 방어 전투의 손맛과 배속 시뮬레이션을 빠르게 검증하기 위한 전투 전용 빌드입니다.”</p>
                <p>가드, 포커스, 화염 버스트를 섞어 웨이브 3개를 막아내세요.</p>
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
            <h2 className="mb-2 text-lg font-bold">Result</h2>
            {battleEnded ? (
              <div>
                <div className="mb-2 text-xl font-bold text-[#f5c56f]">{result}</div>
                <p>{result === "Victory" ? "전 웨이브 방어 성공. 웹 전투 프로토 1차 목표 달성." : "아군 전멸. 밸런스 조정 필요."}</p>
              </div>
            ) : (
              <p>전투 진행 중. 오토와 배속을 조합해 감각을 확인하세요.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function TeamPanel({ title, team, accent, reverse = false }: { title: string; team: Fighter[]; accent: "emerald" | "rose"; reverse?: boolean }) {
  return (
    <div className="rounded-xl border border-[#9a7a46] bg-[rgba(10,8,15,0.72)] p-4 backdrop-blur-sm">
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      <div className="space-y-3">
        {team.map((fighter) => {
          const percent = Math.max(0, (fighter.hp / fighter.maxHp) * 100);
          return (
            <div key={fighter.id} className={`rounded-xl border border-[#5e4d2e] bg-[#211a29] p-3 ${reverse ? "text-right" : ""}`}>
              <div className="mb-1 flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-[#f8edd5]">{fighter.name}</div>
                  <div className="text-xs text-[#d8c7a1]">{fighter.role ?? "Enemy"}</div>
                </div>
                <div className="text-sm text-[#e6d6b1]">{fighter.hp}/{fighter.maxHp}</div>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-[#3a2f44]">
                <div className={`h-full rounded-full ${accent === "emerald" ? "bg-emerald-500" : "bg-rose-500"}`} style={{ width: `${percent}%` }} />
              </div>
              <div className="mt-2 text-xs text-[#cdb88b]">ATK {fighter.atk} · DEF {fighter.def} · SPD {fighter.speed}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
