import { createServer } from "http";
import { Server } from "socket.io";

const httpserver = createServer();

const io = new Server(httpserver, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  socket.emit("hello", "Hello from server");

  socket.on("msg", (message) => socket.broadcast.emit("msg", message));
  socket.on("offer", (message) => socket.broadcast.emit("offer", message));
  socket.on("answer", (message) => socket.broadcast.emit("answer", message));
  socket.on("ice", (message) => socket.broadcast.emit("ice", message));
});

io.listen(process.env.PORT || 8000);
