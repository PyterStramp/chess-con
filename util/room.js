
const {redisClient} = require("../config/redis");

/*
room object -> {
'room_id': {
            'id': roomId,
            'players:' [user1, user2],
            'moves': [],
            'time': X in minutes,
            'password': 'example',
            gameStarted: false
            }
}
*/

let numberOfRoomsIndices = {
    'beginner': 0,
    'intermediate': 1,
    'advanced': 2,
    'expert': 3,
};

const createRoom = async (roomId, user, time, password = null) => {
    let room = {
        id: roomId,
        players: [user, null],
        moves: [],
        time,
        gameStarted: false
    };
    if (password) {
        room.password = password;
    }

    // Guardar la sala en Redis
    await redisClient.set(roomId, JSON.stringify(room));

    // Actualizar la lista de salas en Redis
    let rooms = JSON.parse(await redisClient.get('rooms')) || [];
    let index = rooms.length;
    rooms.push(room);
    await redisClient.set('rooms', JSON.stringify(rooms));

    // Actualizar el índice de la sala en roomIndices
    let roomIndices = JSON.parse(await redisClient.get('roomIndices')) || {};
    roomIndices[`${roomId}`] = index;
    await redisClient.set('roomIndices', JSON.stringify(roomIndices));

    // Actualizar el contador total de salas
    let totalRooms = parseInt(await redisClient.get('total-rooms')) || 0;
    totalRooms += 1;
    await redisClient.set('total-rooms', totalRooms.toString());

    // Actualizar el número de salas por rango
    let numberOfRooms = JSON.parse(await redisClient.get('number-of-rooms')) || [0, 0, 0, 0];
    numberOfRooms[numberOfRoomsIndices[user.user_rank]] += 1;
    await redisClient.set('number-of-rooms', JSON.stringify(numberOfRooms));
};

const joinRoom = async (roomId, user) => {
    // Obtener la sala específica desde Redis
    let roomData = await redisClient.get(roomId);
    if (roomData) {
        let room = JSON.parse(roomData);

        // Añadir el usuario al segundo puesto de la lista de jugadores
        room.players[1] = user;
        await redisClient.set(roomId, JSON.stringify(room));

        // Actualizar `rooms` y `roomIndices` en Redis
        let roomIndices = JSON.parse(await redisClient.get('roomIndices')) || {};
        let rooms = JSON.parse(await redisClient.get('rooms')) || [];

        if (roomIndices[roomId] !== undefined) {
            let index = roomIndices[roomId];
            rooms[index].players[1] = user;
            await redisClient.set('rooms', JSON.stringify(rooms));
        }
    }
};

const removeRoom = async (roomId, userRank) => {
    // Eliminar la sala específica de Redis
    await redisClient.del(roomId);

    // Actualizar roomIndices y rooms en Redis
    let roomIndices = JSON.parse(await redisClient.get('roomIndices')) || {};
    let rooms = JSON.parse(await redisClient.get('rooms')) || [];

    if (roomIndices[roomId] !== undefined) {
        let index = roomIndices[roomId];
        rooms.splice(index, 1); // Eliminar la sala de rooms
        delete roomIndices[roomId]; // Eliminar el índice de roomIndices

        // Actualizar rooms y roomIndices en Redis
        await redisClient.set('rooms', JSON.stringify(rooms));
        await redisClient.set('roomIndices', JSON.stringify(roomIndices));
    }

    // Actualizar el contador total de salas
    let totalRooms = parseInt(await redisClient.get('total-rooms')) || 0;
    totalRooms -= 1;
    await redisClient.set('total-rooms', totalRooms.toString());

    // Actualizar el número de salas por rango
    let numberOfRooms = JSON.parse(await redisClient.get('number-of-rooms')) || [0, 0, 0, 0];
    numberOfRooms[numberOfRoomsIndices[userRank]] -= 1;
    await redisClient.set('number-of-rooms', JSON.stringify(numberOfRooms));
};

module.exports = {createRoom, joinRoom, removeRoom}
