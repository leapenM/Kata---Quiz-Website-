//initialized varables and setup start page
let userToken = null;
setupStartPage();

/**
 * Generates a new user token from OpenTDB API
 */
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

/**
 * Generates a resets user token from OpenTDB API
 */
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
 * Gets all possible categories from OpenTDB API
 */
async function categoryLookup() {
    let categories = await fetch('https://opentdb.com/api_category.php');
    let data = await categories.json();
    return data.trivia_categories;
}


/**
 * Generates all of the assets for the start page and options for selection
 */
function setupStartPage() {
    //generate a token for the user
    if (localStorage.getItem("userToken") == null) {
        generateToken();
    }

    //set up selection boxes
    populateCategories();

    //set up high score display
    let highScore = localStorage.getItem("highScore") || 0;
    let totalQuestions = localStorage.getItem("quizNumberQuestions") || 0;
    let hsDifficulty = localStorage.getItem("hsDifficulty") || "N/A";
    document.getElementById("highScoreDisplay").textContent = "High Score: " + highScore;
    document.getElementById("hsDifficulty").textContent = "Difficulty: " + hsDifficulty.charAt(0).toUpperCase() + hsDifficulty.slice(1);
    document.getElementById("hsHints").textContent = "Hints Used: " + (localStorage.getItem("hsHints") || 0);


    //set the event of the button(setup for quiz page)
    document.querySelector("#createQuiz").addEventListener("click", createQuiz);
}

function populateCategories() {
    let categoriesSelectBox = document.querySelector("#categories");

    categoryLookup().then(categories => {
        categories.forEach(category => {
            let option = document.createElement('option');
            option.value = category.id;
            option.text = category.name;
            categoriesSelectBox.appendChild(option);
        });
    });
}



/**
 * Sets up the quiz based on user selections and loads the quiz page
 */
async function createQuiz() {
    let categorySelect = document.querySelector("#categories");
    let difficultySelect = document.querySelector("#difficulty");
    let numberQuestionsSelect = document.querySelector("#numQuestions");

    //check number of questions selection is valid
    if(numberQuestionsSelect.value == "" || numberQuestionsSelect.value == null) {
        numberQuestionsSelect.value = 10;
    } else if (numberQuestionsSelect.value > 50) {
        alert("Cannot have more than 50 questions in a quiz.");
        numberQuestionsSelect.value = 50;

    } else if (numberQuestionsSelect.value < 1) {
        alert("Cannot have less than 1 question in a quiz.");
        numberQuestionsSelect.value = 1;
    }

    //check number of questions available in selected category
    if (categorySelect.value != "") { //some category was selected
        let maxQuestions = await fetch('https://opentdb.com/api_count.php?category=' + categorySelect.value);
        let maxQuestionsData = await maxQuestions.json();

        if (numberQuestionsSelect.value > maxQuestionsData.value){
            alert("The selected category does not have enough questions. The maximum number of questions for this category is " + maxQuestionsData.value + ".");
            numberQuestionsSelect.value = maxQuestionsData.value;
        }
    } 
   
    // Save category and difficulty selections to localStorage 
    localStorage.setItem("quizCategory", categorySelect.value);
    localStorage.setItem("quizDifficulty", difficultySelect.value);
    localStorage.setItem("quizNumberQuestions", numberQuestionsSelect.value);

    //load quiz page
    window.location.href = "quizPage.html";
}



