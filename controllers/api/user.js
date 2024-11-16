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

        
        let query = `SELECT id FROM users WHERE username = $1 OR email = $2`;
        const values = [username, email];

        const result = await db.query(query, values);
        if (result.rows.length > 0) {
            return res.redirect("/register?error=Username or email is already taken");
        }

       
        const encryptedPassword = await bcrypt.hash(password, 10);

        
        query = `SELECT createUser($1, $2, $3)`;
        await db.query(query, [username, email, encryptedPassword]);

        
        query = `SELECT id FROM users WHERE email = $1`;
        const userResult = await db.query(query, [email]);

        if (userResult.rows.length === 0) {
            return res.redirect("/register?success=Something went wrong");
        }

        const userId = userResult.rows[0].id;

        
        const payload = { id: userId, username, email };

        jwt.sign(payload, jwtSecret, (err, token) => {
            if (err) {
                throw err;
            }

            
            res.cookie("token", token, {
                maxAge: 1000 * 60 * 60 * 24 * 30 * 6, 
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
                maxAge: 1000 * 60 * 60 * 24 * 30 * 6,
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
                user_points: parseInt(req.cookies.user_points)
            }

            return res.json(user);

        });
    }catch(err) {
        console.log(err);
        res.status(500).json({error: err.message});
    }
}

exports.changeUsername = async(req, res) => {
    try {
        const errors = validationResult(req);

        if(!errors.isEmpty()){
            return res.status(400).json({error: errors.array()[0].msg})
        }

        const {username} = req.body;

        const querySearchUsername = `SELECT id FROM users WHERE username=$1`;
        const result = await db.query(querySearchUsername, [username]);

        if (result.rows.length > 0) {
            return res.status(400).json({error: "Username is already taken"});
        }

        const queryUpdate = `UPDATE users SET username=$1 WHERE id=$2`;
        const values = [username, req.user.id];
        await db.query(queryUpdate, values);

        const payload = {
            id: req.user.id,
            username,
            email: req.user.email
        }

        jwt.sign(payload, jwtSecret, (err, token) => {
            if(err) throw err;

            res.cookie("token", token, {maxAge: 1000 * 60 * 60 * 24 * 30 * 6, httpOnly: true, secure: false, sameSite: "strict"})

            res.json({message: "Your username updated successfully!", username});
        });

    } catch (err) {
        console.log(err)
        res.status(500).json({error: err.message})
    }
}

exports.changeEmail = async(req, res) => {
    try {
        const errors = validationResult(req);

        if(!errors.isEmpty()){
            return res.status(400).json({error: errors.array()[0].msg})
        }

        const {email} = req.body;

        const querySearchUsername = `SELECT id FROM users WHERE email=$1`;
        const result = await db.query(querySearchUsername, [email]);

        if (result.rows.length > 0) {
            return res.status(400).json({error: "Email is already taken"});
        }

        const queryUpdate = `UPDATE users SET email=$1 WHERE id=$2`;
        const values = [email, req.user.id];
        await db.query(queryUpdate, values);

        const payload = {
            id: req.user.id,
            username: req.user.username,
            email
        }

        jwt.sign(payload, jwtSecret, (err, token) => {
            if(err) throw err;

            res.cookie("token", token, {maxAge: 1000 * 60 * 60 * 24 * 30 * 6, httpOnly: true, secure: false, sameSite: "strict"})

            res.json({message: "Your email updated successfully!", email});
        });

    } catch (err) {
        console.log(err)
        res.status(500).json({error: err.message})
    }
}

exports.changePassword = async(req, res) => {
    try {
        const errors = validationResult(req);

        if(!errors.isEmpty()){
            return res.status(400).json({error: errors.array()[0].msg})
        }

        const {oldPassword, newPassword} = req.body;

        const querySearchUsername = `SELECT password FROM users WHERE id=$1`;
        const result = await db.query(querySearchUsername, [req.user.id]);

        const isMatch = await bcrypt.compare(oldPassword, result.rows[0].password);

        if (!isMatch) {
            return res.status(401).json({error: "Your password is incorrect"});
        }

        const encryptedPassword = await bcrypt.hash(newPassword, 10);

        const queryUpdate = `UPDATE users SET password=$1 WHERE id=$2`;
        const values = [encryptedPassword, req.user.id];
        await db.query(queryUpdate, values);

        res.json({message: "Your password updated successfully!"});

    } catch (err) {
        console.log(err)
        res.status(500).json({error: err.message})
    }
}

exports.logout = (req, res) => {
    res.clearCookie("token");
    res.clearCookie("user_points");
    res.clearCookie("user_rank");

    res.redirect("/login");
}

exports.deleteAccount = async(req, res) => {
    try {
        const query = `DELETE FROM users WHERE id=$1`;
        await db.query(query, [req.user.id]);
        
        res.json({message: "Account deleted successfully"})
        
    } catch (err) {
        console.log(err)
        res.status(500).json({error: err.message})
    }
}
