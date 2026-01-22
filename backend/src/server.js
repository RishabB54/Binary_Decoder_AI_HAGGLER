// Load environment variables FIRST before any other imports
import './config.js';

import express from "express";
import cors from "cors";

import { catalogRouter } from "./routes/catalog.js";
import { chatRouter } from "./routes/chat.js";
import { dealRouter } from "./routes/deal.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/catalog", catalogRouter);
app.use("/chat", chatRouter);
app.use("/deal", dealRouter);

const port = Number(process.env.PORT || 8080);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${port}`);
});
