const express = require("express");
const PORT = process.env.PORT || 5000;
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const app = express();

const route = require("./route");
const { addUser, findUser, getRoomUsers, removeUser } = require("./users");

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
  console.log("user connected");
  socket.on("join", ({ name, room }) => {
    socket.join(room);

    const { user, isExist } = addUser({ name, room });

    const userMessages = isExist
      ? `Welcome back, ${user.name}`
      : `Welcome, ${user.name}`;

    socket.emit("message", {
      data: {
        user: { name: "Admin" },
        message: userMessages,
      },
    });

    socket.broadcast.to(user.room).emit("message", {
      data: {
        user: { name: "Admin" },
        message: `${user.name} has joined the chat`,
      },
    });

    io.to(user.room).emit("room", {
      data: {
        room: user.room,
        users: getRoomUsers(user.room),
      },
    });
  });

  socket.on("sendMessage", ({ message, params }) => {
    const user = findUser(params);

    if (user) {
      io.to(user.room).emit("message", {
        data: {
          user,
          message,
        },
      });
    }
  });

  socket.on("notification", ({ data }) => {
    const { name, room, email } = data;
    socket.broadcast.emit("notification", {
      data: {
        name,
        room,
        email,
      },
    });
  });

  socket.on("dietSchedule", (data) => {
    socket.broadcast.emit("dietSchedule", data);
  });

  socket.on("leftRoom", ({ params }) => {
    const user = removeUser(params);

    if (user) {
      const { room, name } = user;

      io.to(room).emit("message", {
        data: { user: { name: "Admin" }, message: `${name} has left` },
      });

      io.to(room).emit("room", {
        data: { users: getRoomUsers(room) },
      });
    }
  });

  io.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
