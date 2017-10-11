'use strict';

var HTTPS = require('https');

function _Simple_Request (method, host, port, path, data, callback, options) { // jshint ignore:line

    options = Object.assign({}, options || {}, { method, host, port, path });
    options.headers = Object.assign({}, options.headers || {}, {
        'Content-Type': 'application/json'
    });

    let request = HTTPS.request(
        options,
        (response) => {
            let response_data = '';

            response.on('data', (data) => {
                response_data += data;
            });

            response.on('end', () => {
                let parsed;
                try {
                    parsed = JSON.parse(response_data);
                }
                catch(error) {
                    return callback(`error parsing JSON data: ${error}`);
                }
				if (response.statusCode < 200 || response.statusCode >= 300) {
                    return callback(`error response, status code was ${response.statusCode}`, parsed);
                }
				else {
                	return callback(null, parsed);
				}
            });

            response.on('error', (error) => {
                return callback(`https error: ${error}`);
            });
        }
    );
    request.on('error', (error) => {
        callback(error);
    });
    if (data) {
        request.write(JSON.stringify(data));
    }
    request.end();
}

module.exports = {

    get: (host, port, path, data, callback, options) => {
        _Simple_Request('get', host, port, path, data, callback, options);
    },

    post: (host, port, path, data, callback, options) => {
        _Simple_Request('post', host, port, path, data, callback, options);
    },

    put: (host, port, path, data, callback, options) => {
        _Simple_Request('put', host, port, path, data, callback, options);
    }
};
