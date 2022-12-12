const fs = require("fs");
const express = require("express");

const app = express();
const port = process.env.PORT || 8080;

const rankingNum = 10;
let ranking = [];
ranking = JSON.parse(fs.readFileSync("database.json"));

app.use(express.static("public"));
app.use(express.json());

app.get("/ranking", (req, res) => {
    res.json(ranking);
})

app.post("/ranking", (req, res) => {
    ranking.push(req.body);
    ranking.sort((a, b) => {

    });
    res.json(ranking);
});


app.listen(port, () => {
    console.log(`${port} listening`);
})