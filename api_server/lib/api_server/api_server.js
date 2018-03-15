// The APIServer object manages the components of an API Server module
// While APIServerModules does the module pre-processing, the modules are
// ultimately processed here

'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
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
		this.integrations = {};
		this.data = {};
	}

	// start 'er up
	start (callback) {
		BoundAsync.series(this, [
			this.setListeners,
			this.loadModules,
			this.startServices,
			this.registerMiddleware,
			this.registerRoutes,
			this.registerDataSources,
			this.initializeModules,
			this.listen
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

	// load all the modules in the modules directory, we'll let APIServerModules handle all that
	loadModules (callback) {
		this.log('Loading modules...');
		this.modules = new APIServerModules({
			api: this
		});
		this.modules.loadModules(callback);
	}

	// start whatever services we need, the modules provide us with "service functions",
	// these get executed and return to us the actual services that become available to the app
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

	// start the service indicated by the passed service function ... starting a service
	// really means making it available to the app through the API Server's services object
	startService (serviceFunction, callback) {
		serviceFunction(
			(error, servicesToAccept) => {
				if (error) { return callback(error); }
				this.acceptServices(servicesToAccept, callback);
			}
		);
	}

	// accept whatever services a module's service function wants us to accept
	acceptServices (services, callback) {
		BoundAsync.forEachLimit(
			this,
			services,
			10,
			this.acceptService,
			callback
		);
	}

	// accept a single service
	acceptService (service, callback) {
		// accepting a service really means just making it available in our
		// services object ... or integrations object if specified
		Object.keys(service).forEach(serviceName => {
			if (typeof service[serviceName].isIntegration === 'function' &&
				service[serviceName].isIntegration()
			) {
				this.integrations[serviceName] = service[serviceName];
			}
			else {
				this.services[serviceName] = service[serviceName];
			}
		});
		process.nextTick(callback);
	}

	// register all middleware functions
	registerMiddleware (callback) {
		this.log('Registering middleware...');
		this.express.use(this.setupRequest.bind(this));	// this is always first in the middleware chain
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

	// register the master error handler, this happens if there is an express js error
	// of some sort ... it goes last in the middleware chain
	registerErrorHandler (callback) {
		this.express.use((error, request, response, next) => {
			this.error('Express error: ' + error.message + '\n' + error.stack);
			if (!response.headersSent) {
				response.sendStatus(500);
			}
			request.connection.destroy();
			return next; 
		});
		callback();
	}

	// first in the middleware chain, we'll set up the request so it's properly
	// initialized
	setupRequest (request, response, next) {
		request.api = this;
		request.apiModules = this.modules;
		process.nextTick(next);
	}

	// register a single middleware function
	registerMiddlewareFunction (middleware, callback) {
		this.express.use(middleware);
		process.nextTick(callback);
	}

	// register all  DataSources, which really means making collections available
	// in our data object
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

	// register a single DataSource by making it available in our data object
	registerDataSource (dataSourceFunction, callback) {
		let dataSource = dataSourceFunction();
		Object.assign(this.data, dataSource);
		return process.nextTick(callback);
	}

	// regiser all routes
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

	// register a single route object, the route object can itself have middleware
	// functions, but ultimately calls the function as indicated by func
	registerRouteObject (routeObject, callback) {
		let middleware = routeObject.middleware || [];
		let args = [ routeObject.path, ...middleware, routeObject.func];
		this.express[routeObject.method].apply(this.express, args);
		process.nextTick(callback);
	}

	initializeModules (callback) {
		this.modules.initializeModules(callback);
	}

	// start listening for requests!
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
			callback(`Unable to start server on port ${this.config.express.port}: ${error}`);
		});
		this.expressServer.on('listening', () => {
			this.log(`Listening on port ${this.config.express.port}...`);
			callback();
		});
	}

	// get options for express js to listen for requests
	getServerOptions () {
		let options = {};
		const error = this.makeHttpsOptions(options);
		if (error) {
			return error;
		}
		return options;
	}

	// make https options, so we know how to listen to requests over https
	makeHttpsOptions (options) {
		// read in key and cert file
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
		setTimeout(() => {
			process.exit(0);
		}, 100);
	}

	// master wants us to shutdown, but is giving us the chance to finish all open
	// requests first ... if the master sends another signal within five seoncds,
	// we're going to commit suicide regardless ... meanie master
	wantShutdown (signal) {
		// how many open requests do we have right now?
		let numOpenRequests =
			this.services.requestTracker &&
			this.services.requestTracker.numOpenRequests();

		if (numOpenRequests && !this.killReceived) {
			// we've got some open requests, and no additional commands to die
			this.critical(`Worker ${this.workerId} received ${signal}, waiting for ${numOpenRequests} requests to complete, send ${signal} again to kill`);
			this.killReceived = true;
			// give the user 5 seconds to force-kill us, otherwise their chance to do so expires
			setTimeout(
				() => {	this.killReceived = false; },
				5000
			);
			this.expressServer.close();
			this.shutdownPending = true;
		}
		else {
			if (numOpenRequests) {
				// the user is impatient, we'll die even though we have open requests
				this.critical(`Worker ${this.workerId} received ${signal}, shutting down despite ${numOpenRequests} open requests...`);
			}
			else {
				// we have no open requests, so we can just die
				this.critical(`Worker ${this.workerId} received ${signal} and has no open requests, shutting down...`);
			}
			// seppuku
			this.shutdown();
		}
	}

	// signal that there are currently no open requests
	noMoreRequests () {
		// if there is a shutdown pending (the master commanded us to shutdown, but is allowing all requests to finish),
		// then since there are no more requests, we can just die
		if (this.shutdownPending) {
			this.critical(`Worker ${this.workerId} has no more open requests, shutting down...`);
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
