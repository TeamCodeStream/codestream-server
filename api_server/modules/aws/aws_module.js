// provides AWS-related services to the API server,
// the various services are all collected under one roof here

'use strict';

var APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module');
var AWS = require(process.env.CS_API_TOP + '/server_utils/aws/aws');
var SQSClient = require('./sqs_client');

class AWSModule extends APIServerModule {

	services () {
		// return a function that, when invoked, returns a service structure with the desired AWS services
		return (callback) => {
			this.api.log('Initiating AWS services...');
			this.aws = new AWS(this.api.config.aws);
			this.initializeSQS();
			return callback(null, [{
				queueService: this.sqsClient
			}]);
		};
	}

	initializeSQS () {
		this.sqsClient = new SQSClient({ aws: this.aws });
	}
}

module.exports = AWSModule;








/*


// This file provides a simple message queueing service using the Amazon SQS service
// The message queue service relies on the Amazon AWS SDK node client (http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/frames.html)
//
// SQS does not provide a callback mechanism when messages are received, instead we have to do a continuous loop of long-polling receipt
// requests, kind of sucks, but we encapsulate all that here so callers don't have to deal with it

var AWS = require(process.env.SRCTOP + '/ec/lib/util/aws.js').aws,
	_ = require('underscore'),
	ASync = require('async'),
	aws = new AWS();

// Message_Queue_Service object instantiation
//
// usage: var message_queue_service = new Message_Queue_Service();
// purpose: initialize a new Message_Queue_Service object
// arguments: none
// returns: a new Message_Queue_Service object
//
var Message_Queue_Service = function(logger) {
	if (logger) {
		this.logger = logger;
	}
	else {
		this.logger = console;
	}
	this.queues = {};
};

//
// Public
//
// Message_Queue_Service.start();
//
// purpose: Start the Message Queue Service by connecting to the amazon SQS client
// arguments:
//    options: startup options:
//    callback: to call when the Message Queue Service has successfully started, format is callback(error)
// returns: nothing
//
Message_Queue_Service.prototype.start = function(options, callback) {
	// create an amazon SQS client
	try {
		this.sqs_client = aws.sqs;
		callback();
	} catch(error) {
		return callback('unable to create SQS client: ' + error);
	}
};

// Create a message queue
Message_Queue_Service.prototype.create_queue = function(options, callback) {
	var self = this;
	if (!_.isString(options.name)) {
		return callback('can not create message queue, must provide a queue name');
	}
	this.sqs_client.createQueue(
		_.extend(
			{},
			{
				QueueName: options.name
			},
			options.queue_options || {}
		),
		function(error, data) {
			if (error) {
				return callback('unable to create queue ' + options.name + ': ' + error);
			}
			self.queues[options.name] = {
				name: options.name,
				options: options,
				url: data.QueueUrl,
				callback: options.callback
			};
			if (!options.dont_listen) {
				self._initiate_polling(options.name);
			}
			else {
				self.logger.info('NOTE: message queue ' + options.name + ' will be outbound only');
			}
			return callback();
		}
	);
};

// Send a message to a message queue
Message_Queue_Service.prototype.send_message = function(queue_name, data, options, callback) {
	var self = this;
	options = options || {};
	if (!_.isString(queue_name)) {
		return callback('must provide a valid queue name');
	}
	var queue = self.queues[queue_name];
	if (!queue) {
		return callback('no queue found matching ' + queue_name);
	}
	var params = {
		MessageBody: JSON.stringify(data),
		QueueUrl: queue.url,
		DelaySeconds: options.delay || 0
	};
	if (_.isNumber(options.delay)) {
		params.DelaySeconds = options.delay;
	}
	if (_.isObject(options.attributes)) {
		params.MessageAttributes = options.attributes;
	}
	this.sqs_client.sendMessage(params, callback);
};

// Initiate a continuous polling for messages received in a particular queue
Message_Queue_Service.prototype._initiate_polling = function(queue_name) {
	var self = this;
	var queue = self.queues[queue_name];
	if (!queue) { return; }
	ASync.whilst(
		function() {
			return !queue.stop_polling;
		},
		function(whilst_callback) {
			self._poll_once(queue_name, whilst_callback);
		},
		function() {
		}
	);
};

// Poll a given message queue once for messages
Message_Queue_Service.prototype._poll_once = function(queue_name, callback) {
	var self = this;
	var queue = self.queues[queue_name];
	if (!queue) { return; }
	var params = {
		QueueUrl: queue.url,
		WaitTimeSeconds: 20 // maximum allowed
	}
	self.sqs_client.receiveMessage(params, function(error, data) {
		if (error) {
			self.logger.warn('Error receiving message on queue ' + queue_name + ': ' + error);
			return callback();
		}
		else if (!data || !data.Messages || !_.isArray(data.Messages)) {
			// this is assumed to to be the timeout, though there doesn't seem to be any explicit indication
			return callback();
		}
		else {
			ASync.forEachSeries(data.Messages, function(message, foreach_callback) {
				self._process_message(queue, message, function() { ASync.nextTick(foreach_callback); });
			}, callback);
		}
	});
};

// Process message data from queue
Message_Queue_Service.prototype._process_message = function(queue, message, callback) {
	var self = this;
	self.logger.info('Received an SQS message on queue ' + queue.name + ': ' + message.MessageId + ':' + message.ReceiptHandle);
 	if (message.Body) {
		var data;
		try {
			data = JSON.parse(message.Body);
		}
		catch (error) {
			self.logger.warn('Unable to process message ' + message.MessageId + ' on queue ' + queue.name + ': bad JSON data: ' + error);
			return;
		}
		if (queue.callback) {
			queue.callback(data, function(done) {
				if (done) {
					self._release_message(queue, message, callback);
				}
			});
		}
		else {
			callback();
		}
	}
};

// Release an already processed message from the queue
Message_Queue_Service.prototype._release_message = function(queue, message, callback) {
	var self = this;
	var params = {
		QueueUrl: queue.url,
		ReceiptHandle: message.ReceiptHandle
	};
	self.sqs_client.deleteMessage(params, function(error, data) {
		if (error) {
			self.logger.warn('Unable to delete message ' + message.MessageId + ' from queue: ' + error);
		}
		callback();
	});
};
*/
