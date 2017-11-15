'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var APIServerModules = require('./api_server_modules.js');
var Express = require('express');
var HTTPS = require('https');
var HTTP = require('http');
var FS = require('fs');

class APIServer {

	constructor (config) {
		this.config = config;
		if (!config.noLogging) {
			this.logger = this.config.logger || console;
		}
		this.express = Express();
		this.services = {};
		this.data = {};
	}

	start (callback) {
		BoundAsync.series(this, [
			this.setListeners,
			this.loadModules,
			this.startServices,
			this.registerMiddleware,
			this.registerRoutes,
			this.registerDataSources,
			this.listen
		], (error) => {
			return callback && callback(error);
		});
	}

	setListeners (callback) {
		process.on('message', this.handleMessage.bind(this));
		process.on('SIGINT', this.onSigint.bind(this));
		process.on('SIGTERM', this.onSigterm.bind(this));
		process.nextTick(callback);
	}

	loadModules (callback) {
		this.log('Loading modules...');
		this.modules = new APIServerModules({
			api: this
		});
		this.modules.loadModules(callback);
	}

	startServices (callback) {
		this.log('Starting services...');
		let serviceFunctions = this.modules.getServiceFunctions();
		BoundAsync.forEachLimit(
			this,
			serviceFunctions,
			10,
			this.startService,
			callback
		);
	}

	startService (serviceFunction, callback) {
		serviceFunction(
			(error, servicesToAccept) => {
				if (error) { return callback(error); }
				this.acceptServices(servicesToAccept, callback);
			}
		);
	}

	acceptServices (services, callback) {
		BoundAsync.forEachLimit(
			this,
			services,
			10,
			this.acceptService,
			callback
		);
	}

	acceptService (service, callback) {
		Object.assign(this.services, service);
		process.nextTick(callback);
	}

	registerMiddleware (callback) {
		this.log('Registering middleware...');
		this.express.use(this.setupRequest.bind(this));
		let middlewareFunctions = this.modules.getMiddlewareFunctions();
		BoundAsync.forEachLimit(
			this,
			middlewareFunctions,
			10,
			this.registerMiddlewareFunction,
			() => {
				this.registerErrorHandler(callback);
			}
		);
	}

	registerErrorHandler (callback) {
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

	setupRequest (request, response, next) {
		request.api = this;
		request.apiModules = this.modules;
		process.nextTick(next);
	}

	registerMiddlewareFunction (middleware, callback) {
		this.express.use(middleware);
		process.nextTick(callback);
	}

	registerDataSources (callback) {
		this.log('Registering data sources...');
		let dataSourceFunctions = this.modules.getDataSourceFunctions();
		BoundAsync.forEachLimit(
			this,
			dataSourceFunctions,
			10,
			this.registerDataSource,
			callback
		);
	}

	registerDataSource (dataSourceFunction, callback) {
		let dataSource = dataSourceFunction();
		Object.assign(this.data, dataSource);
		return process.nextTick(callback);
	}

	registerRoutes (callback) {
		this.log('Registering routes...');
		let routeObjects = this.modules.getRouteObjects();
		BoundAsync.forEachLimit(
			this,
			routeObjects,
			10,
			this.registerRouteObject,
			callback
		);
	}

	registerRouteObject (routeObject, callback) {
		let middleware = routeObject.middleware || [];
		let args = [ routeObject.path, ...middleware, routeObject.func];
		this.express[routeObject.method].apply(this.express, args);
		process.nextTick(callback);
	}

	listen (callback) {
		const serverOptions = this.getServerOptions();
		if (typeof serverOptions === 'string') {
			return callback('failed to make server options: ' + serverOptions);
		}
		if (this.config.express.https && !this.config.express.ignoreHttps) {
			this.log('Creating HTTPS server...');
			this.expressServer = HTTPS.createServer(
				serverOptions,
				this.express
			).listen(this.config.express.port);
		}
		else {
			this.log('Creating HTTP server...');
			this.expressServer = HTTP.createServer(
				this.express
			).listen(this.config.express.port);
		}
		this.expressServer.on('error', (error) => {
			callback('Unable to start server on port ' + this.config.express.port + ': ' + error);
		});
		this.expressServer.on('listening', () => {
			this.log('Listening on port ' + this.config.express.port + '...');
			callback();
		});
	}

	getServerOptions () {
		let options = {};
		const error = this.makeHttpsOptions(options);
		if (error) {
			return error;
		}
		return options;
	}

	makeHttpsOptions (options) {
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
				let caCertificate;
				try {
					caCertificate = FS.readFileSync(this.config.express.https.cafile);
				}
				catch(error) {
					return 'could not read certificate chain file: ' + this.config.express.https.cafile + ': ' + error;
				}
				options.ca = caCertificate;
			}
		}
	}

	handleMessage (message) {
		if (typeof message !== 'object') { return; }
		if (message.shutdown) {
			this.shutdown();
		}
		else if (message.wantShutdown) {
			this.wantShutdown(message.signal || 'signal');
		}
		else if (message.youAre) {
			this.workerId = message.youAre;
			if (this.config.logger) {
				this.loggerId = 'W' + this.workerId;
				this.config.logger.loggerId = this.loggerId;
				this.config.logger.loggerHost = this.config.express.host;
			}
		}
	}

	shutdown () {
		if (this.shuttingDown) { return; }
		this.shuttingDown = true;
		setTimeout(() => {
			process.exit(0);
		}, 100);
	}

	wantShutdown (signal) {
		let numOpenRequests =
			this.services.requestTracker &&
			this.services.requestTracker.numOpenRequests();

		if (numOpenRequests && !this.killReceived) {
			this.critical('Worker ' + this.workerId + ' received ' + signal + ', waiting for ' + numOpenRequests + ' requests to complete, send ' + signal + ' again to kill');
			this.killReceived = true;
			setTimeout(
				() => {	this.killReceived = false; },
				5000
			);
			this.expressServer.close();
			this.shutdownPending = true;
		}
		else {
			if (numOpenRequests) {
				this.critical('Worker ' + this.workerId + ' received ' + signal + ', shutting down despite ' + numOpenRequests + ' open requests...');
			}
			else {
				this.critical('Worker ' + this.workerId + ' received ' + signal + ' and has no open requests, shutting down...');
			}
			this.shutdown();
		}
	}

	noMoreRequests () {
		if (this.shutdownPending) {
			this.critical('Worker ' + this.workerId + ' has no more open requests, shutting down...');
			this.shutdown();
		}
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

module.exports = APIServer;
