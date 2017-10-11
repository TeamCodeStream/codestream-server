'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var API_Server_Modules = require('./api_server_modules.js');
var Express = require('express');
var HTTPS = require('https');
var HTTP = require('http');
var FS = require('fs');

class API_Server {

	constructor (config) {
		this.config = config;
		if (!config.no_logging) {
			this.logger = this.config.logger || console;
		}
		this.express = Express();
		this.services = {};
		this.data = {};
	}

	start (callback) {
		Bound_Async.series(this, [
			this.set_listeners,
			this.load_modules,
			this.start_services,
			this.register_middleware,
			this.register_routes,
			this.register_data_sources,
			this.listen
		], (error) => {
			return callback && callback(error);
		});
	}

	set_listeners (callback) {
		process.on('message', this.handle_message.bind(this));
		process.on('SIGINT', this.on_sigint.bind(this));
		process.on('SIGTERM', this.on_sigterm.bind(this));
		process.nextTick(callback);
	}

	load_modules (callback) {
		this.log('Loading modules...');
		this.modules = new API_Server_Modules({
			api: this
		});
		this.modules.load_modules(callback);
	}

	start_services (callback) {
		this.log('Starting services...');
		let service_functions = this.modules.get_service_functions();
		Bound_Async.forEachLimit(
			this,
			service_functions,
			10,
			this.start_service,
			callback
		);
	}

	start_service (service_function, callback) {
		service_function(
			(error, services_to_accept) => {
				if (error) { return callback(error); }
				this.accept_services(services_to_accept, callback);
			}
		);
	}

	accept_services (services, callback) {
		Bound_Async.forEachLimit(
			this,
			services,
			10,
			this.accept_service,
			callback
		);
	}

	accept_service (service, callback) {
		Object.assign(this.services, service);
		process.nextTick(callback);
	}

	register_middleware (callback) {
		this.log('Registering middleware...');
		this.express.use(this.setup_request.bind(this));
		let middleware_functions = this.modules.get_middleware_functions();
		Bound_Async.forEachLimit(
			this,
			middleware_functions,
			10,
			this.register_middleware_function,
			() => {
				this.register_error_handler(callback);
			}
		);
	}

	register_error_handler (callback) {
		this.express.use((error, request, response, next) => {
			this.error('Express error: ' + error.message + '\n' + error.stack);
			if (!response.headersSent) {
				response.sendStatus(500);
			}
			request.connection.destroy();
			return next; // this makes jshint happy but doesn't call next()
		});
		callback();
	}

	setup_request (request, response, next) {
		request.api = this;
		request.api_modules = this.modules;
		process.nextTick(next);
	}

	register_middleware_function (middleware, callback) {
		this.express.use(middleware);
		process.nextTick(callback);
	}

	register_data_sources (callback) {
		this.log('Registering data sources...');
		let data_source_functions = this.modules.get_data_source_functions();
		Bound_Async.forEachLimit(
			this,
			data_source_functions,
			10,
			this.register_data_source,
			callback
		);
	}

	register_data_source (data_source_function, callback) {
		let data_source = data_source_function();
		Object.assign(this.data, data_source);
		return process.nextTick(callback);
	}

	register_routes (callback) {
		this.log('Registering routes...');
		let route_objects = this.modules.get_route_objects();
		Bound_Async.forEachLimit(
			this,
			route_objects,
			10,
			this.register_route_object,
			callback
		);
	}

	register_route_object (route_object, callback) {
		let middleware = route_object.middleware || [];
		let args = [ route_object.path, ...middleware, route_object.func];
		this.express[route_object.method].apply(this.express, args);
		process.nextTick(callback);
	}

	listen (callback) {
		const server_options = this.get_server_options();
		if (typeof server_options === 'string') {
			return callback('failed to make server options: ' + server_options);
		}
		if (this.config.express.https && !this.config.express.ignore_https) {
			this.log('Creating HTTPS server...');
			this.express_server = HTTPS.createServer(
				server_options,
				this.express
			).listen(this.config.express.port);
		}
		else {
			this.log('Creating HTTP server...');
			this.express_server = HTTP.createServer(
				this.express
			).listen(this.config.express.port);
		}
		this.express_server.on('error', (error) => {
			callback('Unable to start server on port ' + this.config.express.port + ': ' + error);
		});
		this.express_server.on('listening', () => {
			this.log('Listening on port ' + this.config.express.port + '...');
			callback();
		});
	}

	get_server_options () {
		let options = {};
		const error = this.make_https_options(options);
		if (error) {
			return error;
		}
		return options;
	}

	make_https_options (options) {
		if (
			this.config.express.https &&
			this.config.express.https.keyfile &&
			this.config.express.https.certfile
		) {
			try {
				options.key = FS.readFileSync(this.config.express.https.keyfile);
			}
			catch(error) {
				return 'could not read private key file: ' + this.config.express.https.keyfile + ': ' + error;
			}
			try {
				options.cert = FS.readFileSync(this.config.express.https.certfile);
			}
			catch(error) {
				return 'could not read certificate file: ' + this.config.express.https.certfile + ': ' + error;
			}
			if (this.config.express.https.cafile) {
				let ca_certificate;
				try {
					ca_certificate = FS.readFileSync(this.config.express.https.cafile);
				}
				catch(error) {
					return 'could not read certificate chain file: ' + this.config.express.https.cafile + ': ' + error;
				}
				options.ca = ca_certificate;
			}
		}
	}

	handle_message (message) {
		if (typeof message !== 'object') { return; }
		if (message.shutdown) {
			this.shutdown();
		}
		else if (message.want_shutdown) {
			this.want_shutdown(message.signal || 'signal');
		}
		else if (message.you_are) {
			this.worker_id = message.you_are;
			if (this.config.logger) {
				this.logger_id = 'W' + this.worker_id;
				this.config.logger.logger_id = this.logger_id;
				this.config.logger.logger_host = this.config.express.host;
			}
		}
	}

	shutdown () {
		if (this.shutting_down) { return; }
		this.shutting_down = true;
		setTimeout(() => {
			process.exit(0);
		}, 100);
	}

	want_shutdown (signal) {
		let num_open_requests =
			this.services.request_tracker &&
			this.services.request_tracker.num_open_requests();

		if (num_open_requests && !this.kill_received) {
			this.critical('Worker ' + this.worker_id + ' received ' + signal + ', waiting for ' + num_open_requests + ' requests to complete, send ' + signal + ' again to kill');
			this.kill_received = true;
			setTimeout(
				() => {	this.kill_received = false; },
				5000
			);
			this.express_server.close();
			this.shutdown_pending = true;
		}
		else {
			if (num_open_requests) {
				this.critical('Worker ' + this.worker_id + ' received ' + signal + ', shutting down despite ' + num_open_requests + ' open requests...');
			}
			else {
				this.critical('Worker ' + this.worker_id + ' received ' + signal + ' and has no open requests, shutting down...');
			}
			this.shutdown();
		}
	}

	no_more_requests () {
		if (this.shutdown_pending) {
			this.critical('Worker ' + this.worker_id + ' has no more open requests, shutting down...');
			this.shutdown();
		}
	}

	on_sigint () {
	}

	on_sigterm () {
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

module.exports = API_Server;
