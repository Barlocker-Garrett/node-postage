$(document).ready(function () {
    $("#logout").click(function () {
        sessionStorage.clear();
    });
    $("#CreateGame").click(function () {
        var title = $("#title")[0].value;
        var playerCount = $('input[name=group1]:checked')[0].id;
        if (playerCount == 2 || playerCount == 3 || playerCount == 4 && title) {
            var data = getCreds();
            data.playerCount = playerCount;
            data.title = title;
            createGame(data);
        }
    });
    $("#refreshGames").click(function () {
        refreshGames(getCreds());
    });
    $("#refreshPlayers").click(function () {
        var data = getCreds();
        data.gameId = $("#buttonLeave")[0].title;
        refreshPlayers(data);
    });
    $("#startGame").click(function () {
        var data = getCreds();
        data.gameId = $("#buttonLeave")[0].title;
        startGame(data);
    });
    $(".buttonJoin").click(function () {
        var gameId = this.title;
        var data = getCreds();
        data.gameId = gameId;
        joinGame(data);
    });
});

function getCreds() {
    var creds = {};
    if (typeof (sessionStorage) !== "undefined") {
        var session = JSON.parse(sessionStorage.getItem("session"));
        if (session.hasOwnProperty("userId") && session.hasOwnProperty("token")) {
            creds = session;
        }
    }
    return creds;
}

function createGame(data) {
    $.ajax({
        type: "POST",
        url: "/createGame",
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            if (typeof data != 'object') {
                data = JSON.parse(data);
            }
            if (data.success == true) {
                $("#title")[0].value = "";
                $('input[name=group1]:checked')[0].checked = false;
                refreshGames(getCreds());
            }
        },
        failure: function (errMsg) {
            console.log(errMsg);
        }
    });
}

function refreshGames(data) {
    $.ajax({
        type: "POST",
        url: "/getGames",
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8",
        dataType: "html",
        success: function (data) {
            $("#gamesTable").empty().append(data)
        },
        failure: function (errMsg) {
            console.log(errMsg);
        }
    });
}

function refreshPlayers(data) {
    $("#playersTable").empty();
    $.ajax({
        type: "POST",
        url: "/getPlayers",
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8",
        dataType: "html",
        success: function (data) {
            $("#playersTable").append(data)
        },
        failure: function (errMsg) {
            console.log(errMsg);
        }
    });
}

function joinGame(data) {
    $.ajax({
        type: "POST",
        url: "/joinGame",
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8",
        dataType: "html",
        success: function (teamData) {
            if (typeof teamData != 'object') {
                teamData = JSON.parse(teamData);
            }
            if (teamData.success == true) {
                console.log(teamData);
                var creds = getCreds();
                $("html").load("/getGameSlot?userId=" + creds.userId + "&token=" + creds.token + "&gameId=" + data.gameId);
            }
        },
        failure: function (errMsg) {
            console.log(errMsg);
        }
    });
}

function startGame(data) {
    $("html").load("/loadGame?userId=" + data.userId + "&token=" + data.token + "&gameId=" + data.gameId);
}