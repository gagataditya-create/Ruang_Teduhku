import React, { useState, useEffect } from "react";
import { User, EmotionalLog, EmotionType, CounselingSession, Confession } from "../types";
import { Sparkles, Calendar, PlusCircle, CheckCircle2, TrendingUp, HelpCircle, Heart, UserPlus, Clock, Smile, Frown, Compass, Flame, AlertCircle } from "lucide-react";

interface StudentDashboardProps {
  currentUser: User;
  confessions: Confession[];
  privacyKey: string;
  onPrivacyKeyChange: (newKey: string) => void;
  onNewConfessionClick: () => void;
}

export default function StudentDashboard({
  currentUser,
  confessions,
  privacyKey,
  onPrivacyKeyChange,
  onNewConfessionClick
}: StudentDashboardProps) {
  const [emotion, setEmotion] = useState<EmotionType>(EmotionType.CALM);
  const [intensity, setIntensity] = useState(3);
  const [emotionNote, setEmotionNote] = useState("");
  const [logs, setLogs] = useState<EmotionalLog[]>([]);
  const [sessions, setSessions] = useState<CounselingSession[]>([]);
  const [isLogging, setIsLogging] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [sessionNotes, setSessionNotes] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  const fetchLogs = async () => {
    try {
      const response = await fetch(`/api/emotional-logs?userId=${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (e) {
      console.error("Gagal memuat log emosi:", e);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await fetch(`/api/sessions?userId=${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (e) {
      console.error("Gagal memuat sesi:", e);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchSessions();
  }, [currentUser]);

  const handleLogEmotion = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLogging(true);
    try {
      const response = await fetch("/api/emotional-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          emotion,
          intensity,
          note: emotionNote
        })
      });
      if (response.ok) {
        setEmotionNote("");
        fetchLogs();
        setStatusMsg("Suasana hati berhasil disimpan!");
        setTimeout(() => setStatusMsg(""), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLogging(false);
    }
  };

  const handleRequestSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledDate) return;
    setIsScheduling(true);
    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          username: currentUser.username,
          penName: currentUser.penName,
          scheduledAt: scheduledDate,
          notes: sessionNotes
        })
      });
      if (response.ok) {
        setScheduledDate("");
        setSessionNotes("");
        fetchSessions();
        alert("Sesi temu rasa berhasil dijadwalkan! Pemuandi Sanubari siap bersiap menyambut ceritamu.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsScheduling(false);
    }
  };

  const getEmotionLabel = (type: EmotionType) => {
    switch (type) {
      case EmotionType.HAPPY: return { name: "Senang (Happy)", emoji: "😊", color: "text-amber-800 bg-amber-50 border-amber-300 shadow-xs" };
      case EmotionType.SAD: return { name: "Sedih (Sad)", emoji: "😢", color: "text-blue-800 bg-blue-50 border-blue-300 shadow-xs" };
      case EmotionType.ANXIOUS: return { name: "Cemas (Anxious)", emoji: "😰", color: "text-purple-800 bg-purple-50 border-purple-300 shadow-xs" };
      case EmotionType.ANGRY: return { name: "Marah (Angry)", emoji: "😡", color: "text-rose-800 bg-rose-50 border-rose-300 shadow-xs" };
      case EmotionType.CALM: return { name: "Tenang (Calm)", emoji: "🍃", color: "text-emerald-800 bg-emerald-50 border-emerald-300 shadow-xs" };
      case EmotionType.TIRED: return { name: "Lelah (Tired)", emoji: "🥱", color: "text-slate-800 bg-slate-100 border-slate-300 shadow-xs" };
    }
  };

  // Compile stats for Custom SVG Progress Tracker
  const sortedLogs = [...logs].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const moodTrend = sortedLogs.slice(-7); // Last 7 logs

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full" id="student-dashboard">
      {/* Sidebar & Profile (Left Column) */}
      <div className="lg:col-span-4 flex flex-col gap-6 w-full">
        
        {/* User Card */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xl flex flex-col gap-4 relative overflow-hidden">
          {/* Subtle Accent Glow */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-purple-400/20 to-pink-400/20 flex items-center justify-center border border-purple-200 shadow-xs">
              <span className="text-lg font-bold text-purple-700 font-serif">
                {currentUser.penName ? currentUser.penName.charAt(0) : "S"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-slate-500 font-mono">Nama Pena Aktif</span>
              <h3 className="font-semibold text-slate-800 tracking-tight">{currentUser.penName}</h3>
            </div>
          </div>
          
          <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-500">Username Akun</span>
              <span className="text-purple-700 font-semibold">{currentUser.username}</span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-500">Total Karya Curhat</span>
              <span className="text-[#f05a28] font-bold">{confessions.length} Sajak</span>
            </div>
          </div>

          {/* Privacy Key Setting */}
          <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider font-mono">Kunci Sandi Pribadi</span>
            <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
              Kunci sandi ini digunakan untuk mengenkripsi tulisan secara lokal. Masukkan kunci yang sama untuk melihat kembali curhatan Anda yang terkunci.
            </p>
            <input
              type="password"
              placeholder="Masukkan Kunci Privasi..."
              value={privacyKey}
              onChange={(e) => onPrivacyKeyChange(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-purple-800 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-purple-500 font-mono text-center font-bold transition-all"
            />
          </div>
        </div>

        {/* Emotion Log Form */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-1.5 mb-3.5">
            <Smile size={16} className="text-[#f05a28]" />
            <span>Bagaimana Perasaanmu Hari Ini?</span>
          </h3>

          <form onSubmit={handleLogEmotion} className="flex flex-col gap-4">
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-500 font-semibold mb-2">Pilih Emosi Dominan</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  EmotionType.CALM,
                  EmotionType.HAPPY,
                  EmotionType.SAD,
                  EmotionType.ANXIOUS,
                  EmotionType.ANGRY,
                  EmotionType.TIRED
                ].map((emo) => {
                  const label = getEmotionLabel(emo)!;
                  const isSelected = emotion === emo;
                  return (
                    <button
                      key={emo}
                      type="button"
                      onClick={() => setEmotion(emo)}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        isSelected 
                          ? `${label.color} scale-[1.03] ring-1 ring-pink-500/20 font-bold`
                          : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      <span className="text-base select-none">{label.emoji}</span>
                      <span className="text-[8px] tracking-wider text-center font-mono truncate max-w-full">
                        {emo}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[10px] uppercase font-mono tracking-wider text-purple-700 font-bold mb-1.5">
                <span>Intensitas Rasa</span>
                <span className="text-[#f05a28] font-bold">{intensity} / 5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={intensity}
                onChange={(e) => setIntensity(parseInt(e.target.value))}
                className="w-full accent-[#f05a28] cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-500 font-semibold mb-1.5">Catatan Sanubari (Opsional)</label>
              <textarea
                value={emotionNote}
                onChange={(e) => setEmotionNote(e.target.value)}
                placeholder="Bagikan sedikit detail rasa hari ini..."
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-pink-500 min-h-[60px] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLogging}
              className="w-full py-2.5 bg-[#f05a28] hover:bg-[#e04f1c] text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-md"
            >
              {isLogging ? "Mencatat..." : "Simpan Perasaan Hari Ini"}
            </button>
            
            {statusMsg && (
              <span className="text-xs text-emerald-600 font-mono text-center font-semibold">{statusMsg}</span>
            )}
          </form>
        </div>

      </div>

      {/* Main Stats, Progress Tracker, Session Reminders (Right Column) */}
      <div className="lg:col-span-8 flex flex-col gap-6 w-full">

        {/* 1. Counseling Session Reminder Alert */}
        {sessions.filter(s => s.status === "SCHEDULED").length > 0 && (
          <div className="p-4 bg-gradient-to-r from-purple-100 via-orange-50 to-white border border-purple-200 rounded-3xl flex items-start gap-3.5 shadow-md">
            <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center border border-orange-600 text-white shrink-0">
              <Calendar size={18} className="animate-bounce" />
            </div>
            <div className="flex-1 flex flex-col">
              <span className="text-[10px] font-bold text-purple-700 tracking-wider uppercase font-mono">Notifikasi Pengingat Temu Rasa</span>
              <h4 className="text-sm font-serif italic text-[#7244ab] font-bold mt-0.5">Sesi Hangat Menanti Anda</h4>
              {sessions.filter(s => s.status === "SCHEDULED").map((sess) => (
                <div key={sess.id} className="mt-1.5 text-xs text-slate-700 font-mono flex flex-col gap-1">
                  <div>
                    📅 Tanggal & Waktu: <span className="text-purple-800 font-semibold">{new Date(sess.scheduledAt).toLocaleDateString("id-ID", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {sess.notes && (
                    <div className="text-slate-600 italic bg-slate-50 p-2.5 rounded-xl border border-slate-200 mt-1.5">
                      Fokus Bahasan: "{sess.notes}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. Emotional Progress Tracker */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-1/2 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-serif italic text-slate-800 tracking-tight flex items-center gap-1.5 font-bold">
                <TrendingUp size={16} className="text-purple-600" />
                <span>Pelacak Progres Perasaan (Mood Tracker)</span>
              </h3>
              <p className="text-[11px] text-slate-500">Visualisasi fluktuasi suasana hati 7 hari terakhir.</p>
            </div>
            <span className="text-[10px] bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-xl text-purple-700 font-mono font-semibold">
              {logs.length} Log Total
            </span>
          </div>

          {moodTrend.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 flex flex-col items-center gap-2">
              <AlertCircle size={24} className="text-slate-400 animate-pulse" />
              <span>Belum ada progres emosional yang dicatat. Mulailah mencatatkan emosi Anda hari ini!</span>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Responsive Custom SVG Line Chart */}
              <div className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-200 relative overflow-hidden">
                <div className="h-48 w-full relative">
                  {/* Backdrop Grid Lines */}
                  <div className="absolute inset-x-0 bottom-[20%] border-b border-slate-200/60 w-full" />
                  <div className="absolute inset-x-0 bottom-[50%] border-b border-slate-200/60 w-full" />
                  <div className="absolute inset-x-0 bottom-[80%] border-b border-slate-200/60 w-full" />
                  
                  {/* Left-side intensity guide */}
                  <div className="absolute left-2 bottom-[82%] text-[8px] font-mono text-slate-500 select-none font-semibold">Tinggi (5)</div>
                  <div className="absolute left-2 bottom-[52%] text-[8px] font-mono text-slate-500 select-none font-semibold">Sedang (3)</div>
                  <div className="absolute left-2 bottom-[22%] text-[8px] font-mono text-slate-500 select-none font-semibold">Rendah (1)</div>
                  
                  {/* SVG line overlay for connecting the mood dots */}
                  <svg className="absolute inset-0 h-full w-full z-10 p-4" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <polyline
                      fill="none"
                      stroke="url(#chartGradient)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={moodTrend.map((log, index) => {
                        const x = (index / (moodTrend.length - 1 || 1)) * 100;
                        const y = 80 - (log.intensity / 5) * 60; // scale 1-5 to percentage space
                        return `${x},${y}`;
                      }).join(" ")}
                    />
                    <defs>
                      <linearGradient id="chartGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#855ec4" />
                        <stop offset="100%" stopColor="#f05a28" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Absolute positioned interactive dots wrapper (matches SVG p-4 padding) */}
                  <div className="absolute inset-0 p-4 z-20">
                    {moodTrend.map((log, index) => {
                      const emoInfo = getEmotionLabel(log.emotion)!;
                      const xPercent = (index / (moodTrend.length - 1 || 1)) * 100;
                      const yPercent = 20 + (log.intensity / 5) * 60; // corresponds to 100 - y from polyline
                      return (
                        <div
                          key={log.id}
                          className="absolute group"
                          style={{
                            left: `${xPercent}%`,
                            bottom: `${yPercent}%`,
                            transform: "translate(-50%, 50%)",
                          }}
                        >
                          {/* Tooltip on Hover */}
                          <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-purple-200 p-2.5 rounded-xl pointer-events-none text-[10px] w-36 z-50 shadow-xl font-mono text-center text-slate-700">
                            <p className="font-bold text-slate-800 mb-0.5">{emoInfo.name}</p>
                            <p className="text-[#f05a28] font-bold">Intensitas: {log.intensity}/5</p>
                            {log.note && <p className="text-slate-500 mt-1 italic">"{log.note.substring(0, 30)}..."</p>}
                          </div>

                          {/* Beautiful Interactive Pulsing Glow Dot */}
                          <div className="w-5 h-5 rounded-full bg-white border-2 border-[#855ec4] flex items-center justify-center cursor-pointer shadow-md group-hover:scale-125 hover:border-[#f05a28] transition-all duration-200 relative">
                            <span className="text-[10px] select-none">{emoInfo.emoji}</span>
                            <div className="absolute -inset-0.5 rounded-full bg-purple-500/20 animate-ping -z-10 group-hover:bg-[#f05a28]/30" />
                          </div>

                          {/* Floating Date Label placed absolute below dot */}
                          <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-none">
                            <span className="text-[8px] text-slate-600 font-mono whitespace-nowrap bg-white px-1 py-0.5 rounded border border-slate-200 shadow-xs">
                              {new Date(log.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Progress History Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {logs.slice(-4).reverse().map((log) => {
                  const emoInfo = getEmotionLabel(log.emotion)!;
                  return (
                    <div key={log.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-2.5 shadow-xs">
                      <div className="text-xl select-none">{emoInfo.emoji}</div>
                      <div className="flex-1 flex flex-col min-w-0">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-800">{emoInfo.name}</span>
                          <span className="text-[9px] text-slate-500 font-mono font-medium">
                            {new Date(log.createdAt).toLocaleDateString("id-ID", { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex gap-1 items-center mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <div 
                              key={star} 
                              className={`h-1.5 rounded-full flex-1 ${
                                star <= log.intensity ? "bg-gradient-to-r from-[#855ec4] to-[#f05a28] shadow-xs animate-pulse" : "bg-slate-200"
                              }`} 
                            />
                          ))}
                        </div>
                        {log.note && (
                          <p className="text-[10px] text-slate-600 italic mt-1.5 border-l-2 border-slate-300 pl-2 truncate">
                            "{log.note}"
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 3. Schedule counseling form */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <h3 className="text-sm font-semibold text-slate-800 tracking-tight flex items-center gap-1.5 mb-3.5 font-serif italic font-bold">
            <Calendar size={16} className="text-purple-600" />
            <span>Reservasi Sesi Temu Rasa</span>
          </h3>

          <form onSubmit={handleRequestSession} className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-5">
              <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-500 font-semibold mb-1.5">Pilih Waktu & Tanggal</label>
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-purple-900 focus:outline-hidden focus:bg-white focus:border-purple-500 font-mono transition-all"
                required
              />
            </div>
            
            <div className="sm:col-span-7">
              <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-500 font-semibold mb-1.5">Harapan / Fokus Obrolan Temu Rasa</label>
              <input
                type="text"
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Misal: Butuh didengar, lelah pikiran, berbagi kebahagiaan..."
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-purple-500 transition-all"
              />
            </div>

            <div className="sm:col-span-12 flex justify-end">
              <button
                type="submit"
                disabled={isScheduling}
                className="px-5 py-2.5 bg-[#f05a28] hover:bg-[#e04f1c] text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-md"
              >
                {isScheduling ? "Menyimpan..." : "Reservasi Temu Rasa"}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
