import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import * as bcrypt from "bcryptjs";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("aid_requests.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT,
    fullName TEXT
  );

  CREATE TABLE IF NOT EXISTS forms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    beneficiaryName TEXT,
    address TEXT,
    idNumber TEXT,
    familyCount INTEGER,
    phone TEXT,
    isMainBreadwinner INTEGER,
    maritalStatus TEXT,
    submissionDate TEXT,
    wifeName TEXT,
    wifeIdNumber TEXT,
    medicalReports TEXT,
    accessChannel TEXT,
    officeLocation TEXT,
    referralDetails TEXT,
    problemDescription TEXT,
    problemOther TEXT,
    submitterName TEXT,
    submitterSignature TEXT,
    fieldVisitDate TEXT,
    fieldReport TEXT,
    fieldDecision TEXT,
    fieldAidType TEXT,
    fieldRejectionReason TEXT,
    fieldCoordinatorName TEXT,
    reliefManagerDecision TEXT,
    reliefManagerReason TEXT,
    reliefManagerSignature TEXT,
    reliefManagerName TEXT,
    directorApproval TEXT,
    directorReason TEXT,
    directorName TEXT,
    directorSignature TEXT,
    directorStamp TEXT,
    directorDate TEXT,
    status TEXT DEFAULT 'PENDING'
  )
`);

// Migration for existing databases
console.log("Checking database schema...");
const tableInfo = db.prepare("PRAGMA table_info(forms)").all() as any[];
const columns = tableInfo.map(c => c.name);

const newColumns = [
  ['medicalReports', 'TEXT'],
  ['fieldVisitDate', 'TEXT'],
  ['fieldDecision', 'TEXT'],
  ['fieldAidType', 'TEXT'],
  ['fieldRejectionReason', 'TEXT'],
  ['fieldCoordinatorName', 'TEXT'],
  ['reliefManagerDecision', 'TEXT'],
  ['reliefManagerReason', 'TEXT'],
  ['reliefManagerSignature', 'TEXT'],
  ['reliefManagerName', 'TEXT'],
  ['directorApproval', 'TEXT'],
  ['directorReason', 'TEXT'],
  ['directorName', 'TEXT'],
  ['directorSignature', 'TEXT'],
  ['directorStamp', 'TEXT'],
  ['directorStampImage', 'TEXT'],
  ['institutionHeaderImage', 'TEXT'],
  ['directorDate', 'TEXT']
];

newColumns.forEach(([name, type]) => {
  if (!columns.includes(name)) {
    try {
      console.log(`Adding column ${name} to forms table...`);
      db.exec(`ALTER TABLE forms ADD COLUMN ${name} ${type}`);
    } catch (e) {
      console.error(`Failed to add column ${name}:`, e);
    }
  }
});

// Initialize default users if none exist
console.log("Checking users...");
try {
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
  if (userCount.count === 0) {
    console.log("Creating default users...");
    const salt = bcrypt.genSaltSync(10);
    const users = [
      { username: 'admin', password: '123', role: 'PROGRAM_DIRECTOR', fullName: 'مديرة البرامج' },
      { username: 'relief', password: '123', role: 'RELIEF_MANAGER', fullName: 'مدير الإغاثة' },
      { username: 'field', password: '123', role: 'FIELD_COORDINATOR', fullName: 'المنسق الميداني' },
      { username: 'user', password: '123', role: 'SUBMITTER', fullName: 'مقدم الطلب' },
    ];

    const insertUser = db.prepare("INSERT INTO users (username, password, role, fullName) VALUES (?, ?, ?, ?)");
    users.forEach(u => {
      insertUser.run(u.username, bcrypt.hashSync(u.password, salt), u.role, u.fullName);
    });
    console.log("Default users created.");
  }
} catch (e) {
  console.error("Failed to initialize users:", e);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' })); // Increase limit for base64 images

  // Auth Routes
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username) as any;

    if (user && bcrypt.compareSync(password, user.password)) {
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } else {
      res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" });
    }
  });

  app.post("/api/change-password", (req, res) => {
    const { userId, newPassword } = req.body;
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(newPassword, salt);

    try {
      db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashedPassword, userId);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "فشل تغيير كلمة المرور" });
    }
  });

  // API Routes
  app.get("/api/forms", (req, res) => {
    const forms = db.prepare("SELECT * FROM forms ORDER BY id DESC").all();
    res.json(forms);
  });

  app.post("/api/forms", (req, res) => {
    const data = req.body;
    const stmt = db.prepare(`
      INSERT INTO forms (
        beneficiaryName, address, idNumber, familyCount, phone, isMainBreadwinner,
        maritalStatus, submissionDate, wifeName, wifeIdNumber, medicalReports, accessChannel,
        officeLocation, referralDetails, problemDescription, problemOther,
        submitterName, submitterSignature, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'FIELD_REVIEW_PENDING')
    `);

    const result = stmt.run(
      data.beneficiaryName, data.address, data.idNumber, data.familyCount,
      data.phone, data.isMainBreadwinner ? 1 : 0, data.maritalStatus,
      data.submissionDate, data.wifeName, data.wifeIdNumber,
      JSON.stringify(data.medicalReports || []),
      JSON.stringify(data.accessChannel), data.officeLocation, data.referralDetails,
      JSON.stringify(data.problemDescription), data.problemOther,
      data.submitterName, data.submitterSignature
    );

    res.json({ id: result.lastInsertRowid });
  });

  app.patch("/api/forms/:id", (req, res) => {
    const { id } = req.params;
    const data = req.body;
    
    // Dynamic update based on role/section
    const fields = Object.keys(data).filter(k => k !== 'id');
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => {
      if (Array.isArray(data[f])) return JSON.stringify(data[f]);
      return data[f];
    });

    const stmt = db.prepare(`UPDATE forms SET ${setClause} WHERE id = ?`);
    stmt.run(...values, id);
    
    res.json({ success: true });
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
