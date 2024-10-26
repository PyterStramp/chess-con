const redis = require("redis");

const redisClient = redis.createClient();

const connectToRedis = async () => {
    try {
        await redisClient.connect();
        console.log("Connected to Redis...");
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}

module.exports = {connectToRedis, redisClient};
