import React, { useState, useEffect } from "react";
import { Confession, EmotionalLog, CounselingSession, User } from "../types";
import { decryptText } from "../utils/crypto";
import ConfessionCard from "./ConfessionCard";
import { ShieldCheck, CalendarCheck, FileSpreadsheet, Lock, Key, Users, BookOpen, AlertCircle, HeartHandshake, Sparkles, Smile, Frown, Check, Clock } from "lucide-react";

interface CounselorDashboardProps {
  currentUser: User;
  onRefreshDB: () => void;
}

export default function CounselorDashboard({
  currentUser,
  onRefreshDB
}: CounselorDashboardProps) {
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [allLogs, setAllLogs] = useState<EmotionalLog[]>([]);
  const [sessions, setSessions] = useState<CounselingSession[]>([]);
  const [adminPIN, setAdminPIN] = useState("GURUBK123");
  const [activeTab, setActiveTab] = useState<"CONFESSIONS" | "ANALYTICS" | "SESSIONS">("CONFESSIONS");
  const [sessionNotesInput, setSessionNotesInput] = useState<{ [key: string]: string }>({});

  // Custom visual toast state for counselor dashboard
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => {
        if (prev && prev.message === message) return null;
        return prev;
      });
    }, 4500);
  };

  const loadData = async () => {
    try {
      // Fetch all confessions (Admin can fetch all)
      const cRes = await fetch(`/api/confessions?userId=${currentUser.id}&role=ADMIN`);
      if (cRes.ok) {
        const cData = await cRes.json();
        setConfessions(cData.reverse());
      }

      // Fetch all emotional logs
      const lRes = await fetch(`/api/emotional-logs?role=ADMIN`);
      if (lRes.ok) {
        const lData = await lRes.json();
        setAllLogs(lData);
      }

      // Fetch all sessions
      const sRes = await fetch(`/api/sessions?role=ADMIN`);
      if (sRes.ok) {
        const sData = await sRes.json();
        setSessions(sData.reverse());
      }
    } catch (err) {
      console.error("Gagal memuat data pemandu:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleUpdateCounselorNote = async (confId: string, noteText: string) => {
    try {
      const response = await fetch(`/api/confessions/${confId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responseText: noteText })
      });
      if (response.ok) {
        loadData();
        onRefreshDB();
        showToast("Tanggapan Pemandu Sanubari berhasil dikirim hangat.", "success");
      } else {
        showToast("Gagal mengirim tanggapan bimbingan.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Gagal mengirim tanggapan bimbingan karena masalah koneksi.", "error");
    }
  };

  const handleUpdateSessionStatus = async (sessId: string, status: string, notes?: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes })
      });
      if (response.ok) {
        loadData();
        showToast("Sesi bincang jiwa berhasil diperbarui dan diselesaikan.", "success");
      }
    } catch (err) {
      console.error(err);
      showToast("Gagal memperbarui status sesi bincang.", "error");
    }
  };

  const handleDeleteConfession = async (id: string) => {
    try {
      const response = await fetch(`/api/confessions/${id}?userId=${currentUser.id}&role=${currentUser.role}`, {
        method: "DELETE"
      });
      if (response.ok) {
        setConfessions(prev => prev.filter(c => c.id !== id));
        showToast("Curahan hati berhasil dihapus selamanya dari Cloud Database.", "success");
        onRefreshDB();
      } else {
        const errData = await response.json();
        showToast(errData.error || "Gagal menghapus curhatan.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Terjadi kesalahan koneksi saat menghapus curhatan.", "error");
    }
  };

  // Compile aggregate statistics
  const countEmotions = () => {
    const counts = { HAPPY: 0, SAD: 0, ANXIOUS: 0, ANGRY: 0, CALM: 0, TIRED: 0 };
    allLogs.forEach(log => {
      if (counts[log.emotion] !== undefined) {
        counts[log.emotion]++;
      }
    });
    return counts;
  };

  const emotionStats = countEmotions();
  const totalStudentsCheckedIn = new Set(allLogs.map(l => l.userId)).size;

  return (
    <div className="flex flex-col gap-6 w-full" id="counselor-dashboard-root">
      
      {/* Dashboard Top Header Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-md flex items-center gap-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-12 h-12 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center border border-purple-150 text-purple-600">
            <Users size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider font-semibold">Jiwa Terpantau</span>
            <span className="text-base font-bold text-slate-800">{totalStudentsCheckedIn} Jiwa</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-md flex items-center gap-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-12 h-12 bg-orange-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center border border-orange-200 text-[#f05a28]">
            <BookOpen size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider font-semibold">Total Curhatan Masuk</span>
            <span className="text-base font-bold text-slate-800">{confessions.length} Karya</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-md flex items-center gap-3 col-span-2 md:col-span-1 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-12 h-12 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center border border-purple-200 text-[#855ec4]">
            <CalendarCheck size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider font-semibold">Jadwal Temu Rasa</span>
            <span className="text-base font-bold text-slate-800">
              {sessions.filter(s => s.status === "SCHEDULED").length} Aktif
            </span>
          </div>
        </div>

        {/* Admin PIN configuration */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-md flex flex-col justify-center col-span-2 md:col-span-1 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-12 h-12 bg-orange-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-1.5 text-[9px] text-slate-500 uppercase font-mono tracking-wider font-bold mb-1">
            <Key size={11} className="text-[#f05a28]" />
            <span>Kunci Dekripsi Pemandu</span>
          </div>
          <input
            type="password"
            value={adminPIN}
            onChange={(e) => setAdminPIN(e.target.value)}
            className="w-full px-2 py-1.5 text-xs bg-[#f3effa] border border-purple-100 text-[#f05a28] font-mono text-center rounded-lg font-bold focus:border-[#ff5d24] focus:bg-white focus:outline-hidden transition-all"
            title="Kunci ini digunakan secara otomatis untuk mendekripsi curhatan sahabat pada browser Anda."
          />
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex flex-wrap gap-2.5 pb-4 border-b border-white/10">
        {[
          { id: "CONFESSIONS", label: "📝 Curahan Hati Sahabat", count: confessions.length },
          { id: "ANALYTICS", label: "📊 Analisis Perasaan Umum", count: allLogs.length },
          { id: "SESSIONS", label: "📅 Manajemen Temu Rasa", count: sessions.length }
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2.5 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-2 border ${
                isActive
                  ? "bg-[#f05a28] border-[#ff5d24] text-white shadow-[#f05a28]/20"
                  : "bg-white border-purple-200 text-purple-950 hover:bg-purple-50"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border transition-all ${
                  isActive
                    ? "bg-white text-[#f05a28] border-white"
                    : "bg-[#f3effa] text-[#f05a28] border-purple-200"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Tab Contents */}
      <div className="flex flex-col w-full">
        
        {/* TAB 1: CONFESSIONS LIST */}
        {activeTab === "CONFESSIONS" && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-base font-serif italic text-white flex items-center gap-1.5 font-bold">
                <HeartHandshake size={15} className="text-orange-300" />
                <span>Resapi & Tanggapi Curahan Kalbu Sahabat</span>
              </h3>
              <p className="text-[10px] text-purple-100 font-mono font-semibold">Gunakan Kunci Dekripsi untuk membuka pesan secara tulus.</p>
            </div>

            {confessions.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 flex flex-col items-center gap-2 shadow-md">
                <AlertCircle size={26} className="text-slate-400 animate-pulse" />
                <span className="text-sm">Belum ada karya curhat yang dikirimkan ke Ruang Teduh.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {confessions.map((conf) => (
                  <div key={conf.id} className="p-4 bg-white rounded-3xl border border-slate-200/80 flex flex-col gap-4 shadow-md">
                    {/* Header showing if Anonymous to Admin */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-[11px]">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">
                          {conf.isAnonymousToAdmin ? "Jiwa Anonim" : `Sahabat: ${conf.authorPenName}`}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono">ID Pengirim: {conf.userId.substring(0, 8)}...</span>
                      </div>
                      <span className="text-[10px] text-[#f05a28] font-bold font-mono">
                        {new Date(conf.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric', hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    {/* Actual Card Render (Can be decrypted by inputting administrative PIN) */}
                    <ConfessionCard
                      confession={conf}
                      privacyKey=""
                      adminKey={adminPIN}
                      onSaveCounselorNote={handleUpdateCounselorNote}
                      isAdminView={true}
                      onDelete={handleDeleteConfession}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ANALYTICS */}
        {activeTab === "ANALYTICS" && (
          <div className="flex flex-col gap-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-lg">
            <div>
              <h3 className="text-base font-serif italic text-purple-950 tracking-tight flex items-center gap-1.5 font-bold">
                <Sparkles size={16} className="text-purple-600" />
                <span>Analisis Suasana Hati Sahabat (General Mood Aggregations)</span>
              </h3>
              <p className="text-[11px] text-slate-500">Pemandu dapat menganalisis kondisi emosional mayoritas sahabat guna memberikan pendampingan yang tepat.</p>
            </div>

            {allLogs.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
                Belum ada data check-in emosi terkumpul dari sahabat.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                
                {/* SVG Beautiful Bento Bar Chart */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col gap-4 shadow-inner">
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider font-mono">Distribusi Frekuensi Emosi</span>
                  
                  <div className="flex flex-col gap-3.5">
                    {[
                      { emotion: "TENANG", color: "bg-emerald-500", label: "🍃 Tenang (Calm)", count: emotionStats.CALM },
                      { emotion: "SENANG", color: "bg-amber-500", label: "😊 Senang (Happy)", count: emotionStats.HAPPY },
                      { emotion: "SEDIH", color: "bg-blue-500", label: "😢 Sedih (Sad)", count: emotionStats.SAD },
                      { emotion: "CEMAS", color: "bg-purple-500", label: "😰 Cemas (Anxious)", count: emotionStats.ANXIOUS },
                      { emotion: "MARAH", color: "bg-rose-500", label: "😡 Marah (Angry)", count: emotionStats.ANGRY },
                      { emotion: "LELAH", color: "bg-slate-500", label: "🥱 Lelah (Tired)", count: emotionStats.TIRED }
                    ].map(item => {
                      const maxCount = Math.max(...Object.values(emotionStats)) || 1;
                      const percentage = (item.count / maxCount) * 100;
                      return (
                        <div key={item.emotion} className="flex flex-col gap-1">
                          <div className="flex justify-between items-center text-xs text-slate-700 font-mono font-semibold">
                            <span>{item.label}</span>
                            <span className="font-bold">{item.count} check-in</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                            <div 
                              className={`${item.color} h-full rounded-full transition-all duration-500`}
                              style={{ width: `${Math.max(percentage, 3)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recents logs analysis */}
                <div className="flex flex-col gap-4">
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider font-mono">Log Suasana Hati Terbaru</span>
                  <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {allLogs.slice(-6).reverse().map((log) => (
                      <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-start gap-2.5 shadow-xs">
                        <span className="text-xl">
                          {log.emotion === "CALM" ? "🍃" : log.emotion === "HAPPY" ? "😊" : log.emotion === "SAD" ? "😢" : log.emotion === "ANXIOUS" ? "😰" : log.emotion === "ANGRY" ? "😡" : "🥱"}
                        </span>
                        <div className="flex-1 text-[11px]">
                          <div className="flex justify-between font-mono">
                            <span className="text-purple-700 font-bold">Intensitas {log.intensity}/5</span>
                            <span className="text-slate-500">
                              {new Date(log.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          {log.note && <p className="text-slate-600 mt-1 italic">"{log.note}"</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* TAB 3: MANAGEMENT SESSIONS */}
        {activeTab === "SESSIONS" && (
          <div className="flex flex-col gap-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-serif italic text-purple-950 tracking-tight flex items-center gap-1.5 font-bold">
                  <CalendarCheck size={16} className="text-[#f05a28]" />
                  <span>Jadwal & Reservasi Temu Rasa</span>
                </h3>
                <p className="text-[11px] text-slate-500">Kelola janji temu bincang jiwa berkala dengan sahabat untuk saling bertukar kebaikan dan harmoni jiwa.</p>
              </div>
            </div>

            {sessions.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
                Belum ada jadwal sesi temu rasa yang terdaftar.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {sessions.map((sess) => (
                  <div key={sess.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-800">Sahabat: {sess.username} ({sess.penName})</span>
                        {sess.status === "SCHEDULED" ? (
                          <span className="px-2 py-0.5 rounded-full text-[8px] font-mono font-bold bg-purple-100 border border-purple-200 text-purple-800">
                            Terjadwal (Scheduled)
                          </span>
                        ) : sess.status === "COMPLETED" ? (
                          <span className="px-2 py-0.5 rounded-full text-[8px] font-mono font-bold bg-emerald-100 border border-emerald-200 text-emerald-800">
                            Selesai (Completed)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[8px] font-mono font-bold bg-rose-100 border border-rose-200 text-rose-800">
                            Dibatalkan
                          </span>
                        )}
                      </div>
                      
                      <span className="text-[10px] text-slate-500 font-mono font-medium">
                        📅 Jadwal: {new Date(sess.scheduledAt).toLocaleDateString("id-ID", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {sess.notes && (
                        <p className="text-xs text-slate-600 italic bg-white p-2 rounded-xl border border-slate-200 mt-1.5">
                          Tujuan: "{sess.notes}"
                        </p>
                      )}
                    </div>

                    {/* Status update controls & Post-session notes for Admin */}
                    <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
                      {sess.status === "SCHEDULED" && (
                        <div className="flex gap-2 w-full sm:w-auto">
                          <input
                            type="text"
                            placeholder="Catatan hasil / evaluasi bincang jiwa..."
                            value={sessionNotesInput[sess.id] || ""}
                            onChange={(e) => setSessionNotesInput({ ...sessionNotesInput, [sess.id]: e.target.value })}
                            className="p-2 bg-white border border-purple-100 text-[10px] text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#ff5d24] rounded-xl flex-1 min-w-[200px] font-bold"
                          />
                          <button
                            onClick={() => handleUpdateSessionStatus(sess.id, "COMPLETED", sessionNotesInput[sess.id])}
                            className="py-2 px-3.5 bg-[#f05a28] hover:bg-[#e04f1c] text-white font-bold rounded-xl text-[10px] transition-all cursor-pointer flex items-center gap-1 shrink-0 shadow-sm"
                          >
                            <Check size={11} /> Tandai Selesai
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Custom non-blocking admin notification toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-55 max-w-sm bg-white border border-slate-200 rounded-2xl p-4 shadow-2xl animate-fade-in flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
            toast.type === "success" ? "bg-emerald-500" : toast.type === "error" ? "bg-rose-500" : "bg-amber-500"
          } animate-pulse`} />
          <p className="text-xs text-slate-800 leading-relaxed font-mono font-semibold">{toast.message}</p>
          <button 
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-slate-700 font-bold text-xs ml-auto pl-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

    </div>
  );
}
