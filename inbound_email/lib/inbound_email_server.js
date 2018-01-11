// Provides an inbound email server which reads and processes mail files for use by
// the CodeStream API server
//
// We use a node module called watchr, which watches a particular directory (defined
// by environment variable) for files. When it sees one, it reads it in and parses
// it as a mail file, then sends the information along to the API server (via HTTPS)
// for further processing.

'use strict';

var FS = require('fs');
var BoundAsync = require(process.env.CS_INBOUND_EMAIL_TOP + '/server_utils/bound_async');
var Watchr = require('watchr');
var Path = require('path');
var ChildProcess = require('child_process');
var FileHandler = require('./file_handler');

class InboundEmailServer {

	constructor(config) {
		this.config = config;
		if (!config.noLogging) {
			this.logger = this.config.logger || console;
		}
	}

	// start 'er up
	start (callback) {
		this.numOpenTasks = 0;
		BoundAsync.series(this, [
			this.setListeners,	// set process listeners
			this.startWatching,	// start watching for files in the watched directory, representing inbound emails
			this.touchPreExistingFiles	// touch any pre-existing files, forcing them to trigger a change
		], (error) => {
			return callback && callback(error);
		});
	}

	// set relevant event listeners
	setListeners (callback) {
		process.on('message', this.handleMessage.bind(this));
		process.on('SIGINT', this.onSigint.bind(this));
		process.on('SIGTERM', this.onSigterm.bind(this));
		process.nextTick(callback);
	}

	// start watching for changes to the inbound email directory
	startWatching (callback) {
		this.watcher = Watchr.open(
			this.config.inboundEmail.inboundEmailDirectory,
			this.onFileChange.bind(this),
			error => {
				if (error) {
					return callback('Setting up watcher failed: ' + error);
				}
				this.log('Watching...');
				callback();
			}
		);
		this.watcher.on('error', error => {
			this.warn('Watcher emitted an error: ' + error);
		});
	};

	// called upon a change of file in the inbound email directory
	onFileChange (changeType, filePath) {
		if (changeType === 'create' || changeType === 'update') {
			// new file, handle the inbound email
			// or even for files that have been "updated", these may have been
			// created earlier, but processing couldn't proceed because the file
			// was incomplete
			this.handleEmail(filePath);
		}
	};

	// handle an email file, determine whether it is "ours" to process, and then process as needed
	handleEmail (filePath) {
		this.numOpenTasks++;
		new FileHandler({
			inboundEmailServer: this,
			filePath: filePath
		}).handle(() => {
			this.numOpenTasks--;
			if (this.numOpenTasks === 0) {
				this.noMoreTasks();	// in case shutdown is pending
			}
		});
	}

	// touch files that are already in the new directory ... this is in case of
	// a crash of the inbound email server, where we might miss a new file ... this
	// way we recover by triggering a change event on whatever files are there
	// upon startup
	touchPreExistingFiles (callback) {
		FS.readdir(
			this.config.inboundEmail.inboundEmailDirectory,
			(error, files) => {
				if (error) {
					this.warn(`Unable to read contents of inbound email directory: ${error}`);
					return callback();
				}
				BoundAsync.forEachLimit(
					this,
					files,
					10,
					this.touchFile,
					callback
				);
			}
		);
	}

	// touch a single file in the inbound email directory, see above
	touchFile (file, callback) {
		file = Path.join(this.config.inboundEmail.inboundEmailDirectory, file);
		ChildProcess.exec(
			`touch ${file}`,
			error => {
				if (error) {
					this.warn(`Error touching file ${file}: ${error}`);
				}
				process.nextTick(callback);
			}
		);
	}

	// handle a message from the master
	handleMessage (message) {
		if (typeof message !== 'object') { return; }
		if (message.shutdown) {
			// master is making us shut down, whether gracefully or not
			this.shutdown();
		}
		else if (message.wantShutdown) {
			// master wants us to shut down, but is giving us the chance to do it gracefully
			this.wantShutdown(message.signal || 'signal');
		}
		else if (message.youAre) {
			// master is telling us our worker ID and helping us identify ourselves in the logs
			this.workerId = message.youAre;
			if (this.config.logger) {
				this.loggerId = 'W' + this.workerId;
				this.config.logger.loggerId = this.loggerId;
				this.config.logger.loggerHost = this.config.express.host;
			}
		}
	}

	// forced shutdown ... boom!
	shutdown () {
		if (this.shuttingDown) { return; }
		this.shuttingDown = true;
		this.stopWatching();
		setTimeout(() => {
			process.exit(0);
		}, 100);
	}

	// master wants us to shutdown, but is giving us the chance to finish all open
	// tasks first ... if the master sends another signal within five seoncds,
	// we're going to commit suicide regardless ... meanie master
	wantShutdown (signal) {
		if (this.numOpenTasks && !this.killReceived) {
			// we've got some open tasks, and no additional commands to die
			this.critical(`Worker ${this.workerId} received ${signal}, waiting for ${numOpenTasks} tasks to complete, send ${signal} again to kill`);
			this.killReceived = true;
			// give the user 5 seconds to force-kill us, otherwise their chance to do so expires
			setTimeout(
				() => {
					this.killReceived = false;
					this.start();	// start watching again, false alarm
				},
				5000
			);
			this.stopWatching();
			this.shutdownPending = true;
		}
		else {
			if (this.numOpenTasks) {
				// the user is impatient, we'll die even though we have open tasks
				this.critical(`Worker ${this.workerId} received ${signal}, shutting down despite ${this.numOpenTasks} open requests...`);
			}
			else {
				// we have no open tasks, so we can just die
				this.critical(`Worker ${this.workerId} received ${signal} and has no open tasks, shutting down...`);
			}
			// seppuku
			this.shutdown();
		}
	}

	// signal that there are currently no open tasks
	noMoreTasks () {
		// if there is a shutdown pending (the master commanded us to shutdown, but is allowing all tasks to finish),
		// then since there are no more tasks, we can just die
		if (this.shutdownPending) {
			this.critical(`Worker ${this.workerId} has no more open tasks, shutting down...`);
			this.shutdown();
		}
	}

	// stop watching, we have a shutdown in progress
	stopWatching () {
		this.watcher.close();
	}

	onSigint () {
	}

	onSigterm () {
	}

	critical (message) {
		if (this.logger && typeof this.logger.critical === 'function') {
			this.logger.critical(message);
		}
	}

	error (message) {
		if (this.logger && typeof this.logger.error === 'function') {
			this.logger.error(message);
		}
	}

	warn (message) {
		if (this.logger && typeof this.logger.warn === 'function') {
			this.logger.warn(message);
		}
	}

	log (message) {
		if (this.logger && typeof this.logger.log === 'function') {
			this.logger.log(message);
		}
	}

	debug (message) {
		if (this.logger && typeof this.logger.debug === 'function') {
			this.logger.debug(message);
		}
	}
}

module.exports = InboundEmailServer;
