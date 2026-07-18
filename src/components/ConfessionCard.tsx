import React, { useState } from "react";
import { Confession, ConfessionType } from "../types";
import { TEMPLATE_STYLES, SIZE_DIMENSIONS, FONT_PAIRINGS } from "./TemplateStyles";
import { decryptText } from "../utils/crypto";
import { ShieldAlert, ShieldCheck, Lock, Unlock, Copy, Check, MessageCircleHeart, BellRing, Download, Trash2 } from "lucide-react";
import html2canvas from "html2canvas";

interface ConfessionCardProps {
  confession: Confession;
  privacyKey: string; // The user's active privacy key
  adminKey?: string; // Optional admin key (if Admin role is viewing)
  onSaveCounselorNote?: (confessionId: string, note: string) => void;
  isAdminView?: boolean;
  onDelete?: (confessionId: string) => void;
}

export default function ConfessionCard({
  confession,
  privacyKey,
  adminKey = "GURUBK123", // default admin key, customizable
  onSaveCounselorNote,
  isAdminView = false,
  onDelete
}: ConfessionCardProps) {
  const [decryptionPIN, setDecryptionPIN] = useState("");
  const [localDecryptedText, setLocalDecryptedText] = useState<string | null>(null);
  const [decryptionError, setDecryptionError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [responseText, setResponseText] = useState("");

  // Visual iframe-friendly interaction states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);

  const activeStyle = TEMPLATE_STYLES.find(s => s.id === confession.templateStyleId) || TEMPLATE_STYLES[0];
  const dimensions = SIZE_DIMENSIONS[confession.cardSize] || SIZE_DIMENSIONS.SQUARE;
  const layout = FONT_PAIRINGS[confession.type] || FONT_PAIRINGS.FREE_TEXT;

  // Try to decrypt with active keys first
  let content = localDecryptedText;
  let isLocked = !content;

  if (isLocked) {
    if (isAdminView) {
      // For Admin, try to decrypt confession.adminEncryptedContent with adminKey (or fallback to confession.encryptedContent)
      const targetCipher = confession.adminEncryptedContent || confession.encryptedContent;
      if (adminKey && targetCipher) {
        try {
          const decrypted = decryptText(targetCipher, adminKey);
          if (decrypted && !decrypted.startsWith("[Gagal Deskripsi")) {
            content = decrypted;
            isLocked = false;
          }
        } catch (e) {
          // fail silently
        }
      }
    } else {
      // For Student, try to decrypt confession.encryptedContent with privacyKey
      if (privacyKey && confession.encryptedContent) {
        try {
          let decrypted = decryptText(confession.encryptedContent, privacyKey);
          // Safe automatic fallback to default key "RAHASIA123" if custom key fails
          if (!decrypted || decrypted.startsWith("[Gagal Deskripsi")) {
            decrypted = decryptText(confession.encryptedContent, "RAHASIA123");
          }
          if (decrypted && !decrypted.startsWith("[Gagal Deskripsi")) {
            content = decrypted;
            isLocked = false;
          }
        } catch (e) {
          // fail silently
        }
      }
    }
  }

  const handleManualDecrypt = (e: React.FormEvent) => {
    e.preventDefault();
    setDecryptionError(false);
    setFallbackNotice(null);
    try {
      const targetCipher = (isAdminView && confession.adminEncryptedContent) 
        ? confession.adminEncryptedContent 
        : confession.encryptedContent;
      
      let decrypted = decryptText(targetCipher, decryptionPIN);
      let usingDefaultFallback = false;

      // Fallback check to 'RAHASIA123' if the manually typed key fails (on student cards only)
      if ((!decrypted || decrypted.startsWith("[Gagal Deskripsi")) && !isAdminView) {
        const defaultDecrypted = decryptText(targetCipher, "RAHASIA123");
        if (defaultDecrypted && !defaultDecrypted.startsWith("[Gagal Deskripsi")) {
          decrypted = defaultDecrypted;
          usingDefaultFallback = true;
        }
      }

      if (decrypted && !decrypted.startsWith("[Gagal Deskripsi")) {
        setLocalDecryptedText(decrypted);
        setDecryptionError(false);
        if (usingDefaultFallback) {
          setFallbackNotice("Karya ini terenkripsi menggunakan kunci default 'RAHASIA123' (kami berhasil membukanya untuk Anda!)");
        }
      } else {
        setDecryptionError(true);
      }
    } catch (err) {
      setDecryptionError(true);
    }
  };

  const handleCopy = () => {
    if (content) {
      navigator.clipboard.writeText(`"${confession.title}" oleh ${confession.authorPenName}\n\n${content}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Helper to convert OKLCH color declarations to HSL so html2canvas doesn't throw parsing errors
  const convertOklchToHsl = (cssText: string): string => {
    return cssText.replace(/oklch\(([^)]+)\)/g, (match, contentStr) => {
      try {
        let cleanContent = contentStr.replace(/\s*\/\s*/g, " / ");
        cleanContent = cleanContent.replace(/\([^)]+\)/g, (m: string) => m.replace(/\s+/g, ""));
        
        const parts = cleanContent.trim().split(/\s+/).filter((p: string) => p !== "/");
        if (parts.length < 3) return "rgba(0,0,0,0)";

        const lStr = parts[0];
        const cStr = parts[1];
        const hStr = parts[2];
        const aStr = parts[3] || "1";

        let l = parseFloat(lStr);
        if (lStr.includes("%")) l = parseFloat(lStr) / 100;

        let c = parseFloat(cStr);
        if (cStr.includes("%")) c = parseFloat(cStr) / 100;

        let h = parseFloat(hStr);
        if (hStr.includes("%")) h = (parseFloat(hStr) / 100) * 360;

        if (isNaN(l) || isNaN(c) || isNaN(h)) return "rgba(0,0,0,0)";

        const s = Math.min(100, Math.max(0, (c / 0.4) * 100));
        const lPercent = Math.min(100, Math.max(0, l * 100));

        let alpha = 1;
        if (aStr) {
          if (aStr.includes("var(")) {
            const varMatch = aStr.match(/,\s*([\d.]+)/);
            if (varMatch) {
              alpha = parseFloat(varMatch[1]);
            } else {
              alpha = 1;
            }
          } else {
            alpha = parseFloat(aStr);
            if (isNaN(alpha)) alpha = 1;
          }
        }

        return `hsla(${h.toFixed(1)}, ${s.toFixed(1)}%, ${lPercent.toFixed(1)}%, ${alpha})`;
      } catch (e) {
        return "rgba(0,0,0,0)";
      }
    });
  };

  const handleDownloadJPG = async () => {
    const cardElement = document.getElementById(`canvas-${confession.id}`);
    if (!cardElement) return;

    setDownloading(true);
    setFeedbackMessage(null);

    interface OriginalStyle {
      element: HTMLElement;
      text?: string;
      disabledState?: boolean;
    }
    const originalStyles: OriginalStyle[] = [];

    try {
      // Temporarily transform OKLCH variables/classes in styles to HSL so html2canvas doesn't throw
      const styleTags = Array.from(document.querySelectorAll("style"));
      const linkTags = Array.from(document.querySelectorAll("link[rel='stylesheet']"));

      for (const tag of styleTags) {
        originalStyles.push({ element: tag, text: tag.textContent || "" });
        tag.textContent = convertOklchToHsl(tag.textContent || "");
      }

      for (const tag of linkTags) {
        const linkEl = tag as HTMLLinkElement;
        try {
          const response = await fetch(linkEl.href);
          if (response.ok) {
            const cssText = await response.text();
            const convertedCss = convertOklchToHsl(cssText);
            
            const tempStyle = document.createElement("style");
            tempStyle.setAttribute("data-temp-canvas-style", "true");
            tempStyle.textContent = convertedCss;
            document.head.appendChild(tempStyle);
            
            originalStyles.push({ element: linkEl, disabledState: linkEl.disabled });
            linkEl.disabled = true;
          }
        } catch (e) {
          console.warn("Could not fetch link stylesheet for conversion:", linkEl.href, e);
        }
      }

      // Capture high-quality canvas. Enable CORS and allowTaint for maximal resilience.
      const canvas = await html2canvas(cardElement, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        scale: 2, // High definition crisp scale compatible across standard device sizes
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: document.documentElement.clientWidth,
        windowHeight: document.documentElement.clientHeight,
        onclone: (clonedDoc) => {
          const clonedEl = clonedDoc.getElementById(`canvas-${confession.id}`);
          if (clonedEl) {
            clonedEl.style.transform = "none";
            clonedEl.style.transition = "none";
            clonedEl.style.animation = "none";
            clonedEl.style.boxShadow = "none";
            
            // Remove transitions/animations on all sub-elements to prevent canvas render errors
            const children = clonedEl.querySelectorAll("*");
            children.forEach((child) => {
              const htmlEl = child as HTMLElement;
              htmlEl.style.transition = "none";
              htmlEl.style.animation = "none";
              // Keep original transform unless it's a dynamic visual effect that breaks canvas
              if (htmlEl.style.transform && (htmlEl.style.transform.includes("scale") || htmlEl.style.transform.includes("translate"))) {
                htmlEl.style.transform = "none";
              }
            });
          }
        }
      });
      
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.95));
      if (!blob) {
        throw new Error("Gagal membuat file JPG dari kartu.");
      }

      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const cleanTitle = confession.title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
      link.download = `${cleanTitle || "karya"}_ruang_teduh.jpg`;
      link.href = downloadUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      setFeedbackMessage({ text: "Kartu seni berhasil diunduh!", type: "success" });
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err) {
      console.error("Gagal mengunduh kartu:", err);
      setFeedbackMessage({ text: "Gagal mengekspor kartu. Silakan buka aplikasi di tab baru jika browser memblokir.", type: "error" });
      setTimeout(() => setFeedbackMessage(null), 5000);
    } finally {
      // Restore original style content
      for (const styleInfo of originalStyles) {
        if (styleInfo.text !== undefined) {
          styleInfo.element.textContent = styleInfo.text;
        }
        if (styleInfo.disabledState !== undefined) {
          (styleInfo.element as HTMLLinkElement).disabled = styleInfo.disabledState;
        }
      }

      // Clean up injected temporary styles
      const tempStyles = document.querySelectorAll("style[data-temp-canvas-style]");
      tempStyles.forEach(el => el.remove());

      setDownloading(false);
    }
  };

  const handleResponseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSaveCounselorNote && responseText.trim()) {
      onSaveCounselorNote(confession.id, responseText);
      setResponseText("");
      setShowResponseForm(false);
    }
  };

  const getFormatLabel = (type: ConfessionType) => {
    switch (type) {
      case ConfessionType.QUOTE: return "Kutipan (Quote)";
      case ConfessionType.FREE_TEXT: return "Kata Bebas";
      case ConfessionType.POETRY: return "Puisi";
      case ConfessionType.PANTUN: return "Pantun";
      case ConfessionType.SONG_LYRIC: return "Lirik Lagu";
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full" id={`card-container-${confession.id}`}>
      {/* Dynamic Styled Confession Card */}
      <div 
        className={`relative ${dimensions} ${activeStyle.bgClass} rounded-2xl flex flex-col justify-between shadow-xl transition-all duration-300 hover:scale-[1.01] border ${activeStyle.borderClass} overflow-hidden`}
        id={`canvas-${confession.id}`}
      >
        {/* Card Header */}
        <div className="flex items-center justify-between w-full mb-4 z-10">
          <span className="text-[10px] uppercase tracking-widest bg-white/10 px-2.5 py-1 rounded-full font-mono backdrop-blur-xs font-semibold">
            {getFormatLabel(confession.type)}
          </span>
          <div className="flex items-center gap-1.5 font-mono text-[10px]">
            {isLocked ? (
              <span className="flex items-center gap-1 text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20 font-semibold">
                <Lock size={10} /> Terenkripsi
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-semibold animate-pulse">
                <Unlock size={10} /> Terbuka
              </span>
            )}
          </div>
        </div>

        {/* Card Body */}
        <div className="flex-1 flex flex-col justify-center items-center my-4 z-10 w-full overflow-hidden">
          {isLocked ? (
            <div className="w-full max-w-sm text-center flex flex-col items-center p-4 rounded-xl bg-black/25 backdrop-blur-xs border border-white/5">
              <Lock className="text-gray-400 mb-2 animate-pulse" size={28} />
              <h4 className="text-xs font-semibold mb-1 tracking-wider uppercase">Pesan Terkunci Privasi</h4>
              <p className="text-[10px] text-gray-400 mb-4 max-w-[200px] leading-relaxed">
                {isAdminView 
                  ? "Masukkan Kunci Sandi Pemandu untuk meresapi curhatan ini." 
                  : "Gunakan Kunci Privasi Anda untuk mendekripsi tulisan ini."}
              </p>
              
              <form onSubmit={handleManualDecrypt} className="flex gap-2 w-full">
                <input
                  type="password"
                  placeholder="Kunci Sandi..."
                  value={decryptionPIN}
                  onChange={(e) => setDecryptionPIN(e.target.value)}
                  className="flex-1 text-xs px-2.5 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-hidden focus:border-white/50 text-center"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-white text-black font-semibold rounded-lg text-xs hover:bg-neutral-200 transition-all cursor-pointer"
                >
                  Buka
                </button>
              </form>
              {decryptionError && (
                <span className="text-[10px] text-rose-400 mt-2 font-mono">Kunci sandi salah / gagal.</span>
              )}
            </div>
          ) : (
            <div className="w-full flex flex-col justify-start overflow-y-auto max-h-[200px] md:max-h-[300px] pr-1.5 scrollbar-thin select-all my-auto">
              {/* Confession Title */}
              <h3 className={`${layout.title} mb-4 text-center tracking-wide`}>
                {confession.title}
              </h3>
              
              {/* Confession Body */}
              <p className={`${layout.body} w-full whitespace-pre-wrap break-words`}>
                {content}
              </p>

              {/* Confession Author Pen Name */}
              <p className={`${layout.author} mt-4 text-right italic font-mono`}>
                — {confession.isAnonymousToAdmin && isAdminView ? "Jiwa Anonim" : confession.authorPenName}
              </p>

              {/* Decryption Fallback Guidance Notice */}
              {fallbackNotice && (
                <div data-html2canvas-ignore="true" className="mt-4 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[9px] text-amber-300 font-mono leading-relaxed text-center">
                  💡 {fallbackNotice}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Card Feedback Toast Overlay */}
        {feedbackMessage && (
          <div 
            data-html2canvas-ignore="true" 
            className={`absolute top-14 left-4 right-4 z-40 p-2.5 rounded-xl text-[9px] font-mono text-center border shadow-xl animate-fade-in ${
              feedbackMessage.type === "success" 
                ? "bg-emerald-950/90 border-emerald-500/20 text-emerald-300" 
                : "bg-rose-950/90 border-rose-500/20 text-rose-300"
            }`}
          >
            {feedbackMessage.text}
          </div>
        )}

        {/* Beautiful Custom Delete Confirmation Overlay */}
        {showDeleteConfirm && (
          <div 
            data-html2canvas-ignore="true"
            className="absolute inset-0 bg-white/95 backdrop-blur-md z-45 flex flex-col items-center justify-center p-6 text-center animate-fade-in rounded-2xl border border-rose-200"
          >
            <Trash2 className="text-rose-600 mb-3 animate-bounce" size={28} />
            <h4 className="text-xs font-extrabold text-rose-700 uppercase tracking-widest mb-1 font-mono">Hapus Curahan Selamanya?</h4>
            <p className="text-[10px] text-slate-600 max-w-[200px] mb-4 leading-relaxed font-sans font-medium">
              Tindakan ini bersifat permanen dan akan menghapus karya curhat Anda sepenuhnya dari Cloud Database.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer transition-all font-mono border border-slate-200"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (onDelete) onDelete(confession.id);
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-extrabold cursor-pointer transition-all font-mono shadow-sm shadow-rose-100"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        )}

        {/* Card Footer / Controls */}
        <div className="flex items-center justify-between w-full mt-4 pt-3 border-t border-white/15 z-10 text-[10px] opacity-90 font-mono">
          <span>{new Date(confession.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          <div className="flex items-center gap-1.5" data-html2canvas-ignore="true">
            {onDelete && (
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1 text-rose-600 hover:text-rose-700 bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-sm transition-all cursor-pointer mr-1 font-bold border border-white/10"
                title="Hapus Curhatan"
              >
                <Trash2 size={11} />
                <span>Hapus</span>
              </button>
            )}
            {!isLocked && (
              <>
                <button 
                  onClick={handleCopy}
                  className="flex items-center gap-1 hover:opacity-100 bg-white/10 px-2 py-1 rounded-sm hover:bg-white/20 transition-all cursor-pointer font-semibold border border-white/10"
                  title="Salin ke Clipboard"
                >
                  {copied ? <Check size={11} className="text-emerald-300" /> : <Copy size={11} />}
                  {copied ? "Tersalin!" : "Salin"}
                </button>
                <button 
                  onClick={handleDownloadJPG}
                  disabled={downloading}
                  className="flex items-center gap-1 hover:opacity-100 bg-orange-500/20 text-orange-950 px-2 py-1 rounded-sm hover:bg-orange-500/35 transition-all cursor-pointer disabled:opacity-50 font-bold border border-orange-400/20"
                  title="Unduh Kartu sebagai JPG"
                >
                  <Download size={11} className={downloading ? "animate-bounce" : ""} />
                  {downloading ? "Unduh..." : "Unduh JPG"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Counselor Response Panel */}
      {!isLocked && (
        <div className="flex flex-col gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200/80 shadow-xs">
          {/* Counselor (BK) Response */}
          {confession.counselorResponse ? (
            <div className="bg-emerald-50/70 p-3.5 rounded-lg border border-emerald-200">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                  <MessageCircleHeart size={14} />
                  <span>Tanggapan & Refleksi Pemandu Sanubari</span>
                </div>
                {confession.counselorRepliedAt && (
                  <span className="text-[9px] text-emerald-600/70 font-mono font-bold">
                    {new Date(confession.counselorRepliedAt).toLocaleDateString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                {confession.counselorResponse}
              </p>
            </div>
          ) : (
            <div className="bg-slate-100/60 p-3.5 rounded-lg border border-slate-200/85 flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1.5 font-bold">
                <BellRing size={13} className="text-[#f05a28]" />
                <span>Menunggu tanggapan dari Pemandu Sanubari...</span>
              </span>
              
              {isAdminView && (
                <button
                  onClick={() => setShowResponseForm(true)}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md text-[10px] transition-all cursor-pointer shadow-xs"
                >
                  Berikan Tanggapan
                </button>
              )}
            </div>
          )}

          {/* Form response for ADMIN */}
          {showResponseForm && isAdminView && (
            <form onSubmit={handleResponseSubmit} className="mt-2 border-t border-slate-200 pt-3 flex flex-col gap-2 animate-fade-in">
              <label className="text-xs font-bold text-emerald-800">Tulis Tanggapan Pemandu Sanubari:</label>
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Berikan tanggapan yang hangat, apresiatif, menyentuh, dan kuatkan jiwa mereka..."
                className="w-full p-2.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 focus:bg-white min-h-[90px] transition-all"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowResponseForm(false)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-all cursor-pointer shadow-sm shadow-emerald-50"
                >
                  Kirim Tanggapan
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
