const {Router} = require("express");
const { getRegisterPage, getLoginPage, getLobbyPage } = require("../../controllers/views");

const router = Router();

router.get("/register", getRegisterPage);

router.get("/login", getLoginPage);

router.get("/", getLobbyPage);


module.exports = router;