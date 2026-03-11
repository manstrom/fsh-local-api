import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(__dirname, "../../db/pokemon.db");

export function getDb(): Database.Database {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  return db;
}

export function initDb(): Database.Database {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS pokemon (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      name      TEXT    NOT NULL UNIQUE,
      type      TEXT    NOT NULL,
      hp        INTEGER NOT NULL CHECK(hp > 0),
      attack    INTEGER NOT NULL CHECK(attack >= 0),
      caught    INTEGER NOT NULL DEFAULT 0 CHECK(caught IN (0, 1)),
      created_at TEXT   NOT NULL DEFAULT (datetime('now'))
    );
  `);

  return db;
}

export function seedDb(): void {
  const db = initDb();

  db.exec("DELETE FROM pokemon;");
  db.exec("DELETE FROM sqlite_sequence WHERE name='pokemon';");

  const insert = db.prepare(`
    INSERT INTO pokemon (name, type, hp, attack, caught)
    VALUES (@name, @type, @hp, @attack, @caught)
  `);

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

  const insertMany = db.transaction((pokemons: typeof starterPokemon) => {
    for (const p of pokemons) insert.run(p);
  });

  insertMany(starterPokemon);

  console.log("✅ Database seeded with 8 Pokémon!");
  db.close();
}

if (require.main === module) {
  seedDb();
}