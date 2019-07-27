require('dotenv').config();
var request = require('request');
var fs = require('fs');

let deviceFile     = null;
let deviceDir      = "/sys/bus/w1/devices/";
let reportURL      = process.env.REPORT_URL;
let reportFormat   = process.env.REPORT_KEY || '{"temp": ${value}}';
let reportInterval = process.env.REPORT_INTERVAL || 10000;

if (process.env.DEVICE) {
    deviceFile = process.env.DEVICE;
} else {
    fs.readdirSync(deviceDir).forEach(function (name) {
        if (name.indexOf('28-') === 0) {
            deviceFile = deviceDir + name + '/w1_slave';
        }
    });
}

if (!deviceFile) {
    console.log('No Device Found.');
    process.exit();
}

function report () {
    var fileContent = fs.readFileSync(deviceFile).toString();
    var temp = fileContent.match(/t=(\d+)/)[1];
    var body = reportFormat.replace('${value}', temp);
    var options = {
        uri: reportURL,
        method: 'POST',
        json: true,
        body: JSON.parse(body)
    };
    var timeStart = new Date().getTime();
    console.log('Reporting at ' + new Date().toString())
    request(options, function (error, response, body) {
        console.log('Time cost: ' + (new Date().getTime() - timeStart) + 'ms');
        if (error) {
            console.log('Reported failed:' + error);
        } else {
            console.log('Reported result: ' + JSON.stringify(body));
        }
        setTimeout(report, reportInterval);
    });
}

report();