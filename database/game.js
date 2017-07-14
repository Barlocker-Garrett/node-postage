var drawCard = function(userId, gameId, client, _res) {
  // if your turn, and haven't drawn a card, and have less than 6 cards
  client.query('select player.id from users join player on player.usersid = users.id join team on team.id = player.teamid join game on team.game_id = game.id where game.id = $1 and users.id = $2', [gameId, userId], (err, result) => {
    if (err) {
      console.log(err);
    } else if (result.rows.length === 1) {
      var playerId = result.rows[0].id;
      client.query('select game.id from game where player_turnid = $1 and player_draw = false', [playerId], (err, result) => {
        if (err) {
          console.log(err);
        } else if (result.rows.length === 1) {
          // check hand size < 6
          client.query('SELECT COUNT(id) FROM hand WHERE hand.id = $1', [playerId], (err, result) => {
            if (err) {
              console.log(err);
            } else if (result.rows[0].count < 6) {
              // find a card
              client.query('SELECT deckid, cardid FROM game_deck WHERE gameid = $1 ORDER BY RANDOM() LIMIT 1', [gameId], (err, result) => {
                if (err) {
                  console.log(err);
                } else if (result.rows.length == 1) {
                  // insert the card into your hand
                  var cardId = result.rows[0].cardid;
                  var deckId = result.rows[0].deckid;
                  client.query('INSERT INTO hand(id, cardid, deckid) VALUES($1, $2, $3)', [playerId, cardId, deckId], (err, result) => {
                    if (err) {
                      console.log(err);
                    } else if (result.rowCount == 1) {
                      // insert the card into your hand
                      client.query('DELETE FROM game_deck WHERE cardid = $1 AND deckid = $2 AND gameid = $3', [cardId, deckId, gameId], (err, result) => {
                        if (err) {
                          console.log(err);
                        } else if (result.rowCount == 1) {
                          client.query('UPDATE game SET player_draw = true WHERE id = $1', [gameId], (err, result) => {
                            if (err) {
                              console.log(err);
                            } else if (result.rowCount == 1) {
                              _res.json({
                                success: true
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
                } else {
                  // TODO: maybe resuffle if empty
                }
              });
            } else {
              _res.json({
                success: false,
                message: "You already have 6 cards"
              });
            }
          });
        } else {
          _res.json({
            success: false,
            message: "Not your turn or you already drew"
          });
        }
      });
    } else {
      _res.json({
        success: false,
        message: "Not able to draw right now"
      });
    }
  });
};

var endTurn = function(userId, gameId, teamId, client, _res) {
  // if your turn
  client.query('select player.id from users join player on player.usersid = users.id join team on team.id = player.teamid join game on team.game_id = game.id where game.id = $1 and users.id = $2', [gameId, userId], (err, result) => {
    if (err) {
      console.log(err);
    } else if (result.rows.length === 1) {
      var playerId = result.rows[0].id;
      client.query('select game.id from game where player_turnid = $1', [playerId], (err, result) => {
        if (err) {
          console.log(err);
        } else if (result.rows.length === 1) {
          client.query('select player.id from player join team on team.id = player.teamid where teamid != $2 and game_id = $1 and player.id NOT IN (select game.last_player_id from game where id = $1)', [gameId, teamId], (err, result) => {
            if (err) {
              console.log(err);
            } else if (result.rows.length > 0) {
              var nextPlayer = result.rows[0].id;
              // update last_player_id, player_turnid, and reset player_draw = false
              client.query('UPDATE game SET last_player_id = $1, player_turnid = $2, player_draw = false WHERE game.id = $3', [playerId, nextPlayer, gameId], (err, result) => {
                if (err) {
                  console.log(err);
                } else if (result.rowCount == 1) {
                  _res.json({
                    success: true
                  });
                } else {
                  _res.json({
                    success: false,
                    message: "Unable to switch to next player"
                  });
                }
              });
            } else {
              _res.json({
                success: false,
                message: "Unable to find another player"
              });
            }
          });
        } else {
          _res.json({
            success: false,
            message: "It's not currenlty your turn"
          });
        }
      });
    } else {
      _res.json({
        success: false,
        message: "You are not a player currently"
      });
    }
  });
};

// TODO: add count of cards in the pile
var getDiscardPile = function(gameId, client, _res) {
  // get the most recent discarded card
  client.query('SELECT deck.color, card_value.value, card_suit.suit FROM discard JOIN card ON card.id = discard.cardid JOIN card_value ON card.card_valueid = card_value.id JOIN card_suit ON card.card_suitid = card_suit.id JOIN deck ON deck.id = discard.deckid WHERE gameid = $1 ORDER BY discard.id DESC LIMIT 1 ', [gameId], (err, result) => {
    if (err) {
      console.log(err);
    } else if (result.rows.length === 1) {
      _res.json({
        success: true,
        card: result.rows[0].value + "_of_" + result.rows[0].suit + "_" + result.rows[0].color,
        count: result.rows[0].count
      });
    } else {
      _res.json({
        success: false,
        message: "You are not a player currently"
      });
    }
  });
};

/*var getPlayers = function (gameId, client, _res) {
    // get all of the players and their data for the view
    client.query('SELECT username, teamid, color FROM users JOIN player ON player.usersid = users.id JOIN team ON team.id = player.teamid WHERE team.game_id = $1', [gameId], (err, result) => {
        if (err) {
            console.log(err);
        } else if (result.rows.length > 0) {
            _res.json({
                success: true,
                players: result.rows
            });
        } else {
            _res.json({
                success: false,
                message: "Unable to get the players in this game"
            });
        }
    });
}*/

var getPlayers = function(client, gameId, callback) {
  // get all of the players and their data for the view
  var players = [];
  var userIds = [];
  client.query('SELECT username, teamid, color, usersid FROM users JOIN player ON player.usersid = users.id JOIN team ON team.id = player.teamid WHERE team.game_id = $1' + 'ORDER BY color', [gameId], (err, result) => {
    if (err) {
      console.log(err);
    } else {
      for (var i = 0; i < result.rowCount; i++) {
        var player = {};
        player.username = result.rows[i].username;
        player.teamid = result.rows[i].teamid;
        player.color = result.rows[i].color;
        player.userId = result.rows[i].usersid;
        players.push(player);
      }
      callback(null, players);
    }
  });
};

var getHand = function(userId, gameId, client, _res) {
  // get the values of the cards in the given users hand
  client.query('select player.id from users join player on player.usersid = users.id join team on team.id = player.teamid join game on team.game_id = game.id where game.id = $1 and users.id = $2', [gameId, userId], (err, result) => {
    if (err) {
      console.log(err);
    } else if (result.rows.length == 1) {
      var playerId = result.rows[0].id;
      client.query('SELECT card_value.value, card_suit.suit, deck.color, hand.cardid, hand.deckid FROM hand JOIN player ON player.handid = hand.id JOIN card ON card.id = hand.cardid JOIN card_value ON card.card_valueid = card_value.id JOIN card_suit ON card.card_suitid = card_suit.id JOIN deck ON hand.deckid = deck.id WHERE player.id = $1', [playerId], (err, result) => {
        if (err) {
          console.log(err);
        } else if (result.rows.length > 0) {
          cards = [];
          cardIds = [];
          deckIds = [];
          for (var i = 0; i < result.rows.length; i++) {
            var card = result.rows[i].value + "_of_" + result.rows[i].suit;
            cardIds[i] = result.rows[i].cardid;
            deckIds[i] = result.rows[i].deckid;
            cards[i] = card;
          }
          _res.json({
            success: true,
            cards: cards,
            cardIds: cardIds,
            deckIds: deckIds
          });
        } else {
          _res.json({
            success: false,
            message: "Unable to get the players hand"
          });
        }
      });
    } else {
      _res.json({
        success: false,
        message: "Unable to find the player"
      });
    }
  });
};

var getPlayerTurn = function(gameId, client, _res) {
  client.query('SELECT usersid, player.id AS playerId, teamid, handid, color, game_id FROM player JOIN team on team.id = player.teamid WHERE team.game_id = $1 AND player.id IN (SELECT game.player_turnid FROM game WHERE game.id = $1)', [gameId], (err, result) => {
    if (err) {
      console.log(err);
    } else if (result.rows.length > 0) {
      _res.json({
        success: true,
        playerId: result.rows[0].playerId,
        userId: result.rows[0].usersid
      });
    } else {
      _res.json({
        success: false,
        message: "Unable to find who's turn it is"
      });
    }
  });
};

var placeToken = function(userId, gameId, cardId, locationId, client, _res) {
  // get the players id, and verify they have that card
  client.query('select player.id from users join player on player.usersid = users.id join team on team.id = player.teamid join game on team.game_id = game.id join hand on hand.id = player.handid where game.id = $1 and users.id = $2 AND hand.cardid = $3', [gameId, userId, cardId], (err, result) => {
    if (err) {
      console.log(err);
    } else if (result.rows.length == 1) {
      var playerId = result.rows[0].id;
      client.query('select locationid, location.playerid, cardid  from location join board on board.locationid = location.id join game on game.boardid = board.id where game.id = $1', [gameId], (err, result) => {
        if (err) {
          console.log(err);
        } else if (result.rows.length == 104) {
          var playedPlayerId = result.rows[locationId].playerid;
          var playedCardId = result.rows[locationId].cardid;
          var matches = false;
          var jack = false;
          var eye = null;
          if (locationId == 1 || locationId == 73) {
            if (cardId == 19) {
              matches = true;
            }
          } else if (locationId == 2 || locationId == 72) {
            if (cardId == 20) {
              matches = true;
            }
          } else if (locationId == 3 || locationId == 62) {
            if (cardId == 21) {
              matches = true;
            }
          } else if (locationId == 4 || locationId == 52) {
            if (cardId == 22) {
              matches = true;
            }
          } else if (locationId == 5 || locationId == 42) {
            if (cardId == 23) {
              matches = true;
            }
          } else if (locationId == 6 || locationId == 32) {
            if (cardId == 25) {
              matches = true;
            }
          } else if (locationId == 7 || locationId == 22) {
            if (cardId == 26) {
              matches = true;
            }
          } else if (locationId == 8 || locationId == 23) {
            if (cardId == 27) {
              matches = true;
            }
          } else if (locationId == 10 || locationId == 74) {
            if (cardId == 18) {
              matches = true;
            }
          } else if (locationId == 11 || locationId == 44) {
            if (cardId == 29) {
              matches = true;
            }
          } else if (locationId == 12 || locationId == 45) {
            if (cardId == 28) {
              matches = true;
            }
          } else if (locationId == 13 || locationId == 98) {
            if (cardId == 41) {
              matches = true;
            }
          } else if (locationId == 14 || locationId == 97) {
            if (cardId == 42) {
              matches = true;
            }
          } else if (locationId == 15 || locationId == 96) {
            if (cardId == 43) {
              matches = true;
            }
          } else if (locationId == 16 || locationId == 95) {
            if (cardId == 44) {
              matches = true;
            }
          } else if (locationId == 17 || locationId == 94) {
            if (cardId == 45) {
              matches = true;
            }
          } else if (locationId == 18 || locationId == 93) {
            if (cardId == 46) {
              matches = true;
            }
          } else if (locationId == 19 || locationId == 24) {
            if (cardId == 14) {
              matches = true;
            }
          } else if (locationId == 20 || locationId == 75) {
            if (cardId == 17) {
              matches = true;
            }
          } else if (locationId == 21 || locationId == 54) {
            if (cardId == 30) {
              matches = true;
            }
          } else if (locationId == 25 || locationId == 29) {
            if (cardId == 13) {
              matches = true;
            }
          } else if (locationId == 26 || locationId == 39) {
            if (cardId == 12) {
              matches = true;
            }
          } else if (locationId == 27 || locationId == 48) {
            if (cardId == 10) {
              matches = true;
            }
          } else if (locationId == 28 || locationId == 92) {
            if (cardId == 47) {
              matches = true;
            }
          } else if (locationId == 30 || locationId == 76) {
            if (cardId == 16) {
              matches = true;
            }
          } else if (locationId == 31 || locationId == 55) {
            if (cardId == 31) {
              matches = true;
            }
          } else if (locationId == 33 || locationId == 82) {
            if (cardId == 38) {
              matches = true;
            }
          } else if (locationId == 34 || locationId == 81) {
            if (cardId == 36) {
              matches = true;
            }
          } else if (locationId == 35 || locationId == 71) {
            if (cardId == 35) {
              matches = true;
            }
          } else if (locationId == 36 || locationId == 61) {
            if (cardId == 34) {
              matches = true;
            }
          } else if (locationId == 37 || locationId == 59) {
            if (cardId == 9) {
              matches = true;
            }
          } else if (locationId == 38 || locationId == 91) {
            if (cardId == 48) {
              matches = true;
            }
          } else if (locationId == 40 || locationId == 77) {
            if (cardId == 15) {
              matches = true;
            }
          } else if (locationId == 41 || locationId == 56) {
            if (cardId == 32) {
              matches = true;
            }
          } else if (locationId == 43 || locationId == 83) {
            if (cardId == 39) {
              matches = true;
            }
          } else if (locationId == 46 || locationId == 51) {
            if (cardId == 33) {
              matches = true;
            }
          } else if (locationId == 47 || locationId == 69) {
            if (cardId == 8) {
              matches = true;
            }
          } else if (locationId == 48 || locationId == 80) {
            if (cardId == 49) {
              matches = true;
            }
          } else if (locationId == 50 || locationId == 78) {
            if (cardId == 53) {
              matches = true;
            }
          } else if (locationId == 53 || locationId == 84) {
            if (cardId == 40) {
              matches = true;
            }
          } else if (locationId == 57 || locationId == 79) {
            if (cardId == 7) {
              matches = true;
            }
          } else if (locationId == 58 || locationId == 70) {
            if (cardId == 51) {
              matches = true;
            }
          } else if (locationId == 60 || locationId == 68) {
            if (cardId == 52) {
              matches = true;
            }
          } else if (locationId == 63 || locationId == 85) {
            if (cardId == 2) {
              matches = true;
            }
          } else if (locationId == 64 || locationId == 86) {
            if (cardId == 3) {
              matches = true;
            }
          } else if (locationId == 65 || locationId == 87) {
            if (cardId == 4) {
              matches = true;
            }
          } else if (locationId == 66 || locationId == 88) {
            if (cardId == 5) {
              matches = true;
            }
          } else if (locationId == 67 || locationId == 89) {
            if (cardId == 6) {
              matches = true;
            }
          } else if (cardId == 11 || cardId == 24) {
            jack = true;
            eye = 2;
          } else if (cardId == 37 || cardId == 50) {
            jack = true;
            eye = 1;
          }

          // Insert the token onto this slot
          // TODO: check for sequences
          if (match == true && playedPlayerId == null && playedCardId == null) {
            client.query('UPDATE location SET playerid = $1, cardid = $2', [playerId, cardId], (err, result) => {
              if (err) {
                console.log(err);
              } else if (result.rowCount == 1) {
                // remove card from Hand
                // add card to discard
                _res.json({
                  success: true
                });
              }
            });
          } else if (jack == true && eye == 1) {
            // if locationid is not part of a sequence, remove token
            // if valid remove card from hand
            // then add card to discard
          } else if (jack == true && eye == 2) {
            client.query('UPDATE location SET playerid = $1, cardid = $2', [playerId, cardId], (err, result) => {
              if (err) {
                console.log(err);
              } else if (result.rowCount == 1) {
                // remove card from Hand
                // add card to discard
                _res.json({
                  success: true
                });
              }
            });
          } else {
            _res.json({
              success: false,
              message: "Unknown location, or free space"
            });
          }
        } else {
          _res.json({
            success: false,
            message: "Unable to verify you have that card, or that you are playing the game"
          });
        }
      });
    } else {
      _res.json({
        success: false,
        message: "Unable to verify you have that card, or that you are playing the game"
      });
    }
  });
};


exports.drawCard = drawCard;
exports.endTurn = endTurn;
exports.getDiscardPile = getDiscardPile;
exports.getPlayers = getPlayers;
exports.getHand = getHand;
exports.getPlayerTurn = getPlayerTurn;

// placeToken POST

// deadCard POST

// getBoard POST

// getPlayerTurn POST

// getCard POST return SVG binary stream
