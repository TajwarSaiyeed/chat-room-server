const express = require("express");
const PORT = process.env.PORT || 5000;
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const app = express();

const route = require("./route");
const { addUser } = require("./users");

app.use(
  cors({
    origin: "*",
  })
);
app.use(route);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("join", ({ name, room }) => {
    socket.join(room);

    const { user } = addUser({ name, room });

    socket.emit("message", {
      data: {
        user: { name: "Admin" },
        message: `Welcome, ${user.name}`,
      },
    });

    socket.broadcast.to(user.room).emit("message", {
      data: {
        user: { name: "Admin" },
        message: `${user.name} has joined the chat`,
      },
    });
  });

  io.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
