const fs = require("fs");
const express = require("express");

const app = express();
const port = process.env.PORT || 8080;

const rankingNum = 10;
let ranking = [];
const rankingFileName = "ranking.json";
ranking = JSON.parse(fs.readFileSync(rankingFileName));

app.use(express.static("public"));
app.use(express.json());

app.get("/ranking", (req, res) => {
    res.json(ranking);
})

app.post("/ranking", (req, res) => {
    let data = req.body;

    // undefined チェック
    if (data.score == undefined) {
        throw new Error("Score not defined");
    }
    if (data.name == undefined) {
        throw new Error("Username not defined");
    }
    if (data.time == undefined) {
        throw new Error("Time not defined");
    }

    // 配列にプッシュ
    ranking.push(data);

    // ランキングソート
    ranking.sort((a, b) => {
        let dif = b.score - a.score;
        if (dif == 0) {
            return a.time - b.time;
        }
        return dif;
    });

    // 上位のみ残す
    while (ranking.length > rankingNum) {
        ranking.pop();
    }

    fs.writeFileSync(rankingFileName, JSON.stringify(ranking));

    // 送信
    res.json(ranking);
});


app.listen(port, () => {
    console.log(`${port} listening`);
})