'use strict';

var OAuth = require('oauth-1.0a');
var request = require('request');
var progress = require('request-progress');

var logger = require('./log');

module.exports.RestClient = function (options) {
    var instance = {};

    var servelrUrl = options.url;
    var apiVersion = options.version;
    var oauth = OAuth({
        consumer: {
            public: options.consumerKey,
            secret: options.consumerSecret
        },
        signature_method: 'HMAC-SHA1'
    });
    var token = {
        public: options.accessToken,
        secret: options.accessTokenSecret
    };

    function apiCall(request_data, request_token = '', progress_cb = null) {
        logger.debug('Calling API endpoint: ' + request_data.method + ' ' + request_data.url + ' token: ' + request_token);

        logger.info({
            url: request_data.url,
            method: request_data.method,
            headers: request_token ? { 'Authorization': 'Bearer ' + request_token } : oauth.toHeader(oauth.authorize(request_data, token)),
            json: true,
            body: request_data.body,
        });
        /* eslint no-undef: off*/        
        return new Promise(function (resolve, reject) {
            progress(
                request({
                    url: request_data.url,
                    method: request_data.method,
                    headers: request_token ? { 'Authorization': 'Bearer ' + request_token } : oauth.toHeader(oauth.authorize(request_data, token)),
                    json: true,
                    body: request_data.body,
                }, function (error, response, body) {
                    logger.debug('Response received.');
                    if (error) {
                        logger.error('Error occured: ' + error);
                        reject(error);
                        return;
                    } else if (!httpCallSucceeded(response)) {
                        var errorMessage = 'HTTP ERROR ' + response.code;
                        if(body && body.hasOwnProperty('message') )
                            errorMessage = errorString(body.message, body.hasOwnProperty('parameters') ? body.parameters : {});
                        
                        logger.error('API call failed: ' + errorMessage);
                        reject(response);
                    }
                    resolve(body);
                })
            ).on('progress', function (state) {
                // The state is an object that looks like this:
                // {
                //     percent: 0.5,               // Overall percent (between 0 to 1)
                //     speed: 554732,              // The download speed in bytes/sec
                //     size: {
                //         total: 90044871,        // The total payload size in bytes
                //         transferred: 27610959   // The transferred payload size in bytes
                //     },
                //     time: {
                //         elapsed: 36.235,        // The total elapsed seconds since the start (3 decimals)
                //         remaining: 81.403       // The remaining seconds to finish (3 decimals)
                //     }
                // }
                if (progress_cb) {
                    progress_cb(state);
                }
            });
        });
    }

    instance.consumerToken = function (login_data) {
        return apiCall({
            url: createUrl('/integration/customer/token'),
            method: 'POST',
            body: login_data           
        })
    }

    function httpCallSucceeded(response) {
        return response.statusCode >= 200 && response.statusCode < 300;
    }

    function errorString(message, parameters) {
        if (parameters === null) {
            return message;
        }
        if (parameters instanceof Array) {
            for (var i = 0; i < parameters.length; i++) {
                var parameterPlaceholder = '%' + (i + 1).toString();
                message = message.replace(parameterPlaceholder, parameters[i]);
            }
        } else if (parameters instanceof Object) {
            for (var key in parameters) {
                var parameterPlaceholder = '%' + key;
                message = message.replace(parameterPlaceholder, parameters[key]);
            }
        }

        return message;
    }

    instance.get = function (resourceUrl, request_token = '', progress_cb = null) {
        var request_data = {
            url: createUrl(resourceUrl),
            method: 'GET'
        };
        return apiCall(request_data, request_token, progress_cb);
    }

    function createUrl(resourceUrl) {
        return servelrUrl + '/' + apiVersion + resourceUrl;
    }

    instance.post = function (resourceUrl, data, request_token = '', progress_cb = null) {
        var request_data = {
            url: createUrl(resourceUrl),
            method: 'POST',
            body: data
        };
        return apiCall(request_data, request_token, progress_cb);
    }

    instance.put = function (resourceUrl, data, request_token = '', progress_cb = null) {
        var request_data = {
            url: createUrl(resourceUrl),
            method: 'PUT',
            body: data
        };
        return apiCall(request_data, request_token, progress_cb);
    }

    instance.delete = function (resourceUrl, request_token = '', progress_cb = null) {
        var request_data = {
            url: createUrl(resourceUrl),
            method: 'DELETE'
        };
        return apiCall(request_data, request_token, progress_cb);
    }

    return instance;
}
