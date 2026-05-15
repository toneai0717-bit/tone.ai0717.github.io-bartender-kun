"use client";

import { useState } from "react";

interface Cocktail {
  name: string;
  strength: string;
  technique: string;
  materials: string;
  steps: string;
  snack: string;
  msg: string;
}

const BASES = ["ジン", "ウォッカ", "テキーラ", "ラム", "ウイスキー"];

const TASTES = [
  { emoji: "🍋", label: "さっぱり" },
  { emoji: "🍭", label: "甘め" },
  { emoji: "🌶️", label: "辛口" },
  { emoji: "🍎", label: "フルーティー" },
  { emoji: "🫧", label: "炭酸あり" },
  { emoji: "🥃", label: "強め" },
];

const techniqueEmoji: Record<string, string> = {
  ビルド: "🥃",
  ステア: "🥄",
  シェイク: "🍶",
};

export default function Home() {
  const [mode, setMode] = useState<"standard" | "craft">("standard");
  const [base, setBase] = useState("ジン");
  const [tool, setTool] = useState<"none" | "shaker">("none");
  const [tastes, setTastes] = useState<string[]>([]);
  const [ingredients, setIngredients] = useState("");
  const [loading, setLoading] = useState(false);
  const [cocktails, setCocktails] = useState<Cocktail[]>([]);

  const toggleTaste = (label: string) => {
    setTastes((prev) =>
      prev.includes(label) ? prev.filter((t) => t !== label) : [...prev, label]
    );
  };

  const generate = async () => {
    setLoading(true);
    setCocktails([]);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, base, tool, tastes, ingredients }),
      });
      const data = await res.json();
      setCocktails(data.cocktails || []);
    } catch {
      alert("エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1c2c] font-sans text-slate-200">
      {/* Header */}
      <header className="text-center px-6 py-8">
        <h1 className="text-3xl font-black text-amber-400 tracking-tight" style={{ textShadow: "0 0 20px rgba(251,191,36,0.3)" }}>
          🍸 お任せバーテンダーくん
        </h1>
        <p className="text-slate-400 text-sm mt-2">今夜の気分に合わせた最高の一杯を。</p>
      </header>

      <div className="max-w-xl mx-auto px-4 pb-10 space-y-3">

        {/* 設定まとめカード */}
        <div className="bg-[#252a44] rounded-2xl p-5 border border-white/5 space-y-5">

          {/* 提案モード */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">提案モード</p>
            <div className="flex gap-2">
              {[
                { value: "standard", label: "🍹 定番 (Standard)" },
                { value: "craft", label: "🥂 こだわり (Craft)" },
              ].map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMode(m.value as "standard" | "craft")}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    mode === m.value
                      ? "bg-amber-400 text-slate-900 shadow-lg shadow-amber-400/20"
                      : "bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-white/5" />

          {/* ベース */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">ベース・スピリッツ</p>
            <div className="flex gap-2 flex-wrap">
              {BASES.map((b) => (
                <button
                  key={b}
                  onClick={() => setBase(b)}
                  className={`flex-1 min-w-[80px] py-2.5 rounded-xl text-sm font-bold transition-all ${
                    base === b
                      ? "bg-amber-400 text-slate-900 shadow-lg shadow-amber-400/20"
                      : "bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-white/5" />

          {/* 道具 */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">道具</p>
            <div className="flex gap-2">
              {[
                { value: "none", label: "🥃 道具なし" },
                { value: "shaker", label: "🍶 シェイカーあり" },
              ].map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTool(t.value as "none" | "shaker")}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    tool === t.value
                      ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                      : "bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-white/5" />

          {/* テイスト */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">今日のテイスト</p>
            <div className="flex flex-wrap gap-2">
              {TASTES.map((t) => (
                <button
                  key={t.label}
                  onClick={() => toggleTaste(t.label)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    tastes.includes(t.label)
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white/5 text-slate-400 border-white/10 hover:border-white/30"
                  }`}
                >
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-white/5" />

          {/* 手持ち材料 */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">家にある材料・こだわり</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                placeholder="例：ライム、ミント、コーラ"
                className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-400/50 transition-colors"
              />
              <button
                onClick={() => { setTastes([]); setIngredients(""); }}
                className="px-4 py-2.5 bg-white/5 text-slate-400 rounded-xl text-xs font-medium hover:bg-white/10 transition-colors border border-white/10"
              >
                リセット
              </button>
            </div>
          </div>

        </div>

        {/* 生成ボタン */}
        <button
          onClick={generate}
          disabled={loading}
          className="w-full bg-amber-400 text-slate-900 py-5 rounded-2xl font-black text-lg hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-amber-400/20"
        >
          {loading ? "バーテンダーが考えてます...🍸" : "カクテルを3つ提案してもらう"}
        </button>

        {/* 結果 */}
        {cocktails.length > 0 && (
          <div className="space-y-4 pt-2">
            <p className="text-xs text-slate-500 text-center uppercase tracking-widest">今夜のおすすめ</p>
            {cocktails.map((c, i) => (
              <div key={i} className="bg-[#252a44] rounded-2xl p-5 border border-white/5">
                {/* ヘッダー */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-xl text-amber-400">{c.name}</span>
                    {c.technique && (
                      <span className="text-xs bg-blue-500/15 border border-blue-500/30 text-blue-400 px-2.5 py-1 rounded-full font-bold">
                        {techniqueEmoji[c.technique] || "🥃"} {c.technique}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">度数 {c.strength}</span>
                </div>

                {/* 材料 */}
                <div className="bg-black/20 border-l-4 border-amber-400 rounded-xl p-3 mb-3">
                  <p className="text-xs font-bold text-amber-400 mb-1">レシピ</p>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{c.materials}</p>
                </div>

                {/* 作り方 */}
                <div className="mb-3">
                  <p className="text-xs font-bold text-slate-500 mb-1">作り方</p>
                  <p className="text-sm text-slate-300 leading-relaxed">{c.steps}</p>
                </div>

                {/* おつまみ */}
                <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl p-3 mb-3">
                  <p className="text-sm text-yellow-300">🧀 <strong>おつまみ：</strong>{c.snack}</p>
                </div>

                {/* バーテンダーの一言 */}
                <p className="text-xs text-slate-500 italic mb-4">「{c.msg}」</p>

                {/* リンク */}
                <div className="flex gap-2">
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(c.name + " 作り方")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 bg-red-500/80 text-white rounded-xl text-xs font-bold text-center hover:bg-red-500 transition-colors"
                  >
                    ▶ 動画検索
                  </a>
                  <a
                    href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(c.name + " カクテル")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 bg-white/10 text-slate-300 rounded-xl text-xs font-bold text-center hover:bg-white/20 transition-colors"
                  >
                    📷 画像検索
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
