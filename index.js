// dependencies
'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const csv = require('csvtojson')
var unirest = require("unirest");
var moment = require("moment");
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const { JWT } = require('google-auth-library');

const COLUMN_NAME = "nom";
const SWIMING_POOL_NAME = "piscineName";
const LIBRARY_NAME = "BibliothequeName";
const MUSEUM_NAME = "museumName";
const EVENT_CHRISTMAS = "evenementNoel";
const LIBRARY = "bibliotheque";
const SWIMING_POOL = "piscine";
const PATINOIRE = "patinoire";
const PLACES = "Lieus";
const MUSEUM = "musee";
const ERROR = "Error";
const INTENT_LIST = "Lieux_liste";
const INTENT_MORE_INFO = "Lieux_details";
const INTENT_PRICING = "Lieux_tarifs";
const CSV_MORE_PRICING = "lienTarif";
const INTENT_SCHEDULE = "Lieux_horaires";
const INTENT_CONTACT = "Lieux_contact";
const INTENT_WEBSITE = "Lieux_website";
const INTENT_LOCATION = "Lieux_adresse";
const INTENT_EQUIPEMENT = "Lieux_equipement";
const CSV_PICTURE = "lienImage";
const calPath = path.join(__dirname, 'calendarId.json');
const oauthPath = path.join(__dirname, 'oauthService.json');
const TIME = "ggwg/date-time";
const DURATION = "ggwg/duration";
if (fs.existsSync(calPath)) {
    calFile = require(calPath);
}
if (fs.existsSync(oauthPath)) {
    oauthFile = require(oauthPath);
}
const client = new JWT({
    email: oauthFile.client_email,
    key: oauthFile.private_key,
    scopes: ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/cloud-platform'],
})
const calendar = google.calendar({ version: 'v3', auth: client });


var port = process.env.PORT || 8080;


// create server and configure it.
const server = express();
server.use(bodyParser.json());

server.post('/reservation', async function (request, response) {
    var roomIndex;
    var param = request.body.intent.inputs; // entities
    var intent = request.body.intent.name;
    var text = "Le creneau demandé est disponible, voulez vous confirmer la reservation ?"; // response OK
    var textOk = "Reservation effectué!";
    var textErr = "Le creneau demandé n'est pas disponible"; // response KO
    var richText; // rich message
    response.setHeader('Content-Type', 'application/json');
    // récupérer intent et entities
    console.log("intent : " + intent);
    Object.keys(param).forEach(element => {
        console.log(element + " - " + param[element]);
    });
    //si réservation 
    //Verifier que la salle existe
    for (var cal of calFile) {
        if (cal.name.indexOf(param["salle"]) + 1) {
            console.log(cal.name);
            roomIndex = calFile.indexOf(cal);
        }
    }
    console.log(roomIndex);
    //Verifier que le creneau soit libre
    if(intent == "reservation.salle") {
        const free = await getEvent(param[TIME], param[DURATION], roomIndex);
        if (free) {
            richText = [{
                "type": "button",
                "text": "Confirmer",
                "value": "confirmer la reservation"
            },
            {
                "type": "button",
                "text": "Annuler",
                "value": "annuler la reservation"
            }];
            response.send(JSON.stringify({
                "speech": text,
                "posts": [richText]
            }));
        } else {
            richText = [{
                "type": "button",
                "text": "Autre salle",
                "value": "autre salle"
            },
            {
                "type": "button",
                "text": "Autre creneau",
                "value": "autre creneau"
            }];
            response.send(JSON.stringify({
                "speech": textErr,
                "posts": [richText]
            }));
        }
    }else{
        await setEvent(param[TIME], param[DURATION], roomIndex);
        response.send(JSON.stringify({
            "speech": textOk,
            "posts": []
        }));
    }

});

async function init() {
    try {

        calendar.calendarList.list(function (err, resp) {
            for (var item of resp.data.items) {
                console.log(item.summary + " " + item.id);
            }
        })
    } catch (error) {
        console.log(error);
    }
}

function getEvent(time, duration, roomIdx) {
    var free = true;
    var start = moment(time);
    var end = moment(start);
    end.add(duration.hours, 'hours');
    var timeMIN = moment(start);
    timeMIN.subtract(timeMIN.hour(), 'hours');
    timeMAX = moment(timeMIN);
    timeMAX.add(23, 'hours');
    return new Promise(function (resolve, reject) {
        calendar.events.list({
            calendarId: calFile[roomIdx].id,
            timeMax: timeMAX.toISOString(),
            timeMin: timeMIN.toISOString(),
            //maxResults: 10,
            singleEvents: true,
            orderBy: 'startTime',
        }, (err, res) => {
            var i = 0;
            for (var item of res.data.items) {
                i++;
                var tStart = moment(item.start.dateTime);
                var tEnd = moment(item.end.dateTime);
                var duration = tEnd.hour() - tStart.hour();
                console.log(item.id + " - " + item.summary + " le " + (tStart.month() + 1) + "\\" + tStart.date() + " à " + tStart.hour() + "h pendant " + duration + "h");
                free &= (tEnd.isBefore(start) || tStart.isAfter(end));
                console.log(tEnd.isBefore(start));
                console.log(tStart.isAfter(end));
                console.log("start " + start.toISOString());
                console.log("end " + end.toISOString());
                console.log("tstart " + tStart.toISOString());
                console.log("tend " + tEnd.toISOString());
            }
            console.log("found " + i + " results");
            console.log(free ? "libre" : "occupe");
            resolve(free);
        })
    });
}

async function setEvent(time, duration, idx) {
    const end = moment(time);
    end.add(duration.hours, "hours");
    return new Promise(function (resolve, reject) {
        calendar.events.insert({
            calendarId: calFile[idx].id,
            resource: {
                start: { dateTime: moment(time).toISOString() },
                end: { dateTime: end.toISOString() }
            }
        }, (err, res) => {
            resolve();
        });
    });
}

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
    console.log(request.body);
    console.log("-----------------------------------");
    console.log("List of your entities : ");
    Object.keys(param).forEach(element => { console.log(element + " - " + param[element]) });
    let date = moment(param["ggwg/datetime"]).format("D/M");
    let text = "Nous vous confirmons l'enregistrement de votre réservation ";
    /*    + (param["typeResa"] == "Restaurant" ? "d'une table pour "
            : param["typeResa"] == "Hotel" ? "d'une chambre pour "
                : param["typeResa"] == "Visio" ? "d'une salle de visio pour "
                    : "pour ")
        + param["ggwg/number"] + " personnes pour le " + date
        + (param["ggwg/duration"] ? "pendant " + param["ggwg/duration"] : "");*/
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
                : "concernant la connection à un service " : ".");

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
    var text = "";
    var output = new Array();
    var intent = request.body.intent && request.body.intent.name;
    var param = request.body.intent && request.body.intent.inputs; 

    var ok = param[SWIMING_POOL_NAME] || param[LIBRARY_NAME] || param[PLACES] == LIBRARY || param[PLACES] == SWIMING_POOL ? true : false;
    
    var name = (param[LIBRARY_NAME] || param[PLACES] == LIBRARY ? LIBRARY
        : param[MUSEUM_NAME] || param[PLACES] == MUSEUM ? MUSEUM
            : param[SWIMING_POOL_NAME] || param[PLACES] == SWIMING_POOL ? SWIMING_POOL 
            : param[PLACES] == PATINOIRE ? PATINOIRE
            : param[EVENT_CHRISTMAS] ? EVENT_CHRISTMAS : ERROR);
    var col = "";
    var temp = "";
    var row = param[LIBRARY_NAME] || param[MUSEUM_NAME] || param[SWIMING_POOL_NAME] || param[EVENT_CHRISTMAS] || "all";
    intent = intent.replace('.', '_');
    console.log("Intent found : " + intent);
    console.log("List of your entities : ");
    param && Object.keys(param).forEach(element => { console.log(element + " - " + param[element]) });
    console.log("You search : " + row);
    if (intent == INTENT_LIST || (intent == INTENT_MORE_INFO && row == "all")) {
        csvName = name;
        if (name == ERROR) {
            text = "Je n'ai pas réussi à bien traiter la demande."
            response.setHeader('Content-Type', 'application/json');
            response.send(JSON.stringify({
                "speech": text,
                "posts": []
            }));
        } else {
            col = param[EVENT_CHRISTMAS] ? "id" : COLUMN_NAME;
            csv({
                noheader: false,
                delimiter: [";"]
            })
                .fromFile(csvName + ".csv")
                .then((jsonObj) => {
                    text = "Voici la liste des " + csvName + "s :";
                    jsonObj.forEach(function (elt) {
                        console.log(elt[col]);
                        output.push(
                            {
                                "type": "card",
                                "title": elt[COLUMN_NAME],
                                "image": elt[CSV_PICTURE],
                                "buttons": [{
                                    "type": "button",
                                    "text": "Horaires",
                                    "value": "Horaires " + elt[col]
                                },
                                {
                                    "type": "button",
                                    "text": "Adresse",
                                    "value": "Adresse " + elt[col]
                                },
                                {
                                    "type": "button",
                                    "text": "Plus d'infos",
                                    "value": "Plus d'infos " + elt[col]
                                }]
                            }
                        )
                    })
                    console.log("-------------- output ---------------");
                    console.log(output);
                    response.setHeader('Content-Type', 'application/json');
                    response.send(JSON.stringify({
                        "speech": text,
                        "posts": output
                    }));
                })
        }
    } else if (intent == INTENT_MORE_INFO) {
        if (name == ERROR) {
            text = "Je n'ai pas réussi à bien traiter la demande."
            response.setHeader('Content-Type', 'application/json');
            response.send(JSON.stringify({
                "speech": text,
                "posts": []
            }));
        } else {
            text = "Voici les infos :";
            col = param[EVENT_CHRISTMAS] ? "id" : COLUMN_NAME;
            csvName = name + ".csv";
            csv({
                noheader: false,
                delimiter: [";"]
            })
                .fromFile(csvName)
                .then((jsonObj) => {
                    console.log(jsonObj);
                    jsonObj.forEach(function (elt) {
                        if (elt[COLUMN_NAME] == row) {
                            output.push({
                                "type": "card",
                                "title": "Horaires",
                                "image": elt[CSV_PICTURE],
                                "text": elt[INTENT_SCHEDULE],
                            })
                            output.push({
                                "type": "card",
                                "title": "Adresse",
                                "image": elt[CSV_PICTURE],
                                "text": elt[INTENT_LOCATION],
                            })
                            if (ok) {
                                output.push({
                                    "type": "card",
                                    "title": "Tarifs",
                                    "image": elt[CSV_PICTURE],
                                    "text": elt[INTENT_PRICING],
                                    "buttons": [{
                                        "type": "link",
                                        "text": "plus d'infos tarifs",
                                        "value": elt[CSV_MORE_PRICING]
                                    }]
                                })
                            } else {
                                output.push({
                                    "type": "card",
                                    "title": "Tarifs",
                                    "image": elt[CSV_PICTURE],
                                    "text": elt[INTENT_PRICING],
                                })
                            }
                            output.push({
                                "type": "card",
                                "title": "Contact",
                                "image": elt[CSV_PICTURE],
                                "text": elt[INTENT_CONTACT],
                            })
                            output.push({
                                "type": "card",
                                "title": "Site internet",
                                "image": elt[CSV_PICTURE],
                                "buttons": [{
                                    "type": "link",
                                    "text": "Accéder au site",
                                    "value": elt[INTENT_WEBSITE]
                                }]
                            })
                        } else if (row == "all") {
                            output.push({

                            })
                        }
                    })
                    console.log("-------------- output ---------------");
                    console.log(output);
                    response.setHeader('Content-Type', 'application/json');
                    response.send(JSON.stringify({
                        "speech": text,
                        "posts": output
                    }));
                })
        }
    } else {
        console.log("name " + name);
        if (name == ERROR) {
            console.log("name " + name);
            text = "Je n'ai pas réussi à bien traiter la demande."
            response.setHeader('Content-Type', 'application/json');
            response.send(JSON.stringify({
                "speech": text,
                "posts": []
            }));
        } else {
            col = intent;
            temp = param[EVENT_CHRISTMAS] ? "id" : COLUMN_NAME;
            row = param[LIBRARY_NAME] || param[MUSEUM_NAME] || param[SWIMING_POOL_NAME] || param[EVENT_CHRISTMAS] || "all";
            csvName = name + ".csv";
            csv({
                noheader: false,
                delimiter: [";"]
            })
                .fromFile(csvName)
                .then((jsonObj) => {
                    console.log(jsonObj);
                    jsonObj.forEach(function (elt) {
                        if (elt[temp] == row || row == "all") {
                            if (col == INTENT_PRICING) {
                                text = "Voici les tarifs :"
                                if (ok) {
                                    output.push({
                                        "type": "card",
                                        "title": row == "all" ? elt[COLUMN_NAME] : "Tarifs",
                                        "image": elt[CSV_PICTURE],
                                        "text": elt[INTENT_PRICING],
                                        "buttons": [{
                                            "type": "link",
                                            "text": "plus d'infos tarifs",
                                            "value": elt[CSV_MORE_PRICING]
                                        }]
                                    })
                                } else {
                                    output.push({
                                        "type": "card",
                                        "title": row == "all" ? elt[COLUMN_NAME] : "Tarifs",
                                        "image": elt[CSV_PICTURE],
                                        "text": elt[INTENT_PRICING]
                                    })
                                }
                            } else {
                                text = "Voici les informations :"
                                output.push({
                                    "type": "card",
                                    "title": row == "all" ? elt[COLUMN_NAME] : col.replace("Lieux_", ""),
                                    "image": elt[CSV_PICTURE],
                                    "text": elt[col]
                                })
                            }
                        }
                    })
                    console.log("-------------- output ---------------");
                    console.log(output);
                    response.setHeader('Content-Type', 'application/json');
                    response.send(JSON.stringify({
                        "speech": text,
                        "posts": output
                    }));
                })
        }
    }

})


function buildCard(type = "card", title, picture, text, ...buttons) {
    var btn = new Array();
    buttons.forEach(function (element) {
            btn.push({
                "type": element["type"],
                "text": element["text"],
                "value": element["value"]
            })
    })
    var card = {
        "type": type,
        "title": title,
        "image": picture,
        "text": text,
        "buttons": btn
    }
    return card;
}




server.listen(port, function () {
    console.log("Server is up and running...");
});
