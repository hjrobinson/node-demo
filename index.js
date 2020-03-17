var request = require('request');

var fs = require('fs');
var path = require('path');
var mbgl = require('@mapbox/mapbox-gl-native');
var sharp = require('sharp');

const http = require('http');
var express = require("express");
var app = express();

var port = process.env.PORT || 3000;

app.get('/', function (req, res) {
    var options = {
      request: function(req, callback) {
        request({
            url: 'http://geojackson-gigharbor-print.s3-website-us-west-2.amazonaws.com/0-0-0.vector.pbf',
            encoding: null,
            gzip: true
        }, function (err, res, body) {
            if (err) {
                callback(err);
            } else if (res.statusCode == 200) {
                var response = {};

                if (res.headers.modified) { response.modified = new Date(res.headers.modified); }
                if (res.headers.expires) { response.expires = new Date(res.headers.expires); }
                if (res.headers.etag) { response.etag = res.headers.etag; }

                response.data = body;

                callback(null, response);
            } else {
                callback(new Error(JSON.parse(body).message));
            }
        })
      },
      ratio: 1
    }

    const file = fs.createWriteStream("./test/fixtures/my-style.json");
    const myRequest = http.get("http://geojackson-gigharbor-print.s3-website-us-west-2.amazonaws.com/style.json", function(response) {
        response.pipe(file);
        file.on('finish', function(){
            var map = new mbgl.Map(options);
            map.load(require('./test/fixtures/my-style.json'));

            map.render(options, function (err, buffer) {
                if (err) {
                    console.error(err);
                    res.send(err);
                } else {
                    let image = sharp(buffer, {
                        raw: {
                            width: 512,
                            height: 512,
                            channels: 4
                        }
                    });
                    res.set('Content-Type', 'image/png');
                    image.png().toBuffer().then((result) => {
                        res.send(result);
                    })
                }
            })
        })
    })
})

app.listen(port, () => {
    console.log('Server started on port ' + port)
})
