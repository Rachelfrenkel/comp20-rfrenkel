// Initialization
var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var validator = require('validator'); // See documentation at https://github.com/chriso/validator.js
var app = express();
// See https://stackoverflow.com/questions/5710358/how-to-get-post-query-in-express-node-js
app.use(bodyParser.json());
// See https://stackoverflow.com/questions/25471856/express-throws-error-as-body-parser-deprecated-undefined-extended
app.use(bodyParser.urlencoded({ extended: true }));

// Mongo initialization
var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/test';
var mongo = require('mongodb');
var db = mongo.Db.connect(mongoUri, function(error, databaseConnection) {
	db = databaseConnection;
});
app.post('/sendLocation', function(request,response) {
	response.header("Access-Control-Allow-Origin", "*");
  	response.header("Access-Control-Allow-Headers", "X-Requested-With");
	var login = request.body.login;
	var lat = request.body.lat;
	lat = parseFloat(lat);
	//convert lat to floating
	var lng = request.body.lng;
	lng = parseFloat(lng); 
	var created_at = new Date();//check javascript data format
	

	var toInsert = {
		"login": login,
		"lat":lat,
		"lng":lng,
		"created_at":created_at
	};

	//check if all inputs are there
	if(login == undefined || lat == undefined || lng == undefined)
	{
		reponse.send(500);
	}else{
		db.collection('locations', function(er, collection) {
			var id = collection.insert(toInsert, function(err, saved) {
				if (err) {
					response.send(500);
				}
				else {
					db.collection('locations',function(err,collection){
						collection.find().sort({"created_at":-1}).toArray(function(err,results){
							if(!err){
								response.send(JSON.stringify({"characters":[],"students":results}));
							};
						});
					});
				}
		    });
		});
	}
});

app.get('/redline.json', function(request, response) {
	response.header("Access-Control-Allow-Origin", "*");
  	response.header("Access-Control-Allow-Headers", "X-Requested-With");
	var data = '';
	http.get("http://developer.mbta.com/lib/rthr/red.json", function(apiresponse) {
		apiresponse.on('data', function(chunk) {
			data += chunk;
		});
		apiresponse.on('end', function() {
			response.send(data);
		});
	}).on('error', function(error) {
		response.send(500);
	});
});

app.get('/locations.json', function(request, response) {
	response.header("Access-Control-Allow-Origin", "*");
  	response.header("Access-Control-Allow-Headers", "X-Requested-With");	
	var login = request.query.login;
	console.log(login);
	login = login.toString();
	console.log(login);
	//check if all inputs are there
	if(login == undefined)
	{
		response.send(500);
	}else{		
		db.collection('locations',function(err,collection){
			if(!err){
				collection.find({"login":login}).sort({"created_at":-1}).toArray(function(err,results){
					if(!err){
						response.send(JSON.stringify(results));
					}
				});
			}
		});
	}
});

app.get('/', function(request, response) {
	response.set('Content-Type', 'text/html');
	var indexPage = '';
	db.collection('locations', function(er, collection) {
		if(!er){
			collection.find().sort({"created_at":-1}).toArray(function(err, cursor) {
				if (!err) {
					indexPage += "<!DOCTYPE HTML><html><head><title>where In the World </title></head><body><h1>Check ins</h1>";
					for (var count = 0; count < cursor.length; count++) {
						indexPage += "<p>login: "+ cursor[count].login+",lat: "+cursor[count].lat+",lng: "+cursor[count].lng+",created_at: "+cursor[count].created_at + "</p>";
					}	
					indexPage += "</body></html>";
					response.send(indexPage);
				} else {
					response.send('<!DOCTYPE HTML><html><head><title>Where in the World</title></head><body><h1>Whoops, something went terribly wrong!</h1></body></html>');
				}
			});
		}
	});
});

// Oh joy! http://stackoverflow.com/questions/15693192/heroku-node-js-error-web-process-failed-to-bind-to-port-within-60-seconds-of
app.listen(process.env.PORT || 3000);

