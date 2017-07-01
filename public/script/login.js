$(document).ready(function () {
    $("#loginRegister").click(function () {
        var current = $("#loginButton").get(0).innerHTML;
        if (current == "Login") {
            $("#loginButton").get(0).innerHTML = "Register";
            $("#loginButton").get(0).name = "Register";
            $("#loginRegister").get(0).innerHTML = "Already Have Account";
        } else {
            $("#loginButton").get(0).innerHTML = "Login";
            $("#loginButton").get(0).name = "Login";
            $("#loginRegister").get(0).innerHTML = "Create Account";
        }
    });
    $("#loginButton").click(function () {
        var current = $("#loginButton").get(0).name;
        console.log(current);
        var creds = {
            "username": $("#username_field").get(0).value,
            "password": $("#password_field").get(0).value
        };
        if (creds.username != null && creds.password != null) {
            if (current == "Login") {
                $.ajax({
                    type: "POST",
                    url: "/login",
                    data: JSON.stringify(creds),
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    success: function (data) {
                        if (typeof data != 'object') {
                            data = JSON.parse(data);
                        }
                        if (data.success == true) {
                            saveToken(data);
                            goToGameLobby();
                        }
                    },
                    failure: function (errMsg) {
                        console.log(errMsg);
                    }
                });
            } else {
                $.ajax({
                    type: "POST",
                    url: "/createAccount",
                    data: JSON.stringify(creds),
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    success: function (data) {
                        if (typeof data != 'object') {
                            data = JSON.parse(data);
                        }
                        if (data.success == true) {
                            $.ajax({
                                type: "POST",
                                url: "/login",
                                data: JSON.stringify(creds),
                                contentType: "application/json; charset=utf-8",
                                dataType: "json",
                                success: function (data) {
                                    if (typeof data != 'object') {
                                        data = JSON.parse(data);
                                    }
                                    if (data.success == true) {
                                        saveToken(data);
                                        goToGameLobby();
                                    }
                                },
                                failure: function (errMsg) {
                                    console.log(errMsg);
                                }
                            });
                        }
                    },
                    failure: function (errMsg) {
                        console.log(errMsg);
                    }
                });
            }
        }
    });
});

function saveToken(result) {
    if (result.hasOwnProperty("id") && result.hasOwnProperty("token")) {
        if (typeof (sessionStorage) !== "undefined") {
            delete result.success;
            result.userId = result.id;
            delete result.id;
            sessionStorage.setItem("session", JSON.stringify(result));
        } else {
            // Session Storage not Supported
        }
    }
}

function goToGameLobby() {
    if (typeof (sessionStorage) !== "undefined") {
        var session = JSON.parse(sessionStorage.getItem("session"));
        if (session.hasOwnProperty("userId") && session.hasOwnProperty("token")) {
            $("html").load("/gameLobby?userId=" + session.userId + "&token=" + session.token);
        }
    }
}