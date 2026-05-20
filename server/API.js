const express = require("express");
const path = require("path");
const cors = require("cors");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const { spawn } = require("child_process");
const WebSocket = require("ws");
const fs = require("fs");

console.log("🚀 SERVER STARTING...");

const app = express();
// const PORT = 3000;
const PORT = process.env.PORT || 3000;

/* ================= DB ================= */
const db = mysql.createPool({
 
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  
});
  db.query(`
CREATE TABLE IF NOT EXISTS users(
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255)
)
`);

db.query(`
CREATE TABLE IF NOT EXISTS questions(
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255),
  description TEXT
)
`);

db.query(`
CREATE TABLE IF NOT EXISTS progress(
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  question_id INT,
  solved BOOLEAN DEFAULT FALSE,
  UNIQUE KEY unique_progress(user_id, question_id)
)
`);
  



/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

/* ================= SIGNUP ================= */
app.post("/api/signup", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ msg: "All fields required" });
  }

  db.query("SELECT * FROM users WHERE email=?", [email], async (err, result) => {
    if (err) return res.status(500).json({ msg: "DB error" });

    if (result.length > 0) {
      return res.json({ msg: "User already exists" });
    }

    const hash = await bcrypt.hash(password, 10);

    db.query(
      "INSERT INTO users(name,email,password) VALUES(?,?,?)",
      [name, email, hash],
      (err) => {
        if (err) return res.status(500).json({ msg: "Insert failed" });
        res.json({ msg: "Registered ✅" });
      }
    );
  });
});

/* ================= LOGIN ================= */
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM users WHERE email=?", [email], async (err, result) => {
    if (err) return res.status(500).json({ msg: "DB error" });

    if (result.length === 0) {
      return res.json({ msg: "User not found ❌" });
    }

    const user = result[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.json({ msg: "Wrong password ❌" });
    }

    res.json({
      msg: "Login success ✅",
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  });
});

/* ================= FORGOT PASSWORD ================= */
app.post("/forgot-password", (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email required ❌" });
  }

  db.query("SELECT * FROM users WHERE email=?", [email], (err, result) => {
    if (err) return res.status(500).json({ message: "DB error" });

    if (result.length === 0) {
      return res.status(404).json({ message: "Email not registered ❌" });
    }

    res.json({ message: "Email verified ✅" });
  });
});

/* ================= RESET PASSWORD ================= */
app.post("/reset-password", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Missing data ❌" });
  }

  try {
    const hash = await bcrypt.hash(password, 10);

    db.query(
      "UPDATE users SET password=? WHERE email=?",
      [hash, email],
      (err, result) => {
        if (err) return res.status(500).json({ message: "Update failed ❌" });

        if (result.affectedRows === 0) {
          return res.status(404).json({ message: "User not found ❌" });
        }

        res.json({ message: "Password updated ✅" });
      }
    );
  } catch (err) {
    res.status(500).json({ message: "Server error ❌" });
  }
});

/* ================= QUESTIONS ================= */
app.get("/api/questions", (req, res) => {
  db.query("SELECT * FROM questions", (err, result) => {
    if (err) return res.json([]);
    res.json(result);
  });
});

/* ================= USER PROGRESS ================= */
app.get("/api/progress/:userId", (req, res) => {
  const userId = req.params.userId;

  db.query(
    `SELECT q.id, q.title,
     IFNULL(p.solved, false) as solved
     FROM questions q
     LEFT JOIN progress p
     ON q.id = p.question_id AND p.user_id = ?`,
    [userId],
    (err, result) => {
      if (err) {
        console.log("Progress API Error:", err);
        return res.json([]);
      }
      res.json(result);
    }
  );
});

/* ================= MARK COMPLETE ================= */
app.post("/api/progress", (req, res) => {
  const { userId, questionId } = req.body;

  db.query(
    `INSERT INTO progress(user_id, question_id, solved)
     VALUES (?, ?, true)
     ON DUPLICATE KEY UPDATE solved = true`,
    [userId, questionId],
    (err) => {
      if (err) return res.json({ msg: "Error saving" });
      res.json({ msg: "Saved ✅" });
    }
  );
});

/* ================= START SERVER ================= */

const http = require("http");

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`🚀 HTTP + WS running on PORT ${PORT}`);
});

/* ================= WEBSOCKET ================= */

const wss = new WebSocket.Server({
  server
  
});

wss.on("connection", (ws) => {
    
   ws.isAlive = true;

   ws.on("pong", () => {
   ws.isAlive = true;
   }); 

    ws.on("error", (err) => {
    console.log("WS ERROR:", err);
  });

  console.log("⚡ WS Connected");

  let processRun = null;
   ws.on("close", () => {
    console.log("❌ WS Closed");

    if (processRun) {
      processRun.kill("SIGKILL");
    }
  });
  ws.on("message", (msg) => {
    let data;

    try {
    data = JSON.parse(msg);
    } catch (err) {
     ws.send(JSON.stringify({
     type: "output",
     value: "Invalid Message"
    }));
    return;
   }

    if (data.type === "start") {

      if (processRun) processRun.kill("SIGKILL");

      const id = Date.now();

      if (data.lang === "Cpp") {

       const file = `temp_${id}.cpp`;
       const exe = `temp_${id}`;

       fs.writeFileSync(file, data.code);

       const compile = spawn("g++", [file, "-o", exe]);

       compile.stderr.on("data", d => {
       ws.send(JSON.stringify({
       type: "output",
       value: d.toString()
      }));
    });

    compile.on("close", (code) => {

    if (code !== 0) {
      ws.send(JSON.stringify({
        type: "output",
        value: "\nCompilation Failed ❌"
      }));
      return;
    }

   processRun = spawn(`./${exe}`, [], {
  shell: true,
  stdio: ["pipe", "pipe", "pipe"]
});

    processRun.on("error", err => {
      ws.send(JSON.stringify({
        type: "output",
        value: "\nExecution Error ❌\n" + err.message
      }));
    });

    attachIO(ws, processRun);
    if (data.input) {
     processRun.stdin.write(data.input + "\n");
     processRun.stdin.end();
    }
  });
}

      else if (data.lang === "Python") {

  const file = `temp_${id}.py`;

  fs.writeFileSync(file, data.code);

  processRun = spawn("python3", [file], {
  shell: true,
  stdio: ["pipe", "pipe", "pipe"]
});

  processRun.on("error", err => {

    ws.send(JSON.stringify({
      type: "output",
      value: "\nPython Execution Error ❌\n" + err.message
    }));

  });

  attachIO(ws, processRun);
  if (data.input) {
  processRun.stdin.write(data.input + "\n");
  processRun.stdin.end();
}

}

     else if (data.lang === "Java") {

  const className = `Main${id}`;
  const file = `${className}.java`;

  const code = data.code.replace(/class\s+Main/g, `class ${className}`);

  fs.writeFileSync(file, code);

  const compile = spawn("javac", [file]);

  compile.stderr.on("data", d => {

    ws.send(JSON.stringify({
      type: "output",
      value: d.toString()
    }));

  });

  compile.on("close", (code) => {

    if (code !== 0) {

      ws.send(JSON.stringify({
        type: "output",
        value: "\nCompilation Failed ❌"
      }));

      return;
    }

   processRun = spawn("java", [className], {
  shell: true,
  stdio: ["pipe", "pipe", "pipe"]
});

    processRun.on("error", err => {

      ws.send(JSON.stringify({
        type: "output",
        value: "\nExecution Error ❌\n" + err.message
      }));

    });

    attachIO(ws, processRun);
    if (data.input) {
     processRun.stdin.write(data.input + "\n");
     processRun.stdin.end();
    }
  });

}
    }

    if (data.type === "input") {

  if (
    processRun &&
    processRun.stdin &&
    processRun.stdin.writable
  ) {

    processRun.stdin.write(data.value + "\n");

  }

}
  });
});

/* ================= IO ================= */
function attachIO(ws, processRun) {

  processRun.stdout.on("data", d => {

    if (ws.readyState === WebSocket.OPEN) {

      ws.send(JSON.stringify({
        type: "output",
        value: d.toString()
      }));

    }

  });

  processRun.stderr.on("data", d => {

    if (ws.readyState === WebSocket.OPEN) {

      ws.send(JSON.stringify({
        type: "output",
        value: d.toString()
      }));

    }

  });

  processRun.on("close", () => {

    if (ws.readyState === WebSocket.OPEN) {

      ws.send(JSON.stringify({
        type: "output",
        value: "\n[Finished]"
      }));

    }

  });

}
/* ================= KEEP WS ALIVE ================= */

setInterval(() => {

  wss.clients.forEach((ws) => {

    if (!ws.isAlive) {
      return ws.terminate();
    }

    ws.isAlive = false;
    ws.ping();

  });

}, 30000);