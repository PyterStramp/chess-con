const {Router} = require("express");
const { getRegisterPage, getLoginPage, getLobbyPage, getGamesPage } = require("../../controllers/views");

const router = Router();

router.get("/register", getRegisterPage);

router.get("/login", getLoginPage);

router.get("/", getLobbyPage);

router.get("/games", getGamesPage);

module.exports = router;