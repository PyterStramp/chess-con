
const express = require("express");
const dotenv = require("dotenv");
const db = require("./config/db");
const path = require("path");
const http = require("http");
const socketIO = require("socket.io");
const cookieParser = require("cookie-parser");
const { connectToRedis, redisClient } = require("./config/redis");
const { newUser, removeUser } = require("./util/user");

dotenv.config();

// Routes
const viewRoutes = require("./routes/views");
const userRoutes = require("./routes/api/user");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

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
                const totalUsers = parseInt(await redisClient.get('total-users')) || 0;
                const totalRooms = parseInt(await redisClient.get('total-rooms')) || 0;
                const numberOfRooms = JSON.parse(await redisClient.get('number-of-rooms')) || [0, 0, 0, 0];

                socket.emit('receive-number-of-rooms-and-users', numberOfRooms, totalRooms, totalUsers);
            } catch (err) {
                console.error("Error al obtener datos de Redis:", err);
            }
        });

        socket.on('disconnect', async () => {
            try {
                const user = JSON.parse(await redisClient.get(socket.id));
                if (user && user.room) {
                    // TODO: remove user from room
                }
                removeUser(socket.id);
            } catch (err) {
                console.error("Error al manejar desconexión:", err);
            }
        });
    });

    // Iniciar el servidor
    const PORT = process.env.PORT || 4500;
    server.listen(PORT, () => {
        console.log(`Server started at http://localhost:${PORT}`);
    });
})();
