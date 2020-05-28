// Provides an inbound email server which reads and processes mail files for use by
// the CodeStream API server
//
// We use a node module called watchr, which watches a particular directory (defined
// by environment variable) for files. When it sees one, it reads it in and parses
// it as a mail file, then sends the information along to the API server (via HTTPS)
// for further processing.

'use strict';

const FS = require('fs');
const Path = require('path');
const ChildProcess = require('child_process');
const FileHandler = require('./file_handler');
const OS = require('os');
const { callbackWrap } = require(process.env.CS_MAILIN_TOP + '/server_utils/await_utils');

class InboundEmailServer {

	constructor (options = {}) {
		this.serverOptions = options;
		this.config = options.config || {};
		if (!this.config.noLogging) {
			this.logger = options.logger || console;
		}
		this.inProcess = {};
	}

	// start 'er up
	async start () {
		this.numOpenTasks = 0;
		this.setListeners();	// set process listeners
		this.startWatching();	// start watching for files in the watched directory, representing inbound emails
		await this.touchPreExistingFiles();	// touch any pre-existing files, forcing them to trigger a change
	}

	// set relevant event listeners
	setListeners () {
		process.on('message', this.handleMessage.bind(this));
		process.on('SIGINT', this.onSigint.bind(this));
		process.on('SIGTERM', this.onSigterm.bind(this));
	}

	// start watching for changes to the inbound email directory
	startWatching () {
		const path = this.config.inboundEmail.inboundEmailDirectory;
		this.log(`Watching ${path}...`);
		FS.watch(path, this.onFileChange.bind(this));
	}

	// called upon a change of file in the inbound email directory
	async onFileChange (changeType, file) {
		this.log(`Got ${changeType} notification: ${file}`);
		if (changeType === 'rename' || changeType === 'change') {

			// guard against multiple notifications
			if (this.inProcess[file]) {
				this.log('Already in process, ignoring ' + file);
				return;
			}
			this.inProcess[file] = true;
			setTimeout(() => {
				delete this.inProcess[file];
			}, 60000);

			// new file, handle the inbound email
			// or even for files that have been "updated", these may have been
			// created earlier, but processing couldn't proceed because the file
			// was incomplete
			const path = this.config.inboundEmail.inboundEmailDirectory;
			const filePath = Path.join(path, file);
			this.log('Accessing ' + file);
			FS.access(filePath, error => {
				if (!error) {
					this.handleEmail(filePath);
				}
				else {
					const message = error instanceof Error ? error.message : JSON.stringify(error);
					this.warn(`ERROR ACCESSING ${filePath}: ${message}`);
				}
			});
		}
	}

	// handle an email file, determine whether it is "ours" to process, and then process as needed
	async handleEmail (filePath) {
		this.numOpenTasks++;
		this.log('Handling ' + filePath);
		await new FileHandler({
			inboundEmailServer: this,
			filePath: filePath
		}).handle();
		this.numOpenTasks--;
		if (this.numOpenTasks === 0) {
			this.noMoreTasks();	// in case shutdown is pending
		}
	}

	// touch files that are already in the new directory ... this is in case of
	// a crash of the inbound email server, where we might miss a new file ... this
	// way we recover by triggering a change event on whatever files are there
	// upon startup
	async touchPreExistingFiles () {
		let files;
		try {
			files = await callbackWrap(
				FS.readdir,
				this.config.inboundEmail.inboundEmailDirectory
			);
		}
		catch (error) {
			return this.warn(`Unable to read contents of inbound email directory: ${error}`);
		}
		await Promise.all(files.map(async file => {
			await this.touchFile(file);
		}));
	}

	// touch a single file in the inbound email directory, see above
	async touchFile (file) {
		file = Path.join(this.config.inboundEmail.inboundEmailDirectory, file);
		try {
			await callbackWrap(
				ChildProcess.exec,
				`touch ${file}`
			);
		}
		catch (error) {
			this.warn(`Error touching file ${file}: ${error}`);
		}
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
				this.config.logger.loggerHost = OS.hostname();
			}
		}
	}

	// forced shutdown ... boom!
	shutdown () {
		if (this.shuttingDown) { return; }
		this.shuttingDown = true;
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
			this.critical(`Worker ${this.workerId} received ${signal}, waiting for ${this.numOpenTasks} tasks to complete, send ${signal} again to kill`);
			this.killReceived = true;
			// give the user 5 seconds to force-kill us, otherwise their chance to do so expires
			setTimeout(
				() => {
					this.killReceived = false;
					this.start();	// start watching again, false alarm
				},
				5000
			);
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
	
	onSigint () {
	}

	onSigterm () {
	}

	critical (message, file) {
		if (this.logger && typeof this.logger.critical === 'function') {
			this.logger.critical(message, file);
		}
	}

	error (message, file) {
		if (this.logger && typeof this.logger.error === 'function') {
			this.logger.error(message, file);
		}
	}

	warn (message, file) {
		if (this.logger && typeof this.logger.warn === 'function') {
			this.logger.warn(message, file);
		}
	}

	log (message, file) {
		if (this.logger && typeof this.logger.log === 'function') {
			this.logger.log(message, file);
		}
	}

	debug (message, file) {
		if (this.logger && typeof this.logger.debug === 'function') {
			this.logger.debug(message, file);
		}
	}
}

module.exports = InboundEmailServer;
