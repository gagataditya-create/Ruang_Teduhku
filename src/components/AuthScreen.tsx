import React, { useState } from "react";
import { Sparkles, RefreshCw, LogIn, UserPlus, Heart, Lock, HelpCircle, ShieldCheck } from "lucide-react";
import { User } from "../types";

interface AuthScreenProps {
  onAuthSuccess: (user: User) => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState(() => {
    return localStorage.getItem("ruang_teduh_saved_username") || "";
  });
  const [password, setPassword] = useState(() => {
    return localStorage.getItem("ruang_teduh_saved_password") || "";
  });
  const [penName, setPenName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    if (!username.trim() || !password.trim()) {
      setErrorMsg("Username dan Password wajib diisi.");
      setLoading(false);
      return;
    }

    if (!isLogin && !penName.trim()) {
      setErrorMsg("Nama Pena wajib diisi agar karya Anda memiliki identitas keindahan.");
      setLoading(false);
      return;
    }

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    const payload = isLogin 
      ? { username, password }
      : { username, password, penName };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Gagal memproses autentikasi.");
      }

      // Save credentials to localStorage for next time
      localStorage.setItem("ruang_teduh_saved_username", username);
      localStorage.setItem("ruang_teduh_saved_password", password);

      onAuthSuccess(data.user);
    } catch (err: any) {
      setErrorMsg(err.message || "Koneksi terganggu. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white p-8 rounded-3xl border border-purple-200 shadow-2xl flex flex-col gap-6" id="auth-screen-container">
      
      {/* App Branding logo inside auth */}
      <div className="flex flex-col items-center gap-1.5 text-center">
        <div className="w-14 h-14 bg-[#f05a28] rounded-full flex items-center justify-center border border-[#ff5d24] shadow-md text-white mb-2">
          <Heart size={28} className="text-white animate-pulse" fill="currentColor" />
        </div>
        <h1 className="text-3xl font-serif italic text-[#7244ab] tracking-tight font-bold">Ruang Teduh</h1>
        <p className="text-[10px] uppercase tracking-[0.2em] text-purple-400 mt-1 font-bold">Private Sanctuary</p>
        <p className="text-xs text-slate-600 max-w-[300px] mt-2 font-bold leading-relaxed">
          Gerbang aman mencurahkan kalbu, mengukir karya, dan bersandar pada pendampingan pemandu sanubari yang tulus.
        </p>
      </div>

      {/* Switch Tab buttons */}
      <div className="grid grid-cols-2 bg-[#f3effa] p-1.5 rounded-2xl border border-purple-100">
        <button
          onClick={() => { setIsLogin(true); setErrorMsg(""); }}
          className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            isLogin ? "bg-white border border-[#ff5d24] text-[#f05a28] shadow-sm" : "text-purple-700 hover:text-purple-900 hover:bg-white/40 border border-transparent"
          }`}
        >
          Masuk Ruang
        </button>
        <button
          onClick={() => { setIsLogin(false); setErrorMsg(""); }}
          className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            !isLogin ? "bg-white border border-[#ff5d24] text-[#f05a28] shadow-sm" : "text-purple-700 hover:text-purple-900 hover:bg-white/40 border border-transparent"
          }`}
        >
          Daftar Akun
        </button>
      </div>

      {/* Auth Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 text-center font-semibold font-mono">
            {errorMsg}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-mono tracking-wider text-purple-700 font-bold">Username Akun</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Ketik username..."
            className="w-full p-2.5 bg-[#f3effa] border border-purple-100 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:bg-white focus:border-[#ff5d24] font-mono font-bold transition-all"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-mono tracking-wider text-purple-700 font-bold">Kata Sandi (Password)</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Ketik kata sandi..."
            className="w-full p-2.5 bg-[#f3effa] border border-purple-100 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:bg-white focus:border-[#ff5d24] font-mono font-bold transition-all"
            required
          />
        </div>

        {/* Extra registration details */}
        {!isLogin && (
          <div className="flex flex-col gap-1.5 animate-fade-in">
            <label className="text-[10px] uppercase font-mono tracking-wider text-purple-700 font-bold">Nama Pena Kreatif</label>
            <input
              type="text"
              value={penName}
              onChange={(e) => setPenName(e.target.value)}
              placeholder="Misal: Penulis Senja, Musafir Rasa..."
              className="w-full p-2.5 bg-[#f3effa] border border-purple-100 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:bg-white focus:border-[#ff5d24] font-serif font-bold transition-all"
              required
            />
            <span className="text-[9px] text-purple-600 font-mono leading-relaxed font-bold">
              Nama pena ini akan tertera sebagai pengarang pada karya seni curahan hati Anda.
            </span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 mt-2 bg-[#f05a28] hover:bg-[#e04f1c] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md hover:shadow-lg cursor-pointer"
        >
          {loading ? (
            <RefreshCw className="animate-spin" size={14} />
          ) : isLogin ? (
            <>
              <LogIn size={14} />
              <span>Masuk Ruang Teduh</span>
            </>
          ) : (
            <>
              <UserPlus size={14} />
              <span>Daftar Akun Teduh</span>
            </>
          )}
        </button>

      </form>

      {/* Comforting footer message */}
      <div className="flex justify-center items-center gap-1 text-[10px] text-purple-500 font-mono border-t border-purple-100 pt-4 font-bold">
        <Lock size={10} className="text-[#f05a28]" />
        <span>Terenkripsi Simetris Ganda 256-Bit</span>
      </div>

    </div>
  );
}
