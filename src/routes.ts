import { Router, Request, Response } from "express";
import { initDb } from "./db/database";
import { CreatePokemonBody, UpdatePokemonBody } from "./types";

export const pokemonRouter = Router();

pokemonRouter.get("/", (req: Request, res: Response) => {
  const db = initDb();
  try {
    const { type } = req.query;

    let rows;
    if (type && typeof type === "string") {
      rows = db
        .prepare("SELECT * FROM pokemon WHERE type LIKE ? ORDER BY id")
        .all(`%${type}%`);
    } else {
      rows = db.prepare("SELECT * FROM pokemon ORDER BY id").all();
    }

    const pokemon = (rows as any[]).map((r) => ({
      ...r,
      caught: r.caught === 1,
    }));

    res.json({ data: pokemon, count: pokemon.length });
  } finally {
    db.close();
  }
});

pokemonRouter.get("/:id", (req: Request, res: Response) => {
  const db = initDb();
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id — must be a number" });
      return;
    }

    const row = db.prepare("SELECT * FROM pokemon WHERE id = ?").get(id) as any | undefined;

    if (!row) {
      res.status(404).json({ error: `Pokémon with id ${id} not found` });
      return;
    }

    res.json({ ...row, caught: row.caught === 1 });
  } finally {
    db.close();
  }
});

pokemonRouter.post("/", (req: Request, res: Response) => {
  const db = initDb();
  try {
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

    const existing = db.prepare("SELECT id FROM pokemon WHERE name = ?").get(name.trim());
    if (existing) {
      res.status(409).json({ error: `A Pokémon named '${name.trim()}' already exists` });
      return;
    }

    const result = db
      .prepare("INSERT INTO pokemon (name, type, hp, attack, caught) VALUES (?, ?, ?, ?, ?)")
      .run(name.trim(), type.trim(), hp, attack, caught ? 1 : 0);

    const created = db.prepare("SELECT * FROM pokemon WHERE id = ?").get(result.lastInsertRowid) as any;

    res.status(201).json({ ...created, caught: created.caught === 1 });
  } finally {
    db.close();
  }
});

pokemonRouter.patch("/:id", (req: Request, res: Response) => {
  const db = initDb();
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id — must be a number" });
      return;
    }

    const existing = db.prepare("SELECT * FROM pokemon WHERE id = ?").get(id) as any | undefined;
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
    db.prepare(`UPDATE pokemon SET ${updates.join(", ")} WHERE id = ?`).run(...values);

    const updated = db.prepare("SELECT * FROM pokemon WHERE id = ?").get(id) as any;
    res.json({ ...updated, caught: updated.caught === 1 });
  } finally {
    db.close();
  }
});

pokemonRouter.delete("/:id", (req: Request, res: Response) => {
  const db = initDb();
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id — must be a number" });
      return;
    }

    const existing = db.prepare("SELECT * FROM pokemon WHERE id = ?").get(id) as any | undefined;
    if (!existing) {
      res.status(404).json({ error: `Pokémon with id ${id} not found` });
      return;
    }

    db.prepare("DELETE FROM pokemon WHERE id = ?").run(id);
    res.json({
      message: `Pokémon '${existing.name}' was deleted`,
      deleted: { ...existing, caught: existing.caught === 1 },
    });
  } finally {
    db.close();
  }
});