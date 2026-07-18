import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  addDoc, 
  query, 
  where 
} from 'firebase/firestore';

dotenv.config();

// --- KONFIGURASI FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyAbZcPJHnaARMEjg23iwViwtfzjwb23vKg",
  authDomain: "project-umum-a58eb.firebaseapp.com",
  projectId: "project-umum-a58eb",
  storageBucket: "project-umum-a58eb.firebasestorage.app",
  messagingSenderId: "778774567319",
  appId: "1:778774567319:web:1c2b35335ce1c3550bccd2"
};

// --- MENGHIDUPKAN MESIN FIREBASE ---
const firebaseApp = initializeApp(firebaseConfig);
const firestoreDb = getFirestore(firebaseApp);

// Initialize Gemini API client safely if key is available
let ai: GoogleGenAI | null = null;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (GEMINI_API_KEY && GEMINI_API_KEY !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    console.log("Gemini API initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize Gemini API:", err);
  }
} else {
  console.log("GEMINI_API_KEY is not configured. Running in fallback mode.");
}

const app = express();
const PORT = 3000;

app.use(express.json());

// --- API Endpoints ---

// 1. Authentication APIs
app.post("/api/auth/register", async (req, res) => {
  const { username, password, penName } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: "Username dan Password wajib diisi." });
  }

  // Prevent users from taking over the admin account name case-insensitively
  if (
    username.toLowerCase() === "gagat aditya kurniaji" || 
    username.toLowerCase() === "admin"
  ) {
    return res.status(400).json({ error: "Username ini dicadangkan untuk Admin." });
  }
  
  try {
    const q = query(
      collection(firestoreDb, "users"), 
      where("usernameLowercase", "==", username.toLowerCase())
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return res.status(400).json({ error: "Username sudah terdaftar." });
    }
    
    const userId = "user-" + Math.random().toString(36).substring(2, 11);
    const newUser = {
      id: userId,
      username,
      usernameLowercase: username.toLowerCase(),
      passwordHash: password,
      penName: penName || "Hamba Allah",
      role: "USER",
      createdAt: new Date().toISOString()
    };
    
    await setDoc(doc(firestoreDb, "users", userId), newUser);
    
    res.status(201).json({
      message: "Registrasi berhasil",
      user: {
        id: newUser.id,
        username: newUser.username,
        penName: newUser.penName,
        role: newUser.role,
        createdAt: newUser.createdAt
      }
    });
  } catch (err: any) {
    console.error("Firestore error registering user:", err);
    res.status(500).json({ error: "Gagal menyimpan data pengguna ke Cloud Database." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: "Username dan Password wajib diisi." });
  }
  
  // Permanent Hardcoded Admin Credentials
  if (username === "Gagat Aditya Kurniaji" && password === "Ibrahim17") {
    return res.json({
      message: "Login berhasil",
      user: {
        id: "admin-user",
        username: "Gagat Aditya Kurniaji",
        penName: "Gagat Aditya Kurniaji",
        role: "ADMIN",
        createdAt: new Date().toISOString()
      }
    });
  }

  if (username.toLowerCase() === "gagat aditya kurniaji") {
    return res.status(401).json({ error: "Username atau Password salah." });
  }
  
  try {
    const q = query(
      collection(firestoreDb, "users"), 
      where("usernameLowercase", "==", username.toLowerCase()),
      where("passwordHash", "==", password)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return res.status(401).json({ error: "Username atau Password salah." });
    }
    
    const userDoc = querySnapshot.docs[0];
    const user = userDoc.data();
    
    res.json({
      message: "Login berhasil",
      user: {
        id: user.id,
        username: user.username,
        penName: user.penName,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (err: any) {
    console.error("Firestore login error:", err);
    res.status(500).json({ error: "Gagal memproses autentikasi dari Cloud Database." });
  }
});

// 2. Confessions APIs
app.get("/api/confessions", async (req, res) => {
  const { userId, role } = req.query;
  
  try {
    let confessions: any[] = [];
    
    if (role === "ADMIN" || userId === "admin-user") {
      const snapshot = await getDocs(collection(firestoreDb, "confessions"));
      confessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      if (!userId) {
        return res.status(400).json({ error: "userId diperlukan." });
      }
      const q = query(collection(firestoreDb, "confessions"), where("userId", "==", userId));
      const snapshot = await getDocs(q);
      confessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    
    confessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(confessions);
  } catch (err: any) {
    console.error("Firestore get confessions error:", err);
    res.status(500).json({ error: "Gagal mengambil data curhatan dari Cloud Database." });
  }
});

app.post("/api/confessions", async (req, res) => {
  const { userId, authorPenName, type, title, encryptedContent, adminEncryptedContent, templateStyleId, cardSize, isAnonymousToAdmin } = req.body;
  
  if (!userId || !encryptedContent) {
    return res.status(400).json({ error: "Data curhatan tidak lengkap." });
  }
  
  const confessionId = "conf-" + Math.random().toString(36).substring(2, 11);
  const newConfession = {
    id: confessionId,
    userId,
    authorPenName: authorPenName || "Anonim",
    type: type || "FREE_TEXT",
    title: title || "Tanpa Judul",
    encryptedContent,
    adminEncryptedContent: adminEncryptedContent || "",
    templateStyleId: templateStyleId || "style-1",
    cardSize: cardSize || "SQUARE",
    isAnonymousToAdmin: !!isAnonymousToAdmin,
    createdAt: new Date().toISOString()
  };
  
  try {
    await setDoc(doc(firestoreDb, "confessions", confessionId), newConfession);
    res.status(201).json(newConfession);
  } catch (err: any) {
    console.error("Firestore save confession error:", err);
    res.status(500).json({ error: "Gagal menyimpan curhatan ke Cloud Database." });
  }
});

app.post("/api/confessions/:id/respond", async (req, res) => {
  const { id } = req.params;
  const { responseText } = req.body;
  
  if (!responseText) {
    return res.status(400).json({ error: "Catatan respon penulisan wajib diisi." });
  }
  
  try {
    const confessionRef = doc(firestoreDb, "confessions", id);
    const confessionSnap = await getDoc(confessionRef);
    
    if (!confessionSnap.exists()) {
      return res.status(404).json({ error: "Curhatan tidak ditemukan." });
    }
    
    const updatedData = {
      counselorResponse: responseText,
      counselorRepliedAt: new Date().toISOString()
    };
    
    await updateDoc(confessionRef, updatedData);
    
    res.json({
      message: "Respon curhatan berhasil disimpan",
      confession: {
        ...confessionSnap.data(),
        ...updatedData
      }
    });
  } catch (err: any) {
    console.error("Firestore respond confession error:", err);
    res.status(500).json({ error: "Gagal menyimpan respon curhatan ke Cloud Database." });
  }
});

app.delete("/api/confessions/:id", async (req, res) => {
  const { id } = req.params;
  const { userId, role } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "Identifikasi pengguna diperlukan untuk menghapus." });
  }

  try {
    const confessionRef = doc(firestoreDb, "confessions", id);
    const confessionSnap = await getDoc(confessionRef);

    if (!confessionSnap.exists()) {
      return res.status(404).json({ error: "Curhatan tidak ditemukan." });
    }

    const confessionData = confessionSnap.data();

    // Check permissions: ADMIN can delete any. Normal USER can only delete their own.
    if (role !== "ADMIN" && confessionData.userId !== userId) {
      return res.status(403).json({ error: "Anda tidak memiliki hak untuk menghapus curhatan ini." });
    }

    await deleteDoc(confessionRef);
    res.json({ message: "Curhatan berhasil dihapus." });
  } catch (err: any) {
    console.error("Firestore delete confession error:", err);
    res.status(500).json({ error: "Gagal menghapus curhatan dari Cloud Database." });
  }
});

// 3. Emotional Logs APIs
app.get("/api/emotional-logs", async (req, res) => {
  const { userId, role } = req.query;
  
  try {
    let logs: any[] = [];
    
    if (role === "ADMIN" || userId === "admin-user") {
      const snapshot = await getDocs(collection(firestoreDb, "emotionalLogs"));
      logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      if (!userId) {
        return res.status(400).json({ error: "userId diperlukan." });
      }
      const q = query(collection(firestoreDb, "emotionalLogs"), where("userId", "==", userId));
      const snapshot = await getDocs(q);
      logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    
    logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(logs);
  } catch (err: any) {
    console.error("Firestore get logs error:", err);
    res.status(500).json({ error: "Gagal mengambil data progres emosi dari Cloud Database." });
  }
});

app.post("/api/emotional-logs", async (req, res) => {
  const { userId, emotion, intensity, note } = req.body;
  
  if (!userId || !emotion) {
    return res.status(400).json({ error: "Data emosi tidak lengkap." });
  }
  
  const logId = "log-" + Math.random().toString(36).substring(2, 11);
  const newLog = {
    id: logId,
    userId,
    emotion,
    intensity: intensity || 3,
    note: note || "",
    createdAt: new Date().toISOString()
  };
  
  try {
    await setDoc(doc(firestoreDb, "emotionalLogs", logId), newLog);
    res.status(201).json(newLog);
  } catch (err: any) {
    console.error("Firestore save log error:", err);
    res.status(500).json({ error: "Gagal menyimpan emosi ke Cloud Database." });
  }
});

// 4. Counseling Sessions / Reminders APIs
app.get("/api/sessions", async (req, res) => {
  const { userId, role } = req.query;
  
  try {
    let sessions: any[] = [];
    
    if (role === "ADMIN" || userId === "admin-user") {
      const snapshot = await getDocs(collection(firestoreDb, "counselingSessions"));
      sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      if (!userId) {
        return res.status(400).json({ error: "userId diperlukan." });
      }
      const q = query(collection(firestoreDb, "counselingSessions"), where("userId", "==", userId));
      const snapshot = await getDocs(q);
      sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    
    sessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(sessions);
  } catch (err: any) {
    console.error("Firestore get sessions error:", err);
    res.status(500).json({ error: "Gagal mengambil data sesi berbagi dari Cloud Database." });
  }
});

app.post("/api/sessions", async (req, res) => {
  const { userId, username, penName, scheduledAt, notes } = req.body;
  
  if (!userId || !scheduledAt) {
    return res.status(400).json({ error: "userId dan tanggal sesi diperlukan." });
  }
  
  const sessionId = "sess-" + Math.random().toString(36).substring(2, 11);
  const newSession = {
    id: sessionId,
    userId,
    username: username || "Sahabat",
    penName: penName || "Nama Pena",
    scheduledAt,
    status: "SCHEDULED",
    notes: notes || "",
    createdAt: new Date().toISOString()
  };
  
  try {
    await setDoc(doc(firestoreDb, "counselingSessions", sessionId), newSession);
    res.status(201).json(newSession);
  } catch (err: any) {
    console.error("Firestore save session error:", err);
    res.status(500).json({ error: "Gagal menyimpan jadwal sesi ke Cloud Database." });
  }
});

app.patch("/api/sessions/:id", async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  
  try {
    const sessionRef = doc(firestoreDb, "counselingSessions", id);
    const sessionSnap = await getDoc(sessionRef);
    
    if (!sessionSnap.exists()) {
      return res.status(404).json({ error: "Sesi berbagi tidak ditemukan." });
    }
    
    const updatedData: any = {};
    if (status) updatedData.status = status;
    if (notes !== undefined) updatedData.notes = notes;
    
    await updateDoc(sessionRef, updatedData);
    
    res.json({
      ...sessionSnap.data(),
      ...updatedData
    });
  } catch (err: any) {
    console.error("Firestore patch session error:", err);
    res.status(500).json({ error: "Gagal memperbarui sesi berbagi di Cloud Database." });
  }
});

// 5. Gemini AI Analysis & Empathetic Reflection
app.post("/api/gemini/reflect", async (req, res) => {
  const { title, type, decryptedText } = req.body;
  
  if (!decryptedText) {
    return res.status(400).json({ error: "Teks curhatan tidak boleh kosong." });
  }
  
  if (!ai) {
    const fallbackResponses = [
      "Terima kasih sudah mencurahkan isi hatimu. Setiap kata yang kamu tulis begitu indah dan mendalam. Ingatlah bahwa kamu tidak sendirian, dan emosi yang kamu rasakan sepenuhnya valid. Teruslah berkarya dan salurkan energimu ke dalam tulisan-tulisan indah selanjutnya.",
      "Sajak/kata-kata yang kamu buat menggambarkan ketulusan hatimu. Ruang Teduh selalu ada untuk mendengar. Semoga curahan hati ini membawa sedikit kelegaan di dadamu. Tetap jaga kesehatan mentalmu dan bernapaslah dengan tenang.",
      "Karya yang begitu menyentuh jiwa. Menulis adalah salah satu bentuk katarsis emosi terbaik. Semoga kehangatan selalu menyertai langkahmu hari ini. Bila kamu butuh ruang berbagi lebih lanjut, Penjaga Teduh kami selalu siap menyambutmu."
    ];
    const randomIndex = Math.floor(Math.random() * fallbackResponses.length);
    return res.json({ reflection: fallbackResponses[randomIndex] });
  }
  
  try {
    const prompt = `
      Anda adalah "Asisten AI Ruang Teduh", seorang asisten emosional dan pemandu sanubari yang sangat hangat, empatik, bijaksana, dan ramah.
      
      Seorang sahabat/pengguna telah menulis sebuah karya curahan hati dengan rincian berikut:
      - Judul: "${title || "Tanpa Judul"}"
      - Jenis Karya: "${type}"
      - Isi Curahan Hati: "${decryptedText}"
      
      Tugas Anda:
      1. Berikan apresiasi estetika terhadap karya tulis mereka (apakah itu puisi, pantun, quotes, lirik lagu, atau kata bebas).
      2. Berikan analisis psikologis/emosional yang hangat terhadap perasaan yang tersirat dalam karya mereka (misal: rasa rindu, kesepian, cemas, haru, atau bahagia). Nyatakan bahwa perasaan mereka itu valid.
      3. Berikan kata-kata penyemangat, dukungan hangat, dan saran relaksasi yang menenangkan (misal: teknik pernapasan, istirahat sejenak, atau pengingat bahwa badai pasti berlalu).
      4. Gunakan bahasa Indonesia yang santun, puitis, menenangkan, ramah, dan sangat empatik layaknya seorang pemandu sanubari idaman yang merangkul sahabatnya. Jangan gunakan bahasa yang kaku atau formalitas robotik. Gunakan sapaan hangat seperti "Sahabat Teduh-ku" atau "Jiwa Indah".
      
      Batasi respon Anda maksimal dalam 3 paragraf pendek agar mudah dibaca dan meresap ke dalam hati.
    `;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    
    const reflection = response.text || "Terima kasih sudah membagikan curahan hatimu yang begitu indah.";
    res.json({ reflection });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "Gagal memproses refleksi emosional AI." });
  }
});

// Update / Save AI Reflection directly back to a confession
app.post("/api/confessions/:id/ai-reflect", async (req, res) => {
  const { id } = req.params;
  const { aiReflection } = req.body;
  
  try {
    const confessionRef = doc(firestoreDb, "confessions", id);
    const confessionSnap = await getDoc(confessionRef);
    
    if (!confessionSnap.exists()) {
      return res.status(404).json({ error: "Curhatan tidak ditemukan." });
    }
    
    await updateDoc(confessionRef, { aiReflection });
    
    res.json({
      message: "Refleksi AI berhasil diperbarui",
      confession: {
        ...confessionSnap.data(),
        aiReflection
      }
    });
  } catch (err: any) {
    console.error("Firestore AI reflect error:", err);
    res.status(500).json({ error: "Gagal memperbarui refleksi AI di Cloud Database." });
  }
});

// --- Vite Middleware or Static Assets setup ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Ruang Teduh server running on port ${PORT}`);
  });
}

startServer();
