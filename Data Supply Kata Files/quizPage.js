 //initalize variables when quiz is created
 let questionIndex = 0; 
 let score = 0;
 let hintUsed = 0;
 let questionsArray = [];

initialQuizPage(); //run page setup

/**
 * Sets up the initial quiz page by fetching questions based on user selections,
 * displaying quiz information, and providing a start button to begin the quiz.
 */
async function initialQuizPage() {
    //fetch questions based on user selections
    questionsArray = await fetchQuestions();

    //check if questions are available -> no questions return to start page
    if(questionsArray == null || questionsArray.length == 0) {
        alert("No questions available.");
        window.location.href = "index.html";
        return;
    } 

    //Label what quiz is about
        let quizInfo = document.getElementById("quizInfo");
        let category = localStorage.getItem("quizCategory");
        let difficulty = localStorage.getItem("quizDifficulty");
        let numberQuestions = localStorage.getItem("quizNumberQuestions");
        let categoryText = category ? `Category: ${decodeURIComponent(questionsArray.results[0].category)}` : "Category: Any";
        let difficultyText = difficulty ? `Difficulty: ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}` : "Difficulty: Any";

        quizStart.innerHTML = "Quiz Information"
        categoryInfo.innerHTML = categoryText;
        difficultyInfo.innerHTML = difficultyText;
        numberQuestionsInfo.innerHTML = `Number of Questions: ${numberQuestions}`;

    //display start button
        let quizBox = document.getElementById("quizBox");
        let startButton = document.createElement("button");
        startButton.textContent = "Start Quiz";
        startButton.addEventListener("click", () => {
            quizBox.innerHTML = "";
            console.log(questionsArray);
            displayNextQuestions();
        });
        quizBox.appendChild(startButton);
}


/**
 * Takes user quiz settings from localStorage and fetches questions from the API.
 *  WILL DEAL WITH RESPONSE CODES***
 * @returns an array of questions for the quiz
 */
async function fetchQuestions() {
    let numberQuestions = localStorage.getItem("quizNumberQuestions");
    let category = localStorage.getItem("quizCategory");
    let difficulty = localStorage.getItem("quizDifficulty");

    //create API url
    let apiUrl = `https://opentdb.com/api.php?amount=${numberQuestions}`;
    if (category != null && category !== "") {
        apiUrl += `&category=${category}`;
    }
    if (difficulty != null && difficulty !== "") {
        apiUrl += `&difficulty=${difficulty}`;
    }
    apiUrl += `&encode=url3986`; //encode to handle special characters
    apiUrl += `&token=${localStorage.getItem("userToken")}`; //add token to API url
    
    let data = await fetch(apiUrl);
    let responseData = await data.json();

    //handle response codes
    let validResponse = await handleResponseCodes(responseData.response_code, fetchQuestions);

    if (validResponse === false) {
        return null; // STOP execution -> return to start page
    }

    return responseData;
}

/**
 * Displays the next question in the quiz along with answer options and handles user interactions.
 */
async function displayNextQuestions() {
  let currQuestion = questionsArray.results[questionIndex];
  let quizBox = document.getElementById("quizBox");


  quizBox.innerHTML = ""; //clear previous question


  //question
    let questionElement = document.createElement("h2");
    questionElement.id = "questionText";
    questionElement.textContent = "Question " + (questionIndex + 1) + ": " + decodeURIComponent(currQuestion.question);
    quizBox.appendChild(questionElement);

  //answers
    let answers = [currQuestion.correct_answer, ...currQuestion.incorrect_answers];
    answers = shuffleArray(answers); //randomize answer order
    
    answers.forEach(answer => {
        //create answer button
        let answerButton = document.createElement("button");
        answerButton.textContent = decodeURIComponent(answer);
        answerButton.classList.add("answerButton")

        //mark correct answer
        if (answer === currQuestion.correct_answer) {
            answerButton.id = "correctAnswer";
        }

        //Event on answer buttons
        answerButton.addEventListener("click", () => {
            //edit button colors and scores
            if (answer === currQuestion.correct_answer) { //correct answer picked
                answerButton.style.backgroundColor = "lightgreen";
                
                //update score if correct
                score++;
                document.getElementById("scoreDisplay").textContent = "Answers Correct: " + score;

            } else { //incorrect answer picked
                answerButton.style.backgroundColor = "salmon"; //highlight incorrect answer
               
                //account for multiple correct answers
               let correctButtons = document.getElementById("correctAnswer");
                if (correctButtons) {
                    correctButtons.style.backgroundColor = "lightgreen";
                } 
            }

            //show next question button
            quizBox.appendChild(nextButton); //display next button after answer selection

            //disable all answer buttons after selection
            let allAnswerButtons = document.querySelectorAll(".answerButton");
            allAnswerButtons.forEach(button => {
                button.disabled = true;
            });

        });

        //add answers to quiz box
        quizBox.appendChild(answerButton);
    });

    //next question button
    let nextButton = document.createElement("button");
    nextButton.textContent = "Next Question";
    nextButton.addEventListener("click", () => {
        questionIndex++; // get next question index
        if (questionIndex < questionsArray.results.length) { //get next question
            displayNextQuestions();

        } else { // no more question to interat through, results page
           resultsPage();
        }
    });

    //hint button - only for multiple choice questions
    if (currQuestion.type === "multiple") {
        let hintButton = document.createElement("button");
        hintButton.textContent = "Hint - Reveal 2 Incorrect Answers";
        hintButton.className = "hintButton";
        hintButton.addEventListener("click", () => {
            //get two random incorrect answers
            let incorrectAnswers = answers.filter(ans => ans !== currQuestion.correct_answer);
            shuffleArray(incorrectAnswers); //randomize incorrect answers
            let answersToReveal = incorrectAnswers.slice(0, 2).map(a => decodeURIComponent(a)); //text

            document.querySelectorAll(".answerButton").forEach(button => {
                if (answersToReveal.includes(button.textContent)) {
                    button.disabled = true; //disable revealed incorrect answers
                    button.id = "hintEliminate" // for styling purposes
                }
            });
            
            //disable hint button after use
            hintButton.disabled = true;
            hintButton.id = "hintEliminate"; // for styling purposes
            hintUsed++; // track hint usage
        });
            quizBox.appendChild(hintButton); //add hint button to quiz box
    }
    
}


/**
 * Displays the results page at the end of the quiz, 
 * showing the user's score and providing an option to return to the start page.(Helper Method)
 */
function resultsPage() {
    quizBox.innerHTML = "<h2 id='resultsTitle'>Quiz Complete!</h2>";
     
    //display score + hints usage
    document.getElementById("scoreDisplay").textContent = ""; //clear score display
    let scoreElement = document.createElement("h3");
    scoreElement.textContent = `You scored ${score} out of ${questionsArray.results.length}`;
    if (hintUsed > 0) {
        scoreElement.textContent += ` (Hints used: ${hintUsed})`;
    }   
    quizBox.appendChild(scoreElement);

    //Give feedback 
    let feedbackElement = document.createElement("h4"); 
    let percentage = (score / questionsArray.results.length) * 100;
    if (percentage === 100) {
        feedbackElement.textContent = "Perfect Score! Amazing job!";
    } else if (percentage >= 80) {
        feedbackElement.textContent = "Great work! You have a strong knowledge of the material.";
    } else if (percentage >= 50) {
        feedbackElement.textContent = "Good effort! Consider reviewing some areas to improve.";
    } else {
        feedbackElement.textContent = "Keep trying! Don't be discouraged, practice makes perfect.";
    }
    quizBox.appendChild(feedbackElement);

    //High Score storage 
    let highScore = localStorage.getItem("highScore");
    if (highScore === null || score > highScore) {
        localStorage.setItem("highScore", score);
        let highScoreElement = document.createElement("h4");
        highScoreElement.textContent = "New High Score!";
        quizBox.appendChild(highScoreElement);

        //store high score information
        localStorage.setItem("hsDifficulty", localStorage.getItem("quizDifficulty"));
        localStorage.setItem("hsNumberQuestions", localStorage.getItem("quizNumberQuestions"));
        localStorage.setItem("hsHints", hintUsed);
 
    }

    //return to start page button
    let restartButton = document.createElement("button");
    restartButton.textContent = "Return to Start Page";
    restartButton.addEventListener("click", () => {
        //redirect to start page
        window.location.href = "index.html";
        console.log(questionIndex);
    }); 

    quizBox.appendChild(restartButton);
}

function shuffleArray(array) { //Fisher-Yates Shuffle Algorithm
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

//////////////////// ERROR HANDLING ////////////////////
//handle token generation 
function generateToken() {
    userToken = fetch('https://opentdb.com/api_token.php?command=request')
        .then(response => response.json())
        .then(data => {
            userToken = data.token;
            console.log("Generated Token: ", userToken);

            //store token in local storage
            localStorage.setItem("userToken", userToken);
        })
        .catch(error => {
            console.error("Error generating token: ", error);
        }); 
    console.log(userToken);
}

function resetToken() {
    if (userToken != null) {
        fetch(`https://opentdb.com/api_token.php?command=reset&token=${userToken}`)
            .then(response => response.json())
            .then(data => {
                console.log("Token reset: ", data);
            });
    }
}

/**
 * Handles response codes from the OpenTDB API 
 * -> takes appropriate actions based on the code(will return to home page)
 * 
 * @param {*} code - response code from API
 */
async function handleResponseCodes(code) {
    switch(code) {
        case 0:
            //Success and do nothing
            console.log(0);
            return true; // valid response
        case 1:
            console.log(1);
            alert("No Results: The API doesn't have enough questions for your query. Please try changing the number of questions, category or difficulty.");
            return false; // can't generate questions
        case 2:
            console.log(2);
            alert("Invalid Parameter: Please check your quiz settings and try again.");
            return false; // can't generate questions
        case 3:
            console.log("Token Not Found: Generating new token.");
            generateToken();
            return false;
        case 4:
            console.log("Token Empty: All questions have been returned for the specified query. Resetting token.");
            resetToken();
            return false;
        case 5:
            console.log("Rate Limit Too many requests have occurred. Each IP can only access the API once every 5 seconds. Please wait and try again.");
            alert("Too many requests have occured, please wait 5 seconds and try again!");
            generateToken(); //get a new token 

            //Create a delay page before returning to the main page
            document.getElementById("scoreDisplay").innerHTML = "";
            let quizBox = document.getElementById("quizBox");
            quizBox.innerHTML = "<h2>Waiting 5 seconds... Will return to start page...</h2>";

            await new Promise(r => setTimeout(r, 5000)); //wait for 5 seconds

            window.location.href = "index.html"; //return to start page after 5 seconds
        default:
            console.error("Unknown response code: ", code);
    }   
}


