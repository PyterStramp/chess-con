const db = require("../../config/db");
const { redisClient } = require('../../config/redis');

exports.getGames = async(req, res) => {
    try {
        const playerRedisPlayedGames = await redisClient.get(`${req.user.id}-played-games`);
        if (playerRedisPlayedGames) {
            let playedGames = JSON.parse(playerRedisPlayedGames);

            res.json(playedGames);
        } else {
            const query = `
                SELECT id, timer, moves, user_id_white, user_id_black,
                TO_CHAR(started_at, 'DD/MM/YY HH24:MI') AS started_at,
                TO_CHAR(completed_at, 'DD/MM/YY HH24:MI') AS completed_at
                FROM games
                WHERE user_id_white = $1 OR user_id_black = $1
            `;
            const values = [req.user.id];

            const result = await db.query(query, values);

            if (result.rows.length > 0) {
                await redisClient.setEx(`${req.user.id}-played-games`, 3600 * 24, JSON.stringify(result.rows));
                return res.json(result.rows);
            }else {
                return res.json([]);
            }
        }
    } catch (err) {
        console.log(err)
        res.status(500).json({error: err.message})
    }
}

exports.getGameMoves = async(req, res) => {
    try {
        const gameId = req.params.gameId;
        const redisMovesPlayer = await redisClient.get(`${req.user.id}-played-game-${gameId}-moves`);
        if (redisMovesPlayer) {
            const moves = JSON.parse(redisMovesPlayer);
            return res.json(moves);
        } else {
            const query = `SELECT moves FROM games WHERE id=$1`;
            const values = [gameId];
            const result = await db.query(query, values);
            if (result.rows.length > 0) {
                const moves = JSON.parse(result.rows[0].moves);

                await redisClient.setEx(`${req.user.id}-played-game-${gameId}-moves`, 3600 * 24, JSON.stringify(moves));

                res.json(moves);
            }else {
                return res.status(404).json({error: "Game not found"});
            }
        }
    } catch (err) {
        console.log(err)
        res.status(500).json({error: err.message})
    }
}