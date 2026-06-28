const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// ---------------- MEMORY STORE ----------------
let beds = {};
let relayState = {};

// ---------------- ROOT CHECK ----------------
app.get("/", (req, res) => {
  res.send("🏥 SafeDrip ICU Server Running Successfully");
});

// ---------------- RECEIVE DATA FROM ESP ----------------
app.post("/data", (req, res) => {
  const { bed, weight, transmitter_id } = req.body;

  beds[bed] = {
    bed,
    weight,
    transmitter_id,
    time: new Date().toISOString()
  };

  // send live update to dashboard
  io.emit("update", beds[bed]);

  res.json({ ok: true });
});

// ---------------- GET ALL DATA ----------------
app.get("/latest", (req, res) => {
  res.json(beds);
});

// ---------------- RELAY CONTROL (FROM DASHBOARD) ----------------
app.post("/relay", (req, res) => {
  const { bed, state } = req.body;
  relayState[bed] = state;
  res.json({ ok: true });
});

// ---------------- ESP CHECK RELAY ----------------
app.get("/relay", (req, res) => {
  const bed = req.query.bed;
  res.json({
    state: relayState[bed] || "AUTO"
  });
});

// ---------------- SOCKET CONNECTION ----------------
io.on("connection", (socket) => {
  console.log("Dashboard connected");

  socket.emit("init", beds);
});

// ---------------- START SERVER ----------------
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("🏥 ICU Server running on port", PORT);
});