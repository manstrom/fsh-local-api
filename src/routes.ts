import { Router, Request, Response } from "express";
import { initDb } from "./db/database";
import { CreatePokemonBody, UpdatePokemonBody } from "./types";

export const pokemonRouter = Router();

// ──────────────────────────────────────────────
// GET /api/pokemon
// Returns all Pokémon. Optional ?type= filter.
// ──────────────────────────────────────────────
pokemonRouter.get("/", async (req: Request, res: Response) => {
  const db = await initDb();
  const { type } = req.query;

  let rows;
  if (type && typeof type === "string") {
    rows = await db.all(
      "SELECT * FROM pokemon WHERE type LIKE ? ORDER BY id",
      [`%${type}%`]
    );
  } else {
    rows = await db.all("SELECT * FROM pokemon ORDER BY id");
  }

  const pokemon = rows.map((r: any) => ({ ...r, caught: r.caught === 1 }));
  res.json({ data: pokemon, count: pokemon.length });
});

// ──────────────────────────────────────────────
// GET /api/pokemon/:id
// Returns a single Pokémon by id
// ──────────────────────────────────────────────
pokemonRouter.get("/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id — must be a number" });
    return;
  }

  const db = await initDb();
  const row = await db.get("SELECT * FROM pokemon WHERE id = ?", [id]);

  if (!row) {
    res.status(404).json({ error: `Pokémon with id ${id} not found` });
    return;
  }

  res.json({ ...row, caught: row.caught === 1 });
});

// ──────────────────────────────────────────────
// POST /api/pokemon
// Creates a new Pokémon
// ──────────────────────────────────────────────
pokemonRouter.post("/", async (req: Request, res: Response) => {
  const { name, type, hp, attack, caught = false }: CreatePokemonBody = req.body;

  if (!name || typeof name !== "string" || name.trim() === "") {
    res.status(400).json({ error: "Field 'name' is required" });
    return;
  }
  if (!type || typeof type !== "string" || type.trim() === "") {
    res.status(400).json({ error: "Field 'type' is required" });
    return;
  }
  if (!hp || typeof hp !== "number" || hp <= 0) {
    res.status(400).json({ error: "Field 'hp' must be a positive number" });
    return;
  }
  if (attack === undefined || typeof attack !== "number" || attack < 0) {
    res.status(400).json({ error: "Field 'attack' must be a non-negative number" });
    return;
  }

  const db = await initDb();

  const existing = await db.get("SELECT id FROM pokemon WHERE name = ?", [name.trim()]);
  if (existing) {
    res.status(409).json({ error: `A Pokémon named '${name.trim()}' already exists` });
    return;
  }

  const result = await db.run(
    "INSERT INTO pokemon (name, type, hp, attack, caught) VALUES (?, ?, ?, ?, ?)",
    [name.trim(), type.trim(), hp, attack, caught ? 1 : 0]
  );

  const created = await db.get("SELECT * FROM pokemon WHERE id = ?", [result.lastID]);
  res.status(201).json({ ...created, caught: created.caught === 1 });
});

// ──────────────────────────────────────────────
// PATCH /api/pokemon/:id
// Updates one or more fields on a Pokémon
// ──────────────────────────────────────────────
pokemonRouter.patch("/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id — must be a number" });
    return;
  }

  const db = await initDb();
  const existing = await db.get("SELECT * FROM pokemon WHERE id = ?", [id]);

  if (!existing) {
    res.status(404).json({ error: `Pokémon with id ${id} not found` });
    return;
  }

  const body: UpdatePokemonBody = req.body;
  const updates: string[] = [];
  const values: any[] = [];

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim() === "") {
      res.status(400).json({ error: "Field 'name' must be a non-empty string" });
      return;
    }
    updates.push("name = ?");
    values.push(body.name.trim());
  }
  if (body.type !== undefined) {
    if (typeof body.type !== "string" || body.type.trim() === "") {
      res.status(400).json({ error: "Field 'type' must be a non-empty string" });
      return;
    }
    updates.push("type = ?");
    values.push(body.type.trim());
  }
  if (body.hp !== undefined) {
    if (typeof body.hp !== "number" || body.hp <= 0) {
      res.status(400).json({ error: "Field 'hp' must be a positive number" });
      return;
    }
    updates.push("hp = ?");
    values.push(body.hp);
  }
  if (body.attack !== undefined) {
    if (typeof body.attack !== "number" || body.attack < 0) {
      res.status(400).json({ error: "Field 'attack' must be a non-negative number" });
      return;
    }
    updates.push("attack = ?");
    values.push(body.attack);
  }
  if (body.caught !== undefined) {
    updates.push("caught = ?");
    values.push(body.caught ? 1 : 0);
  }

  if (updates.length === 0) {
    res.status(400).json({ error: "No valid fields provided to update" });
    return;
  }

  values.push(id);
  await db.run(`UPDATE pokemon SET ${updates.join(", ")} WHERE id = ?`, values);

  const updated = await db.get("SELECT * FROM pokemon WHERE id = ?", [id]);
  res.json({ ...updated, caught: updated.caught === 1 });
});

// ──────────────────────────────────────────────
// DELETE /api/pokemon/:id
// Deletes a Pokémon by id
// ──────────────────────────────────────────────
pokemonRouter.delete("/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id — must be a number" });
    return;
  }

  const db = await initDb();
  const existing = await db.get("SELECT * FROM pokemon WHERE id = ?", [id]);

  if (!existing) {
    res.status(404).json({ error: `Pokémon with id ${id} not found` });
    return;
  }

  await db.run("DELETE FROM pokemon WHERE id = ?", [id]);
  res.json({
    message: `Pokémon '${existing.name}' was deleted`,
    deleted: { ...existing, caught: existing.caught === 1 },
  });
});