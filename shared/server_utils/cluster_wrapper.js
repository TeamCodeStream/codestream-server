// Invoke an API server using node's cluster module, which spawns as many worker
// threads as there are CPUs available on the host machine

'use strict';

const OS = require('os');
const Program = require('commander');
const Cluster = require('cluster');
const DevSecrets = require('./dev_secrets.js');

Program
	.option('--one_worker [one_worker]', 'Use only one worker')	// force to use only worker, sometimes desirable for clarity when reading output
	.option('--dev_secrets', 'Load vault secrets at runtime')
	.parse(process.argv);

class ClusterWrapper {

	// construct a wrapper class around node cluster
	// serverClass is the class of the server to instantiate for each worker
	// serverOptions are a black box of options that are passed to the server class upon construction
	// options are options for ClusterWrapper itself (not a black box)
	constructor (serverClass, serverOptions = {}, options = {}) {
		if (!serverClass) {
			throw new Error('serverClass must be provided in ClusterWrapper constructor');
		}
		this.serverClass = serverClass;
		this.serverOptions = serverOptions;
		this.options = options;
		this.logger = this.options.logger || console;
		this.workers = {};
		this.env = {};
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
		await this.readDevSecrets();
		this.startWorkers();
	}

	processArguments () {
		if (Program.one_worker || this.options.oneWorker) {
			this.oneWorker = true;
		}
		if (Program.dev_secrets) {
			this.devSecrets = true;
		}
	}

	async readDevSecrets () {
		if (!this.devSecrets) { return; }
		this.env = await DevSecrets.readVaultDevSecrets();
	}

	startWorkers () {
		// spawn one worker for each available CPU, and set up some events to listen to
		this.numCpus = this.oneWorker ? 1 : OS.cpus().length;
		const workerEnv = Object.assign({}, process.env, this.env);
		for (let i = 0; i < this.numCpus; i++) {
			Cluster.fork(workerEnv);
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
			if (Object.keys(this.workers).length === 0) {
				console.warn('All workers died, cluster master going down...');
				process.exit(0);
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
		setTimeout(() => { // (hack: make sure worker is actually up and listening)
			if (Cluster.workers[worker.id]) {
				Cluster.workers[worker.id].send({ youAre: worker.id, firstWorker });
			}
		}, 1000);
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
