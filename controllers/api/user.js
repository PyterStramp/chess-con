const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const {validationResult} = require("express-validator");
const dotenv = require("dotenv");
const db = require("../../config/db");

dotenv.config();

const jwtSecret = process.env.JWT_SECRET || "secreto";

exports.register = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.redirect("/register?error=" + errors.array()[0].msg);
        }

        const { username, email, password, confirmPassword } = req.body;

        if (password !== confirmPassword) {
            return res.redirect("/register?error=Passwords do not match");
        }

        // 1. Verificar si el usuario o email ya existen
        let query = `SELECT id FROM users WHERE username = $1 OR email = $2`;
        const values = [username, email];

        const result = await db.query(query, values);
        if (result.rows.length > 0) {
            return res.redirect("/register?error=Username or email is already taken");
        }

        // 2. Hashear la contraseña
        const encryptedPassword = await bcrypt.hash(password, 10);

        // 3. Ejecutar el procedimiento almacenado `createUser`
        query = `SELECT createUser($1, $2, $3)`;
        await db.query(query, [username, email, encryptedPassword]);

        // 4. Obtener el ID del usuario recién creado para generar el JWT
        query = `SELECT id FROM users WHERE email = $1`;
        const userResult = await db.query(query, [email]);

        if (userResult.rows.length === 0) {
            return res.redirect("/register?success=Something went wrong");
        }

        const userId = userResult.rows[0].id;

        // 5. Crear el payload y firmar el token
        const payload = { id: userId, username, email };

        jwt.sign(payload, jwtSecret, (err, token) => {
            if (err) {
                throw err;
            }

            // Configurar cookies para el token y la información adicional del usuario
            res.cookie("token", token, {
                maxAge: 1000 * 60 * 60 * 24 * 30 * 6, // 6 meses
                httpOnly: true,
                secure: false,
                sameSite: "strict"
            });
            res.cookie("user_rank", 'beginner', {
                maxAge: 1000 * 60 * 60 * 24 * 30 * 6,
                httpOnly: true,
                secure: false,
                sameSite: "strict"
            });
            res.cookie("user_points", 0, {
                maxAge: 1000 * 60 * 60 * 24 * 30 * 6,
                httpOnly: true,
                secure: false,
                sameSite: "strict"
            });

            res.redirect("/?success=You have registered your user successfully");
        });

    } catch (err) {
        console.error(err);
        res.redirect("/register?error=Something went wrong");
    }
};

exports.login = async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.redirect("/login?error=" + errors.array()[0].msg);
        }

        const { email, password } = req.body;

        let query = `SELECT * FROM users WHERE email = $1`;
        const result = await db.query(query, [email]);
        if (result.rows.length === 0) {
            return res.redirect("/login?error=Account not found");
        }

        let user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.redirect("/login?error=Email or password not valid");
        }
        
        query = `SELECT user_rank, user_points FROM user_info WHERE user_id = $1`;
        const playerInfo = await db.query(query, [user.id]);

        let playerInfoRP = playerInfo.rows[0];

        const payload = {
            id: user.id, username: user.username, email
        };

        jwt.sign(payload, jwtSecret, (err, token)=>{
            if (err) {
                throw err;
            }

            res.cookie("token", token, {
                maxAge: 1000 * 60 * 60 * 24 * 30 * 6, // 6 meses
                httpOnly: true,
                secure: false,
                sameSite: "strict"
            });
            res.cookie("user_rank", playerInfoRP.user_rank, {
                maxAge: 1000 * 60 * 60 * 24 * 30 * 6,
                httpOnly: true,
                secure: false,
                sameSite: "strict"
            });
            res.cookie("user_points", playerInfoRP.user_points, {
                maxAge: 1000 * 60 * 60 * 24 * 30 * 6,
                httpOnly: true,
                secure: false,
                sameSite: "strict"
            });
            res.redirect("/?success=You have loged your user successfully");
        });

    }catch(err){
        console.log(err);
        res.redirect("/login?error=Something went weong");
    }

}

exports.getInfo = (req, res) =>{
    try {
        jwt.verify(req.cookies.token, jwtSecret, async (err, userPayload)=>{
            if(err){
                throw err;
            }
            const {id, email, username} = userPayload;
            
            let user = {
                id,
                username,
                email,
                user_rank: req.cookies.user_rank,
                user_points: req.cookies.user_points
            }

            return res.json(user);

        });
    }catch(err) {
        console.log(err);
        res.status(500).json({error: err.message});
    }
}
