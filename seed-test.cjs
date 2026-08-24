const { DatabaseSync } = require("node:sqlite");
const { randomBytes, scryptSync } = require("node:crypto");
const path = require("node:path");

const db = new DatabaseSync(path.join(__dirname, ".data", "gymbro.db"));
db.exec("PRAGMA foreign_keys = ON;");

function hash(pw) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(pw, salt, 64).toString("hex")}`;
}

let user = db.prepare("SELECT id FROM users WHERE username = ?").get("testuser");
if (!user) {
  const r = db
    .prepare(
      "INSERT INTO users (username, name, password_hash, created_at) VALUES (?, ?, ?, ?)",
    )
    .run("testuser", "Test Runner", hash("secret123"), Date.now());
  user = { id: Number(r.lastInsertRowid) };
}
const uid = user.id;

const groups = db.prepare("SELECT id, name FROM muscle_groups ORDER BY id").all();
console.log("muscle_groups:", groups.length);

function ex(name, gid) {
  const found = db.prepare("SELECT id FROM exercises WHERE user_id=? AND name=?").get(uid, name);
  if (found) return Number(found.id);
  const r = db
    .prepare("INSERT INTO exercises (user_id, muscle_group_id, name, created_at) VALUES (?, ?, ?, ?)")
    .run(uid, gid, name, Date.now());
  return Number(r.lastInsertRowid);
}
const press = ex("Press banca", groups.find((g) => g.name === "Pecho").id);
const squat = ex("Sentadilla", groups.find((g) => g.name === "Cuádriceps").id);
ex("Dominadas", groups.find((g) => g.name === "Espalda").id);

let routine = db.prepare("SELECT id FROM routines WHERE user_id=? LIMIT 1").get(uid);
if (!routine) {
  const rr = db
    .prepare("INSERT INTO routines (user_id, name, created_at) VALUES (?, ?, ?)")
    .run(uid, "Fuerza base", Date.now());
  const rid = Number(rr.lastInsertRowid);
  // Monday (0) and Wednesday (2)
  for (const wd of [0, 2]) {
    const rd = db
      .prepare("INSERT INTO routine_days (routine_id, weekday) VALUES (?, ?)")
      .run(rid, wd);
    const ids = wd === 0 ? [press] : [squat];
    ids.forEach((exerciseId, i) => {
      db.prepare(
        "INSERT INTO routine_exercises (routine_day_id, exercise_id, position, target_sets) VALUES (?, ?, ?, ?)",
      ).run(Number(rd.lastInsertRowid), exerciseId, i, 4);
    });
  }
  routine = { id: rid };
}

// A finished workout in history
let doneWorkout = db
  .prepare("SELECT id FROM workouts WHERE user_id=? AND ended_at IS NOT NULL LIMIT 1")
  .get(uid);
if (!doneWorkout) {
  const start = Date.now() - 3600_000;
  const w = db
    .prepare(
      "INSERT INTO workouts (user_id, routine_day_id, started_at, ended_at, duration_seconds) VALUES (?, NULL, ?, ?, 3540)",
    )
    .run(uid, start, Date.now() - 60_000);
  const wid = Number(w.lastInsertRowid);
  const we = db
    .prepare("INSERT INTO workout_exercises (workout_id, exercise_id, position) VALUES (?, ?, 0)")
    .run(wid, press);
  const weid = Number(we.lastInsertRowid);
  for (let s = 1; s <= 3; s++) {
    db.prepare(
      "INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight) VALUES (?, ?, ?, ?)",
    ).run(weid, s, 8, 60 + s * 2.5);
  }
}

// Body weight entries
const hasW = db.prepare("SELECT id FROM body_weights WHERE user_id=? LIMIT 1").get(uid);
if (!hasW) {
  const ins = db
    .prepare(
      "INSERT INTO body_weights (user_id, date, weight) VALUES (?, ?, ?) ON CONFLICT(user_id,date) DO UPDATE SET weight=excluded.weight",
    );
  const now = new Date();
  for (let d = 45; d >= 0; d -= 3) {
    const dt = new Date(now.getTime() - d * 86400_000);
    const iso = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
    ins.run(uid, iso, 78 - (45 - d) * 0.05 + Math.sin(d) * 0.3);
  }
}

const token = randomBytes(32).toString("hex");
db.prepare("INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)").run(
  token,
  uid,
  Date.now() + 30 * 86400_000,
  Date.now(),
);
console.log("TOKEN=" + token);
