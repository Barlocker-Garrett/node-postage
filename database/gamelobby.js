var hat = require('hat');
var rack = hat.rack();

/*
 * Creates a new game, both teams, and inserts the requesting user as a player
 */
var createGame = function (title, playerCount, userId, client, _res) {
    var url = rack();
    var socket = 3000;
    console.log("createGame Intro");
    client.query('INSERT INTO game(title, url, socket, player_count) VALUES ($1, $2, $3, $4) RETURNING id', [title, url, socket, playerCount], (err, result) => {
        if (err) {
            console.log(err);
        } else if (result.rowCount === 1) {
            console.log("createGame rowCount" + result.rowCount);
            var gameId = result.rows[0].id;
            var color = "blue";
            client.query('INSERT INTO team(color, game_id) VALUES ($1, $2), ($3, $2) RETURNING id', [color, gameId, "red"], (err, result) => {
                if (err) {
                    console.log(err);
                } else if (result.rowCount >= 1) {
                    var teamId = result.rows[0].id;
                    client.query('INSERT INTO player(teamid, usersid) VALUES ($1, $2) RETURNING id', [teamId, userId], (err, result) => {
                        if (err) {
                            console.log(err);
                        } else if (result.rowCount === 1) {
                            var playerId = result.rows[0].id;
                            _res.json({
                                success: true,
                                gameUrl: url,
                                teamId: teamId,
                                teamColor: color,
                                playerId: playerId,
                                gameId: gameId
                            });
                        } else {
                            _res.json({
                                success: false
                            });
                        }
                    });
                } else {
                    _res.json({
                        success: false
                    });
                }
            });
        } else {
            _res.json({
                success: false
            });
        }
    });
}

/*
 * Create new players if there is room on a team within that game  
 */
var joinGame = function (gameId, userId, client, _res) {
    client.query('SELECT player.teamid, player.id, team.color, game.title, game.url, game.socket, game.player_count FROM player JOIN team ON player.teamid = team.id' +
        ' JOIN game ON team.game_id = game.id' +
        ' WHERE team.game_id = $1', [gameId], (err, result) => {
            var player_count = result.rows[0].player_count;
            var teamId = result.rows[0].teamid;
            var url = result.rows[0].url;
            var color = result.rows[0].color;
            console.log(result.rows.length);
            if (err) {
                console.log(err);
            } else if (result.rows.length == player_count) {
                _res.json({
                    success: false,
                    message: "Game is full"
                });
            } else if (result.rows.length == 1 && player_count == 4) {
                client.query('INSERT INTO player(teamid, usersid) VALUES ($1, $2) RETURNING id', [teamId, userId], (err, result) => {
                    if (err) {
                        console.log(err);
                    } else if (result.rowCount === 1) {
                        var playerId = result.rows[0].id;
                        _res.json({
                            success: true,
                            gameUrl: url,
                            teamId: teamId,
                            teamColor: color,
                            playerId: playerId
                        });
                    } else {
                        _res.json({
                            success: false
                        });
                    }
                });
            } else if (result.rows.length == 1 && player_count == 3) {
                teamId++;
                client.query('INSERT INTO player(teamid, usersid) VALUES ($1, $2) RETURNING id', [teamId, userId], (err, result) => {
                    if (err) {
                        console.log(err);
                    } else if (result.rowCount === 1) {
                        console.log("Green");
                        var playerId = result.rows[0].id;
                        _res.json({
                            success: true,
                            gameUrl: url,
                            teamId: teamId,
                            teamColor: "green",
                            playerId: playerId
                        });
                    } else {
                        _res.json({
                            success: false
                        });
                    }
                });
            } else if (result.rows.length < player_count) {
                teamId++;
                client.query('INSERT INTO player(teamid, usersid) VALUES ($1, $2) RETURNING id', [teamId, userId], (err, result) => {
                    if (err) {
                        console.log(err);
                    } else if (result.rowCount === 1) {
                        var playerId = result.rows[0].id;
                        _res.json({
                            success: true,
                            gameUrl: url,
                            teamId: teamId,
                            teamColor: "red",
                            playerId: playerId
                        });
                    } else {
                        _res.json({
                            success: false
                        });
                    }
                });
            }
        });
}

/*
 * Remove a given player from a game, by their player id
 */
var leaveGame = function (playerId, client, _res) {
    client.query('DELETE FROM player WHERE (id = $1)', [playerId], (err, result) => {
        if (err) {
            console.log(err);
        } else if (result.rowCount === 1) {
            _res.json({
                success: true
            });
        } else {
            _res.json({
                success: false
            });
        }
    });
}

/*
 * Remove a given game by game id
 * TODO: only allow the creator to delete the game, backend check
 */
var deleteGame = function (gameId, client, _res) {
    client.query('DELETE FROM player WHERE teamid IN (SELECT player.teamid FROM player JOIN team ON team.id = player.teamid WHERE team.game_id = $1)', [gameId], (err, result) => {
        if (err) {
            console.log(err);
        } else {
            client.query('DELETE FROM team WHERE game_id = $1', [gameId], (err, result) => {
                if (err) {
                    console.log(err);
                } else {
                    client.query('DELETE FROM game WHERE (id = $1)', [gameId], (err, result) => {
                        if (err) {
                            console.log(err);
                        } else if (result.rowCount === 1) {
                            _res.json({
                                success: true
                            });
                        } else {
                            _res.json({
                                success: false
                            });
                        }
                    });
                }
            });
        }
    });
}

/*
 * Check to make sure there are enough players, if so create the board, cards, game_deck, hands, and draw cards from game_deck
 */
var startGame = function (gameId, client, _res) {
    // make sure there are the correct number of players
    client.query('SELECT count(player.id), player_count FROM player' +
        ' JOIN team ON player.teamid = team.id' +
        ' JOIN game ON game.id = team.game_id' +
        ' WHERE game.id = $1' +
        ' GROUP BY game.id', [gameId], (err, result) => {
            if (err) {
                console.log(err);
            } else if (result.rows[0].count == result.rows[0].player_count) {
                // create empty 104 empty locations
                var insertLocations = 'INSERT INTO location(playerid, cardid) values(null, null),';
                for (var i = 0; i < 102; i++) {
                    insertLocations += ' (null,null),'
                }
                insertLocations += ' (null,null) RETURNING id'
                client.query(insertLocations, [], (err, result) => {
                    if (err) {
                        console.log(err);
                    } else if (result.rowCount == 104) {
                        // create the board using the gameId and the just created locations for the board
                        var locationId = result.rows[0].id;
                        var insertBoardLocations = 'INSERT INTO board(id, locationid) values($1, ' + locationId + '),';
                        for (var i = 0; i < 102; i++) {
                            locationId = result.rows[i + 1].id;
                            insertBoardLocations += ' ($1, ' + locationId + '),';
                        }
                        insertBoardLocations += ' ($1, ' + result.rows[103].id + ')';
                        client.query(insertBoardLocations, [gameId], (err, result) => {
                            if (err) {
                                console.log(err);
                            } else if (result.rowCount == 104) {
                                // create red and blue decks
                                client.query('INSERT INTO deck(color) VALUES($1), ($2) RETURNING id', ["blue", "red"], (err, result) => {
                                    if (err) {
                                        console.log(err);
                                    } else if (result.rowCount == 2) {
                                        // place all 104 cards in game_deck
                                        var blueDeck = result.rows[0].id;
                                        var redDeck = result.rows[1].id;
                                        var insertGameDecks = 'INSERT INTO game_deck (deckid, cardid, gameid) VALUES';
                                        for (var i = 2; i < 54; i++) {
                                            insertGameDecks += ' ($1, ' + i + ', $3),';
                                        }
                                        for (var j = 2; j < 53; j++) {
                                            insertGameDecks += ' ($2, ' + j + ', $3),';
                                        }
                                        insertGameDecks += ' ($2, 53, $3)';
                                        client.query(insertGameDecks, [blueDeck, redDeck, gameId], (err, result) => {
                                            if (err) {
                                                console.log(err);
                                            } else if (result.rowCount == 104) {
                                                let playerIds = [];
                                                client.query('SELECT player.id FROM player JOIN team ON team.id = player.teamid WHERE team.game_id = $1 AND player.handid IS NULL', [gameId], (err, result) => {
                                                    for (let i = 0; i < result.rowCount; i++) {
                                                        playerIds[i] = result.rows[i].id;
                                                    }
                                                    // draw a set number of cards
                                                    var numCards = 24;
                                                    client.query('SELECT cardid, deckid FROM game_deck WHERE gameid = $1 ORDER BY RANDOM() LIMIT $2', [gameId, numCards], (err, result) => {
                                                        if (err) {
                                                            console.log(err);
                                                        } else if (result.rows.length == numCards) {
                                                            var cardIds = [];
                                                            var deckIds = [];
                                                            for (var i = 0; i < numCards; i++) {
                                                                cardIds[i] = result.rows[i].cardid;
                                                            }
                                                            for (var i = 0; i < numCards; i++) {
                                                                deckIds[i] = result.rows[i].deckid;
                                                            }
                                                            // delete the 24 cards from game_deck
                                                            var deleteCards = 'DELETE FROM game_deck WHERE gameid = $1 AND';
                                                            for (var i = 0; i < numCards - 1; i++) {
                                                                deleteCards += ' (cardid =' + cardIds[i] + ' AND deckid =' + deckIds[i] + ') OR';
                                                            }
                                                            deleteCards += ' (cardid =' + cardIds[numCards - 1] + ' AND deckid =' + deckIds[numCards - 1] + ')';
                                                            // create a hand id is the players id
                                                            client.query(deleteCards, [gameId], (err, result) => {
                                                                if (err) {
                                                                    console.log(err);
                                                                } else {
                                                                    var m = 0;
                                                                    var valid = false;
                                                                    for (var p = 0; p < numCards; p += 6, m++) {
                                                                        let playerId = playerIds[m];
                                                                        var insertHand = 'INSERT INTO hand(id, cardid, deckid) VALUES';
                                                                        for (var j = p; j < p + 5; j++) {
                                                                            insertHand += ' ($1,' + cardIds[j] + ', ' + deckIds[j] + '),';
                                                                        }
                                                                        insertHand += '($1,' + cardIds[j] + ', ' + deckIds[j] + ')';
                                                                        client.query(insertHand, [playerId], (err, result) => {
                                                                            if (err) {
                                                                                console.log(err);
                                                                            } else if (result.rowCount == numCards / playerIds.length) {
                                                                                // update handId for player where hand == null and game id = gameId limit 1
                                                                                client.query('UPDATE player SET handid = $1 WHERE handid IS NULL AND id = $1', [playerId], (err, result) => {
                                                                                    if (err) {
                                                                                        console.log(err);
                                                                                    } else if (result.rowCount == 1) {
                                                                                        // TODO: somehow check that these were change then success = true
                                                                                        // valid = true;
                                                                                    }
                                                                                });
                                                                            }
                                                                        });
                                                                    }
                                                                    _res.json({
                                                                        success: true
                                                                    });
                                                                }
                                                            });
                                                        }
                                                    });
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    } else {
                        var count = result.rows[0].player_count - result.rows[0].count;
                        _res.json({
                            success: false,
                            message: "Missing " + count + " player(s)"
                        });
                    }
                });
            }
        });
}

/*
 * Gets a list of all of the non-full games
 */
var getGames = function (client, _res) {

    client.query('select count(player.id), game.id, game.player_count, game.title, game.url from game join team on team.game_id = game.id join player on player.teamid = team.id group by game.id', [], (err, result) => {
        if (err) {
            console.log(err);
        } else {
            console.log(result);
            var allGames = [];
            for (var i = 0; i < result.rows.length; i++) {
                if (result.rows[i].count < result.rows[i].player_count) {
                    allGames.push(result.rows[i]);
                }
            }
            _res.json({
                success: true,
                games: allGames
            });
        }
    });
}

/*
 * Gets a list of all of the non-full games
 */
var getListOfGames = function (client, games, callback) {
    var games = [];
    client.query('select count(player.id), game.id, game.player_count, game.title, game.url from game join team on team.game_id = game.id join player on player.teamid = team.id group by game.id', [], (err, result) => {
        if (err) {
            console.log(err);
        } else {
            for (var i = 0; i < result.rowCount; i++) {
                if (result.rows[i].count < result.rows[i].player_count) {
                    var game = {};
                    game.id = result.rows[i].id;
                    game.count = result.rows[i].count;
                    game.player_count = result.rows[i].player_count;
                    game.title = result.rows[i].title;
                    game.url = result.rows[i].url;
                    games.push(game);
                }
            }
            callback(null, games);
        }
    });
}

exports.createGame = createGame;
exports.joinGame = joinGame;
exports.leaveGame = leaveGame;
exports.deleteGame = deleteGame;
exports.startGame = startGame;
exports.getGames = getGames;
exports.getListOfGames = getListOfGames;