// dependencies
'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const csv = require('csvtojson')
var unirest = require("unirest");
var moment = require("moment");


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
    } else if (param["Cocktail name"]) {
        url += "/search.php?s=" + param["Cocktail name"];
    } else if (param["ggwg/number"]) {
        url += "/lookup.php?i=" + param["ggwg/number"];
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
            if (param["alcohol"] || param["Cocktail name"]) {
                text += "Voici les cocktails correspondants : \n"
            } else if (param["ggwg/number"]) {
                text += "Voici les détail du cocktail :\n"
            } else {
                text += "Voici un cocktail que tu devrais tester !\n"
            }
            if (param["ggwg/number"]) {
                output[0] = {
                    "type": "card",
                    "title": drink[0].strDrink,
                    "image": drink[0].strDrinkThumb,
                    "text": drink[0].strInstructions,
                }
                for (let i = 1; i < 20; i++) {
                    console.log(drink[0]["strIngredient" + i]);
                    if (drink[0]["strIngredient" + i]) {
                        output[i] = {
                            "type": "card",
                            "title": drink[0]["strIngredient" + i],
                            "text": (drink[0]["strMeasure" + i] == "\n" ? "-" : drink[0]["strMeasure" + i])
                        }
                    }
                }
            } else {
                for (let i = 0; i < drink.length; i++) {
                    output[i] = {
                        "type": "card",
                        "title": drink[i].strDrink,
                        "image": drink[i].strDrinkThumb,
                        "buttons": [{
                            "type": "button",
                            "text": "Voir en détail",
                            "value": "Detail " + drink[i].idDrink
                        }]
                    };
                }
            }
            text = param["alcohol"];
            console.log(output[0]);
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
    if (param["Category"]) {
        url += "filter.php?c=" + param["Category"];
    } else if (param["Area"]) {
        url += "filter.php?a=" + param["Area"];
    } else if (param["Random meal"]) {
        url += "random.php";
    } else if (param["ggwg/number"]) {
        url += "lookup.php?i=" + param["ggwg/number"];
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
            if (param["Category"] || param["Area"]) {
                text += "Voici les recettes correspondantes : \n";
            } else if (param["ggwg/number"]) {
                text += "Voici le détail de la recette : \n";
            } else {
                text += "Voici une recette que tu devrais tester !\n";
            }
            if (param["ggwg/number"]) {
                output[0] = {
                    "type": "card",
                    "title": meal[0].strMeal,
                    "image": meal[0].strMealThumb,
                    "text": meal[0].strInstructions,
                }
                for (let i = 1; i < 20; i++) {
                    console.log(meal[0]["strIngredient" + i]);
                    if (meal[0]["strIngredient" + i]) {
                        output[i] = {
                            "type": "card",
                            "title": meal[0]["strIngredient" + i],
                            "text": meal[0]["strMeasure" + i]
                        }
                    }
                }
            } else {
                for (let i = 0; i < meal.length; i++) {
                    output[i] = {
                        "type": "card",
                        "title": meal[i].strMeal,
                        "image": meal[i].strMealThumb,
                        "buttons": [{
                            "type": "button",
                            "text": "Voir en détail",
                            "value": "Detail " + meal[i].idMeal
                        }]
                    };
                }
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

server.post('/movie', function (request, response) {
    var param = request.body.intent.inputs;
    console.log("List of your entities : ");
    Object.keys(param).forEach(element => { console.log(element + " - " + param[element]) });
    var url = "https://api.themoviedb.org/discover/movie?"
    if (param["Genre"]) {
        url += "with_genre=" + param["Genre"];
    } else if (param["Actors"]) {
        url += "with_cast=" + param["Actors"];
    } else if (param["origine"]) {
        url += "region";
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
            let text = "Voici les films correspondants : ";
            for (let i = 0; i < drink.length; i++) {
                output[i] = {
                    "type": "card",
                    "title": drink[i].strDrink,
                    "image": drink[i].strDrinkThumb,
                    "buttons": [{
                        "type": "button",
                        "text": "Voir en détail",
                        "value": "Detail " + drink[i].idDrink
                    }]
                };
            }
            response.setHeader('Content-Type', 'application/json');
            response.send(JSON.stringify({
                "speech": text,
                "posts": []
            }));
        }
    })
});

server.post('/reservation', function (request, response) {
    var param = request.body.intent.inputs;
    console.log("List of your entities : ");
    Object.keys(param).forEach(element => { console.log(element + " - " + param[element]) });
    let date = moment(param["ggwg/datetime"]).format("D/M");
    let text = "Nous vous confirmons l'enregistrement de votre réservation "
        + (param["typeResa"] == "Restaurant" ? "d'une table pour "
            : param["typeResa"] == "Hotel" ? "d'une chambre pour "
                : param["typeResa"] == "Visio" ? "d'une salle de visio pour "
                    : "pour ")
        + param["ggwg/number"] + " personnes pour le " + date
        + (param["ggwg/duration"] ? "pendant " + param["ggwg/duration"] : "");
    console.log(date);
    response.setHeader('Content-Type', 'application/json');
    response.send(JSON.stringify({
        "speech": text,
        "posts": []
    }));
})

server.post('/support', function (request, response) {
    var param = request.body.intent.inputs;
    console.log("List of your entities : ");
    Object.keys(param).forEach(element => { console.log(element + " - " + param[element]) });
    let text = "Nous vous confirmons l'enregistrement de votre problème "
        + (param["typeMateriel"] ? param["typeMateriel"] != "Ordinateur" ? "concernant un périphérique "
            : "concernant votre ordinateur "
            : param["typeService"] ? param["typeService"] != "Connection" ? "concernant l'accés à un serivce "
                : "concernant la connection à un serivce " : ".");

    response.setHeader('Content-Type', 'application/json');
    response.send(JSON.stringify({
        "speech": text,
        "posts": []
    }));
})

server.post('/addEntityMovie', function (request, response) {
    var url = "https://api.themoviedb.org/3/genre/movie/list?api_key=749c70b3747805b5581f8d03f0479065";
    var req = unirest("GET", url);
    console.log(req);
    req.send("{}");
    req.end(function (res) {
        if (res.error) {
            console.log(res.error);
        } else if (res.body.genres.length > 0) {
            let genre = res.body.genres;
            let output = Array(genre.length);
            console.log(genre[0]);
            for (let i = 0; i < genre.length; i++) {
                output[i] = {
                    "value": genre[i].id,
                    "synonyms": [
                        genre[i].name
                    ]
                };
                console.log(output[i]);
            }
            var url2 = "https://www.gogowego.com/api/v1/Entities";
            var resp = unirest("POST", url2);
            resp.headers({
                'Authorization': 'Bearer b897fe23-c8f9-4d98-ba28-fef92e99b96c',
                'Content-type': 'application/json'
            })
            resp.send(JSON.stringify([{
                "name": "testGenre",
                "automatically_extensible": false,
                "use_synonyms": false,
                "data": output
            }]));
            console.log(resp);
            response.setHeader('Content-type', 'application/json');
            response.send(JSON.stringify({
                "speech": "Ca devrait avoir marché",
                "posts": []
            }))
        }
    })
})

server.post('/getNews', function (request, response) {
    console.log(request.body);
    console.log(request.body.intent.inputs);
    var url = "https://newsapi.org/v2/"
        + (request.body.intent.inputs['top-headline'] != ""
            || request.body.intent.inputs['source'] == "" ? "top-headlines" : "everything")
        + "?apiKey=dc7a99af9cc6432e9791af434a6f1328";
    var req = unirest("GET", url);
    req.query({
        "pageSize": "4",
        "page": request.body.intent.inputs['page'] || "1",
    });
    (request.body.intent.inputs['top-headline'] != "" || request.body.intent.inputs['source'] == "" ?
        request.body.intent.inputs['category'] ?
            req.query({
                "category": request.body.intent.inputs['category'],
                "country": request.body.intent.inputs['language'] || "fr"
            })
            :
            req.query({
                "country": request.body.intent.inputs['language'] || "fr"
            })
        :
        req.query({
            "sources": request.body.intent.inputs['source'],
            "language": request.body.intent.inputs['language'] || "fr"
        }));
    console.log(req);
    req.send("{}");
    req.end(function (res) {
        if (res.error) {
            console.log(res.error);
            response.setHeader('Content-Type', 'application/json');
            response.send(JSON.stringify({
                "speech": "Error. Can you try it again ? ",
                "displayText": "Error. Can you try it again ? "
            }));
        } else if (res.body.totalResults > 0) {
            let article = res.body.articles;
            let text = "Voici les news";
            if (request.body.intent.inputs['source'] != "" && request.body.intent.inputs['source'] != undefined) {
                text += " de " + request.body.intent.inputs['source'];
            } else if (request.body.intent.inputs['category'] != "") {
                text += " correspondates"
            }
            text += " :\n";
            let output = Array(article.length);
            for (let i = 0; i < article.length; i++) {
                output[i] = {
                    "type": "card",
                    "title": article[i].title,
                    "image": article[i].urlToImage,
                    "subtitle": article[i].description,
                    "buttons": [{
                        "type": "link",
                        "text": "Voir en détail",
                        "value": article[i].url
                    }]
                };
            }

            response.setHeader('Content-Type', 'application/json');
            response.send(JSON.stringify({
                "speech": text,
                "posts": output
            }));
        }
    });
});

server.post('/SE', function (request, response) {
    var csvName = "";
    var col = "";
    var row = "";
    var text = "";
    var output = new Array();
    var intent = request.body.intent.name;
    var param = request.body.intent.inputs;
    console.log("List of your entities : ");
    Object.keys(param).forEach(element => { console.log(element + " - " + param[element]) });
    if (intent == "liste") {
        csvName = param["Lieus"];
        col = "nom";
        csv({
            noheader: false,
            delimiter: [";"]
        })
            .fromFile(csvName + ".csv")
            .then((jsonObj) => {
                text = "Voici la liste des " + csvName + "s :";
                jsonObj.forEach(function (elt) {
                    output.push(
                        {
                            "type": "card",
                            "title": elt[col],
                            "image": elt["lienImage"],
                            "buttons": [{
                                "type": "button",
                                "text": "Horaires",
                                "value": "horaires " + elt[col]
                            },
                            {
                                "type": "button",
                                "text": "Tarifs",
                                "value": "tarifs " + elt[col]
                            },
                            {
                                "type": "button",
                                "text": "Plus d'info",
                                "value": "plus d'info " + elt[col]
                            }]
                        }
                    )
                })
                response.setHeader('Content-Type', 'application/json');
                response.send(JSON.stringify({
                    "speech": text,
                    "posts": output
                }));
            })
    } else {
        var link = "";
        var name = (param["BibliothequeName"] ? "bibliotheque"
            : param["museumName"] ? "museum"
                : param["piscineName"] ? "piscine" : "Error");
        col = intent;
        row = param["BibliothequeName"] || param["museumName"] || param["piscineName"];
        csvName = name + ".csv";
        csv({
            noheader: false,
            delimiter: [";"]
        })
            .fromFile(csvName)
            .then((jsonObj) => {
                console.log(jsonObj);
                jsonObj.forEach(function (elt) {
                    if (elt["nom"] == row) {
                        if (col = "tarifs") {
                            text = "Voici les tarifs :"
                            output.push({
                                "type": "card",
                                "title": col,
                                "image": elt["lienImage"],
                                "text": elt[col],
                                "button": [{
                                    "type": "link",
                                    "text": "plus d'info tarifs",
                                    "value": elt["lienTarif"]
                                }]
                            })
                            output.push({
                                "type": "button",
                                "text": "Retour",
                                "value": "liste " + name
                            })
                        } else {
                            text = "Voici les informations :"
                            output.push({
                                "type": "card",
                                "title": col,
                                "image": elt["lienImage"],
                                "text": elt[col]
                            })
                        }
                    }
                })
                response.setHeader('Content-Type', 'application/json');
                response.send(JSON.stringify({
                    "speech": text,
                    "posts": output
                }));
            })
    }


})

server.listen(port, function () {
    console.log("Server is up and running...");
});