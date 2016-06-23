require('dotenv').config({silent: true});

// Setting some things up
var request = require('request'),
    express = require('express'),
    _ = require('underscore'),
    AWS = require("aws-sdk"),
    moment = require("moment-timezone"),
    parseString = require('xml2js').parseString,
    geohash = require('ngeohash'),
    fs = require('fs'),
    JSONStream = require('JSONStream'),
    es = require('event-stream'),
    omitEmpty = require('omit-empty');



var d = new Date(),
    app  = express();

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 1337;
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';

// Configuring AWS
AWS.config.update({
    region: "us-east-1"
});


var fs = require('fs'),
  JSONStream = require('JSONStream'),
  es = require('event-stream');

request({url: 'https://opencta.cloudant.com/trains/_all_docs\?include_docs\=true'})
  .pipe(JSONStream.parse('rows.*.doc'))
  .pipe(es.mapSync(function (data) {
    save(data.data)
    // console.error(data)
    return data
}))


// javascript is so dumb
var isNumberic = function(num){
    return !isNaN(num);
};


//the stuff to do every 3 seconds
var save = function(result){
         // var meta = {errCd: result.errCd[0], errNm: result.errNm[0], insertTimestamp: Date.now(), responseTimestamp: moment.tz(result.tmst[0], "YYYYMMDD HH:mm:ss", "America/Chicago").unix()};
          _.each(result,function(element, index, list) {
          var docClient = new AWS.DynamoDB.DocumentClient();

            //parsing
            _.each(element, function (train, property_index,list){
                var params = {
                    TableName: process.env.AWS_DYNAMODB_TABLE_NAME_TRAINS,
                    Item: { 

                    }
                };
                params.Item = train
                params.Item.routeName = index;
                params.Item.arrT = moment.tz(params.Item.arrT, "YYYYMMDD HH:mm:ss", "America/Chicago").unix();
                params.Item.prdt = moment.tz(params.Item.prdt, "YYYYMMDD HH:mm:ss", "America/Chicago").unix();
                params.Item.geohash = geohash.encode(params.Item.lat, params.Item.lon, 9);
                docClient.put(omitEmpty(params), function(err, data) {
                    console.log(params)
                    if (err) console.error(JSON.stringify(err, null, 2));
                });
            });
        });



    };

app.get('/', function (req, res) {
   res.end("It's alive!");
});

app.listen(port, ip);
console.log('Server running on ' + ip + ':' + port);
