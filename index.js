var express = require('express');
var app = express();

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
    response.render('pages/index');
});

app.get('/postage', function(request, response) {
    var resObj = calculate(request, response);

    response.render('pages/cost', {
        weight: request.query.weight,
        type: resObj.type,
        cost: resObj.cost
    })

});

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});

function calculate(request, response){
    var cost = null;
    var type = null;
    var weight = request.query.weight;
    switch (request.query.mailType) {
        case '0': // Letters (Stamped)
            cost = calculateStamped(weight);
            type = "Letters (Stamped)"
            break;
        case '1': // Letters (Metered)
            cost = calculateMetered(weight);
            type = "Letters (Metered)"
            break;
        case '2': // Large Envelopes (Flats)
            cost = calculateEnvelopes(weight);
            type = "Large Envelopes"
            break;
        case '3': // Parcels
            cost = calculateParcels(weight);
            type = "Parcels"
            break;
        default:
            console.log("You got problems in the switch statement....");
    }
    if (cost != null) {
        cost = formatDollars(cost);
    } else {
        cost = "Nope"
    }
    return {"cost": cost,"type":type};
}

function formatDollars(cost) {
    var formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    });
    return formatter.format(cost);
}

function calculateStamped(weight) {
    if (weight < 0) {
        return null;
    } else if (weight <= 1) {
        return .49;
    } else if (weight <= 2) {
        return .7;
    } else if (weight <= 3) {
        return .91;
    } else if (weight <= 3.5) {
        return 1.12;
    } else {
        return null;
    }
}

function calculateMetered(weight) {
    if (weight < 0) {
        return null;
    } else if (weight <= 1) {
        return .46;
    } else if (weight <= 2) {
        return .67;
    } else if (weight <= 3) {
        return .88;
    } else if (weight <= 3.5) {
        return 1.09;
    } else {
        return null;    
    }
}

function calculateEnvelopes(weight) {
    if (weight < 0) {
        return null;
    } else if (weight <= 1) {
        return .98;
    } else if (weight <= 2) {
        return 1.19;
    } else if (weight <= 3) {
        return 1.4;
    } else if (weight <= 4) {
        return 1.61;
    } else if (weight <= 5) {
        return 1.82;
    } else if (weight <= 6) {
        return 2.03;
    } else if (weight <= 7) {
        return 2.24;
    } else if (weight <= 8) {
        return 2.45;
    } else if (weight <= 9) {
        return 2.66;
    } else if (weight <= 10) {
        return 2.87;
    } else if (weight <= 11) {
        return 3.08;
    } else if (weight <= 12) {
        return 3.29;
    } else if (weight <= 13) {
        return 3.5;
    } else {
        return null;
    }
}

function calculateParcels(weight) {
    if (weight < 0) {
        return null;
    } else if (weight <= 1) {
        return 2.67;
    } else if (weight <= 2) {
        return 2.67;
    } else if (weight <= 3) {
        return 2.67;
    } else if (weight <= 4) {
        return 2.67;
    } else if (weight <= 5) {
        return 2.85;
    } else if (weight <= 6) {
        return 3.03;
    } else if (weight <= 7) {
        return 3.21;
    } else if (weight <= 8) {
        return 3.39;
    } else if (weight <= 9) {
        return 3.57;
    } else if (weight <= 10) {
        return 3.75;
    } else if (weight <= 11) {
        return 3.93;
    } else if (weight <= 12) {
        return 4.11;
    } else if (weight <= 13) {
        return 4.29;
    } else {
        return null;
    }
}




















