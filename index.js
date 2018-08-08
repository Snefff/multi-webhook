// dependencies
'use strict';
const express = require('express');
const bodyParser = require('body-parser');
var unirest = require("unirest");

var port = process.env.PORT || 8080;


// create server and configure it.
const server = express();
server.use(bodyParser.json());


// entry point
server.post('/cocktail', function (request, response) {
    var param = request.body.intent.inputs;
    console.log("List of your entities : ");
    Object.keys(param).forEach(element => { console.log(element + " - " + param[element]) });
    var url = "https://www.thecocktaildb.com/api/json/v1/1/"
    if (param["alcohol"]) {
        url += "filter.php?i=" + param["alcohol"];
    } else if (param["Random cocktail"]) {
        url += "random.php";
    }
        var req = unirest("GET", url);
    console.log(req);
    req.send("{}");
    req.end(function (res) {
        if (res.error) {
            console.log(res.error);
            response.setHeader('Content-Type', 'application/json');
            response.send(JSON.stringify({
                "speech": "Error. Can you try it again ? ",
                "posts": []
            }));
        } else if (res.body.drinks.length > 0) {
            let drink = res.body.drinks;
            let output = Array(drink.length);
            let text = "";
            if(param["alcohol"]) {
                text += "Voici les cocktails correspondants : \n"
                let output = Array(drink.length);
                for (let i = 0; i < drink.length; i++) {
                    output[i] = {
                        "type": "card",
                        "title": drink[i].strDrink,
                        "image": drink[i].strDrinkThumb,
                        "buttons": [{
                            "type": "button",
                            "text": "Voir en détail",
                            "value": drink[i].idDrink
                        }]
                    };
                }
            }else {
                text += "Voici une recette que tu devrais tester !\n"
                    output[0] = {
                        "type": "card",
                        "title": drink[0].strDrink,
                        "image": drink[0].strDrinkThumb,
                        "buttons": [{
                            "type": "button",
                            "text": "Voir en détail",
                            "value": drink[0].idDrink
                        }]
                    };
            }
            console.log(output);
            response.setHeader('Content-Type', 'application/json');
            response.send(JSON.stringify({
                "speech": text,
                "posts": output
            }));
        }
    });
});

server.post('/meal', function (request, response) {
    var param = request.body.intent.inputs;
    console.log("List of your entities : ");
    Object.keys(param).forEach(element => { console.log(element + " - " + param[element]) });
    var url = "https://www.themealdb.com/api/json/v1/1/"
    if (param["category"]) {
        url += "filter.php?c=" + param["category"];
    } else if (param["area"]) {
        url += "filter.php?a=" + param["area"];
    }
        var req = unirest("GET", url);
    console.log(req);
    req.send("{}");
    req.end(function (res) {
        if (res.error) {
            console.log(res.error);
            response.setHeader('Content-Type', 'application/json');
            response.send(JSON.stringify({
                "speech": "Error. Can you try it again ? ",
                "posts": []
            }));
        } else if (res.body.meals.length > 0) {
            let meal = res.body.meals;
            let output = Array(meal.length);
            let text = "";
            if(param["category"]) {
                text +="Voici les recettes correspondantes : \n"
                let output = Array(meal.length);
                for (let i = 0; i < meal.length; i++) {
                    output[i] = {
                        "type": "card",
                        "title": meal[i].strMeal,
                        "image": meal[i].strMealThumb,
                        "buttons": [{
                            "type": "button",
                            "text": "Voir en détail",
                            "value": meal[i].idMeal
                        }]
                    };
                }
            }else{
                text += "Voici une recette que tu devrais tester !\n"
                    output[0] = {
                        "type": "card",
                        "title": meal[0].stMeal,
                        "image": meal[0].strMealThumb,
                        "buttons": [{
                            "type": "button",
                            "text": "Voir en détail",
                            "value": meal[0].idMeal
                        }]
                    };    
            }
            console.log(output);
            response.setHeader('Content-Type', 'application/json');
            response.send(JSON.stringify({
                "speech": text,
                "posts": output
            }));
        }
    });
});


server.listen(port, function () {
    console.log("Server is up and running...");
});