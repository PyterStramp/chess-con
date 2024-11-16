
const { redisClient } = require('../config/redis');

const newUser = async (socketId, user, roomId) => {
    if (roomId) {
        user.room = roomId;
    }

    // Guardar el usuario en Redis
    await redisClient.set(socketId, JSON.stringify(user));

    // Obtener y actualizar el total de usuarios
    let totalUsers = parseInt(await redisClient.get('total-users')) || 0;
    totalUsers += 1;
    await redisClient.set('total-users', totalUsers.toString());
};

const removeUser = async (socketId) => {
    // Eliminar el usuario de Redis
    await redisClient.del(socketId);

    // Obtener y actualizar el total de usuarios
    let totalUsers = parseInt(await redisClient.get('total-users')) || 0;
    totalUsers -= 1;

    if (totalUsers <= 0) {
        await redisClient.del('total-users'); // Eliminar el contador si no hay usuarios
    } else {
        await redisClient.set('total-users', totalUsers.toString());
    }
};

module.exports = { newUser, removeUser };
