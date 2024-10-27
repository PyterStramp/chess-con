exports.getRegisterPage = (req, res)=>{
    if (req.cookies.token) {
        return res.redirect("/");
    }
    res.render("auth/register");
}

exports.getLoginPage = (req, res)=>{
    if (req.cookies.token) {
        return res.redirect("/");
    }    
    res.render("auth/login");
}

exports.getLobbyPage = (req, res) => {
    if (!req.cookies.token) {
        return res.redirect("/login");
    }    
    res.render("lobby");
}