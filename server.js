import axios from 'axios';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// ================== Global Variables ================== //
let quizDatas = JSON.parse(fs.readFileSync(__dirname + '/data/quizdatas.json', 'utf-8'));
let quizes = JSON.parse(fs.readFileSync(__dirname + '/data/quizes.json', 'utf-8'));
let userDatas = JSON.parse(fs.readFileSync(__dirname + '/data/userdatas.json', 'utf-8'));

// ================== Routes ================== //

app.get('/', async (req, res) => {
    res.sendFile(path.join(__dirname + '/public/index.html'));
});

app.post('/api/check_user', async (req, res) => {
    let reqBody = req.body;
    if (!reqBody || !reqBody.uniqueId) {
        res.status(400).send({
            status: 'error',
            message: 'Bad Request'
        });
        return;
    }

    const { uniqueId } = req.body;

    let savedUsername = userDatas[uniqueId] || "null";

    if (savedUsername != "null") {
        res.status(200).send({
            status: 'success',
            message: 'User Found!',
            username: savedUsername
        });
    } else {
        res.status(400).send({
            status: 'error',
            message: "No User Found!",
        });
    }
});

app.post('/api/add_user', async (req, res) => {
    let reqBody = req.body;

    if (!reqBody || !reqBody.uniqueId || !reqBody.username) {
        res.status(400).send({
            status: 'error',
            message: 'Bad Request'
        });
        return;
    }

    const { uniqueId, username } = req.body;

    // save user's username
    userDatas[uniqueId] =  username;
    fs.writeFileSync(__dirname + '/data/userdatas.json', JSON.stringify(userDatas, null, 2), 'utf-8');

    res.status(200).send({
        status: 'success',
        message: 'User added successfully'
    });
});

app.post('/api/create', async (req, res) => {
    let reqBody = req.body;

    try {
        if (!reqBody || !reqBody.items || !reqBody.category || !reqBody.difficulty || !reqBody.type) {
            res.status(400).send({
                status: 'error',
                message: 'Bad Request'
            });
            return;
        }

        const { items, username, category, difficulty, type } = req.body;

        let requestData = {
            amount: items,
            category: category != 'any' ? category : '',
            difficulty: difficulty != 'any' ? difficulty : '',
            type: type != 'any' ? type : '',
        }

        let queryString = new URLSearchParams(requestData).toString();

        axios.get(`https://opentdb.com/api.php?${queryString}`)
        .then(async (response) => {
            // generate random id
            let chars = 'abcdefghijklmnopqrstuvwxyz1234567890';
            let rand_uniqueId = '';
            for (let i = 8; i > 0; --i) rand_uniqueId += chars[Math.floor(Math.random() * chars.length)];

            // rewrite data from api
            let quizData =  []
            let correctData = []

            let data = response.data.results;
            data.forEach((item) => {
                let question = item.question;
                let correctAnswer = item.correct_answer;
                let incorrectAnswers = item.incorrect_answers;
                let choices = [...incorrectAnswers, correctAnswer];
                let shuffledChoices = choices.sort(() => Math.random() - 0.5);

                let quizItem = {
                    type: item.type,
                    difficulty: item.difficulty,
                    category: item.category,
                    question: question,
                    choices: shuffledChoices
                }

                correctData.push(correctAnswer);
                quizData.push(quizItem);
            });

            // save correctData to quizes
            quizes[rand_uniqueId] = {
                username: username,
                category: category,
                difficulty: difficulty,
                type: type,
                correctAnswers: correctData,
                quiz_data: quizData
            };

            fs.writeFileSync(__dirname + '/data/quizes.json', JSON.stringify(quizes, null, 2), 'utf-8');

            // return success response
            res.status(200).send({
                id: rand_uniqueId,
                username: username,
                quiz_data: quizData,
                status: 'success',
                message: 'Quiz data created successfully'
            });

        })
        .catch((error) => {
            console.log(error.message)
            res.status(201).send({
                status: 'error',
                message: error.message
            });
        });

    } catch (error) {
        console.log(error.message);
        res.status(201).send({
            status: 'error',
            message: error.message
        });
    }
});

app.post('/api/check', async (req, res) => {
    let reqBody = req.body;
    try {
        if (!reqBody || !reqBody.id || !reqBody.answers) {
            res.status(400).send({
                status: 'error',
                message: 'Bad Request'
            });
            return;
        }

        let { id, answers } = reqBody;

        if (!quizes[id]) {
            res.status(404).send({
                status: 'error',
                message: "Quiz data not found"
            });
            return;
        }

        let correctAnswers = quizes[id].correctAnswers;
        let score = 0;

        answers.forEach((answer, index) => {
            if (answer === correctAnswers[index]) {
                score += 1;
            }
        });

        // save quiz data
        quizDatas[id] = {
            id: id,
            username: quizes[id].username,
            category: quizes[id].category,
            difficulty: quizes[id].difficulty,
            type: quizes[id].type,
            score: score,
            items: correctAnswers.length,
            user_answers: answers,
        }

        fs.writeFileSync(__dirname + '/data/quizdatas.json', JSON.stringify(quizDatas, null, 2), 'utf-8');

        // return success response
        res.status(200).send({
            score: score,
            items: correctAnswers.length,
            username: quizes[id].username,
            category: quizes[id].category,
            difficulty: quizes[id].difficulty,
            type: quizes[id].type,
            user_answers: answers,
            correct_answers: correctAnswers,
            status: 'success',
            message: 'Quiz data checked successfully'
        });

    } catch (error) {
        console.log(error.message);
        res.status(201).send({
            status: 'error',
            message: error.message
        });
    }
});

app.post('/api/quiz_preview', async (req, res) => {
    let reqBody = req.body;
    try {
        if (!reqBody || !reqBody.id) {
            res.status(400).send({
                status: 'error',
                message: 'Bad Request'
            });
            return;
        }

        let { id } = reqBody;

        if (!quizes[id] && !quizDatas[id]) {
            res.status(404).send({
                status: 'error',
                message: "Quiz data not found"
            });
            return;
        }

        let correctAnswers = quizes[id].correctAnswers;

        // return success response
        res.status(200).send({
            username: quizes[id].username,
            items: quizDatas[id].items,
            category: quizes[id].category,
            difficulty: quizes[id].difficulty,
            type: quizes[id].type,
            correct_answers: correctAnswers,
            user_answers: quizDatas[id] ? quizDatas[id].user_answers : [],
            quiz_data: quizes[id].quiz_data,
            status: 'success',
            message: 'Quiz data previewed successfully'
        });

    } catch (error) {
        console.log(error.message);
        res.status(201).send({
            status: 'error',
            message: error.message
        });
    }
});

app.post('/api/quiz_result', async (req, res) => {
    const id = req.body.resultId;

    if (!id) {
        res.status(400).send({
            status: 'error',
            message: 'Bad Request'
        });
        return;
    }

    if (!quizDatas[id]) {
        res.status(404).send({
            status: 'error',
            message: "Quiz data not found"
        });
        return;
    }

    res.status(200).send({
        score: quizDatas[id].score,
        items: quizDatas[id].items,
        username: quizDatas[id].username,
        category: quizDatas[id].category,
        difficulty: quizDatas[id].difficulty,
        type: quizDatas[id].type,
        user_answers: quizDatas[id].user_answers,
        correct_answers: quizes[id].correctAnswers,
        status: 'success',
        message: 'Result fetched successfully'
    });
});

// delete quizes data and quizdatas data every 12:00 AM manila time
setInterval(() => {
    let date = new Date();
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();

    if (hours === 0 && minutes === 0 && seconds === 0) {
        quizes = {};
        quizDatas = {};
        fs.writeFileSync(__dirname + '/data/quizes.json', JSON.stringify(quizes, null, 2), 'utf-8');
        fs.writeFileSync(__dirname + '/data/quizdatas.json', JSON.stringify(quizDatas, null, 2), 'utf-8');
        console.log('Quizes and Quizdatas data has been resetted');
    }
}, 1000);

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log('Listening on port:', port);
});