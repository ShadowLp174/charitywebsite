const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const fs = require("fs");

const path = require("path");

// secured admin website
const secured = require("express").Router();
secured.use((req, res, next) => {
  const auth = {login: (process.env["adminname"] || 'yourlogin'), password: (process.env["adminpass"] || 'yourpassword')} // change this

  const b64auth = (req.headers.authorization || '').split(' ')[1] || ''
  const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':')

  if (login && password && login === auth.login && password === auth.password) {
    return next();
  }

  res.set('WWW-Authenticate', 'Basic realm="401"')
  res.status(401).send('Authentication required.')
});
secured.use(express.json());

// base app routing
secured.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname + "/static/admin.html"));
});
secured.post("/update", (req, res) => {
  res.send(updateProgress(req.body.progress));
});
secured.post("/update/goal", (req, res) => {
  res.send(updateGoal(req.body.goal));
});
secured.post("/update/add", (req, res) => {
  res.send(addProgress(req.body.count));
});

app.use("/admin", secured);

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname + "/static/index.html"));
});
app.get("/data", (_req, res) => {
  res.send(JSON.stringify(data));
})

app.get("/assets/:file", (req, res) => { // assets
  const file = req.params.file;
  res.sendFile(path.join(__dirname + "/assets/" + file));
});

server.listen(3000, () => {
  console.log("Listening on port 3000");
});

const data = require(path.join(__dirname + "/data/goals.json"));
console.log(data);

// socket.io stuff
const { Server } = require("socket.io");
const io = new Server(server);

var connected = 0;

io.on('connection', (socket) => {
  io.emit("usercount", ++connected);
  socket.on("usercount", () => {
    socket.emit("usercount", connected);
  });
  socket.on("disconnect", () => {
    io.emit("usercount", --connected);
  });

  socket.on("init", () => {
    socket.emit("data", data);
  });

  socket.on("data", () => {
    socket.emit("progress", data);
  });
});

function save() {
  fs.writeFile(path.join(__dirname + "/data/goals.json"), JSON.stringify(data), "utf8", () => {
    console.log("saved");
  });
}

function updateProgress(distance=null) {
  distance = parseInt(distance);
  if (Number.isNaN(distance)) return false;
  data.curr = distance;
  const progress = distance / (data.goal / 100);
  data.progress = progress;
  console.log(progress, distance, data);

  io.emit("data", data);

  save();
  return true;
}
function updateGoal(goal=null) {
  goal = parseInt(goal);
  if (Number.isNaN(goal)) return false;
  data.goal = goal;
  updateProgress(data.curr);

  save();
  return true;
}
function addProgress(count=null) {
  if (!count) return false;
  count = parseInt(count);
  if (Number.isNaN(count)) return false;
  data.curr += count;
  updateProgress(data.curr);

  save();

  return true;
}
