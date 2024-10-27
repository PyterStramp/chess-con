const express = require("express");
const dotenv = require("dotenv");
const db = require("./config/db");
const path = require("path");
const cookieParser = require("cookie-parser");
const {connectToRedis, redisClient} = require("./config/redis");

dotenv.config();

//routes
const viewRoutes = require("./routes/views");
const userRoutes = require("./routes/api/user");


const app = express();

db.connect((err)=>{
    if (err) {
        console.log(err);
        process.exit(1);
    }
    console.log("Connected to PG");
});

app.use(cookieParser("secret"));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use("/", viewRoutes);
app.use("/api", userRoutes);

const PORT = process.env.PORT || 4500;

app.listen(PORT, ()=>{
    console.log(`Server started at http://localhost:${PORT}`);
});

