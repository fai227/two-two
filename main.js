const express = require("express");
const app = express();
const port = process.env.PORT || 8080;
const db = require("./scripts/database");

app.use(express.static("public"));

app.get("/", (req, res) => {

});



app.listen(port, () => {
    console.log(`${port} listening`);
})