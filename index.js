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
            let text = "Voici les cocktails correspondants : \n"
            let output = Array(drink.length);
            for (let i = 0; i < article.length; i++) {
                output[i] = {
                    "type": "card",
                    "title": drink[i].strDrink,
                    "image": drink[i].strDrinkThumb,
                    "subtitle": drink[i].description,
                    "buttons": [{
                        "type": "button",
                        "text": "Voir en détail",
                        "value": drink[i].idDrink
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
        response.setHeader('Content-Type', 'application/json');
        response.send(JSON.stringify({
            "speech": "Hello from /example :)",
            "posts": []
        }));
    })


    server.listen(port, function () {
        console.log("Server is up and running...");
    });