var express = require('express'),
    http = require('http');
//make sure you keep this order
var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);

var bodyParser = require('body-parser');
const format = require('pg-format');
const pool = require('./database.js');
var account = require('./database/useraccount.js');
var gameLobby = require('./database/gamelobby.js');
var game = require('./database/game.js');

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

app.use(bodyParser.json());

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function (req, res) {
    res.render("./pages/login.ejs");
});

/*app.get('/', function (req, res) {
    res.render("./pages/login.ejs");
});*/

server.listen(3000, function () {
    console.log('socket.io listening on *:3000');
});

io.on('connection', function (socket) {
    console.log('a user connected');
    socket.on('disconnect', function () {
        console.log('user disconnected');
    });
});

app.get('/gameLobby', function (req, res) {
    pool.connect(function (err, client, done) {
        if (err) throw new Error(err);
        if (req.query.userId != null && req.query.token != null) {
            var valid = null;
            account.verify(req.query.userId, req.query.token, client, function (error, valid) {
                if (valid == req.query.userId) {
                    var games = null;
                    gameLobby.getListOfGames(client, games, function (error, games) {
                        res.render("./pages/gameLobby.ejs", {
                            results: games
                        });
                    });
                } else {
                    res.render("./pages/login.ejs");
                }
            });
        } else {
            res.render("./pages/login.ejs");
        }
    });
});

app.get('/loadGame', function (req, res) {
    pool.connect(function (err, client, done) {
        if (err) throw new Error(err);
        var gameId = req.query.gameId;
        if (req.query.userId != null && req.query.token != null && gameId != null) {
            var valid = null;
            account.verify(req.query.userId, req.query.token, client, function (error, valid) {
                if (valid == req.query.userId) {
                    res.render("./pages/game.ejs", {});
                } else {
                    res.render("./pages/login.ejs");
                }
            });
        } else {
            res.render("./pages/login.ejs");
        }
    });
});

app.post('/createAccount', function (req, res) {
    pool.connect(function (err, client, done) {
        if (err) throw new Error(err);
        console.log(req.body);
        if (req.body.username != null && req.body.password != null) {
            account.createAccount(req.body.username, req.body.password, client, res);
        } else {
            res.json({
                success: false
            });
        }
    });
});

app.post('/login', function (req, res) {
    pool.connect(function (err, client, done) {
        if (err) throw new Error(err);
        console.log(req.body);
        if (req.body.username != null && req.body.password != null) {
            account.login(req.body.username, req.body.password, client, res, io);
        } else {
            res.json({
                success: false
            });
        }
    });
});

app.post('/createGame', function (req, res) {
    pool.connect(function (err, client, done) {
        if (err) throw new Error(err);
        if (req.body.userId != null && req.body.token != null && req.body.title != null && req.body.playerCount != null) {
            var valid = null;
            account.verify(req.body.userId, req.body.token, client, function (error, valid) {
                if (valid != null) {
                    gameLobby.createGame(req.body.title, req.body.playerCount, valid, client, res);
                } else {
                    res.json({
                        success: false
                    });
                }
            });
        } else {
            res.json({
                success: false
            });
        }
    });
});

app.post('/joinGame', function (req, res) {
    pool.connect(function (err, client, done) {
        if (err) throw new Error(err);
        if (req.body.userId != null && req.body.token != null && req.body.gameId != null) {
            var valid = null;
            account.verify(req.body.userId, req.body.token, client, function (error, valid) {
                if (valid != null) {
                    gameLobby.joinGame(req.body.gameId, valid, client, res);
                } else {
                    res.json({
                        success: false
                    });
                }
            });
        } else {
            res.json({
                success: false
            });
        }
    });
});

app.get('/getGameSlot', function (req, res) {
    pool.connect(function (err, client, done) {
        if (err) throw new Error(err);
        var gameId = req.query.gameId;
        var playerId = req.query.playerId;
        console.log("PlayerId:" + playerId);
        if (req.query.userId != null && req.query.token != null && gameId != null && playerId != null) {
            var valid = null;
            account.verify(req.query.userId, req.query.token, client, function (error, valid) {
                if (valid == req.query.userId) {
                    var players = null;
                    game.getPlayers(client, gameId, function (error, players) {
                        res.render("./pages/gameSlot.ejs", {
                            results: players,
                            id: playerId
                        });
                    });
                } else {
                    res.render("./pages/login.ejs");
                }
            });
        } else {
            res.render("./pages/login.ejs");
        }
    });
});

app.delete('/leaveGame', function (req, res) {
    pool.connect(function (err, client, done) {
        if (err) throw new Error(err);
        if (req.body.userId != null && req.body.token != null && req.body.playerId != null) {
            var valid = null;
            account.verify(req.body.userId, req.body.token, client, function (error, valid) {
                if (valid != null) {
                    gameLobby.leaveGame(req.body.playerId, client, res);
                } else {
                    res.json({
                        success: false
                    });
                }
            });
        } else {
            res.json({
                success: false
            });
        }
    });
});

app.delete('/deleteGame', function (req, res) {
    pool.connect(function (err, client, done) {
        if (err) throw new Error(err);
        if (req.body.userId != null && req.body.token != null && req.body.gameId != null) {
            var valid = null;
            account.verify(req.body.userId, req.body.token, client, function (error, valid) {
                if (valid != null) {
                    gameLobby.deleteGame(req.body.gameId, client, res);
                } else {
                    res.json({
                        success: false
                    });
                }
            });
        } else {
            res.json({
                success: false
            });
        }
    });
});

app.post('/startGame', function (req, res) {
    pool.connect(function (err, client, done) {
        if (err) throw new Error(err);
        if (req.body.userId != null && req.body.token != null && req.body.gameId != null) {
            var valid = null;
            account.verify(req.body.userId, req.body.token, client, function (error, valid) {
                if (valid != null) {
                    gameLobby.startGame(req.body.gameId, client, res);
                } else {
                    res.json({
                        success: false
                    });
                }
            });
        } else {
            res.json({
                success: false
            });
        }
    });
});

app.post('/getGames', function (req, res) {
    pool.connect(function (err, client, done) {
        if (err) throw new Error(err);
        if (req.body.userId != null && req.body.token != null) {
            var valid = null;
            account.verify(req.body.userId, req.body.token, client, function (error, valid) {
                if (valid == req.body.userId) {
                    var games = null;
                    gameLobby.getListOfGames(client, games, function (error, games) {
                        res.render("./partials/games.ejs", {
                            results: games
                        });
                    });
                } else {
                    res.render("./pages/login.ejs");
                }
            });
        } else {
            res.render("./pages/login.ejs");
        }
    });
});

app.post('/getPlayers', function (req, res) {
    pool.connect(function (err, client, done) {
        if (err) throw new Error(err);
        var gameId = req.body.gameId;
        console.log(req.body);
        if (req.body.userId != null && req.body.token != null && gameId != null) {
            var valid = null;
            account.verify(req.body.userId, req.body.token, client, function (error, valid) {
                if (valid == req.body.userId) {
                    var players = null;
                    game.getPlayers(client, gameId, function (error, players) {
                        console.log(players);
                        res.render("./partials/players.ejs", {
                            results: players
                        });
                    });
                } else {
                    console.log("Invalid Login");
                    res.render("./pages/login.ejs");
                }
            });
        } else {
            console.log("Invalid REQ");
            res.render("./pages/login.ejs");
        }
    });
});

app.post('/drawCard', function (req, res) {
    pool.connect(function (err, client, done) {
        if (err) throw new Error(err);
        if (req.body.userId != null && req.body.token != null && req.body.gameId != null) {
            var valid = null;
            account.verify(req.body.userId, req.body.token, client, function (error, valid) {
                if (valid != null) {
                    game.drawCard(valid, req.body.gameId, client, res);
                } else {
                    res.json({
                        success: false
                    });
                }
            });
        } else {
            res.json({
                success: false
            });
        }
    });
});

app.post('/endTurn', function (req, res) {
    pool.connect(function (err, client, done) {
        if (err) throw new Error(err);
        if (req.body.userId != null && req.body.token != null && req.body.gameId != null && req.body.teamId != null) {
            var valid = null;
            account.verify(req.body.userId, req.body.token, client, function (error, valid) {
                if (valid != null) {
                    game.endTurn(valid, req.body.gameId, req.body.teamId, client, res);
                } else {
                    res.json({
                        success: false
                    });
                }
            });
        } else {
            res.json({
                success: false
            });
        }
    });
});

app.post('/getDiscardPile', function (req, res) {
    pool.connect(function (err, client, done) {
        if (err) throw new Error(err);
        if (req.body.userId != null && req.body.token != null && req.body.gameId != null) {
            var valid = null;
            account.verify(req.body.userId, req.body.token, client, function (error, valid) {
                if (valid != null) {
                    game.getDiscardPile(req.body.gameId, client, res);
                } else {
                    res.json({
                        success: false
                    });
                }
            });
        } else {
            res.json({
                success: false
            });
        }
    });
});

app.post('/getHand', function (req, res) {
    pool.connect(function (err, client, done) {
        if (err) throw new Error(err);
        if (req.body.userId != null && req.body.token != null && req.body.gameId != null) {
            var valid = null;
            account.verify(req.body.userId, req.body.token, client, function (error, valid) {
                if (valid != null) {
                    game.getHand(valid, req.body.gameId, client, res);
                } else {
                    res.json({
                        success: false
                    });
                }
            });
        } else {
            res.json({
                success: false
            });
        }
    });
});

app.post('/getPlayerTurn', function (req, res) {
    pool.connect(function (err, client, done) {
        if (err) throw new Error(err);
        if (req.body.userId != null && req.body.token != null && req.body.gameId != null) {
            var valid = null;
            account.verify(req.body.userId, req.body.token, client, function (error, valid) {
                if (valid != null) {
                    game.getPlayerTurn(req.body.gameId, client, res);
                } else {
                    res.json({
                        success: false
                    });
                }
            });
        } else {
            res.json({
                success: false
            });
        }
    });
});

app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});