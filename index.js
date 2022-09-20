const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);

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

// base app routing
secured.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname + "/static/admin.html"));
});
secured.post("/update", (req, res) => {
  console.log(req.body, req);
  res.send("test");
});

app.use("/admin", secured);

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname + "/static/index.html"));
});

app.get("/assets/:file", (req, res) => { // assets
  const file = req.params.file;
  res.sendFile(path.join(__dirname + "/assets/" + file));
});

server.listen(3000, () => {
  console.log("Listening on port 3000");
});

const progress = require(path.join(__dirname + "/data/goals.json"));
console.log(progress);

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
});
