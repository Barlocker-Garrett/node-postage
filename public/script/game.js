var socketLobby = io('/singleGame');
var game = null;
var boardMap = new Map();

$(document).ready(function() {
  var creds = getCreds();
  game = getGame();
  createBoardMap(boardMap);
  if (game.hasOwnProperty("gameId")) {
    creds.gameId = game.gameId;
  }
  getHand(creds);
  getPlayerTurn(creds);
  $("#toggle_hand").click(function(e) {
    if ($(".select_toggle").hasClass("collapse")) {
      $(".select_toggle").toggleClass("uncollapse");
    } else {
      $(".select_toggle").toggleClass("collapse");
    }
    var val = $("#toggle").html();
    if (val == "▼") {
      $("#toggle").text("▲");
    } else {
      $("#toggle").text("▼");
    }
  });
  $("#logout").click(function() {
    var creds = getCreds();
    socketLobby.emit('logout', creds);
    sessionStorage.clear();
  });
  socketLobby.on('playerList', function(data) {
    console.log(data);
    $("#playersTable").empty();
    var tr;
    for (var i = 0; i < data.length; i++) {
      tr = $('<tr/>');
      tr.append("<td class='td-value'>" + data[i].username + "</td>");
      tr.append("<td class='td-value'>" + data[i].color.charAt(0).toUpperCase() + data[i].color.slice(1) + "</td>");
      tr.append("<td></td>");
      tr.append("<td></td>");
      $('#playersTable').append(tr);
    }
  });
  $("#refreshPlayers").click(function() {
    var data = getCreds();
    data.gameId = $("#buttonLeave")[0].title;
    refreshPlayers(data);
  });
  $('.card_in_hand').click(function() {
    var card = JSON.parse(this.alt);
    validPlay(card, this);
  });
});

function getGame() {
  var game = {};
  if (typeof(sessionStorage) !== "undefined") {
    var session = JSON.parse(sessionStorage.getItem("gameData"));
    if (session && session.hasOwnProperty("gameId")) {
      game = session;
    } else {
      goToLoginPage();
    }
  }
  return game;
}

function getCreds() {
  var creds = {};
  if (typeof(sessionStorage) !== "undefined") {
    var session = JSON.parse(sessionStorage.getItem("session"));
    if (session && session.hasOwnProperty("userId") && session.hasOwnProperty("token")) {
      creds = session;
    } else {
      goToLoginPage();
    }
  }
  return creds;
}

function refreshPlayers(data) {
  $("#playersTable").empty();
  $.ajax({
    type: "POST",
    url: "/getPlayers",
    data: JSON.stringify(data),
    contentType: "application/json; charset=utf-8",
    dataType: "html",
    success: function(data) {
      $("#playersTable").append(data);
    },
    failure: function(errMsg) {
      console.log(errMsg);
    }
  });
}

function goToLoginPage() {
  var re = new RegExp(/^.*\//);
  window.location.href = re.exec(window.location.href);
}

function getHand(data) {
  $.ajax({
    type: "POST",
    url: "/getHand",
    data: JSON.stringify(data),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function(res) {
      if (!res.success) {
        createHand(data);
      } else {
        console.log(res);
        $('#hand').css('width', (res.cards.length + 1) * 87 + "px");
        for (var i = 0; i < res.cards.length; i++) {
          if ($('.card_in_hand')[i]) {
            $('.card_in_hand')[i].src = "/images/" + res.cards[i] + ".svg";
            $('.card_in_hand')[i].alt = "{\"id\":" + res.cardIds[i] + ",\"deckId\":" + res.deckIds[i] + "}";
          }
        }
      }
    },
    failure: function(errMsg) {
      console.log(errMsg);
    }
  });
}

function createHand(data) {
  $.ajax({
    type: "POST",
    url: "/createHand",
    data: JSON.stringify(data),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function(res) {
      if (res) {
        getHand(data);
      }
    },
    failure: function(errMsg) {
      console.log(errMsg);
    }
  });
}

function getPlayerTurn(data) {
  $.ajax({
    type: "POST",
    url: "/getPlayerTurn",
    data: JSON.stringify(data),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function(res) {
      if (res) {
        console.log(res);
        if (res.hasOwnProperty("userId")) {
          var selector = "#" + res.userId;
          $(selector)[0].innerHTML = "★";
        }
      }
    },
    failure: function(errMsg) {
      console.log(errMsg);
    }
  });
}

function createBoardMap(boardMap) {
  var allValidLocations = [];
  for (var i = 1; i < 100; i++) {
    if (i != 9 && i != 90 && i != 99) {
      allValidLocations.push(i);
    }
  }
  boardMap.set(2, [63, 85]);
  boardMap.set(3, [64, 86]);
  boardMap.set(4, [65, 87]);
  boardMap.set(5, [66, 88]);
  boardMap.set(6, [67, 89]);
  boardMap.set(7, [57, 79]);
  boardMap.set(8, [47, 69]);
  boardMap.set(9, [37, 59]);
  boardMap.set(10, [27, 49]);
  boardMap.set(11, allValidLocations);
  boardMap.set(12, [26, 39]);
  boardMap.set(13, [25, 29]);
  boardMap.set(14, [24, 19]);
  boardMap.set(15, [40, 77]);
  boardMap.set(16, [30, 76]);
  boardMap.set(17, [20, 75]);
  boardMap.set(18, [10, 74]);
  boardMap.set(19, [1, 73]);
  boardMap.set(20, [2, 72]);
  boardMap.set(21, [3, 62]);
  boardMap.set(22, [4, 52]);
  boardMap.set(23, [5, 42]);
  boardMap.set(24, allValidLocations);
  boardMap.set(25, [6, 32]);
  boardMap.set(26, [7, 22]);
  boardMap.set(27, [8, 23]);
  boardMap.set(28, [12, 45]);
  boardMap.set(29, [11, 44]);
  boardMap.set(30, [21, 54]);
  boardMap.set(31, [31, 55]);
  boardMap.set(32, [41, 56]);
  boardMap.set(33, [51, 46]);
  boardMap.set(34, [61, 36]);
  boardMap.set(35, [71, 35]);
  boardMap.set(36, [81, 34]);
  // boardMap.set(37, [, ]); Jack of Hearts
  boardMap.set(38, [82, 33]);
  boardMap.set(39, [83, 43]);
  boardMap.set(40, [84, 53]);
  boardMap.set(41, [13, 98]);
  boardMap.set(42, [14, 97]);
  boardMap.set(43, [15, 96]);
  boardMap.set(44, [16, 95]);
  boardMap.set(45, [17, 94]);
  boardMap.set(46, [18, 93]);
  boardMap.set(47, [28, 92]);
  boardMap.set(48, [38, 91]);
  boardMap.set(49, [48, 80]);
  // boardMap.set(50, [, ]); Jack of Spades
  boardMap.set(51, [58, 70]);
  boardMap.set(52, [68, 60]);
  boardMap.set(53, [78, 50]);
}

function validPlay(card, clickedCard) {
  $('.card').removeClass("available");
  $('.card_in_hand').removeClass("unavailable");
  $('.card_in_hand').removeClass("availableToPlay");

  // two eyed Jack
  if (card.id == 11 || card.id == 24) {
    console.log("Wild");
  }
  // one eyed jack
  else if (card.id == 37 || card.id == 50) {
    console.log("Remove");
  }

  var locations = boardMap.get(card.id);
  if (locations) {
    var noLocations = true;
    for (var i = 0; i < locations.length; i++) {
      var selector = "slot" + locations[i];
      var cardSlot = document.getElementsByClassName(selector)[0];
      if (!cardSlot.classList.contains("redToken") && !cardSlot.classList.contains("blueToken")) {
        cardSlot.className += " available";
        noLocations = false;
      }
    }
    if (noLocations) {
      clickedCard.className += " unavailable";
    } else {
      clickedCard.className += " availableToPlay";
    }
  }
}
