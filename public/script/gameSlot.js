var socketLobby = io('/singleGame');

$(document).ready(function() {
  var creds = getCreds();
  var gameData = {
    gameId: $('#gameId')[0].title
  };
  saveGameData(gameData);
  $("#logout").click(function() {
    var creds = getCreds();
    socketLobby.emit('logout', creds);
    sessionStorage.clear();
  });
  socketLobby.on('gameStarted', function(data) {
    console.log(data);
    var gameData = getGame();
    if (gameData.gameId == data.gameId) {
      var creds = getCreds();
      creds.gameId = data.gameId;
      startGame(creds);
    }
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
  $("#startGame").click(function() {
    var data = getCreds();
    data.gameId = $('#gameId')[0].title;
    initGame(data);
  });
  $("#buttonLeave").click(function() {
    var data = getCreds();
    data.playerId = $("#buttonLeave")[0].title;
    data.gameId = $('#gameId')[0].title;
    leaveGame(data);
  });
});

function saveGameData(result) {
  if (result.hasOwnProperty("gameId")) {
    if (typeof(sessionStorage) !== "undefined") {
      sessionStorage.setItem("gameData", JSON.stringify(result));
    } else {
      // Session Storage not Supported
    }
  }
}

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

function initGame(data) {
  $.ajax({
    type: "POST",
    url: "/startGame",
    data: JSON.stringify(data),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function(success) {
      console.log(success);
      startGame(data);
    },
    failure: function(errMsg) {
      console.log(errMsg);
    }
  });
}

function startGame(data) {
  socketLobby.disconnect();
  window.location.href = "/loadGame?userId=" + data.userId + "&token=" + data.token + "&gameId=" + data.gameId;
}

function goToLoginPage() {
  var re = new RegExp(/^.*\//);
  window.location.href = re.exec(window.location.href);
}

function leaveGame(data) {
  $.ajax({
    type: "DELETE",
    url: "/leaveGame",
    data: JSON.stringify(data),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function(leaveData) {
      if (typeof leaveData != 'object') {
        leaveData = JSON.parse(leaveData);
      }
      if (leaveData.success == true) {
        var creds = getCreds();
        window.location.href = "/gameLobby?userId=" + creds.userId + "&token=" + creds.token;
      }
    },
    failure: function(errMsg) {
      console.log(errMsg);
    }
  });
}
