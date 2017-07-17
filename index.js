const format = require('pg-format');
const pool = require('./database.js');
var account = require('./database/useraccount.js');
var gameLobby = require('./database/gamelobby.js');
var game = require('./database/game.js');

const express = require('express');
const socketIO = require('socket.io');
const path = require('path');
const bodyParser = require('body-parser');
const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html');

const app = express();
var server = app.listen(PORT, () => console.log(`Listening on ${ PORT }`));
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
  extended: true
}));

// Socket.IO
const io = socketIO.listen(server);

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(req, res) {
  res.render("./pages/login.ejs");
});

// This works since this data needs to be emited across the entire lobby
var gameLobbyNSP = io.of('/gameLobby');
gameLobbyNSP.on('connection', function(socket) {
  console.log('User joined Game Lobby');
  socket.on('disconnect', function() {
    // TODO: remove from any active games
    console.log('User left Game Lobby');
  });
  socket.on('logout', function(creds) {
    // TODO: remove from any active games
    console.log('User left Game Lobby');
    console.log(creds);
  });
});

// Would be better to use the game URL instead of global loading game namespace, maybe rooms?
var gameNSP = io.of('/singleGame');
gameNSP.on('connection', function(socket) {
  console.log('User in single Game NSP');
  socket.on('disconnect', function() {
    // TODO: remove from any active games
    console.log('User disconnected from single Game NSP');
  });
  socket.on('logout', function(creds) {
    // TODO: remove from any active games
    console.log('User disconnected from single Game NSP');
    //console.log(creds);
  });
});

// If valid user creds, load the gameLobby page, populate with the list of games to join
app.get('/gameLobby', function(req, res) {
  pool.connect(function(err, client, done) {
    if (err) throw new Error(err);
    if (req.query.userId != null && req.query.token != null) {
      var valid = null;
      account.verify(req.query.userId, req.query.token, client, function(error, valid) {
        if (valid == req.query.userId) {
          done(err);
          var games = null;
          gameLobby.getListOfGames(client, games, function(error, games) {
            res.render("./pages/gameLobby.ejs", {
              results: games
            });
          });
        } else {
          done(err);
          res.render("./pages/login.ejs");
        }
      });
    } else {
      done(err);
      res.render("./pages/login.ejs");
    }
  });
});

app.get('/loadGame', function(req, res) {
  pool.connect(function(err, client, done) {
    if (err) throw new Error(err);
    var gameId = req.query.gameId;
    if (req.query.userId != null && req.query.token != null && gameId != null) {
      var valid = null;
      account.verify(req.query.userId, req.query.token, client, function(error, valid) {
        if (valid == req.query.userId) {
          gameNSP.emit("gameStarted", {
            gameId: gameId
          });
          var players = null;
          game.getPlayers(client, gameId, function(error, players) {
            done(err);
            res.render("./pages/game.ejs", {
              results: players,
              gameId: gameId
            });
          });
          done(err);
        } else {
          done(err);
          res.render("./pages/login.ejs");
        }
      });
    } else {
      done(err);
      res.render("./pages/login.ejs");
    }
  });
});

// Allow for people to register for an account
app.post('/createAccount', function(req, res) {
  pool.connect(function(err, client, done) {
    if (err) throw new Error(err);
    //console.log(req.body);
    if (req.body.username != null && req.body.password != null) {
      done(err);
      account.createAccount(req.body.username, req.body.password, client, res);
    } else {
      done(err);
      res.json({
        success: false
      });
    }
  });
});

// Check against username and password, if match is found return userId, and session token
app.post('/login', function(req, res) {
  pool.connect(function(err, client, done) {
    if (err) throw new Error(err);
    //console.log(req.body);
    if (req.body.username != null && req.body.password != null) {
      done(err);
      account.login(req.body.username, req.body.password, client, res, io);
    } else {
      done(err);
      res.json({
        success: false
      });
    }
  });
});

// See if they are a valid user if so, let them add a game, emit to all users in game lobby
app.post('/createGame', function(req, res) {
  pool.connect(function(err, client, done) {
    if (err) throw new Error(err);
    if (req.body.userId != null && req.body.token != null && req.body.title != null && req.body.playerCount != null) {
      var valid = null;
      account.verify(req.body.userId, req.body.token, client, function(error, valid) {
        if (valid != null) {
          gameLobby.createGame(req.body.title, req.body.playerCount, valid, client, res, function(err, games) {
            gameLobbyNSP.emit('gameList', games);
          });
          done(err);
        } else {
          done(err);
          res.json({
            success: false
          });
        }
      });
    } else {
      done(err);
      res.json({
        success: false
      });
    }
  });
});

// See if they are a valid user if so, let them join a game, emit updated game list to all users in game lobby
app.post('/joinGame', function(req, res) {
  pool.connect(function(err, client, done) {
    if (err) throw new Error(err);
    if (req.body.userId != null && req.body.token != null && req.body.gameId != null) {
      var valid = null;
      account.verify(req.body.userId, req.body.token, client, function(error, valid) {
        if (valid != null) {
          gameLobby.joinGame(req.body.gameId, valid, client, res, function(err, games) {
            gameLobbyNSP.emit('gameList', games);
            var players = null;
            game.getPlayers(client, req.body.gameId, function(err, players) {
              gameNSP.emit('playerList', players);
            });
          });
          done(err);
        } else {
          done(err);
          res.json({
            success: false
          });
        }
      });
    } else {
      done(err);
      res.json({
        success: false
      });
    }
  });
});

app.get('/getGameSlot', function(req, res) {
  pool.connect(function(err, client, done) {
    if (err) throw new Error(err);
    var gameId = req.query.gameId;
    var playerId = req.query.playerId;
    //console.log("PlayerId:" + playerId);
    if (req.query.userId != null && req.query.token != null && gameId != null && playerId != null) {
      var valid = null;
      account.verify(req.query.userId, req.query.token, client, function(error, valid) {
        if (valid == req.query.userId) {
          var players = null;
          game.getPlayers(client, gameId, function(error, players) {
            done(err);
            res.render("./pages/gameSlot.ejs", {
              results: players,
              id: playerId,
              gameId: gameId,
              gameName: "Game Title"
            });
          });
        } else {
          done(err);
          res.render("./pages/login.ejs");
        }
      });
    } else {
      done(err);
      res.render("./pages/login.ejs");
    }
  });
});

// See if they are a valid user if so, let them leave a game, emit games to all users in game lobby, and emit game slots to users in given game
app.delete('/leaveGame', function(req, res) {
  pool.connect(function(err, client, done) {
    if (err) throw new Error(err);
    if (req.body.userId != null && req.body.token != null && req.body.playerId != null && req.body.gameId != null) {
      var valid = null;
      account.verify(req.body.userId, req.body.token, client, function(error, valid) {
        if (valid != null) {
          gameLobby.leaveGame(req.body.playerId, client, res, function(err, games) {
            gameLobbyNSP.emit('gameList', games);
            var players = null;
            //console.log("GameId:" + req.body.gameId);
            game.getPlayers(client, req.body.gameId, function(err, players) {
              gameNSP.emit('playerList', players);
            });
          });
          done(err);
        } else {
          done(err);
          res.json({
            success: false
          });
        }
      });
    } else {
      done(err);
      res.json({
        success: false
      });
    }
  });
});

app.delete('/deleteGame', function(req, res) {
  pool.connect(function(err, client, done) {
    if (err) throw new Error(err);
    if (req.body.userId != null && req.body.token != null && req.body.gameId != null) {
      var valid = null;
      account.verify(req.body.userId, req.body.token, client, function(error, valid) {
        if (valid != null) {
          gameLobby.deleteGame(req.body.gameId, client, res);
          done(err);
        } else {
          done(err);
          res.json({
            success: false
          });
        }
      });
    } else {
      done(err);
      res.json({
        success: false
      });
    }
  });
});

app.post('/startGame', function(req, res) {
  //console.log("Hit");
  pool.connect(function(err, client, done) {
    if (err) throw new Error(err);
    if (req.body.userId != null && req.body.token != null && req.body.gameId != null) {
      var valid = null;
      account.verify(req.body.userId, req.body.token, client, function(error, valid) {
        if (valid != null) {
          gameLobby.startGame(req.body.gameId, client, res);
          done(err);
        } else {
          done(err);
          res.json({
            success: false
          });
        }
      });
    } else {
      done(err);
      res.json({
        success: false
      });
    }
  });
});

app.post('/createHand', function(req, res) {
  pool.connect(function(err, client, done) {
    if (err) throw new Error(err);
    if (req.body.userId != null && req.body.token != null && req.body.gameId != null) {
      var valid = null;
      account.verify(req.body.userId, req.body.token, client, function(error, valid) {
        if (valid != null) {
          gameLobby.createHand(req.body.gameId, client, res);
          done(err);
        } else {
          done(err);
          res.json({
            success: false
          });
        }
      });
    } else {
      done(err);
      res.json({
        success: false
      });
    }
  });
});

// See if they are a valid user if so, let them manually refresh the games list
// it should stay updated with socket.io this is a fallback
app.post('/getGames', function(req, res) {
  pool.connect(function(err, client, done) {
    if (err) throw new Error(err);
    if (req.body.userId != null && req.body.token != null) {
      var valid = null;
      account.verify(req.body.userId, req.body.token, client, function(error, valid) {
        if (valid == req.body.userId) {
          var games = null;
          gameLobby.getListOfGames(client, games, function(error, games) {
            done(err);
            res.render("./partials/games.ejs", {
              results: games
            });
          });
        } else {
          done(err);
          res.render("./pages/login.ejs");
        }
      });
    } else {
      done(err);
      res.render("./pages/login.ejs");
    }
  });
});

app.post('/getPlayers', function(req, res) {
  pool.connect(function(err, client, done) {
    if (err) throw new Error(err);
    var gameId = req.body.gameId;
    //console.log(req.body);
    if (req.body.userId != null && req.body.token != null && gameId != null) {
      var valid = null;
      account.verify(req.body.userId, req.body.token, client, function(error, valid) {
        if (valid == req.body.userId) {
          var players = null;
          game.getPlayers(client, gameId, function(error, players) {
            //console.log(players);
            done(err);
            res.render("./partials/players.ejs", {
              results: players
            });
          });
        } else {
          done(err);
          //console.log("Invalid Login");
          res.render("./pages/login.ejs");
        }
      });
    } else {
      done(err);
      //console.log("Invalid REQ");
      res.render("./pages/login.ejs");
    }
  });
});

app.post('/drawCard', function(req, res) {
  pool.connect(function(err, client, done) {
    if (err) throw new Error(err);
    if (req.body.userId != null && req.body.token != null && req.body.gameId != null) {
      var valid = null;
      account.verify(req.body.userId, req.body.token, client, function(error, valid) {
        if (valid != null) {
          game.drawCard(valid, req.body.gameId, client, res);
          done(err);
        } else {
          done(err);
          res.json({
            success: false
          });
        }
      });
    } else {
      done(err);
      res.json({
        success: false
      });
    }
  });
});

app.post('/endTurn', function(req, res) {
  pool.connect(function(err, client, done) {
    if (err) throw new Error(err);
    if (req.body.userId != null && req.body.token != null && req.body.gameId != null) {
      var valid = null;
      account.verify(req.body.userId, req.body.token, client, function(error, valid) {
        if (valid != null) {
          game.endTurn(valid, req.body.gameId, client, res, function(err) {
            gameNSP.emit('playerTurn', err);
          });
          done(err);
        } else {
          done(err);
          res.json({
            success: false
          });
        }
      });
    } else {
      done(err);
      res.json({
        success: false
      });
    }
  });
});

app.post('/getDiscardPile', function(req, res) {
  pool.connect(function(err, client, done) {
    if (err) throw new Error(err);
    if (req.body.userId != null && req.body.token != null && req.body.gameId != null) {
      var valid = null;
      account.verify(req.body.userId, req.body.token, client, function(error, valid) {
        if (valid != null) {
          game.getDiscardPile(req.body.gameId, client, res);
          done(err);
        } else {
          done(err);
          res.json({
            success: false
          });
        }
      });
    } else {
      done(err);
      res.json({
        success: false
      });
    }
  });
});

app.post('/discardCard', function(req, res) {
  console.log("hit");
  pool.connect(function(err, client, done) {
    if (err) throw new Error(err);
    if (req.body.userId != null && req.body.token != null && req.body.gameId != null) {
      var valid = null;
      account.verify(req.body.userId, req.body.token, client, function(error, valid) {
        if (valid != null) {
          game.discardCard(client, req.body.gameId, req.body.card.id, req.body.card.deckId, req.body.userId, res, function(){
            done(err);
          });
        } else {
          done(err);
          res.json({
            success: false
          });
        }
      });
    } else {
      done(err);
      res.json({
        success: false
      });
    }
  });
});

app.post('/getHand', function(req, res) {
  pool.connect(function(err, client, done) {
    if (err) throw new Error(err);
    if (req.body.userId != null && req.body.token != null && req.body.gameId != null) {
      var valid = null;
      account.verify(req.body.userId, req.body.token, client, function(error, valid) {
        if (valid != null) {
          game.getHand(valid, req.body.gameId, client, res);
          done(err);
        } else {
          done(err);
          res.json({
            success: false
          });
        }
      });
    } else {
      done(err);
      res.json({
        success: false
      });
    }
  });
});

app.post('/getPlayerTurn', function(req, res) {
  pool.connect(function(err, client, done) {
    if (err) throw new Error(err);
    if (req.body.userId != null && req.body.token != null && req.body.gameId != null) {
      var valid = null;
      account.verify(req.body.userId, req.body.token, client, function(error, valid) {
        if (valid != null) {
          game.getPlayerTurn(req.body.gameId, client, res);
          done(err);
        } else {
          done(err);
          res.json({
            success: false
          });
        }
      });
    } else {
      done(err);
      res.json({
        success: false
      });
    }
  });
});

app.post('/playCard', function(req, res) {
  pool.connect(function(err, client, done) {
    if (err) throw new Error(err);
    if (req.body.userId != null && req.body.token != null &&
      req.body.location != null && req.body.card != null &&
      req.body.gameId != null) {
      var valid = null;
      account.verify(req.body.userId, req.body.token, client, function(error, valid) {
        if (valid != null) {
          game.placeToken(req.body.userId, req.body.gameId, req.body.card.id, req.body.location, req.body.card.deckId, client, res, function(err) {
            gameNSP.emit('updateBoard', err);
          });
          done(err);
        } else {
          done(err);
          res.json({
            success: false
          });
        }
      });
    } else {
      done(err);
      res.json({
        success: false
      });
    }
  });
});

app.post('/getBoard', function(req, res) {
  pool.connect(function(err, client, done) {
    if (err) throw new Error(err);
    if (req.body.userId != null && req.body.token != null &&
      req.body.gameId != null) {
      var valid = null;
      account.verify(req.body.userId, req.body.token, client, function(error, valid) {
        if (valid != null) {
          game.getBoard(req.body.gameId, client, res);
          done(err);
        } else {
          done(err);
          res.json({
            success: false
          });
        }
      });
    } else {
      done(err);
      res.json({
        success: false
      });
    }
  });
});
