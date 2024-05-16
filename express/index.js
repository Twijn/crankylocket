const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const path = require("path");

const expressWs = require("express-ws")(app);
app.use(cookieParser());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

const auth = require("./auth");
const controllers = require("./controllers");
const ws = require("./ws");

const sessions = [];

app.use(express.static("express/static"))

app.use((req, res, next) => {
    req.sessions = sessions;
    next();
})

app.use("/auth", auth);
app.use("/ws", ws.router);

app.use("/", controllers);

app.listen(process.env.EXPRESS_PORT, () => {
    console.log(`Express is listening on port ${process.env.EXPRESS_PORT}`);
});
