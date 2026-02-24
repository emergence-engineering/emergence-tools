import express from "express";
import expressWebsockets from "express-ws";
import cors from "cors";
import { Hocuspocus } from "@hocuspocus/server";
import { getLinkPreview } from "link-preview-js";

const PORT = parseInt(process.env.PORT || "4000", 10);
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

const hocuspocus = new Hocuspocus({
  async onConnect() {
    // Allow all connections
  },
});

const { app } = expressWebsockets(express());
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

app.post("/api/link-preview", async (req, res) => {
  const { link } = req.body;
  if (!link || typeof link !== "string") {
    res.status(400).json({ error: "Missing or invalid 'link' field" });
    return;
  }
  try {
    const data = await getLinkPreview(link);
    res.json({ data });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to fetch link preview", errorReason: err });
  }
});

app.ws("/hocuspocus", (ws, req) => {
  hocuspocus.handleConnection(ws, req);
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  console.log(`  - POST /api/link-preview`);
  console.log(`  - WebSocket (Hocuspocus) on ws://localhost:${PORT}/hocuspocus`);
});
