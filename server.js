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
    es = require('event-stream')


var d = new Date(),
    app  = express();

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 1337;
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';

// Configuring AWS
AWS.config.update({
    region: "us-east-1",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

var docClient = new AWS.DynamoDB.DocumentClient();

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
        //  console.log(result)
         // var meta = {errCd: result.errCd[0], errNm: result.errNm[0], insertTimestamp: Date.now(), responseTimestamp: moment.tz(result.tmst[0], "YYYYMMDD HH:mm:ss", "America/Chicago").unix()};

          _.each(result,function(element, index, list) {
            var trainsInRoute = element.train;
            var params = {
              TableName: process.env.AWS_DYNAMODB_TABLE_NAME_TRAINS
            };

            //parsing
            _.each(trainsInRoute, function (train, property_index,list){
              params.Item = _.mapObject(train, function(val, key) {
                if(isNumberic(val[0])){
                  return +val[0];
                }
                return val[0];
            });

            //mapping some things
            params.Item.routeName = element.name[0];
            params.Item.arrT = moment.tz(params.Item.arrT, "YYYYMMDD HH:mm:ss", "America/Chicago").unix();
            params.Item.prdt = moment.tz(params.Item.prdt, "YYYYMMDD HH:mm:ss", "America/Chicago").unix();
            params.Item.geohash = geohash.encode(params.Item.lat, params.Item.lon, 9);
            params.Item.meta = _.pick(meta, _.identity);
            params.Item =  _.pick(params.Item, _.identity);

            console.log("new trains....")
            console.log(params)

            // //pushing to DynamoDB
            // docClient.put(params, function(err, data) {
            //     if (err) console.error(JSON.stringify(err, null, 2));
            // });
          });
        });
    };

app.get('/', function (req, res) {
   res.end("It's alive!");
});

app.listen(port, ip);
console.log('Server running on ' + ip + ':' + port);
