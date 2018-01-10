// Provides an inbound email server which reads and processes mail files for use by
// the CodeStream API server
//
// We use a node module called watchr, which watches a particular directory (defined
// by environment variable) for files. When it sees one, it reads it in and parses
// it as a mail file, then sends the information along to the API server (via HTTPS)
// for further processing.

var FS = require('fs');
var	Async = require('async');
var Util = require('util');
var Watchr = require('watchr');
var Logger = require(process.env.SRCTOP + '/ec/lib/util/logger.js');
var MailParser = require('mailparser').MailParser;
var URL = require('url');
var Path = require('path');
var HTTPS = require('https'),
var ChildProcess = require('child_process');
const Config = require(process.env.CS_INMAIL_SRCTOP + 'config/config');

class InboundEmailServer {

	constructor(options) {
		Object.assign(this, options);
		this.rejectedFiles = [];
		this.attachments = {};
		this.loadConfig();
	}
}

// Respond to message from the cluster master
Inbound_Email_Server.prototype._handle_message = function(message) {
	this.info("Worker got message", message);
	if (message.worker_id) {
		_.extend(this, message);
	}
	if (message.shutdown) {
		this.warn("Got shutdown signal from Cluster master");
		this.warn("Shutting down " + this._watchers.length + " watchers");
		_.each(this._watchers, function(watcher) {
			watcher.close();
		});
		this.warn("Shutting down redis connections");
		this.redis_client.quit();
		this.redis_client_sub.quit();
		this.redis_client_pub.quit();
	}
};

// Start the inbound email server
Inbound_Email_Server.prototype.start = function() {
	var self = this;

	ASync.series([
		function(callback) {
			// start redis
			self.info('Starting redis...');
			self._start_redis(callback);
		},
		function(callback) {
			// start the file storage service
			self.info('Starting file storage service...');
			self._start_file_storage_service(callback);
		},
		function(callback) {
			// need a worker id
			if (!self.worker_id) {
				self.warn('Can not proceed without a worker id');
				process.exit(0);
			}
			// start watching the inbound emails directory
			self.info('Start polling...');
			self._start_polling(callback);
		},
		function(callback) {
			// touch pre-existing files, forcing them to trigger a change
			setTimeout(function() {
				self.info('Touching pre-existing files...');
				self._touch_files(callback);
			}, 1000);
		}
	]);
};

// Start file storage service
// warning: PROCESS DIES ON FAILURE
Inbound_Email_Server.prototype._start_file_storage_service = function(callback) {
	var self = this;
	this.file_storage_service = new File_Storage_Service(this);
	this.file_storage_service.start(this.configuration.s3, function(error) {
		if (error) {
			self.error('Unable to start File Storage Service: ' + Errors.output(error, true));
			process.exit(1);
		}
		else {
			callback();
		}
	});
};

// Start redis client for general caching purposes
// warning: PROCESS DIES ON FAILURE
Inbound_Email_Server.prototype._start_redis = function(outer_callback) {
	var self = this;
	var options = this.configuration.redis;


	ASync.waterfall([
		function(waterfall_callback) {
			// start standard redis client
			self.redis_client = Redis.createClient(options.port, options.host);
			self.redis_client.on('error', function(error) {
				waterfall_callback('could not create Redis client at ' + options.host + ':' + options.port + ': ' + error);
			});
			self.redis_client.auth(options.password, waterfall_callback);
		},
		function(result, waterfall_callback) {
			// start "publish" redis client
			self.redis_client_pub = Redis.createClient(options.port, options.host);
			self.redis_client_pub.on('error', function(error) {
				waterfall_callback('Could not create Redis pub client at ' + options.host + ':' + options.port + ': ' + error);
			});
			self.redis_client_pub.auth(options.password, waterfall_callback);
		},
		function(result, waterfall_callback) {
			// start "subscribe" redis client
			self.redis_client_sub = Redis.createClient(options.port, options.host);
			self.redis_client_sub.on('error', function(error) {
				waterfall_callback('Could not create Redis sub client at ' + options.host + ':' + options.port + ': ' + error);
			});
			self.redis_client_sub.auth(options.password, waterfall_callback);
		},
		function(result, waterfall_callback) {
			// initiate listening for inbound requests on subscribe channel
			self.redis_client_sub.subscribe('api_server_messages');
			self.redis_client_sub.on('message', _.bind(self._handle_redis_message, self));
			waterfall_callback();
		}
	], function(error) {
		if (error) {
			self.error('Could not start redis: ' + error);
			process.exit(1);
		}
		outer_callback();
	});
};

// Handle a message from the API server
Inbound_Email_Server.prototype._handle_redis_message = function(channel, message) {
	if (channel == 'api_server_messages') {
		try {
			var message_object = JSON.parse(message);
		}
		catch (error) {
			this.warn('Error parsing API server message (' + message + '): ' + error);
			return;
		}
	}
};

// Start polling for changes to the inbound email directory
// warning: PROCESS DIES ON FAILURE
Inbound_Email_Server.prototype._start_polling = function(callback) {
	var self = this;
	Watchr.watch({
		paths: [this.configuration.email.inbound_email_directory],
		listeners: {
			error: _.bind(function(error) {
				this.error('Error occurred during watching: ' + error);
			}, this),
			change: _.bind(this._on_change_file, this)
		},
		next: function(error, watchers) {
			if (error) {
				self.error("Setting up all watchers failed!", error);
			}
			else {
				self._watchers = watchers;
			}
		}
	});
	callback();
};

// Called upon a change of file in the inbound email directory
Inbound_Email_Server.prototype._on_change_file = function(change_type, file_path, file_current_stat, file_previous_stat) {
	var self = this;
	if (change_type == 'create') {
		self._handle_email(file_path, file_current_stat, false);
	}
	else if (change_type == 'update') {
		var index = self.rejected_files.indexOf(file_path);
		if (index != -1) {
			self.rejected_files.splice(index, 1);
		}
		self._handle_email(file_path, file_current_stat, true);
	}
};

// Extract a reply from the text of an incoming email
Inbound_Email_Server.prototype._extract_reply = function(text, address) {
	if (!text) return '';
	var qualified_address = address + '\\s*(\\(via ' + this.configuration.product.name + '\\))?\\s*(\\[mailto:.*\\])?';
	var escaped_address = address.replace(/\./, '\\.');
	var regexp_array = [
		new RegExp('(^_*$)(\n)?From:.*' + qualified_address, 'im'),
		new RegExp('(.*)\\(via ' + this.configuration.product.name + '\\)( <' + escaped_address + '>)? wrote:\n'),
		new RegExp('(.*)\\(via ' + this.configuration.product.name + '\\) <(.+)@(.+)>\n'),
		new RegExp('<' + qualified_address + '>', 'i'),
		new RegExp(qualified_address + '\\s+wrote:', 'i'),
		new RegExp('^(^\n)*On.*(\n)?.*wrote:$', 'im'),
		new RegExp('-+original\\s+message-+\\s*$', 'i'),
		new RegExp('from:\\s*$', 'i'),
		new RegExp('-- \n'),	// standard signature separator
		new RegExp('\\s*From:.*\\(via ' + this.configuration.product.name + '\\)\nSent:.*\nTo:.*\n')
	];
	var text_length = text.length;
    // calculates the matching regex closest to top of page
	var index = _.inject(regexp_array, function(memo, regexp) {
		var match = text.search(regexp);
		if (match != -1 && match < memo) {
			return match;
		}
		else {
			return memo;
		}
	}, text_length);
	return text.substring(0, index).trim();
};

// Ensure directory exists
Inbound_Email_Server.prototype._ensure_directory = function(directory, callback) {
	File_System.stat(directory, function(error, stats) {
		if (error || !stats.isDirectory()) {
			File_System.mkdir(directory, function(error) {
				if (error) return callback('could not create directory ' + directory + ': ' + error);
				callback();
			});
		}
		else {
			callback();
		}
	});
};

// Delete an array of files
Inbound_Email_Server.prototype._delete_files = function(files, outer_callback) {
	var self = this;
	ASync.forEach(files, function(file, foreach_callback) {
		File_System.unlink(file, function(error) {
			if (error) {
				self.warn('Unable to delete file "' + file + '": ' + error);
			}
			ASync.nextTick(foreach_callback);
		});
	}, outer_callback);
};

// Handle email attachements by uploading directly to s3 server
Inbound_Email_Server.prototype._handle_attachments = function(attachments, mail_object_attachments, base_name, outer_callback) {
	var self = this;
	var attachments_out = [];
	ASync.forEach(attachments, function(attachment, foreach_callback) {
		var mail_object_attachment = _.find(mail_object_attachments, function(mail_object_attachment) {
			return mail_object_attachment.contentId == attachment.contentId;
		});
		var size = mail_object_attachment ? mail_object_attachment.length : null;
		var filename = self.file_storage_service.pre_encode_filename(Path.basename(attachment.path));
		var error_message = 'Unable to handle attachment ' + base_name + '/' + filename + ': ';
		storage_path = self.configuration.s3.top_path ? self.configuration.s3.top_path + '/' : '';
		storage_path += 'email_files/' + (new Date().getTime()) + '_' + base_name + '/' + filename;
		var options = {
			path: attachment.path,
			filename: storage_path
		};
		self.file_storage_service.store_file(options, function(error, url, download_url, version_id, storage_path) {
			if (error) {
				self.error(error_message + 'unable to store file: ' + Errors.output(error, true));
			}
			else {
				attachments_out.push({
					storage_url: url,
					download_url: download_url,
					version_id: version_id,
					storage_path: storage_path,
					last_modified: (new Date).getTime(),
					size: size,
				});
			}
			foreach_callback();
		});
	}, function() {
		// delete the attachment files and directory
		self._delete_files(_.pluck(attachments, 'path'), function(error) {
			if (!error) {
				File_System.rmdir(Path.dirname(attachments[0].path));
			}
		});
		return outer_callback(null, attachments_out);
	});
};

//
// Private
// API_Server._encode_for_transfer
//
// purpose: Encode for encoded transfer
// arguments: object - object to encode
// returns: encoded text
//
Inbound_Email_Server.prototype._encode_for_transfer = function(object) {
	var self = this;
	if (_.isString(object)) {
		return encodeURIComponent(object);
	}
	else if (_.isArray(object)) {
		return _.map(object, function(element) { return self._encode_for_transfer(element); });
	}
	else if (_.isObject(object)) {
		var encoded = {};
		_.each(_.keys(object), function(key) {
			encoded[key] = self._encode_for_transfer(object[key]);
		});
		return encoded;
	}
	else {
		return object;
	}
};

// Send email info to API server
Inbound_Email_Server.prototype._send_email_to_api_server = function(mail_object, callback) {
	var self = this;
	var host = self.configuration.api.public_host || self.configuration.api.host;
	var post = self.configuration.api.public_port || self.configuration.api.port;
	var url = 'https://' + host + ':' + post;
	var url_object = URL.parse(url);
	var payload = JSON.stringify(mail_object);
	// form http request options
	var headers = {
		'Content-Type': 'application/json',
		'Content-Length': Buffer.byteLength(payload)
	};
	var request_options = {
		host: url_object.hostname,
		port: url_object.port,
		path: '/email',
		method: 'POST',
		headers: headers
	};
	// make the request
	var request = HTTPS.request(request_options, function(response) {
		if (response.statusCode < 200 || response.statusCode >= 300) {
			return callback('http request failed with status code: ' + response.statusCode, response);
		}
		return callback(null, response);
	});
	request.on('error', function(error) {
		return callback('http request to ' + url_object.hostname + ':' + url_object.port + ' failed: ' + error);
	});
	request.write(payload);
	request.end();
};

// Called when parsing an incoming email is complete
Inbound_Email_Server.prototype._handle_email = function(file_path, stat, already_mine) {
	var self = this;
	// we split the files up among the workers by examining the modified time and size of the file (randomish), mod by the number of workers,
	// and claim only those files that correspond to our assigned sequence number
	var modified_time = stat.mtime.getTime();
	var size = stat.size;
	var sequence_number = (Math.floor(modified_time / 1000) + size) % self.num_workers;
	if (sequence_number != self.sequence_number && !already_mine) {
		return;
	}
	var base_name;
	var file;
	var attachment_path;
	var mail_object;
	var got_error = false;
	var moved = false;
	var message_id = null;
	var message_lock = null;

	ASync.waterfall([
		function(waterfall_callback) {
			// move the file to the process directory
			base_name = Path.basename(file_path);
			self.log('Processing file: ' + base_name);
			file = Path.join(self.configuration.email.process_directory, base_name);
			File_System.rename(file_path, file, assert(waterfall_callback, 'unable to move email file to process directory'));
		},
		function(waterfall_callback) {
			moved = true;
			// create temp directory for any attachment files
			attachment_path = Path.join(self.configuration.email.temp_attachment_directory, base_name);
			self._ensure_directory(attachment_path, assert(waterfall_callback, 'unable to create directory for attachments'));
		},
		function(waterfall_callback) {
			// create a read stream on the email file
			var stream = File_System.createReadStream(file);
			stream.on('error', assert(waterfall_callback, 'error reading email file ' + file));
			// instantiate mail parser
			var mail_parser = new MailParser({streamAttachments: true});
			mail_parser.on('error', assert(waterfall_callback, 'error parsing email file ' + file));
			// handle attachments
			mail_parser.on('attachment', function(attachment) {
				var attachment_file = Path.join(attachment_path, attachment.generatedFileName);
				self.info('Writing attachment file ' + attachment_file);
				self.attachments[file] = self.attachments[file] || [];
				var attachment_index = self.attachments[file].length;
				var output = File_System.createWriteStream(attachment_file, {encoding: 'binary'});
				output.on('error', function(error) {
					self.warn('Error on writing attachment file ' + attachment_file + ': ', error);
					self.attachments[file][attachment_index].done = true;
					if (mail_object && (!self.attachments[file] || _.pluck(self.attachments[file], 'done').length == self.attachments[file].length)) {
						waterfall_callback();
					}
				});
				output.on('close', function() {
					self.info('Closed attachment file ' + attachment_file);
					self.attachments[file][attachment_index].done = true;
					if (
						mail_object &&
							(
								!self.attachments[file] ||
								_.compact(_.pluck(self.attachments[file], 'done')).length == self.attachments[file].length
							)
						) {
						waterfall_callback();
					}
				});
				self.attachments[file].push({
					path: attachment_file,
					contentId: attachment.contentId
				});
				attachment.stream.pipe(output);
			});
			mail_parser.on('end', function(the_mail_object) {
				if (got_error) return;  // short-circuit because we already got an error
				mail_object = the_mail_object;
				if (!mail_object || !_.isObject(mail_object.headers) || !_.isArray(mail_object.to) || !_.isArray(mail_object.from)) {
					self.rejected_files.push(file);
					// sometimes the watcher will see a new file and trigger us before the file is completely written, resulting in
					// an invalid email file; so we wait to see if it also triggers an update and we can process the file then
					setTimeout(function() {
						var index = self.rejected_files.indexOf(file);
						if (index != -1) {
							// don't let the array of rejected files grow forever
							self.rejected_files.splice(index, 1);
						}
					}, 60000);
					return waterfall_callback('email rejected because it does not conform to expected format');
				}
				if (!self.attachments[file] || _.compact(_.pluck(self.attachments[file], 'done')).length == self.attachments[file].length) {
					waterfall_callback();
				}
				else {
					self.info('Not all attachments are written yet, waiting...');
				}
			});
			stream.pipe(mail_parser);
		},
		function(waterfall_callback) {
			// lock the message id against other workers, ensure the same message only gets processed once
			message_id = mail_object.headers['message-id'];
			if (!message_id || !_.isString(message_id)) {
				self.warn('No Message-ID in incoming message ' + file_path + ', no lock acquired, may result in duplicate emails');
				return waterfall_callback(null, 1);
			}
			message_lock = message_id + JSON.stringify(mail_object.to) + JSON.stringify(mail_object.from);
			self.redis_client.hsetnx('email_message_locks', message_lock, 1,
				assert(waterfall_callback, 'unable to set message lock, message lock ' + message_lock));
		},
		function(got_lock, waterfall_callback) {
			if (!got_lock) {
				return waterfall_callback('email already handled');
			}
			// so that the we don't continue to add to the redis lock table indefinitely, clear this lock in 1 hour
			// if we get an email with the same Message-ID after that (very late delivery!), it will cause an out-of-sequence duplicate
			if (message_lock) {
				setTimeout(function() {
					self.redis_client.hdel('email_message_locks', message_lock, function(error) {
						if (error) {
							self.warn('Unable to release lock on message ' + file + ', message lock ' + message_lock + ': ' + error);
						}
					});
				}, 60 * 60 * 1000);
			}
			// reject anything that doesn't match our account
			var replyto_domain = self.configuration.email.email_replyto_domain.replace(/\./g, '\\.');
			var regexp = new RegExp(replyto_domain + '$');
			var approved_tos = [];
			var candidate_tos = (mail_object.to || []).
				concat((_.isArray(mail_object.cc) && mail_object.cc) || []).
				concat((_.isArray(mail_object.bcc) && mail_object.bcc) || []).
				concat((_.isArray(mail_object.headers['x-original-to']) && mail_object.headers['x-original-to']) || []).
				concat((_.isString(mail_object.headers['x-original-to']) && [mail_object.headers['x-original-to']]) || []).
				concat((_.isArray(mail_object.headers['delivered-to']) && mail_object.headers['delivered-to']) || []);
			for (var index = 0, length = candidate_tos.length; index < length; index++) {
				var to = candidate_tos[index];
				if (_.isString(to)) {
					to = { address: to };
				}
				if (to && _.isString(to.address) && to.address.match(regexp)) {
					approved_tos.push(to);
				}
				else {
					self.info('Rejecting email address ' + JSON.stringify(to) + ' in ' + file + ' because it does not match our domain of ' +
						self.configuration.email.email_replyto_domain);
				}
			}
			if (!approved_tos.length) {
				return waterfall_callback('email rejected because no EC recipients found');
			}
			mail_object.to = approved_tos;
			if (self.attachments[file]) {
				// handle attachments
				// unfortunately it seems like we need to give a little bit of time for the piped
				// streams to create the attachment files to close, or we get truncated files
				self._handle_attachments(self.attachments[file], (_.isArray(mail_object.attachments) && mail_object.attachments) || [], base_name,
					assert(waterfall_callback, 'error processing attachments'));
			}
			else {
				waterfall_callback(null, null);
			}
		},
		function(attachments, waterfall_callback) {
			delete self.attachments[file];
			if (attachments) {
				mail_object._ec_attachments = attachments;
			}
			// preprocess the text by extracting the reply
			mail_object.text = (_.isString(mail_object.text) && mail_object.text) || '';
			if (!mail_object.text && _.isString(mail_object.html)) {
				// attempt to parse out some basics here, but mostly ignore the html
				mail_object.text = _.unescape(
					mail_object.html.
						replace(/<p>(.*?)<\/p>/ig, function(match, text) { return text + '\n'; }).
						replace(/<div>(.*?)<\/div>/ig, function(match, text) { return text + '\n'; }).
						replace(/<br\s*\/?>(\n)?/ig, '\n').
						replace(/(<([^>]+)>)/ig, '').
						replace(/&nbsp;/ig, ' ')
				);
			}
			mail_object._ec_text = self._extract_reply(mail_object.text, self.configuration.email.email_notification_account);
			if (mail_object._ec_text || mail_object._ec_attachments) {
				// send to api server
				mail_object.html = (_.isString(mail_object.html) && mail_object.html) || '';
				mail_object.acl_secret = self.configuration.secrets.cookie;
				mail_object.mail_file = base_name;
				self.log('Sending email (' + base_name + ') from ' + JSON.stringify(mail_object.from) + ' to ' +
					JSON.stringify(mail_object.to) + ' to API server...');
				self._send_email_to_api_server(mail_object, assert(waterfall_callback, 'unable to send email to API server'));
			}
			else {
				waterfall_callback('email rejected because no text and no attachments');
			}
		}
	], function(error) {
		if (got_error) return;	// already processed an error, can just go home
		if (error) {
			got_error = true;
			if (moved) {
				var error_file = file + '.ERROR';
				var error_stream = File_System.createWriteStream(error_file);
				error_stream.on('error', function(file_error) {
					self.warn('Unable to write to error file on email rejection: ' + file_error)
				});
				error_stream.write(error);
				error_stream.end();
			}
			self.error(Errors.output(error, true));
		}
	});
};

Inbound_Email_Server.prototype._touch_files = function(callback) {
	var self = this;
	File_System.readdir(this.configuration.email.inbound_email_directory, function(error, files) {
		if (error) {
			self.error('Unable to read contents of email directory: ' + error);
			return callback();
		}
		ASync.forEach(files, function(file, foreach_callback) {
			file = Path.join(self.configuration.email.inbound_email_directory, file);
			Child_Process.exec('touch ' + file, function(error) {
				if (error) {
					self.error('Error touching file ' + file + ': ' + error);
				}
				ASync.nextTick(foreach_callback);
			});
		}, callback);
	});
};

// Include logging
var logger = new Logger({
	filename:'inbound-email-%Y%m%d.log',
	console: process.env.EC_ENV === 'dev' && !process.env.EC_ASYNC_LOG,
	symlink:'inbound-email.log'
});
logger.extend(Inbound_Email_Server.prototype);

// Trap uncaught exceptions, log, and exit
process.on('uncaughtException', function(error) {
	var exit_anyway = setTimeout(function() {
		process.exit(1);
	}, 1000);
	Inbound_Email_Server.prototype.critical('UNCAUGHT EXCEPTION: ' + error.message + '\n' + error.stack, function() {
		clearTimeout(exit_anyway);
		process.exit(1);
	});
});

_.extend(Inbound_Email_Server.prototype, Config.prototype);
exports.Inbound_Email_Server = Inbound_Email_Server;
