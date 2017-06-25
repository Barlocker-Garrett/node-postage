var bcrypt = require('bcrypt-nodejs');
var hat = require('hat');
var rack = hat.rack();

// verify a users token matched with their userId
// if valid update the lastused to now()
var verify = function (userId, token, client, callback)  {
    var valid = null;
    client.query('SELECT id, usersid, token, lastUsed FROM session WHERE usersid = $1 AND token = $2 AND lastUsed > CURRENT_TIMESTAMP - INTERVAL \'2 HOURS\'', [userId, token], (err, result) => {
        if (err) {
            console.log(err);
        } else if (result.rows.length === 1) {
            valid = result.rows[0].usersid;
            client.query('UPDATE session SET lastused = CURRENT_TIMESTAMP WHERE id = $1', [result.rows[0].id], (err, result) => {
                if (err) {
                    console.log(err);
                }
            });
            callback(null, valid);
        } else {
            callback(null, valid);
        }
    });
}

// create account
var createAccount = function (username, password, client, _res) {
    var hash = bcrypt.hashSync(password);
    client.query('INSERT INTO users (username, password) VALUES($1,$2)', [username, hash], (err, result) => {
        if (err) {
            console.log(err);
        } else {
            _res.json({
                success: true
            });
        }
    });
}

// login
var login = function (username, password, client, _res) {
    client.query('SELECT password, id FROM users WHERE username = $1', [username], (err, result) => {
        if (err) {
            console.log(err);
        } else {
            processLogin(client, result.rows, password, _res)
        }
    });
}

function processLogin(client, rows, password, _res) {
    var valid = false;
    var id = null;
    var token = null;
    rows.forEach(function (row) {
        valid = bcrypt.compareSync(password, row.password);
        if (valid) {
            id = row.id;
        }
    });
    if (valid && id != null) {
        token = createToken(client, id);
    }
    if (valid && token != null && id != null) {
        _res.json({
            success: valid,
            id: id,
            token: token
        });
    } else {
        _res.json({
            success: valid
        });
    }
}

function createToken(client, id) {
    var token = rack();
    client.query('INSERT INTO session(token, lastused, usersid) VALUES ($1, now(), $2) ON CONFLICT (usersid) DO UPDATE SET token=$1, lastused=now()', [token, id], (err, result) => {
        if (err) {
            console.log(err);
        }
    });

    return token;
}

exports.createAccount = createAccount;
exports.login = login;
exports.verify = verify;