import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("capitune.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    name TEXT,
    role TEXT,
    avatar TEXT,
    banner TEXT,
    points INTEGER DEFAULT 0,
    credibility_score INTEGER DEFAULT 0,
    province TEXT,
    specialty TEXT,
    bio TEXT,
    verified INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS dossiers (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    status TEXT,
    step INTEGER DEFAULT 1,
    data TEXT,
    assigned_to TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    title TEXT,
    description TEXT,
    type TEXT,
    status TEXT,
    date DATETIME,
    link TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    content TEXT,
    category TEXT,
    media_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Mock Auth Middleware (for demo purposes)
  const authMiddleware = (req: any, res: any, next: any) => {
    // In a real app, verify Firebase JWT
    req.user = { id: "demo-user", email: "demo@capitune.ca", role: "PARTICULIER" };
    next();
  };

  app.get("/api/users/me", authMiddleware, (req: any, res) => {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
    if (!user) {
      // Create demo user if not exists
      const newUser = {
        id: req.user.id,
        email: req.user.email,
        name: "Candidat Démo",
        role: "PARTICULIER",
        avatar: "https://picsum.photos/seed/avatar/200",
        points: 150,
        credibility_score: 75
      };
      db.prepare("INSERT INTO users (id, email, name, role, avatar, points, credibility_score) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
        newUser.id, newUser.email, newUser.name, newUser.role, newUser.avatar, newUser.points, newUser.credibility_score
      );
      return res.json(newUser);
    }
    res.json(user);
  });

  app.get("/api/dossiers", authMiddleware, (req: any, res) => {
    const dossiers = db.prepare("SELECT * FROM dossiers WHERE user_id = ?").all(req.user.id);
    res.json(dossiers);
  });

  app.post("/api/dossiers", authMiddleware, (req: any, res) => {
    const id = Math.random().toString(36).substring(7);
    const { data } = req.body;
    db.prepare("INSERT INTO dossiers (id, user_id, status, data) VALUES (?, ?, ?, ?)").run(
      id, req.user.id, "Ouvert", JSON.stringify(data || {})
    );
    res.json({ id, status: "Ouvert" });
  });

  app.get("/api/eed", (req, res) => {
    // Real DLI examples
    res.json([
      { id: "1", name: "Université Laval", province: "Québec", type: "Université", url: "https://www.ulaval.ca" },
      { id: "2", name: "McGill University", province: "Québec", type: "Université", url: "https://www.mcgill.ca" },
      { id: "3", name: "University of Toronto", province: "Ontario", type: "Université", url: "https://www.utoronto.ca" },
      { id: "4", name: "University of British Columbia", province: "Colombie-Britannique", type: "Université", url: "https://www.ubc.ca" },
      { id: "5", name: "Université de Montréal", province: "Québec", type: "Université", url: "https://www.umontreal.ca" },
      { id: "6", name: "University of Alberta", province: "Alberta", type: "Université", url: "https://www.ualberta.ca" },
      { id: "7", name: "Concordia University", province: "Québec", type: "Université", url: "https://www.concordia.ca" },
      { id: "8", name: "Seneca Polytechnic", province: "Ontario", type: "Collège", url: "https://www.senecapolytechnic.ca" },
      { id: "9", name: "Collège Ahuntsic", province: "Québec", type: "Collège", url: "https://www.collegeahuntsic.qc.ca" },
      { id: "10", name: "University of New Brunswick", province: "Nouveau-Brunswick", type: "Université", url: "https://www.unb.ca" },
      { id: "11", name: "Université de Moncton", province: "Nouveau-Brunswick", type: "Université", url: "https://www.umoncton.ca" },
      { id: "12", name: "Mount Allison University", province: "Nouveau-Brunswick", type: "Université", url: "https://www.mta.ca" },
      { id: "13", name: "New Brunswick Community College (NBCC)", province: "Nouveau-Brunswick", type: "Collège", url: "https://nbcc.ca" },
      { id: "14", name: "Collège communautaire du Nouveau-Brunswick (CCNB)", province: "Nouveau-Brunswick", type: "Collège", url: "https://ccnb.ca" },
      { id: "15", name: "St. Thomas University", province: "Nouveau-Brunswick", type: "Université", url: "https://www.stu.ca" },
      { id: "16", name: "Crandall University", province: "Nouveau-Brunswick", type: "Université", url: "https://www.crandallu.ca" },
      { id: "17", name: "University of Manitoba", province: "Manitoba", type: "Université", url: "https://umanitoba.ca" },
      { id: "18", name: "University of Winnipeg", province: "Manitoba", type: "Université", url: "https://www.uwinnipeg.ca" },
      { id: "19", name: "Brandon University", province: "Manitoba", type: "Université", url: "https://www.brandonu.ca" },
      { id: "20", name: "Red River College Polytechnic", province: "Manitoba", type: "Collège", url: "https://www.rrc.ca" },
      { id: "21", name: "Assiniboine Community College", province: "Manitoba", type: "Collège", url: "https://assiniboine.net" },
      { id: "22", name: "Université de Saint-Boniface", province: "Manitoba", type: "Université", url: "https://ustboniface.ca" },
      { id: "23", name: "Manitoba Institute of Trades and Technology (MITT)", province: "Manitoba", type: "Collège", url: "https://mitt.ca" },
      { id: "24", name: "University of Waterloo", province: "Ontario", type: "Université", url: "https://uwaterloo.ca" },
      { id: "25", name: "McMaster University", province: "Ontario", type: "Université", url: "https://www.mcmaster.ca" },
      { id: "26", name: "University of Ottawa", province: "Ontario", type: "Université", url: "https://www.uottawa.ca" },
      { id: "27", name: "Western University", province: "Ontario", type: "Université", url: "https://www.uwo.ca" },
      { id: "28", name: "Queen's University", province: "Ontario", type: "Université", url: "https://www.queensu.ca" },
      { id: "29", name: "York University", province: "Ontario", type: "Université", url: "https://www.yorku.ca" },
      { id: "30", name: "Humber College", province: "Ontario", type: "Collège", url: "https://humber.ca" },
      { id: "31", name: "George Brown College", province: "Ontario", type: "Collège", url: "https://www.georgebrown.ca" },
      { id: "32", name: "Fanshawe College", province: "Ontario", type: "Collège", url: "https://www.fanshawec.ca" },
      { id: "33", name: "Algonquin College", province: "Ontario", type: "Collège", url: "https://www.algonquincollege.com" },
      { id: "34", name: "Simon Fraser University", province: "Colombie-Britannique", type: "Université", url: "https://www.sfu.ca" },
      { id: "35", name: "University of Victoria", province: "Colombie-Britannique", type: "Université", url: "https://www.uvic.ca" },
      { id: "36", name: "British Columbia Institute of Technology (BCIT)", province: "Colombie-Britannique", type: "Collège", url: "https://www.bcit.ca" },
      { id: "37", name: "Langara College", province: "Colombie-Britannique", type: "Collège", url: "https://langara.ca" },
      { id: "38", name: "Douglas College", province: "Colombie-Britannique", type: "Collège", url: "https://www.douglascollege.ca" },
      { id: "39", name: "Thompson Rivers University", province: "Colombie-Britannique", type: "Université", url: "https://www.tru.ca" },
      { id: "40", name: "Vancouver Island University", province: "Colombie-Britannique", type: "Université", url: "https://www.viu.ca" },
      { id: "41", name: "Capilano University", province: "Colombie-Britannique", type: "Université", url: "https://www.capilanou.ca" },
      { id: "42", name: "University of Calgary", province: "Alberta", type: "Université", url: "https://www.ucalgary.ca" },
      { id: "43", name: "University of Lethbridge", province: "Alberta", type: "Université", url: "https://www.ulethbridge.ca" },
      { id: "44", name: "Mount Royal University", province: "Alberta", type: "Université", url: "https://www.mtroyal.ca" },
      { id: "45", name: "MacEwan University", province: "Alberta", type: "Université", url: "https://www.macewan.ca" },
      { id: "46", name: "Southern Alberta Institute of Technology (SAIT)", province: "Alberta", type: "Collège", url: "https://www.sait.ca" },
      { id: "47", name: "Northern Alberta Institute of Technology (NAIT)", province: "Alberta", type: "Collège", url: "https://www.nait.ca" },
      { id: "48", name: "Bow Valley College", province: "Alberta", type: "Collège", url: "https://bowvalleycollege.ca" },
      { id: "49", name: "NorQuest College", province: "Alberta", type: "Collège", url: "https://www.norquest.ca" }
    ]);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
