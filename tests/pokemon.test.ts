import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { seedDb } from "../src/db/database";

// Reset the database before all tests so we always start clean
beforeAll(async () => {
  await seedDb();
});

// ═══════════════════════════════════════════════════════════
//  HEALTH CHECK
// ═══════════════════════════════════════════════════════════
describe("GET /health", () => {
  it("should return status 200", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
  });

  it("should return a JSON body with status 'ok'", async () => {
    const res = await request(app).get("/health");
    expect(res.body.status).toBe("ok");
  });
});

// ═══════════════════════════════════════════════════════════
//  GET /api/pokemon  — Hämta alla Pokémon
// ═══════════════════════════════════════════════════════════
describe("GET /api/pokemon", () => {
  it("should return status 200", async () => {
    const res = await request(app).get("/api/pokemon");
    expect(res.status).toBe(200);
  });

  it("should return an array of pokemon in the 'data' field", async () => {
    const res = await request(app).get("/api/pokemon");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("should return a 'count' that matches number of pokemon", async () => {
    const res = await request(app).get("/api/pokemon");
    expect(res.body.count).toBe(res.body.data.length);
  });

  it.todo("each pokemon should have required fields: id, name, type, hp, attack, caught");
  it.todo("should filter pokemon by type using ?type= query parameter");
  it.todo("should return empty array when no pokemon match the type filter");
});

// ═══════════════════════════════════════════════════════════
//  GET /api/pokemon/:id  — Hämta en Pokémon
// ═══════════════════════════════════════════════════════════
describe("GET /api/pokemon/:id", () => {
  it("should return status 200 for an existing pokemon", async () => {
    const res = await request(app).get("/api/pokemon/1");
    expect(res.status).toBe(200);
  });

  it("should return the correct pokemon", async () => {
    const res = await request(app).get("/api/pokemon/1");
    expect(res.body.name).toBe("Bulbasaur");
    expect(res.body.id).toBe(1);
  });

  it.todo("should return 404 for a non-existent pokemon id");
  it.todo("should return 400 for an invalid (non-numeric) id");
  it.todo("'caught' field should be a boolean, not a number");
});

// ═══════════════════════════════════════════════════════════
//  POST /api/pokemon  — Skapa en ny Pokémon
// ═══════════════════════════════════════════════════════════
describe("POST /api/pokemon", () => {
  it("should create a new pokemon and return 201", async () => {
    const newPokemon = { name: "Testemon", type: "Normal", hp: 50, attack: 40 };
    const res = await request(app).post("/api/pokemon").send(newPokemon);
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Testemon");
    expect(res.body.id).toBeDefined();
  });

  it.todo("should correctly store caught: true when provided");
  it.todo("should return 400 when 'name' is missing");
  it.todo("should return 400 when 'hp' is missing");
  it.todo("should return 409 when a pokemon with the same name already exists");
  it.todo("should return 400 when hp is 0 or negative");
});

// ═══════════════════════════════════════════════════════════
//  PATCH /api/pokemon/:id  — Uppdatera en Pokémon
// ═══════════════════════════════════════════════════════════
describe("PATCH /api/pokemon/:id", () => {
  it("should update a field and return the updated pokemon", async () => {
    const res = await request(app)
      .patch("/api/pokemon/5") // Gengar (caught: false)
      .send({ caught: true });
    expect(res.status).toBe(200);
    expect(res.body.caught).toBe(true);
    expect(res.body.name).toBe("Gengar");
  });

  it.todo("should update hp and return the new value");
  it.todo("should return 404 when trying to update a non-existent pokemon");
  it.todo("should return 400 when body has no valid fields");
  it.todo("should persist the updated name when fetched again");
});

// ═══════════════════════════════════════════════════════════
//  DELETE /api/pokemon/:id  — Ta bort en Pokémon
// ═══════════════════════════════════════════════════════════
describe("DELETE /api/pokemon/:id", () => {
  it("should delete a pokemon and return 200 with a confirmation message", async () => {
    const created = await request(app)
      .post("/api/pokemon")
      .send({ name: "DeleteMe", type: "Ghost", hp: 10, attack: 5 });
    const id = created.body.id;
    const res = await request(app).delete(`/api/pokemon/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toContain("DeleteMe");
  });

  it.todo("deleted pokemon should return 404 when fetched again");
  it.todo("should return 404 when deleting a non-existent pokemon");
  it.todo("response body should include the deleted pokemon's data");
});

describe("BONUS", () => {
  it.todo("full flow: create → update → delete");
  it.todo("all endpoints should return Content-Type application/json");
  it.todo("type filter should be case-insensitive or partial match");
});