// Invoke an API server using node's cluster module, which spawns as many worker
// threads as there are CPUs available on the host machine

'use strict';

const OS = require('os');
const Program = require('commander');
const Net = require('net');
const Cluster = require('cluster');
const AwaitUtils = require('./await_utils');

Program
	.option('--one_worker [one_worker]', 'Use only one worker')	// force to use only worker, sometimes desirable for clarity when reading output
	.parse(process.argv);

class ClusterWrapper {

	constructor (serverClass, serverOptions = {}, options = {}) {
		if (!serverClass) {
			throw new Error('serverClass must be provided in ClusterWrapper constructor');
		}
		this.serverClass = serverClass;
		this.serverOptions = serverOptions;
		this.options = options;
		this.logger = this.serverOptions.logger || console;
		this.workers = {};
	}

	async start () {
		if (Cluster.isMaster) {
			// start up this thread as the master, this thread tracks the workers and re-spawns them if they die
			await this.startMaster();
		}
		else {
			// start up this thread as a worker
			await this.startWorker();
		}
	}

	async startMaster () {
		this.processArguments();
		await AwaitUtils.callbackWrap(this.testPorts.bind(this));
		this.startWorkers();
	}

	processArguments () {
		if (Program.one_worker || this.options.oneWorker || process.env.CS_API_MOCK_MODE) {
			this.oneWorker = true;
		}
	}

	testPorts (callback) {
		// here we test our listen port for availability, before we actually start spawning workers to listen
		const port = this.serverOptions.config && this.serverOptions.config.express && this.serverOptions.config.express.port;
		if (!port) { return callback(); }
		const testSocket = Net.connect(port);

		// error means either there is nothing listening OR we can let the workers reliably trap the
		// error, for example EACCES
		testSocket.on('error', () => {
			testSocket.end();
			process.nextTick(callback);
		});
		// connection made, something is already listening and we need to exit
		testSocket.on('connect', () => {
			testSocket.end();
			callback(`port ${port} is already in use`);
		});
	}

	startWorkers () {
		// spawn one worker for each available CPU, and set up some events to listen to
		this.numCpus = this.oneWorker ? 1 : OS.cpus().length;
		for (let i = 0; i < this.numCpus; i++) {
			Cluster.fork();
		}
		Cluster.on('exit', this.onExit.bind(this));
		Cluster.on('disconnect', this.onDisconnect.bind(this));
		Cluster.on('online', this.onOnline.bind(this));
		process.on('SIGTERM', this.onSigterm.bind(this));
		process.on('SIGINT', this.onSigint.bind(this));
	}

	onExit (worker, code, signal) {
		// a worker died, we'll attempt to respawn if appropriate
		this.logger.critical(`Worker ${worker.id} (process ${worker.process.pid}) died with exit code:${code} and signal:${signal}`);

		// failed with a known error that will be fatal to all children no matter
		// how often restarted ... so kill the whole thing!!!
		if (code === 3) {
			this.dontSpawnNewWorkers = true;
		}

		// if the cluster process sends an explicit shutdown message to the workers, we obviously
		// don't want to auto-revive them
		if (this.dontSpawnNewWorkers === true) {
			if (code === 3) {
				this.logger.critical('Fatal error; unable to spawn worker threads without them immediately dying');
			}
			else {
				this.logger.critical('Got shutdown; will not restart worker threads');
			}
		}
		else {
			// good to go!
			Cluster.fork();
		}
		// we'll get a new worker ID, send this one to its grave
		delete this.workers[worker.id];
	}

	onDisconnect (worker) {
		// just a quick message to track when the master process sends an explicit
		// disconnect to the worker
		if (this.dontSpawnNewWorkers === true) {
			this.logger.critical(`Worker disconnected from cluster pool >${worker.process.pid}<`);
		}
		delete this.workers[worker.id];
	}

	onOnline (worker) {
		// yay! a worker is up and running
		this.logger.log(`Worker ${worker.id} is online`);
		this.workers[worker.id] = worker;
		worker.on('message', this.onWorkerMessage);
		// let the worker know what its ID is
		const firstWorker = !this.gotFirstWorker;
		Cluster.workers[worker.id].send({ youAre: worker.id, firstWorker });
		this.gotFirstWorker = true;
	}

	onWorkerMessage (message) {
		if (typeof message !== 'object') { return; }
		// not doing anything with this, for now
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
		// tell workers to start cleaning up ... not all services automatically listen to
		// disconnect
		try {
			Cluster.workers[id].send({
				wantShutdown: true,
				signal: signal
			});
		}
		catch (error) {
			this.logger.warn(`Could not send shutdown signal to worker ${id}: ${error}`);
		}
	}

	startWorker () {
		// start up the worker thread by invoking an object of the provided serverClass
		// and kicking things off
		global.ServerObject = new this.serverClass(this.serverOptions);
		global.ServerObject.start((error) => {
			if (error) {
				console.error('server worker failed to start: ' + error); // eslint-disable-line no-console
				process.exit(3);	// 3 means to signal the master that we are not to be re-spawned
			}
		});
	}
}

// establish a global error handler function, for handling uncaught exceptions
function GlobalErrorHandler (error, type) {
	// we'll attempt to output the message and then intentionally idea, hoping to be respawned
	const message = (error instanceof Error) ?
		type + `: ${error.message}\n${error.stack}` :
		JSON.stringify(error);
	if (
		global.ServerObject &&
		typeof global.ServerObject.critical === 'function'
	) {
		global.ServerObject.critical(message);
	}
	console.error(message); // eslint-disable-line no-console
	process.exit(1);
}

// trap uncaught exceptions, log, and exit
process.on('uncaughtException', (error) => {
	GlobalErrorHandler(error, 'UNCAUGHT EXCEPTION');
});
process.on('unhandledRejection', (error) => {
	GlobalErrorHandler(error, 'UNHANDLED REJECTION');
});

module.exports = ClusterWrapper;
