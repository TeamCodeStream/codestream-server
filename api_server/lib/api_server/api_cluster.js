'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var OS = require('os');
var Program = require('commander');
var Net = require('net');
var Cluster = require('cluster');
var APIServer = require(process.env.CS_API_TOP + '/lib/api_server/api_server');

Program
  .option('--one_worker [one_worker]', 'Use only one worker')
  .option('--overrideConfig [config.key=value]', 'Override configuration value')
  .parse(process.argv);

class APICluster {

	constructor (config, logger) {
		this.config = config;
		this.logger = logger || console;
		this.workers = {};
		if (this.config.allowConfigOverride) {
			this.handleConfigOverrides();
		}
	}

	start (callback) {
		if (Cluster.isMaster) {
			this.startMaster(callback);
		}
		else {
			this.startWorker(callback);
		}
	}

	startMaster (callback) {
		BoundAsync.series(this, [
			this.processArguments,
			this.testPorts,
			this.startWorkers
		], callback);
	}

	processArguments (callback) {
		if (Program.one_worker) {
			this.oneWorker = true;
		}
		process.nextTick(callback);
	}

	testPorts (callback) {
		if (!Cluster.isMaster) {
			return process.nextTick(callback);
		}
		const port = this.config.express && this.config.express.port;
		if (!port) {
			return process.nextTick(callback);
		}
		let testSocket = Net.connect(port);
		// Error means either there is nothing listening OR we can let the workers reliably trap the
		// error, for example EACCES
		testSocket.on('error', () => {
			testSocket.end();
			process.nextTick(callback);
		});
		// Connection made, something is already listening and we need to exit
		testSocket.on('connect', () => {
			testSocket.end();
			callback('port ' + port + ' is already in use');
		});
	}

	startWorkers (callback) {
		this.numCpus = this.oneWorker ? 1 : OS.cpus().length;
		for (let i = 0; i < this.numCpus; i++) {
			Cluster.fork();
		}
		Cluster.on('exit', this.onExit.bind(this));
		Cluster.on('disconnect', this.onDisconnect.bind(this));
		Cluster.on('online', this.onOnline.bind(this));
		process.on('SIGTERM', this.onSigterm.bind(this));
		process.on('SIGINT', this.onSigint.bind(this));
		process.nextTick(callback);
	}

	onExit (worker, code, signal) {
		this.logger.warn('Worker ' + worker.id + ' (process ' + worker.process.pid + ') died with exit code:' + code + ' and signal:' + signal);

		// Firing up https server on the worker failed with a known error that will be fatal to all
		// children no matter how often restarted.  Kill the whole thing!!!
		if (code === 3) {
			this.dontSpawnNewWorkers = true;
		}

		// if the cluster process sends an explicit shutdown message to the workers, we obviously
		// don't want to auto-revive them
		if (this.dontSpawnNewWorkers === true) {
			if (code === 3) {
				this.logger.warn("Fatal error; unable to spawn worker threads without them immediately dying");
			}
			else {
				this.logger.warn("Got shutdown; will not restart worker threads");
			}
		}
		else {
			Cluster.fork();
		}
		delete this.workers[worker.id];
	}

	onDisconnect (worker) {
		// Just a quick message to track when the master process sends an explicit
		// disconnect to the worker
		if (this.dontSpawnNewWorkers === true) {
			this.logger.warn("Worker disconnected from cluster pool >"  + worker.process.pid + "<");
		}
		delete this.workers[worker.id];
	}

	onOnline (worker) {
		this.logger.log('Worker ' + worker.id + ' is online');
		this.workers[worker.id] = worker;
		worker.on('message', this.onWorkerMessage);
		Cluster.workers[worker.id].send({ youAre: worker.id });
	}

	onWorkerMessage (message) {
		if (typeof message !== 'object') { return; }
	}

	onSigterm () {
		this.logger.warn('Got SIGTERM');
		this.shutdown('SIGTERM');
	}

	onSigint () {
		this.logger.warn('Got SIGINT');
		this.shutdown('SIGINT');
	}

	shutdown (signal) {
		this.dontSpawnNewWorkers = true;   // don't fire the auto-revive code
		Object.keys(Cluster.workers).forEach(id => {
			this.shutdownWorker(id, signal);
		});
	}

	shutdownWorker (id, signal) {
		// Tell workers to start cleaning up.  Not all services automatically listen to
		// disconnect.
		try {
			Cluster.workers[id].send({
				wantShutdown: true,
				signal: signal
			});
		}
		catch (error) {
			this.logger.warn('Could not send shutdown signal to worker ' + id + ': ' + error);
		}
	}

	startWorker () {
		this.config.cluster = { workerId: Cluster.worker.id };
		global.APIServer = this.apiServer = new APIServer(this.config);
		this.apiServer.start((error) => {
			if (error) {
				console.error('API server worker failed to start: ' + error);
				process.exit(3);	// 3 means to signal the master that we are not to be re-spawned
			}
		});
	}

	handleConfigOverrides () {
		if (Program.overrideConfig) {
			this.handleConfigOverride(Program.overrideConfig);
		}
		/*
		_.each(
			Program.overrideConfig,
			this.handleConfigOverride
		);
		*/
	}

	handleConfigOverride (override) {
		let match = override.match(/^(.*)\.(.*)=(.*)$/);
		if (!match || match.length < 4) {
			this.logger.warn('Ignoring configuration override (' + override + '), format is config.key=value');
			return;
		}
		this.logger.log('Setting config value ' + match[1] + '.' + match[2] + ' to ' + match[3]);
		this.config[match[1]][match[2]] = match[3];
	}
}

function GlobalErrorHandler (error, type) {
	const message = (error instanceof Error) ?
		type + `: ${error.message}\n${error.stack}` :
		JSON.stringify(error);
	if (
		global.APIServer &&
		typeof global.APIServer === 'function'
	) {
		global.APIServer.critical(message);
	}
	console.error(message);
	process.exit(1);
}

// Trap uncaught exceptions, log, and exit
process.on('uncaughtException', (error) => {
	GlobalErrorHandler(error, 'UNCAUGHT EXCEPTION');
});
process.on('unhandledRejection', (error) => {
	GlobalErrorHandler(error, 'UNHANDLED REJECTION');
});

module.exports = APICluster;
