const express = require("express");
const { Server } = require("socket.io");
const { v4: uuidV4 } = require("uuid");
const dotenv = require("dotenv");
const http = require("http");
const colors = require("colors");
const errorHandler = require("./Middlewares/error");
const connectDB = require("./config/db");
const Queue = require("./Utils/queue");
const SelectRandom = require("./Utils/SelectRandom");

// Importing morgan for logging api requests for Dev enviroment
const morgan = require("morgan");

// Set up enviromental variables using dotenv
dotenv.config({ path: "./config/config.env" });

// Importing for localhost port
const PORT = process.env.PORT || 5000;

// Router files
const auth = require("./Routes/auth");
const games = require("./Routes/games");

// Connect to database
connectDB();

// Initializing Express
const app = express();

// Creating server using http
const server = http.createServer(app);

// Dev logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Parsing the Body (we can also use body-parser but this does the same work)
app.use(express.json()); 

// Handeling cors by adding additional headers to our requests
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
  next();
});

// Mounting Routers
app.use("/api/v1/auth", auth);
app.use("/api/v1/games", games);

// Handeling Errors
app.use(errorHandler);

// ------------------------------- Socket.io controller Start -----------------------------------------//

// upgrade http server to websocket server
const io = new Server(server, {
  cors: "*", // allow connection from any origin
});

const rooms = new Map();

const roomsQueue = new Queue();
const activeRooms = new Map();

io.on("connection", (socket) => {
  console.log(socket.id, "connected");

  socket.on("username", (username, userId) => {
    console.log("username:", username);
    console.log("userId:", userId);
    socket.data.username = username;
    socket.data.userId = userId;
  });

  socket.on("move", (data) => {
    socket.to(data.room).emit("move", data.move);
  });

  socket.on("closeRoom", async (data) => {
    socket.to(data.roomId).emit("closeRoom", data);
    const clientSockets = await io.in(data.roomId).fetchSockets();

    clientSockets.forEach((s) => {
      s.leave(data.roomId);
    });

    activeRooms.delete(data.roomId);

  });

  socket.on("searchGame", async () => {
    if (!roomsQueue.isEmpty) {
      const roomData = roomsQueue.dequeue();
      console.log(roomsQueue.length);
      console.log("in first");
      let ori;
      if (roomData.orientation === "white") {
        ori = "black";
      } else {
        ori = "white";
      }
      io.to(socket.id).emit("setOrientation", ori);
      const room = roomData.roomId;
      let error, message;
      if (!room) {
        error = true;
        message = "room does not exist";
      } else if (room.length <= 0) {
        error = true;
        message = "room is empty";
      } else if (room.length >= 2) {
        error = true;
        message = "room is full";
      }

      if (error) {
        console.log(error);
      }
      await socket.join(roomData.roomId);
      updatedRoom = {
        roomId: roomData.roomId,
        players: [
          { id: socket.id, username: socket.data?.username },
          { id: roomData.id, username: roomData.username },
        ],
      };
      activeRooms.set(roomData.roomId, updatedRoom);
      io.to(roomData.roomId).emit("opponentJoined", updatedRoom);
      io.to(roomData.roomId).emit("waitOver", updatedRoom);
      return;
    } else {
      console.log("in second");
      const roomId = uuidV4();
      await socket.join(roomId);
      const ori = SelectRandom("white", "black");
      console.log(ori);
      io.to(socket.id).emit("setOrientation", ori);
      roomsQueue.enqueue({
        roomId,
        id: socket.id,
        username: socket.data?.username,
        orientation: ori,
      });
    }
  });

  socket.on("disconnect", () => {
    const gameRooms = Array.from(activeRooms.values());

    gameRooms.forEach((room) => {
      // <- 2
      const userInRoom = room.players.find((player) => player.id === socket.id);

      if (userInRoom) {
        if (room.players.length < 2) {
          rooms.delete(room.roomId);
          return;
        }
        socket.to(room.roomId).emit("playerDisconnected", userInRoom);
      }
    });
  });
});

// ------------------------------- Socket.io controller End -----------------------------------------//

// Start Server
server.listen(PORT, () => {
  `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold;
});

// Handle un handeled rejections
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  //Close server and exit process
  server.close(() => {
    process.exit(1);
  });
});
