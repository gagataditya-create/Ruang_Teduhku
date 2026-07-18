import React, { useState, useEffect } from "react";
import { User, Confession } from "./types";
import AuthScreen from "./components/AuthScreen";
import ConfessionForm from "./components/ConfessionForm";
import ConfessionCard from "./components/ConfessionCard";
import StudentDashboard from "./components/StudentDashboard";
import CounselorDashboard from "./components/CounselorDashboard";
import { Heart, LogOut, PenTool, LayoutDashboard, History, Sparkles, UserCheck, HelpCircle, Lock, RefreshCw } from "lucide-react";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [privacyKey, setPrivacyKey] = useState(() => {
    return localStorage.getItem("ruang_teduh_saved_password") || "RAHASIA123";
  });
  const [activeTab, setActiveTab] = useState<"WRITE" | "ARCHIVE" | "DASHBOARD">("WRITE");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Custom visual toast state for iframe environments
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

  // Admin login modal states
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError("");
    setAdminLoading(true);

    if (!adminUsername.trim() || !adminPassword.trim()) {
      setAdminError("Username dan Password wajib diisi.");
      setAdminLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: adminUsername, password: adminPassword })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Akses ditolak.");
      }

      if (data.user.role !== "ADMIN") {
        throw new Error("Kredensial valid, namun akun ini bukan Pemandu Sanubari (Admin).");
      }

      // Save credentials for next time
      localStorage.setItem("ruang_teduh_saved_username", adminUsername);
      localStorage.setItem("ruang_teduh_saved_password", adminPassword);

      handleAuthSuccess(data.user);
      setShowAdminModal(false);
      setAdminUsername("");
      setAdminPassword("");
    } catch (err: any) {
      setAdminError(err.message || "Gagal masuk ruang admin.");
    } finally {
      setAdminLoading(false);
    }
  };

  // Restore user session on startup
  useEffect(() => {
    const storedUser = localStorage.getItem("ruang_teduh_user");
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
        const savedPassword = localStorage.getItem("ruang_teduh_saved_password");
        if (savedPassword) {
          setPrivacyKey(savedPassword);
        }
      } catch (e) {
        localStorage.removeItem("ruang_teduh_user");
      }
    }
  }, []);

  // Fetch student's own confessions if regular user
  const fetchConfessions = async () => {
    if (!currentUser) return;
    try {
      const response = await fetch(`/api/confessions?userId=${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        setConfessions(data.reverse()); // latest first
      }
    } catch (e) {
      console.error("Gagal mengambil data curhatan:", e);
    }
  };

  useEffect(() => {
    if (currentUser && currentUser.role === "USER") {
      fetchConfessions();
    }
  }, [currentUser, refreshTrigger]);

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem("ruang_teduh_user", JSON.stringify(user));
    
    const savedPassword = localStorage.getItem("ruang_teduh_saved_password");
    if (savedPassword) {
      setPrivacyKey(savedPassword);
    }

    // If admin logs in, default them to the dashboard
    if (user.role === "ADMIN") {
      setActiveTab("DASHBOARD");
    } else {
      setActiveTab("WRITE");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("ruang_teduh_user");
    setPrivacyKey("RAHASIA123");
  };

  const handleNewConfessionSuccess = (newConf: any) => {
    setConfessions([newConf, ...confessions]);
    setActiveTab("ARCHIVE"); // view their archive of beautiful cards
    showToast("Curahan hati berhasil dikirim! Kartu karya seni Anda kini tersimpan dalam enkripsi aman.", "success");
  };

  const handleDeleteConfession = async (id: string) => {
    if (!currentUser) return;
    try {
      const response = await fetch(`/api/confessions/${id}?userId=${currentUser.id}&role=${currentUser.role}`, {
        method: "DELETE"
      });
      if (response.ok) {
        setConfessions(prev => prev.filter(c => c.id !== id));
        showToast("Curahan hati Anda telah dihapus secara permanen dari Cloud Database.", "success");
      } else {
        const errData = await response.json();
        showToast(errData.error || "Gagal menghapus curhatan.", "error");
      }
    } catch (e) {
      console.error("Kesalahan menghapus:", e);
      showToast("Terjadi kesalahan koneksi saat menghapus curhatan.", "error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#855ec4] via-[#7d53bf] to-[#6739b6] text-white flex flex-col font-sans selection:bg-[#ff5d24]/30">
      
      {/* Dynamic Warm Ambient Light Overlays */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#ff5d24]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-white/5 rounded-full blur-[150px] pointer-events-none" />
      
      {/* Top Calming Navigation Header */}
      <header className="border-b border-white/10 bg-[#7244ab]/90 backdrop-blur-lg sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-[#f05a28] border border-[#ff5d24] flex items-center justify-center text-white shadow-md shadow-orange-950/20">
              <Heart size={16} fill="currentColor" className="text-white animate-pulse" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-base font-serif italic text-white tracking-tight font-bold">Ruang Teduh</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-purple-100 mt-0.5 font-bold">Private Sanctuary</p>
            </div>
          </div>

          {currentUser ? (
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Navigation Tabs for Pupil / Student */}
              {currentUser.role === "USER" && (
                <nav className="flex items-center gap-1 sm:gap-2">
                  {[
                    { id: "WRITE", label: "Pena Curhat", icon: PenTool },
                    { id: "ARCHIVE", label: "Galeri Karya", icon: History },
                    { id: "DASHBOARD", label: "Progres Emosi", icon: LayoutDashboard }
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isActive
                            ? "bg-[#f05a28] border border-[#ff5d24] text-white shadow-lg"
                            : "text-purple-100 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        <Icon size={13} />
                        <span className="hidden sm:inline">{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              )}

              {/* Navigation Indicator for Admin / Guru BK */}
              {currentUser.role === "ADMIN" && (
                <div className="flex items-center gap-1.5 bg-[#f05a28] border border-[#ff5d24] px-3 py-1.5 rounded-xl text-xs text-white font-mono font-bold shadow-md">
                  <UserCheck size={13} />
                  <span>KONSOL PEMANDU</span>
                </div>
              )}

              {/* User Identity info & Log Out */}
              <div className="flex items-center gap-2 sm:gap-4 border-l border-white/10 pl-4 sm:pl-6">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-bold text-white">{currentUser.penName}</span>
                  <span className="text-[10px] text-purple-200 uppercase tracking-wider font-semibold">{currentUser.role === "ADMIN" ? "Pemandu" : "Nama Pena"}</span>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl bg-white/10 border border-white/15 text-white hover:bg-[#f05a28] hover:border-[#ff5d24] hover:text-white transition-all cursor-pointer"
                  title="Keluar"
                >
                  <LogOut size={14} />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                setAdminError("");
                setShowAdminModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#f05a28] border border-[#ff5d24] hover:bg-[#e04f1c] transition-all hover:scale-105 cursor-pointer shadow-md font-mono"
            >
              <Lock size={12} />
              <span>ADMIN</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-center relative">
        {!currentUser ? (
          <AuthScreen onAuthSuccess={handleAuthSuccess} />
        ) : (
          <div className="w-full flex-1 animate-fade-in">
            {/* 1. STUDENT VIEW */}
            {currentUser.role === "USER" && (
              <>
                {activeTab === "WRITE" && (
                  <ConfessionForm
                    currentUser={currentUser}
                    privacyKey={privacyKey}
                    onSuccess={handleNewConfessionSuccess}
                  />
                )}

                 {activeTab === "ARCHIVE" && (
                  <div className="flex flex-col gap-6 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-serif italic tracking-tight text-white flex items-center gap-1.5 font-bold">
                          <History className="text-[#f05a28]" size={18} />
                          <span>Galeri Karya Seni Curahan Hati Anda</span>
                        </h2>
                        <p className="text-xs text-purple-100">Arsip aman seluruh ekspresi estetikamu yang terenkripsi sepenuhnya.</p>
                      </div>
 
                      {/* Privacy key configuration */}
                      <div className="flex items-center gap-2 bg-[#7244ab] p-2.5 rounded-2xl border border-white/10 shadow-md">
                        <span className="text-[10px] font-mono text-white uppercase tracking-wider font-bold">Kunci Sandi:</span>
                        <input
                          type="password"
                          value={privacyKey}
                          onChange={(e) => setPrivacyKey(e.target.value)}
                          className="px-2 py-1 text-xs bg-[#5c2d9e] border border-white/10 text-white font-mono text-center rounded-lg font-bold focus:border-[#ff5722] focus:outline-hidden w-28 placeholder-purple-200"
                          placeholder="Kunci..."
                        />
                      </div>
                    </div>

                    {confessions.length === 0 ? (
                      <div className="p-12 text-center bg-[#7244ab] rounded-3xl border border-white/10 flex flex-col items-center gap-3 w-full shadow-lg">
                        <PenTool size={32} className="text-purple-200 animate-pulse" />
                        <p className="text-sm text-purple-100 font-serif font-bold">Belum ada karya seni curhat yang Anda tulis.</p>
                        <button
                          onClick={() => setActiveTab("WRITE")}
                          className="mt-2 px-5 py-2.5 bg-[#f05a28] hover:bg-[#e04f1c] text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md"
                        >
                          Mulai Menulis Pertama Kali
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start w-full">
                        {confessions.map((conf) => (
                          <div key={conf.id} className="bg-[#7244ab] p-4 rounded-3xl border border-white/10 flex flex-col gap-4 shadow-xl">
                            <ConfessionCard
                              confession={conf}
                              privacyKey={privacyKey}
                              onDelete={handleDeleteConfession}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "DASHBOARD" && (
                  <StudentDashboard
                    currentUser={currentUser}
                    confessions={confessions}
                    privacyKey={privacyKey}
                    onPrivacyKeyChange={(newKey) => setPrivacyKey(newKey)}
                    onNewConfessionClick={() => setActiveTab("WRITE")}
                  />
                )}
              </>
            )}

            {/* 2. COUNSELOR (ADMIN) VIEW */}
            {currentUser.role === "ADMIN" && (
              <CounselorDashboard
                currentUser={currentUser}
                onRefreshDB={() => setRefreshTrigger(prev => prev + 1)}
              />
            )}
          </div>
        )}
      </main>

      {/* Aesthetic Calming Footer */}
      <footer className="border-t border-white/15 bg-[#5c2d9e]/80 backdrop-blur-md py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center">
          <span className="text-[10px] text-purple-200 font-mono tracking-wide font-bold">
            © 2026 Ruang Teduh. Dibuat dengan cinta untuk kesehatan dan kedamaian jiwa.
          </span>
          <div className="flex gap-4 text-[10px] text-purple-200 font-mono font-bold">
            <span className="flex items-center gap-1"><Lock size={10} className="text-orange-400" /> Sandi Terenkripsi Lokal</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Sparkles size={10} className="text-orange-400" /> Bimbingan AI Hangat</span>
          </div>
        </div>
      </footer>
      {/* Admin Login Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-sm bg-[#7244ab] p-6 rounded-3xl border border-white/20 shadow-2xl flex flex-col gap-5 animate-fade-in relative z-55">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-white">
                <Lock size={16} />
                <span className="font-serif italic text-sm font-bold">Akses Konsol Pemandu</span>
              </div>
              <button 
                onClick={() => setShowAdminModal(false)}
                className="text-purple-100 hover:text-white text-xs cursor-pointer px-2 py-1 rounded-lg hover:bg-white/10 transition-all font-bold"
              >
                Tutup
              </button>
            </div>
            
            {adminError && (
              <div className="p-3 bg-rose-600 border border-rose-400 rounded-xl text-xs text-white text-center font-mono font-bold">
                {adminError}
              </div>
            )}
            
            <form onSubmit={handleAdminLoginSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider text-purple-100 font-bold">Username Admin</label>
                <input
                  type="text"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="Ketik nama lengkap Pemandu..."
                  className="w-full p-2.5 bg-white border border-transparent rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-[#ff5722] font-mono font-bold"
                  required
                />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider text-purple-100 font-bold">Kata Sandi</label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Ketik kata sandi..."
                  className="w-full p-2.5 bg-white border border-transparent rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-[#ff5722] font-mono font-bold"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={adminLoading}
                className="w-full py-2.5 mt-2 bg-[#f05a28] hover:bg-[#e04f1c] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                {adminLoading ? (
                  <RefreshCw className="animate-spin" size={14} />
                ) : (
                  <>
                    <UserCheck size={14} />
                    <span>Masuk Konsol Pemandu</span>
                  </>
                )}
              </button>
            </form>
          </div>
         </div>
       )}

      {/* Modern floating non-blocking Toast notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-55 max-w-sm bg-[#7244ab]/95 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-2xl animate-fade-in flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
            toast.type === "success" ? "bg-emerald-400" : toast.type === "error" ? "bg-rose-500" : "bg-[#f05a28]"
          } animate-pulse`} />
          <p className="text-xs text-white leading-relaxed font-mono font-bold">{toast.message}</p>
          <button 
            onClick={() => setToast(null)}
            className="text-purple-100 hover:text-white font-bold text-xs ml-auto pl-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
