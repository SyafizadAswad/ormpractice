import "reflect-metadata";
import cors from "cors";
import express from "express";
import { config } from "dotenv";
import { AppDataSource } from "./data-source";
import issuesRouter from "./routes/issues.routes";

config();

const port = Number(process.env.PORT ?? 3000);

async function bootstrap() {
  await AppDataSource.initialize();
  console.log("TypeORM DataSource initialized (query logging enabled).");

  const app = express();
  app.use(cors({ origin: true }));
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/issues", issuesRouter);

  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });
}

bootstrap().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
