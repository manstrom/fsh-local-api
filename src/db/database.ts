import path from "path";
import fs from "fs";
import { open, Database } from "sqlite";
import sqlite3 from "sqlite3";

const DB_DIR  = path.join(process.cwd(), "db");
const DB_PATH = path.join(DB_DIR, "pokemon.db");

// Skapa db/-mappen automatiskt om den inte finns
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  dbInstance = await open({
    filename: DB_PATH,
    driver: sqlite3.Database,
  });

  await dbInstance.run("PRAGMA journal_mode = WAL");
  return dbInstance;
}

export async function initDb(): Promise<Database> {
  const db = await getDb();

  await db.exec(`
    CREATE TABLE IF NOT EXISTS pokemon (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL UNIQUE,
      type       TEXT    NOT NULL,
      hp         INTEGER NOT NULL CHECK(hp > 0),
      attack     INTEGER NOT NULL CHECK(attack >= 0),
      caught     INTEGER NOT NULL DEFAULT 0 CHECK(caught IN (0, 1)),
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  return db;
}

export async function seedDb(): Promise<void> {
  const db = await initDb();

  await db.run("DELETE FROM pokemon;");
  await db.run("DELETE FROM sqlite_sequence WHERE name='pokemon';");

  const starterPokemon = [
    { name: "Bulbasaur",  type: "Grass/Poison", hp: 45,  attack: 49,  caught: 1 },
    { name: "Charmander", type: "Fire",          hp: 39,  attack: 52,  caught: 1 },
    { name: "Squirtle",   type: "Water",         hp: 44,  attack: 48,  caught: 1 },
    { name: "Pikachu",    type: "Electric",      hp: 35,  attack: 55,  caught: 1 },
    { name: "Gengar",     type: "Ghost/Poison",  hp: 60,  attack: 65,  caught: 0 },
    { name: "Mewtwo",     type: "Psychic",       hp: 106, attack: 110, caught: 0 },
    { name: "Eevee",      type: "Normal",        hp: 55,  attack: 55,  caught: 1 },
    { name: "Snorlax",    type: "Normal",        hp: 160, attack: 110, caught: 0 },
  ];

  for (const p of starterPokemon) {
    await db.run(
      "INSERT INTO pokemon (name, type, hp, attack, caught) VALUES (?, ?, ?, ?, ?)",
      [p.name, p.type, p.hp, p.attack, p.caught]
    );
  }

  console.log("✅ Database seeded with 8 Pokémon!");
}

if (require.main === module) {
  seedDb().catch(console.error);
}