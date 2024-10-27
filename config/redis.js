// Importar el cliente de Redis (recuerde tener instalado redis)
const {createClient} = require("redis");

// Configurar el cliente con la URL de Redis (puedes usar variables de entorno)
const redisClient = createClient({
    host: 'localhost',
    port: 6379,
});

// Función para conectar a Redis
const connectToRedis = async () => {
    try {
        await redisClient.connect(); // Conexión asincrónica
        console.log("Connected to Redis...");
    } catch (err) {
        console.error("Error connecting to Redis:", err.message);
        process.exit(1); // Finalizar el proceso si no se puede conectar
    }
};

// Detectar errores que no los capture el Try Catch
redisClient.on("error", (err) => {
    console.error("Redis error:", err.message);
});

// Exporta la función de conexión y el cliente para usarlos en otros archivos
module.exports = { connectToRedis, redisClient };
