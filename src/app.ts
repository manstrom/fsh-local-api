import express from "express";
import { pokemonRouter } from "./routes";

export const app = express();

app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", message: "Pokémon API is running! 🎮" });
});

// Pokemon endpoints
app.use("/api/pokemon", pokemonRouter);

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});