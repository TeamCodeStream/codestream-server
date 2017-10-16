'use strict';

var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var OS = require('os');
var Program = require('commander');
var Net = require('net');
var Cluster = require('cluster');
var API_Server = require(process.env.CS_API_TOP + '/lib/api_server/api_server');

Program
  .option('--one_worker [one_worker]', 'Use only one worker')
  .option('--override_config [config.key=value]', 'Override configuration value')
  .parse(process.argv);

class API_Cluster {

	constructor (config, logger) {
		this.config = config;
		this.logger = logger || console;
		this.workers = {};
		if (this.config.allow_config_override) {
			this.handle_config_overrides();
		}
	}

	start (callback) {
		if (Cluster.isMaster) {
			this.start_master(callback);
		}
		else {
			this.start_worker(callback);
		}
	}

	start_master (callback) {
		Bound_Async.series(this, [
			this.process_arguments,
			this.test_ports,
			this.start_workers
		], callback);
	}

	process_arguments (callback) {
		if (Program.one_worker) {
			this.one_worker = true;
		}
		process.nextTick(callback);
	}

	test_ports (callback) {
		if (!Cluster.isMaster) {
			return process.nextTick(callback);
		}
		const port = this.config.express && this.config.express.port;
		if (!port) {
			return process.nextTick(callback);
		}
		let test_socket = Net.connect(port);
		// Error means either there is nothing listening OR we can let the workers reliably trap the
		// error, for example EACCES
		test_socket.on('error', () => {
			test_socket.end();
			process.nextTick(callback);
		});
		// Connection made, something is already listening and we need to exit
		test_socket.on('connect', () => {
			test_socket.end();
			callback('port ' + port + ' is already in use');
		});
	}

	start_workers (callback) {
		this.num_cpus = this.one_worker ? 1 : OS.cpus().length;
		for (let i = 0; i < this.num_cpus; i++) {
			Cluster.fork();
		}
		Cluster.on('exit', this.on_exit.bind(this));
		Cluster.on('disconnect', this.on_disconnect.bind(this));
		Cluster.on('online', this.on_online.bind(this));
		process.on('SIGTERM', this.on_sigterm.bind(this));
		process.on('SIGINT', this.on_sigint.bind(this));
		process.nextTick(callback);
	}

	on_exit (worker, code, signal) {
		this.logger.warn('Worker ' + worker.id + ' (process ' + worker.process.pid + ') died with exit code:' + code + ' and signal:' + signal);

		// Firing up https server on the worker failed with a known error that will be fatal to all
		// children no matter how often restarted.  Kill the whole thing!!!
		if (code === 3) {
			this.dont_spawn_new_workers = true;
		}

		// if the cluster process sends an explicit shutdown message to the workers, we obviously
		// don't want to auto-revive them
		if (this.dont_spawn_new_workers === true) {
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

	on_disconnect (worker) {
		// Just a quick message to track when the master process sends an explicit
		// disconnect to the worker
		if (this.dont_spawn_new_workers === true) {
			this.logger.warn("Worker disconnected from cluster pool >"  + worker.process.pid + "<");
		}
		delete this.workers[worker.id];
	}

	on_online (worker) {
		this.logger.log('Worker ' + worker.id + ' is online');
		this.workers[worker.id] = worker;
		worker.on('message', this.on_worker_message);
		Cluster.workers[worker.id].send({ you_are: worker.id });
	}

	on_worker_message (message) {
		if (typeof message !== 'object') { return; }
	}

	on_sigterm () {
		this.logger.warn('Got SIGTERM');
		this.shutdown('SIGTERM');
	}

	on_sigint () {
		this.logger.warn('Got SIGINT');
		this.shutdown('SIGINT');
	}

	shutdown (signal) {
		this.dont_spawn_new_workers = true;   // don't fire the auto-revive code
		Object.keys(Cluster.workers).forEach(id => {
			this.shutdown_worker(id, signal);
		});
	}

	shutdown_worker (id, signal) {
		// Tell workers to start cleaning up.  Not all services automatically listen to
		// disconnect.
		try {
			Cluster.workers[id].send({
				want_shutdown: true,
				signal: signal
			});
		}
		catch (error) {
			this.logger.warn('Could not send shutdown signal to worker ' + id + ': ' + error);
		}
	}

	start_worker () {
		this.config.cluster = { worker_id: Cluster.worker.id };
		global.API_Server = this.api_server = new API_Server(this.config);
		this.api_server.start((error) => {
			if (error) {
				console.error('API server worker failed to start: ' + error);
				process.exit(3);	// 3 means to signal the master that we are not to be re-spawned
			}
		});
	}

	handle_config_overrides () {
		if (Program.override_config) {
			this.handle_config_override(Program.override_config);
		}
		/*
		_.each(
			Program.override_config,
			this.handle_config_override
		);
		*/
	}

	handle_config_override (override) {
		let match = override.match(/^(.*)\.(.*)=(.*)$/);
		if (!match || match.length < 4) {
			this.logger.warn('Ignoring configuration override (' + override + '), format is config.key=value');
			return;
		}
		this.logger.log('Setting config value ' + match[1] + '.' + match[2] + ' to ' + match[3]);
		this.config[match[1]][match[2]] = match[3];
	}
}

function Global_Error_Handler (error, type) {
	const message = (error instanceof Error) ?
		type + `: ${error.message}\n${error.stack}` :
		JSON.stringify(error);
	if (
		global.API_Server &&
		typeof global.API_Server === 'function'
	) {
		global.API_Server.critical(message);
	}
	console.error(message);
	process.exit(1);
}

// Trap uncaught exceptions, log, and exit
process.on('uncaughtException', (error) => {
	Global_Error_Handler(error, 'UNCAUGHT EXCEPTION');
});
process.on('unhandledRejection', (error) => {
	Global_Error_Handler(error, 'UNHANDLED REJECTION');
});

module.exports = API_Cluster;
