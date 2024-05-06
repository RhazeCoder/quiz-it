// ====== GLOBAL VARIABLES ====== //
let quizData = [];
let choiceData = [];
let correctAns = [];
let currentQuestionIndex = 0;
let user_username = '';
let quizId = '';
let timerStatus = false;

// ====== PAGES ====== //
const main_welcome_container = document.querySelector('#main-welcome-container');
const main_setup_container = document.querySelector('#main-setup-container');
const main_quiz_container = document.querySelector('#main-quiz-container');
const main_result_container = document.querySelector('#main-result-container');
const main_quiz_preview_container = document.querySelector('#main-quiz-preview-container');

// ===== BUTTONS ===== //
const enterQuizBtn = document.querySelector('#enter-quiz');
const startQuizBtn = document.querySelector('#start-quiz');
const quizChoice = document.querySelector('.item-choices-text');
const choicesList = document.querySelector('#choices-list');
const gobackBtn = document.querySelector('#go-back');
const nextBtn = document.querySelector('#next-question');
const shareResult = document.querySelector('#share-result');
const startNewQuiz = document.querySelector('#start-new-quiz');
const viewQuizPreview = document.querySelector('#view-quiz-preview');
const previewGoBackBtn = document.querySelector('#quiz-preview-goback');

// ===== INPUTS ===== //
const usernameInput = document.querySelector('#username-input');
const itemInput = document.querySelector('#item-input');
const categoryInput = document.querySelector('#category-input');
const difficultyInput = document.querySelector('#difficulty-input');
const typeInput = document.querySelector('#type-input');


// ===== TEXT AREAS ===== //
const itemsPossition = document.querySelector('#items-position');
const quizTimer = document.querySelector('#time-left');
const quizQuestion = document.querySelector('#quiz-question');
const resultUsername = document.querySelector('#result-username');
const resultScore = document.querySelector('#result-score');
const resultCategory = document.querySelector('#result-category');
const resultDifficulty = document.querySelector('#result-difficulty');
const quizPreviewList = document.getElementById('quiz-preview-list');

// ===== FUNCTIONS ===== //
async function startSite() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('resultId');
    if (!id) {
        checkUser();
    } else {
        const requestOption = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                resultId: id
            })
        }

        const response = await fetch('/api/quiz_result', requestOption);

        const data = await response.json();

        try {
            if (data.status === 'success') {
                const categoryText = document.querySelector(`#category-input option[value="${data.category}"]`).textContent;
                const difficultyText = document.querySelector(`#difficulty-input option[value="${data.difficulty}"]`).textContent;
                resultUsername.textContent = `${data.username}'s score:`;
                resultScore.innerHTML = `${data.score}/${data.items}`;
                resultCategory.innerHTML = categoryText
                resultDifficulty.innerHTML = difficultyText;

                quizId = id;
                setActivePage('result');
            } else {
                checkUser();
            }
        } catch (error) {
            checkUser();
        }
    }
}

async function setActivePage(page) {
    switch (page) {
        case 'welcome':
            main_welcome_container.style.display = 'flex';
            main_setup_container.style.display = 'none';
            main_quiz_container.style.display = 'none';
            main_result_container.style.display = 'none';
            main_quiz_preview_container.style.display = 'none';
            break;
        case 'setup':
            main_welcome_container.style.display = 'none';
            main_setup_container.style.display = 'flex';
            main_quiz_container.style.display = 'none';
            main_result_container.style.display = 'none';
            main_quiz_preview_container.style.display = 'none';
            break;
        case 'quiz':
            main_welcome_container.style.display = 'none';
            main_setup_container.style.display = 'none';
            main_quiz_container.style.display = 'flex';
            main_result_container.style.display = 'none';
            main_quiz_preview_container.style.display = 'none';
            break;
        case 'result':
            main_welcome_container.style.display = 'none';
            main_setup_container.style.display = 'none';
            main_quiz_container.style.display = 'none';
            main_result_container.style.display = 'flex';
            main_quiz_preview_container.style.display = 'none';
            break;
        case 'quiz_preview':
            main_welcome_container.style.display = 'none';
            main_setup_container.style.display = 'none';
            main_quiz_container.style.display = 'none';
            main_result_container.style.display = 'none';
            main_quiz_preview_container.style.display = 'flex';
            break;
        default:
            main_welcome_container.style.display = 'flex';
            main_setup_container.style.display = 'none';
            main_quiz_container.style.display = 'none';
            main_result_container.style.display = 'none';
            main_quiz_preview_container.style.display = 'none';
            break;
    }
}

async function checkUser() {
    const fpPromise = import('https://openfpcdn.io/fingerprintjs/v4')
        .then(FingerprintJS => FingerprintJS.load())
    fpPromise
        .then(fp => fp.get())
        .then(async result => {
            const visitorId = result.visitorId;

            const requestOption = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    uniqueId: visitorId
                })
            }

            const response = await fetch('/api/check_user', requestOption);

            const data = await response.json();

            if (data.status === 'success') {
                user_username = data.username;
                setActivePage('setup');
            } else {
                setActivePage('welcome');
            }
        });
}

async function startTimer(quizLength) {
    let time = quizLength * 20;
    let minutes = Math.floor(time / 60);
    let seconds = time % 60;

    const interval = setInterval(() => {
        time--;
        minutes = Math.floor(time / 60);
        seconds = time % 60 < 10 ? `0${time % 60}` : time % 60;

        if (timerStatus) {
            quizTimer.innerHTML = `${minutes}:${seconds}`;
        } else {
            clearInterval(interval);
            time = 0;
            quizTimer.innerHTML = '0:00';
        }

        if (time <= 0) {
            clearInterval(interval);
            if (timerStatus) {
                console.log('Check via timer')
                // set the choiceData that was not fill to ""
                for (let i = 0; i < quizLength; i++) {
                    if (choiceData[i] === undefined) {
                        choiceData[i] = '';
                    }
                }
                displayResult();
            }
        }
    }, 1000);
}

async function displayChoices(quizData) {
    let choices = quizData.choices;

    for (const choice of choices) {
        const ul = document.querySelector('#choices-list');
        const li = document.createElement('li');
        li.className = 'choices-list-item';

        const div = document.createElement('div');
        div.className = 'choices-item-container';

        const p = document.createElement('p');
        p.className = 'item-choices-text';
        p.innerHTML = choice;

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 512 512');
        svg.setAttribute('width', '1em');
        svg.setAttribute('height', '1em');
        svg.setAttribute('fill', 'currentColor');
        svg.setAttribute('display', 'none');
        svg.classList.add('text-success', 'choice-check');

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-111 111-47-47c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l64 64c9.4 9.4 24.6 9.4 33.9 0L369 209z');

        svg.appendChild(path);
        div.appendChild(p);
        div.appendChild(svg);
        li.appendChild(div);
        ul.appendChild(li);
    }
}

async function removeChoices() {
    let choiceListItems = document.querySelectorAll('.choices-list-item');
    for (let i = 0; choiceListItem = choiceListItems[i]; i++) {
        choiceListItem.parentNode.removeChild(choiceListItem);
    }
}

async function displayResult() {
    nextBtn.disabled = true;
    nextBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Loading...';

    const requestOption = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: quizId,
            answers: choiceData
        })
    }

    const response = await fetch('/api/check', requestOption);

    const data = await response.json();

    if (data.status === 'success') {
        const categoryText = document.querySelector(`#category-input option[value="${data.category}"]`).textContent;
        const difficultyText = document.querySelector(`#difficulty-input option[value="${data.difficulty}"]`).textContent;
        resultUsername.textContent = `${data.username}'s score:`;
        resultScore.innerHTML = `${data.score}/${data.items}`;
        resultCategory.innerHTML = categoryText
        resultDifficulty.innerHTML = difficultyText;

        setActivePage('result');
    } else {
        alert('Error: ', data.message);
        nextBtn.disabled = false;
        nextBtn.innerHTML = 'Submit';
    }
}

// ===== EVENT LISTENERS ===== //
enterQuizBtn.addEventListener('click', async () => {
    const fpPromise = import('https://openfpcdn.io/fingerprintjs/v4')
        .then(FingerprintJS => FingerprintJS.load())
    fpPromise
        .then(fp => fp.get())
        .then(async result => {
            const visitorId = result.visitorId;

            const requestOption = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    uniqueId: visitorId,
                    username: usernameInput.value
                })
            }

            const response = await fetch('/api/add_user', requestOption);

            const data = await response.json();

            if (data.status === 'success') {
                user_username = usernameInput.value;
                setActivePage('setup');
            }
        });
});

startQuizBtn.addEventListener('click', async () => {
    if (parseInt(itemInput.value) < 5 || parseInt(itemInput.value) > 50) {
        alert('Quantity of items should be between 5 and 50.');
        return;
    }

    startQuizBtn.disabled = true;
    startQuizBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Loading...';

    const requestOption = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: user_username,
            items: itemInput.value,
            category: categoryInput.value,
            difficulty: difficultyInput.value,
            type: typeInput.value
        })
    }

    const response = await fetch('/api/create', requestOption);

    const data = await response.json();

    try {
        if (data.status === 'success') {
            quizId = data.id;
            quizData = data.quiz_data;
            currentQuestionIndex = 0;

            timerStatus = true;
            startTimer(quizData.length);
            itemsPossition.innerHTML = `${currentQuestionIndex + 1}/${quizData.length}`;
            quizQuestion.innerHTML = quizData[currentQuestionIndex].question;
            displayChoices(quizData[currentQuestionIndex]);

            await setActivePage('quiz');
        } else {
            alert('Error: ', data.message);
            startQuizBtn.disabled = false;
            startQuizBtn.innerHTML = 'START QUIZ';
        }

    } catch (error) {
        alert('Error: ', error.message);
        startQuizBtn.disabled = false;
        startQuizBtn.innerHTML = 'START QUIZ';
    }
});

choicesList.addEventListener('click', async (e) => {
    const clickedLi = e.target.closest('li');
    const liElements = Array.from(choicesList.querySelectorAll('li'));
    const index = liElements.indexOf(clickedLi);

    const choicesContainer = document.querySelectorAll('.choices-item-container');
    const choicesChecked = document.querySelectorAll('.choice-check');

    choicesContainer.forEach((container, idx) => {
        container.style.background = (index === idx) ? '#52FFCD' : '#FFFFFF';
        choicesChecked[idx].style.display = (index === idx) ? 'block' : 'none';

        let choiceText = container.querySelector('.item-choices-text').innerHTML;

        if (index === idx) {
            if (choiceData[currentQuestionIndex] !== undefined) {
                choiceData[currentQuestionIndex] = choiceText;
            } else {
                choiceData.push(choiceText);
            }

        }
    });
});

gobackBtn.addEventListener('click', async () => {
    if (currentQuestionIndex === 0) return;

    removeChoices();
    currentQuestionIndex--;
    itemsPossition.innerHTML = `${currentQuestionIndex + 1}/${quizData.length}`;
    quizQuestion.innerHTML = quizData[currentQuestionIndex].question;
    displayChoices(quizData[currentQuestionIndex]);

    nextBtn.textContent = 'Next';

    if (choiceData[currentQuestionIndex] !== undefined) {
        const choicesContainer = document.querySelectorAll('.choices-item-container');
        const choicesChecked = document.querySelectorAll('.choice-check');

        choicesContainer.forEach((container, idx) => {
            let choiceText = container.querySelector('.item-choices-text').textContent;

            if (choiceData[currentQuestionIndex] === choiceText) {
                container.style.background = '#52FFCD';
                choicesChecked[idx].style.display = 'block';
            }
        });
    }
});

nextBtn.addEventListener('click', async () => {
    if (!choiceData[currentQuestionIndex]) return;

    if (currentQuestionIndex === quizData.length - 1) {
        displayResult();
        return;
    } else if (currentQuestionIndex === quizData.length - 2) {
        removeChoices();
        currentQuestionIndex++;
        itemsPossition.innerHTML = `${currentQuestionIndex + 1}/${quizData.length}`;
        quizQuestion.innerHTML = quizData[currentQuestionIndex].question;
        displayChoices(quizData[currentQuestionIndex]);

        nextBtn.textContent = 'Submit';
    } else {
        removeChoices();

        currentQuestionIndex++;
        itemsPossition.innerHTML = `${currentQuestionIndex + 1}/${quizData.length}`;
        quizQuestion.innerHTML = quizData[currentQuestionIndex].question;
        displayChoices(quizData[currentQuestionIndex]);
    }

    if (choiceData[currentQuestionIndex] !== undefined) {
        const choicesContainer = document.querySelectorAll('.choices-item-container');
        const choicesChecked = document.querySelectorAll('.choice-check');

        choicesContainer.forEach((container, idx) => {
            let choiceText = container.querySelector('.item-choices-text').textContent;

            if (choiceData[currentQuestionIndex] === choiceText) {
                container.style.background = '#52FFCD';
                choicesChecked[idx].style.display = 'block';
            }
        });
    }
});

startNewQuiz.addEventListener('click', async () => {
    startQuizBtn.disabled = false;
    startQuizBtn.innerHTML = 'START QUIZ';

    quizData = [];
    choiceData = [];
    currentQuestionIndex = 0;
    user_username = '';
    quizId = '';
    timerStatus = false;
    removeChoices();
    nextBtn.disabled = false;
    nextBtn.innerHTML = 'Next';
    window.history.pushState({}, document.title, window.location.pathname);

    checkUser();
});

viewQuizPreview.addEventListener('click', async () => {
    const requestOption = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: quizId
        })
    }

    const response = await fetch('/api/quiz_preview', requestOption);

    const data = await response.json();
    
    choiceData = data.user_answers;
    correctAns = data.correct_answers;
    quizData = data.quiz_data;
    const quizLength = data.items;

    quizPreviewList.innerHTML = '';

    for (let i = 0; i < quizLength; i++) {
        const listItem = document.createElement('li');
        listItem.className = 'quiz-preview-list-item';

        const divContainer = document.createElement('div');
        divContainer.className = 'quiz-item-preview-container';

        const divPreview = document.createElement('div');
        divPreview.id = 'quiz-preview-container';

        const divQuestion = document.createElement('div');
        divQuestion.id = 'quiz-preview-question-container';

        const pQuestion = document.createElement('p');
        pQuestion.id = 'quiz-preview-question';
        pQuestion.className = 'text-center';
        pQuestion.innerHTML = quizData[i].question;

        divQuestion.appendChild(pQuestion);
        divPreview.appendChild(divQuestion);
        divContainer.appendChild(divPreview);
        listItem.appendChild(divContainer);

        const ulChoices = document.createElement('ul');
        ulChoices.id = 'quiz-preview-choices';

        for (let j = 0; j < quizData[i].choices.length; j++) {
            const choice = quizData[i].choices[j];
            const liChoice = document.createElement('li');
            liChoice.className = 'quiz-preview-choices-list-item';

            const divChoice = document.createElement('div');
            divChoice.className = 'quiz-preview-choices-item-container';

            if (choiceData[i] == correctAns[i] && choice == choiceData[i]) {
                divChoice.style.backgroundColor = '#52FFCD';
            } else if (choiceData[i] != correctAns[i] && choice == correctAns[i]) {
                divChoice.style.backgroundColor = '#52FFCD';
            } else if (choiceData[i] != correctAns[i] && choice == choiceData[i]) {
                divChoice.style.backgroundColor = '#FF4F4F';
            }

            const pChoice = document.createElement('p');
            pChoice.className = 'quiz-preview-item-choices-text';
            pChoice.innerHTML = choice;

            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('viewBox', '0 0 512 512');
            svg.setAttribute('width', '1em');
            svg.setAttribute('height', '1em');
            svg.setAttribute('fill', 'currentColor');
            svg.setAttribute('display', 'none');
            svg.classList.add('text-success', 'choice-check');

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', 'M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-111 111-47-47c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l64 64c9.4 9.4 24.6 9.4 33.9 0L369 209z');

            svg.appendChild(path);
            divChoice.appendChild(pChoice);
            divChoice.appendChild(svg);
            liChoice.appendChild(divChoice);
            ulChoices.appendChild(liChoice);
        }

        divPreview.appendChild(ulChoices);
        quizPreviewList.appendChild(listItem);
    }

    setActivePage('quiz_preview');
});

shareResult.addEventListener('click', async () => {
    const url = new URL(window.location.href);
    const resultId = quizId;
    let resultUrl = `${url.origin}/?resultId=${resultId}`;
    navigator.clipboard.writeText(resultUrl);
    alert('Link copied to clipboard!');
});

previewGoBackBtn.addEventListener('click', async () => {
    setActivePage('result');
});

startSite();