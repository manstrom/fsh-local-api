import express from "express";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import { pokemonRouter } from "./routes";

export const app = express();

app.use(express.json());

// ──────────────────────────────────────────────
// Swagger / OpenAPI setup
// ──────────────────────────────────────────────
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Pokémon API",
      version: "1.0.0",
      description: "En lokal Pokémon API för testautomationskursen på FSH 🎮",
    },
    servers: [{ url: "http://localhost:3000" }],
    components: {
      schemas: {
        Pokemon: {
          type: "object",
          properties: {
            id:         { type: "integer", example: 1 },
            name:       { type: "string",  example: "Pikachu" },
            type:       { type: "string",  example: "Electric" },
            hp:         { type: "integer", example: 35 },
            attack:     { type: "integer", example: 55 },
            caught:     { type: "boolean", example: true },
            created_at: { type: "string",  example: "2024-01-15 12:00:00" },
          },
        },
        CreatePokemon: {
          type: "object",
          required: ["name", "type", "hp", "attack"],
          properties: {
            name:   { type: "string",  example: "Ditto" },
            type:   { type: "string",  example: "Normal" },
            hp:     { type: "integer", example: 48 },
            attack: { type: "integer", example: 48 },
            caught: { type: "boolean", example: false },
          },
        },
        UpdatePokemon: {
          type: "object",
          properties: {
            name:   { type: "string",  example: "Raichu" },
            type:   { type: "string",  example: "Electric" },
            hp:     { type: "integer", example: 60 },
            attack: { type: "integer", example: 90 },
            caught: { type: "boolean", example: true },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: { type: "string", example: "Pokémon with id 99 not found" },
          },
        },
      },
    },
    paths: {
      "/health": {
        get: {
          summary: "Hälsokontroll",
          tags: ["Health"],
          responses: {
            "200": { description: "API:et är igång" },
          },
        },
      },
      "/api/pokemon": {
        get: {
          summary: "Hämta alla Pokémon",
          tags: ["Pokemon"],
          parameters: [
            {
              name: "type",
              in: "query",
              required: false,
              schema: { type: "string" },
              description: "Filtrera efter typ, t.ex. Fire",
            },
          ],
          responses: {
            "200": {
              description: "Lista med Pokémon",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data:  { type: "array", items: { $ref: "#/components/schemas/Pokemon" } },
                      count: { type: "integer" },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: "Skapa en ny Pokémon",
          tags: ["Pokemon"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreatePokemon" },
              },
            },
          },
          responses: {
            "201": { description: "Pokémon skapad" },
            "400": { description: "Ogiltiga fält" },
            "409": { description: "Namn finns redan" },
          },
        },
      },
      "/api/pokemon/{id}": {
        get: {
          summary: "Hämta en Pokémon",
          tags: ["Pokemon"],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
          responses: {
            "200": { description: "Pokémon hittad" },
            "404": { description: "Pokémon hittades inte" },
          },
        },
        patch: {
          summary: "Uppdatera en Pokémon",
          tags: ["Pokemon"],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UpdatePokemon" },
              },
            },
          },
          responses: {
            "200": { description: "Pokémon uppdaterad" },
            "404": { description: "Pokémon hittades inte" },
          },
        },
        delete: {
          summary: "Ta bort en Pokémon",
          tags: ["Pokemon"],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
          responses: {
            "200": { description: "Pokémon borttagen" },
            "404": { description: "Pokémon hittades inte" },
          },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ──────────────────────────────────────────────
// Health check
// ──────────────────────────────────────────────
app.get("/health", (_req: express.Request, res: express.Response) => {
  res.json({ status: "ok", message: "Pokémon API is running! 🎮" });
});

// Pokemon endpoints
app.use("/api/pokemon", pokemonRouter);

// 404 fallback
app.use((_req: express.Request, res: express.Response) => {
  res.status(404).json({ error: "Route not found" });
});