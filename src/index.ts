import { app } from "./app";
import { seedDb } from "./db/database";

const PORT = process.env.PORT || 3000;

seedDb().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🎮 Pokémon API is running!`);
    console.log(`👉 http://localhost:${PORT}`);
    console.log(`\nEndpoints:`);
    console.log(`  GET    /health`);
    console.log(`  GET    /api/pokemon`);
    console.log(`  GET    /api/pokemon/:id`);
    console.log(`  POST   /api/pokemon`);
    console.log(`  PATCH  /api/pokemon/:id`);
    console.log(`  DELETE /api/pokemon/:id`);
    console.log(`\nHappy testing! 🚀\n`);
  });
}).catch(console.error);
