import React, { useState, useEffect } from "react";
import { ConfessionType, User } from "../types";
import { TEMPLATE_STYLES, SIZE_DIMENSIONS, FONT_PAIRINGS } from "./TemplateStyles";
import { encryptText } from "../utils/crypto";
import { Sparkles, Send, ShieldAlert, Sparkle, RefreshCw, PenTool, LayoutTemplate, Expand, Eye } from "lucide-react";

interface ConfessionFormProps {
  currentUser: User;
  privacyKey: string;
  onSuccess: (newConfession: any) => void;
}

export default function ConfessionForm({
  currentUser,
  privacyKey,
  onSuccess
}: ConfessionFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<ConfessionType>(ConfessionType.FREE_TEXT);
  const [templateStyleId, setTemplateStyleId] = useState("style-night");
  const [cardSize, setCardSize] = useState<"SQUARE" | "PORTRAIT" | "LANDSCAPE">("SQUARE");
  const [penName, setPenName] = useState(currentUser.penName || "Hamba Allah");
  const [isAnonymousToAdmin, setIsAnonymousToAdmin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  // Update penName when currentUser updates
  useEffect(() => {
    if (currentUser.penName) {
      setPenName(currentUser.penName);
    }
  }, [currentUser]);

  const activeStyle = TEMPLATE_STYLES.find(s => s.id === templateStyleId) || TEMPLATE_STYLES[0];
  const layout = FONT_PAIRINGS[type] || FONT_PAIRINGS.FREE_TEXT;
  const dimensions = SIZE_DIMENSIONS[cardSize] || SIZE_DIMENSIONS.SQUARE;

  // Auto-generate some prompt examples depending on confession type
  const handleRandomPrompt = () => {
    let examples: string[] = [];
    switch (type) {
      case ConfessionType.QUOTE:
        examples = [
          "Terkadang, melepaskan adalah tindakan paling berani yang bisa kita ambil.",
          "Di balik kelamnya malam, selalu ada fajar hangat yang menanti dengan senyuman.",
          "Menjadi kuat tidak berarti tidak pernah menangis, melainkan bangkit setelah setiap tetesan air mata."
        ];
        break;
      case ConfessionType.POETRY:
        examples = [
          "Bait sunyi mengalir perlahan,\nMenyusuri relung hati yang tertawan.\nKutanya angin malam yang berembun,\nAdakah kedamaian yang kan menuntun?",
          "Di sela jemari rintik hujan,\nKutitipkan sebait kenangan.\nTentang mimpi yang belum usai,\nDan asa yang perlahan mulai damai."
        ];
        break;
      case ConfessionType.PANTUN:
        examples = [
          "Pergi ke pasar membeli mangga,\nMangga manis harum baunya.\nJangan pendam lara di dada,\nCurahkan saja di Ruang Teduh kita.",
          "Burung merpati terbang melayang,\nHinggap sebentar di dahan rindang.\nKerasnya hidup janganlah bimbang,\nEsok hari fajar kan terang."
        ];
        break;
      case ConfessionType.SONG_LYRIC:
        examples = [
          "[Verse 1]\nKu berjalan di tengah badai sepi\nMencari arti tenang di hati\n[Chorus]\nOoo... dekap aku dalam tenangnya jiwamu\nBiarkan lara menguap bersama debu",
          "[Intro]\nNada ini tercipta dari keluh\n[Chorus]\nNamun ku tahu esok lusa ku takkan jatuh\nKembali teguh, kembali utuh"
        ];
        break;
      case ConfessionType.FREE_TEXT:
        examples = [
          "Hari ini rasanya melelahkan sekali. Ujian tadi siang membuatku cemas setengah mati, ditambah tumpukan tugas yang tiada habisnya. Aku hanya ingin didengar tanpa dihakimi.",
          "Aku merasa tidak berdaya melihat orang tuaku bertengkar semalam. Di sekolah aku mencoba tersenyum, tapi di dalam hati rasanya sesak sekali."
        ];
        break;
    }
    const rand = examples[Math.floor(Math.random() * examples.length)];
    setContent(rand);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setStatusMsg("Isi curahan hatimu tidak boleh kosong.");
      return;
    }

    setIsSubmitting(true);
    setStatusMsg("Mengamankan curhatan Anda...");

    try {
      // 1. Encrypt with user's local privacy key to keep it secure for the user
      const userKey = privacyKey || "RAHASIA123";
      const encryptedPayload = encryptText(content, userKey);

      // 2. Encrypt with Counselor Master Key "GURUBK123" to allow counselor viewing
      const ADMIN_ENCRYPTION_KEY = "GURUBK123"; 
      const adminEncryptedPayload = encryptText(content, ADMIN_ENCRYPTION_KEY);

      // Create initial confession entry
      const response = await fetch("/api/confessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          authorPenName: penName || "Hamba Allah",
          type,
          title: title || "Curahan Rasa",
          encryptedContent: encryptedPayload,
          adminEncryptedContent: adminEncryptedPayload,
          templateStyleId,
          cardSize,
          isAnonymousToAdmin
        })
      });

      if (!response.ok) {
        throw new Error("Gagal menyimpan curhatan ke server.");
      }

      const savedConfession = await response.json();

      setStatusMsg("");
      setTitle("");
      setContent("");
      setIsAnonymousToAdmin(false);
      onSuccess(savedConfession);

    } catch (err: any) {
      console.error(err);
      setStatusMsg("Gagal: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full" id="curhat-form-container">
      {/* Writing Pad Customizer (Left Side) */}
      <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xl flex flex-col gap-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-orange-50 rounded-lg text-[#f05a28] border border-orange-100">
            <PenTool size={18} />
          </div>
          <h2 className="text-lg font-serif italic text-[#7244ab] font-bold tracking-tight">Buat Curahan Karya Indah</h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Format Type Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">Format Karya</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { type: ConfessionType.FREE_TEXT, label: "📝 Bebas" },
                { type: ConfessionType.QUOTE, label: "💬 Quotes" },
                { type: ConfessionType.POETRY, label: "✒️ Puisi" },
                { type: ConfessionType.PANTUN, label: "📜 Pantun" },
                { type: ConfessionType.SONG_LYRIC, label: "🎵 Lirik" }
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setType(item.type)}
                  className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                    type === item.type
                      ? "bg-[#f05a28] border-[#ff5d24] text-white shadow-sm"
                      : "bg-[#f3effa] border-purple-100 text-purple-800 hover:bg-purple-100/50"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Template Style Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <LayoutTemplate size={12} className="text-slate-400" /> Desain Template
              </label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TEMPLATE_STYLES.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setTemplateStyleId(style.id)}
                  className={`py-2 px-2.5 text-xs text-left rounded-xl border transition-all cursor-pointer truncate ${
                    templateStyleId === style.id
                      ? "bg-orange-100 border-[#ff5d24] text-[#f05a28] font-bold shadow-xs"
                      : "bg-[#f3effa] border-purple-100 text-purple-800 hover:bg-purple-100/50"
                  }`}
                >
                  {style.name}
                </button>
              ))}
            </div>
          </div>

          {/* Card Dimensions & Pen Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                <Expand size={12} className="text-slate-400" /> Ukuran Kanvas
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { size: "SQUARE", label: "1:1 Kotak" },
                  { size: "PORTRAIT", label: "9:16 Story" },
                  { size: "LANDSCAPE", label: "16:9 Lebar" }
                ].map((item) => (
                  <button
                    key={item.size}
                    type="button"
                    onClick={() => setCardSize(item.size as any)}
                    className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                      cardSize === item.size
                        ? "bg-[#f05a28] border-[#ff5d24] text-white shadow-sm"
                        : "bg-[#f3effa] border-purple-100 text-purple-800 hover:bg-purple-100/50"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-purple-700 mb-1.5 uppercase tracking-wider">Nama Pena Anda</label>
              <input
                type="text"
                value={penName}
                onChange={(e) => setPenName(e.target.value)}
                placeholder="Misal: Penyair Sunyi, Senja Sendu..."
                className="w-full p-2.5 rounded-xl bg-[#f3effa] border border-purple-100 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-[#ff5d24] font-mono font-bold transition-all"
                maxLength={30}
              />
            </div>
          </div>

          {/* Title & Content Pad */}
          <div className="flex flex-col gap-3 border-t border-slate-100 pt-4">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-purple-700 uppercase tracking-wider">Isi Curahan Hati</label>
              <button
                type="button"
                onClick={handleRandomPrompt}
                className="text-xs text-[#f05a28] hover:text-[#e04f1c] flex items-center gap-1 cursor-pointer font-bold font-mono bg-orange-50 px-2 py-1 rounded-lg border border-orange-100"
              >
                <RefreshCw size={11} className="text-[#f05a28] animate-spin-slow" /> Beri Inspirasi Contoh
              </button>
            </div>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Berikan Judul Karya Anda (Misal: Badai Redup, Sajak Pagi)..."
              className="w-full p-2.5 rounded-xl bg-[#f3effa] border border-purple-100 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-[#ff5d24] font-serif font-bold transition-all"
            />

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                type === ConfessionType.QUOTE ? "Tulis kutipan indahmu di sini..." :
                type === ConfessionType.POETRY ? "Tulis bait puisi yang mengalir dari sukmamu di sini..." :
                type === ConfessionType.PANTUN ? "Tulis sampiran dan isi pantunmu di sini (4 baris)..." :
                type === ConfessionType.SONG_LYRIC ? "Tulis bait lirik lagu syahdumu di sini..." :
                "Tulis bebas keluh kesahmu, perasaan cemas, lelah, gembira, atau rindu di sini..."
              }
              className="w-full p-3 rounded-xl bg-[#f3effa] border border-purple-100 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-[#ff5d24] min-h-[160px] font-mono leading-relaxed font-bold transition-all"
              required
            />
          </div>

          {/* Anonymity Controls & Submitting */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-t border-slate-100 pt-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAnonymousToAdmin}
                onChange={(e) => setIsAnonymousToAdmin(e.target.checked)}
                className="rounded border-purple-200 text-[#f05a28] focus:ring-[#f05a28]/40 h-4 w-4 bg-[#f3effa]"
              />
              <span className="text-xs text-purple-950 font-bold">Sembunyikan identitas saya dari Pemandu (Kirim Anonim)</span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#f05a28] hover:bg-[#e04f1c] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="animate-spin" size={14} />
                  <span>{statusMsg || "Mengirim..."}</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Kirim ke Ruang Teduh</span>
                </>
              )}
            </button>
          </div>

          {statusMsg && !isSubmitting && (
            <div className="p-3 bg-orange-50 rounded-xl border border-orange-200 text-xs text-[#f05a28] flex items-center gap-2 font-mono font-bold animate-pulse">
              <Sparkles size={14} className="text-[#f05a28]" />
              <span>{statusMsg}</span>
            </div>
          )}
        </form>
      </div>

      {/* Live Template Card Preview (Right Side) */}
      <div className="lg:col-span-5 flex flex-col items-center gap-4 sticky top-6">
        <div className="flex items-center gap-1.5 self-start text-xs text-purple-200 font-mono font-bold">
          <Eye size={13} className="text-orange-400" />
          <span>Pratinjau Desain Kartu Curhatan</span>
        </div>

        {/* The Live Rendering Card */}
        <div 
          className={`relative ${dimensions} ${activeStyle.bgClass} rounded-3xl flex flex-col justify-between shadow-xl border ${activeStyle.borderClass} overflow-hidden`}
        >
          <div className="flex items-center justify-between w-full mb-4 z-10">
            <span className="text-[9px] uppercase tracking-widest bg-white/40 px-2 py-0.5 rounded-full font-mono backdrop-blur-xs font-bold border border-white/20">
              PRATINJAU
            </span>
            <span className="flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-mono text-[9px] font-bold">
              🔒 Terbuka
            </span>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center my-4 z-10 w-full">
            <div className="w-full flex flex-col justify-center text-center">
              <h3 className={`${layout.title} mb-4 text-center tracking-wide`}>
                {title || "Sajak Rahasia"}
              </h3>
              
              <p className={`${layout.body} w-full`}>
                {content || "Tuliskan isi hati Anda di lembar pad penulisan... Desain template, font, dan ukuran kartu ini akan ter-update secara real-time."}
              </p>

              <p className={`${layout.author} mt-4 text-right italic font-mono`}>
                — {isAnonymousToAdmin ? "Jiwa Anonim" : penName || "Nama Pena Anda"}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between w-full mt-4 pt-3 border-t border-black/10 z-10 text-[9px] opacity-75 font-mono">
            <span>{new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <span className="text-[8px] bg-black/5 px-1.5 py-0.5 rounded-sm">Kunci Sandi Aktif</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-3xl border border-purple-100 text-[11px] text-purple-950 w-full flex flex-col gap-1.5 shadow-md">
          <span className="font-bold text-[#f05a28] flex items-center gap-1">
            <Sparkle size={12} className="text-[#f05a28] animate-pulse" /> Jaminan Enkripsi Privasi
          </span>
          <p className="leading-relaxed font-sans text-purple-900 font-bold">
            Pesan Anda dikirimkan dengan standar enkripsi simetris ganda. Curhatan hanya dapat dibaca oleh Anda (melalui Kunci Sandi Pribadi Anda) dan Pemandu Sanubari untuk keperluan pendampingan emosional yang tulus dan aman.
          </p>
        </div>
      </div>
    </div>
  );
}
