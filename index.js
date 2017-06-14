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

app.get('/math', function(request, response) {
    var answerObj = calculate(request, response);


    response.render('pages/math', {
        operator: answerObj.operator,
        input1: request.query.input1,
        input2: request.query.input2,
        answer: answerObj.answer
    })

});


app.get('/math_service', function(request, response) {
    var answerObj = calculate(request, response);
    answerObj["input1"] = request.query.input1;
    answerObj["input2"] = request.query.input2;
    response.writeHead(200, {'Content-Type':'application/json'});
    response.write(JSON.stringify(answerObj))
    response.end();

});




app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});


function calculate(request, response){
    var answer = 0;
    var operator = "";
    switch (request.query.operator) {
        case 'add':
            operator = '+';
            answer = Number(request.query.input1) + Number(request.query.input2);
            break;
        case 'subtract':
            operator = "-";
            answer = request.query.input1 - request.query.input2;
            break;
        case 'divide':
            operator = "/";
            answer = request.query.input1 / request.query.input2;
            break;
        case 'multiply':
            operator = "x"
            answer = request.query.input1 * request.query.input2;
            break;
        default:
            console.log("You got problems in the switch statement....");
    }

    return {"operator": operator, "answer": answer};
}
