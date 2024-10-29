
const express = require("express");
const dotenv = require("dotenv");
const db = require("./config/db");
const path = require("path");
const http = require("http");
const socketIO = require("socket.io");
const cookieParser = require("cookie-parser");
const { connectToRedis, redisClient } = require("./config/redis");
const { newUser, removeUser } = require("./util/user");
const {createRoom, joinRoom, removeRoom} = require("./util/room");

dotenv.config();

// Routes
const viewRoutes = require("./routes/views");
const userRoutes = require("./routes/api/user");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

//como Redis es asíncrono, ahora debe ser llamado el servidor
//desde una función anónima
(async () => {
    // 1. Conectar a Redis
    await connectToRedis(); // Espera la conexión a Redis antes de continuar

    // 2. Conectar a la base de datos PostgreSQL
    db.connect((err) => {
        if (err) {
            console.log(err);
            process.exit(1);
        }
        console.log("Connected to PG");
    });

    // Configuración de Express
    app.use(cookieParser("secret"));
    app.set("view engine", "ejs");
    app.set("views", path.join(__dirname, "views"));
    app.use(express.static(path.join(__dirname, "public")));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Rutas
    app.use("/", viewRoutes);
    app.use("/api", userRoutes);

    // Configuración de Socket.IO
    io.on("connection", (socket) => {
        socket.on('user-connected', (user, roomId = null) => {
            if (roomId) {
                // TODO: join with roomID
            } else {
                newUser(socket.id, user);
            }
        });

        socket.on('send-total-rooms-and-users', async () => {
            try {
                //Redis en lugar de usar un callback, utiliza ahora promesas
                const totalUsers = parseInt(await redisClient.get('total-users')) || 0;
                const totalRooms = parseInt(await redisClient.get('total-rooms')) || 0;
                const numberOfRooms = JSON.parse(await redisClient.get('number-of-rooms')) || [0, 0, 0, 0];

                socket.emit('receive-number-of-rooms-and-users', numberOfRooms, totalRooms, totalUsers);
            } catch (err) {
                console.error("Error al obtener datos de Redis:", err);
            }
        });

        socket.on('get-rooms', async(rank)=> {
            let roomData = await redisClient.get("rooms");

            if (roomData) {
                let roomsSocket = JSON.parse(roomData);
                if (rank==='all') {
                    socket.emit('receive-rooms', roomsSocket);
                } else {
                    let filteredRoom = roomsSocket.filter(room => room.players[0].user_rank === rank);
                    socket.emit('receive-rooms', filteredRoom);
                }
            } else {
                socket.emit('receive-rooms', []);
            }
        });

        socket.on('send-message', async(message, user, roomId=null)=>{
            if (roomId) {
                socket.to(roomId).emit('receive-message', message, user);
            } else {
                socket.broadcast.emit('receive-message', message, user, true);
            }
        });

        socket.on('create-room', async(roomId, time, user, password=null) => {
            const roomIdRedis = await redisClient.get('roomId');
            if (roomIdRedis) {
                socket.emit("error", `Room with id ${roomIdRedis} already exists`);
            } else {
                if (password) {
                    
                    createRoom(roomId, user, time, password);
                } else {
                    createRoom(roomId, user, time);
                }

                socket.emit('room-created');
            }
        });

        socket.on('join-room', async(roomId, user, password=null) => {
            const roomIdRedis = await redisClient.get(roomId);
            if (roomIdRedis) {
                let room = JSON.parse(roomIdRedis);
                if (room.players[1]===null) {
                    if (room.password &&(!password || room.password !==password)) {
                        socket.emit("error", "You have to provide the correct password");
                        return;
                    }
                    joinRoom(roomId, user);

                    if (room.password && password !=="") {
                        socket.emit('room-joined', roomId, password);
                    } else {
                        socket.emit('room-joined', roomId);
                    }

                } else {
                    socket.emit('error', `The room is full`);
                }
            }else {
                socket.emit('error', `Room with id ${roomId} does not exist`);
            }
        });

        socket.on('join-random', async(user) => {
            const roomsRedis = await redisClient.get('rooms');
            if (roomsRedis) {
                let rooms = JSON.parse(roomsRedis);

                let room = rooms.find(room => room.players[1] ===null && !room.password);

                if (room) {
                    joinRoom(room.id, user);
                    socket.emit('room-joined', room.id);
                } else {
                    socket.emit('error', 'No room found');
                }
            } else {
                socket.emit('error', "No room found");
            }
        });

        socket.on('disconnect', async () => {
            try {
                const user = JSON.parse(await redisClient.get(socket.id));
                if (user && user.room) {
                    const userRoomRedis = await redisClient.get(user.room);
                    if (userRoomRedis) {
                        let roomRedis = JSON.parse(userRoomRedis);

                        if (!roomRedis.gameFinished) {
                            io.to(user.room).emit('error', 'An user has been disconnected');
                        }
                    }

                    removeRoom(user.room, user.user_rank);
                }
                removeUser(socket.id);
            } catch (err) {
                console.error("Handling user disconnected error: ", err);
            }
        });
    });

    // Iniciar el servidor
    const PORT = process.env.PORT || 4500;
    server.listen(PORT, () => {
        console.log(`Server started at http://localhost:${PORT}`);
    });
})();
