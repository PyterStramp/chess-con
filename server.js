
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
const gameRoutes = require("./routes/api/games");

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
    app.use("/api", gameRoutes);

    // Configuración de Socket.IO
    io.on("connection", (socket) => {
        socket.on('user-connected', async(user, roomId = null, password=null) => {
            if (roomId) {
                const roomIdRedis = await redisClient.get(roomId);

                if (roomIdRedis) {
                    let room = JSON.parse(roomIdRedis);
                    if (room.gameStarted) {
                        socket.emit("error", "The room is full");
                        return;
                    }

                    if (room.password &&(!password || room.password !==password)) {
                        socket.emit("error", "You have to provide the correct password");
                        return;
                    }

                    socket.join(roomId);
                    await newUser(socket.id, user, roomId);

                    if (room.players[0].username === user.username) {
                        return;
                    }

                    if (room.players[1]===null) {
                        room.players[1] = user;
                    }
                    room.gameStarted = true;
                    await redisClient.set(roomId, JSON.stringify(room));
                    socket.to(roomId).emit("game-started", user);

                    const roomIndicesRedis = await redisClient.get("roomIndices");
                    if (roomIndicesRedis) {
                        let roomIndices = JSON.parse(roomIndicesRedis);
                        const roomsRedis = await redisClient.get('rooms');
                        if (roomsRedis) {
                            let rooms = JSON.parse(roomsRedis);

                            rooms[roomIndices[roomId]] = room;
                            await redisClient.set('rooms', JSON.stringify(rooms));
                        }
                    }
                }
                else {
                    socket.emit('error', "The room does not exist");
                }
            } else {
                await newUser(socket.id, user);
            }
        });

        socket.on('get-game-details', async(roomId, user) => {
            const roomIdRedis = await redisClient.get(roomId);
            if (roomIdRedis) {
                let room = JSON.parse(roomIdRedis);
                let details = {players: room.players, time: room.time}

                socket.emit('receive-game-details', details);
            }
        })

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

        socket.on('move-made', async(roomId, move, pawnPromotion=null, castling=null, enPassantPerformed=false)=> {
            const redisRoomId = await redisClient.get(roomId);
            if (redisRoomId) {
                let room = JSON.parse(redisRoomId);

                room.moves.push(move);

                await redisClient.set(roomId, JSON.stringify(room));

                if (pawnPromotion) {
                    socket.to(roomId).emit("enemy-moved_pawn-promotion", move, pawnPromotion);
                } else if (castling) {
                    socket.to(roomId).emit("enemy-moved_castling", castling);
                } else if (enPassantPerformed) {
                    socket.to(roomId).emit("enemy-moved_en-passant", move);
                } else {
                    socket.to(roomId).emit("enemy-moved", move);
                }
            }
        });

        socket.on('update-timer', async(roomId, minutes, seconds)=> {
            socket.to(roomId).emit("enemy-timer-updated", minutes, seconds);
        });

        socket.on('check', async(roomId) => {
            socket.to(roomId).emit('king-is-attacked')
        });

        socket.on('checkmate', async(roomId, winner, score, startedAt)=> {
            const roomIdRedis = await redisClient.get(roomId);
            if (roomIdRedis) {
                let room = JSON.parse(roomIdRedis);
                
                await redisClient.del(`${room.players[0].id}-played-games`);
                await redisClient.del(`${room.players[1].id}-played-games`);

                room.gameFinished = true;

                await redisClient.set(roomId, JSON.stringify(room))

                socket.to(roomId).emit("you-lost", winner, score);

                let query = `
                INSERT INTO games(timer, moves, user_id_white, user_id_black, started_at)
                VALUES($1, $2, $3, $4, $5)
                `;

                await db.query(query, [room.time + '', JSON.stringify(room.moves), room.players[0].id, room.players[1].id, startedAt + '']);

            }
        });

        socket.on('timer-ended', async(roomId, loser, startedAt)=> {
            const roomIdRedis = await redisClient.get(roomId);
            if (roomIdRedis) {
                let room = JSON.parse(roomIdRedis);

                await redisClient.del(`${room.players[0].id}-played-games`);
                await redisClient.del(`${room.players[1].id}-played-games`);

                room.gameFinished = true;

                await redisClient.set(roomId, JSON.stringify(room));

                let winner;

                if(room.players[0].username === loser){
                    winner = room.players[1].username;
                }else{
                    winner = room.players[0].username;
                }

                socket.emit("you-lost", winner);
                socket.to(roomId).emit("you-won");

                let query = `
                INSERT INTO games(timer, moves, user_id_white, user_id_black, started_at)
                VALUES($1, $2, $3, $4, $5)
                `;

                
                await db.query(query, [room.time + '', JSON.stringify(room.moves), room.players[0].id, room.players[1].id, startedAt + '']);
            }

        });

        socket.on('draw', roomId => {
            socket.to(roomId).emit("draw");
        });

        socket.on("update-score", async(roomId, playerOneScore, playerTwoScore) => {
            const roomIdRedis = await redisClient.get(roomId);
            if (roomIdRedis) {
                let room = JSON.parse(roomIdRedis);

                let userOne = room.players[0];
                let userTwo = room.players[1];

                userOne.user_points = parseInt(userOne.user_points, 10); // Convierte a entero, si es NaN usa 0
                userTwo.user_points = parseInt(userTwo.user_points, 10);
                userOne.user_points += playerOneScore;
                userTwo.user_points += playerTwoScore;

                let query = `SELECT updateScores($1, $2, $3, $4)`;
                
                await db.query(query, [userOne.username, Math.max(userOne.user_points, 0), userTwo.username, Math.max(userTwo.user_points, 0)]);

                await redisClient.set(userOne.username + "-score-updated", 'true')
                await redisClient.set(userTwo.username + "-score-updated", 'true')
            }
               
        });

        socket.on('create-room', async(roomId, time, user, password=null) => {
            const roomIdRedis = await redisClient.get(roomId);
            if (roomIdRedis) {
                socket.emit("error", `Room with id ${roomIdRedis} already exists`);
            } else {
                if (password) {
                    
                    await createRoom(roomId, user, time, password);
                } else {
                    await createRoom(roomId, user, time);
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
                    await joinRoom(roomId, user);

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
                    await joinRoom(room.id, user);
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
