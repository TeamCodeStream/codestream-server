// The APIServer object manages the components of an API Server module
// While APIServerModules does the module pre-processing, the modules are
// ultimately processed here

'use strict';

const APIServerModules = require('./api_server_modules.js');
const Express = require('express');
const HTTPS = require('https');
const HTTP = require('http');
const FS = require('fs');
const AwaitUtils = require(process.env.CS_API_TOP + '/server_utils/await_utils');
const IPCResponse = require('./ipc_response');

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
	async start () {
		this.setListeners();
		this.loadModules();
		await this.registerServices();
		this.registerMiddleware();
		this.registerRoutes();
		this.registerDataSources();
		this.modules.initializeModules();
		this.makeHelp();
		await AwaitUtils.callbackWrap(this.listen.bind(this));
	}

	// set relevant event listeners
	setListeners () {
		process.on('message', this.handleMessage.bind(this));
		process.on('SIGINT', this.onSigint.bind(this));
		process.on('SIGTERM', this.onSigterm.bind(this));
	}

	// load all the modules in the modules directory, we'll let APIServerModules handle all that
	loadModules () {
		this.log('Loading modules...');
		this.modules = new APIServerModules({
			api: this
		});
		this.modules.loadModules();
	}

	// register whatever services we need, the modules provide us with "service functions",
	// these get executed and return to us the actual services that become available to the app
	async registerServices () {
		this.log('Registering services...');
		const serviceFunctions = this.modules.getServiceFunctions();
		await Promise.all(serviceFunctions.map(async serviceFunction => {
			await this.registerModuleServices(serviceFunction);
		}));
	}

	// start the service indicated by the passed service function ... starting a service
	// really means making it available to the app through the API Server's services object
	async registerModuleServices (serviceFunction) {
		const services = await serviceFunction();
		// registering a service really means just making it available in our
		// services object ... or integrations object if specified
		for (let serviceName in services) {
			const service = services[serviceName];
			if (typeof service.isIntegration === 'function' &&
				service.isIntegration()
			) {
				this.integrations[serviceName] = service;
			}
			else {
				this.services[serviceName] = service;
			}
		}
	}

	// register all middleware functions
	registerMiddleware () {
		this.log('Registering middleware...');
		if (this.config.api.mockMode) {
			return this.registerMiddlewareForIpc();
		}
		this.express.use(this.setupRequest.bind(this));	// this is always first in the middleware chain
		const middlewareFunctions = this.modules.getMiddlewareFunctions();
		middlewareFunctions.forEach(middlewareFunction => {
			this.express.use(middlewareFunction);
		});
		this.registerErrorHandler();
	}

	// register the master error handler, this happens if there is an express js error
	// of some sort ... it goes last in the middleware chain
	registerErrorHandler () {
		this.express.use((error, request, response, next) => {
			this.error('Express error: ' + error.message + '\n' + error.stack);
			if (!response.headersSent) {
				response.sendStatus(500);
			}
			request.connection.destroy();
			return next;
		});
	}

	// first in the middleware chain, we'll set up the request so it's properly
	// initialized
	setupRequest (request, response, next) {
		request.api = this;
		request.apiModules = this.modules;
		process.nextTick(next);
	}

	// register all  DataSources, which really means making collections available
	// in our data object
	registerDataSources () {
		this.log('Registering data sources...');
		const dataSourceFunctions = this.modules.getDataSourceFunctions();
		dataSourceFunctions.forEach(dataSourceFunction => {
			const dataSource = dataSourceFunction();
			Object.assign(this.data, dataSource);
		});
	}

	// regiser all routes
	registerRoutes () {
		this.log('Registering routes...');
		const routeObjects = this.modules.getRouteObjects();
		routeObjects.forEach(this.registerRouteObject.bind(this));
	}

	// register a single route object, the route object can itself have middleware
	// functions, but ultimately calls the function as indicated by func
	registerRouteObject (routeObject) {
		let middleware = routeObject.middleware || [];
		if (typeof middleware === 'function') {
			middleware = middleware(this);
		}
		if (!(middleware instanceof Array)) {
			middleware = [middleware];
		}
		if (this.config.api.mockMode) {
			return this.registerRouteForIpc(routeObject, middleware);
		}
		const args = [ routeObject.path, ...middleware, routeObject.func];
		this.express[routeObject.method].apply(this.express, args);
	}

	// start listening for requests!
	listen (callback) {
		if (this.config.api.mockMode) {
			this.listenToIpc();
		}
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
			return callback(`Unable to start server on port ${this.config.express.port}: ${error}`);
		});
		this.expressServer.on('listening', () => {
			this.log(`Listening on port ${this.config.express.port}...`);
			callback();
		});
	}

	// listen on IPC instead, for "mock-mode", testing in local environment
	listenToIpc () {
		this.services.ipc.on('request', this.handleIpcRequest.bind(this));
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

	// based on information collected from the modules, form data related to help on api server routines
	makeHelp () {
		this.log('Generating documentation for routes...');
		this.documentedRoutes = [];
		const routeObjects = this.modules.getRouteObjects();
		routeObjects.forEach(this.documentRouteObject.bind(this));
		this.documentedModels = this.modules.describeModels();
		this.documentedErrors = this.modules.describeErrors();
	}

	// given a route object, form description information for help
	documentRouteObject (routeObject) {
		if (!routeObject.describe) { return; }
		const description = routeObject.describe();
		if (description) {
			description.method = routeObject.method;
			description.path = routeObject.path;
			description.route = `${routeObject.method.toUpperCase()} ${routeObject.path}`;
			this.documentedRoutes.push(description);
		}
	}

	// register a route for IPC requests, which simulate HTTP requests for testing purposes
	registerRouteForIpc (routeObject, middleware) {
		this.ipcRoutes = this.ipcRoutes || {};
		this.ipcRoutes[routeObject.path] = this.ipcRoutes[routeObject.path] || {};
		this.ipcRoutes[routeObject.path][routeObject.method] = {
			middleware,
			func: routeObject.func
		};
	}

	// register middleware for IPC requests, which simulate HTTP requests for testing purposes
	registerMiddlewareForIpc () {
		this.ipcMiddleware = [];
		this.ipcMiddleware.push(this.setupRequest.bind(this));
		const middlewareFunctions = this.modules.getMiddlewareFunctions();
		middlewareFunctions.forEach(middlewareFunction => {
			this.ipcMiddleware.push(middlewareFunction);
		});
	}

	// handle an inbound IPC request, which simulates an HTTP request for testing purposes
	handleIpcRequest (request, socket) {
		request.params = {};
		request.query = request.query || {};
		request.body = request.body || {};
		request.headers = Object.keys(request.headers || {}).reduce((headers, headerKey) => {
			headers[headerKey.toLowerCase()] = request.headers[headerKey];
			return headers;
		}, {});
		request.url = request.path;
		request.path = request.url.split('?')[0];
		request.query = (request.url.split('?')[1] || '').split('&').reduce((query, param) => {
			const keyValue = param.split('=');
			query[decodeURIComponent(keyValue[0])] = keyValue[1] ? decodeURIComponent(keyValue[1]) : true;
			return query;
		}, {});
		const response = new IPCResponse({
			ipc: this.services.ipc,
			socket,
			clientRequestId: request.clientRequestId
		});
		let pathRoute = this.ipcRoutes[request.path];
		if (!pathRoute) {
			pathRoute = this.findIpcRoute(request);
			if (!pathRoute) {
				return response.sendStatus(404);
			}
		}
		const route = pathRoute[request.method];
		if (!route) {
			return response.sendStatus(404);
		}

		this.ipcMiddleware = this.ipcMiddleware || [];
		let i = 0;
		const next = () => {
			i++;
			if (i === this.ipcMiddleware.length) {
				route.func(request, response);
			}
			else {
				this.ipcMiddleware[i](request, response, next);
			}
		};
		this.ipcMiddleware[0](request, response, next);
	}

	// find a matching route to a path given in an IPC request
	findIpcRoute (request) {
		const { path } = request;
		const routeKey = Object.keys(this.ipcRoutes).find(routeKey => {
			return this.routeMatchesPath(routeKey, path, request);
		});
		if (routeKey) {
			return this.ipcRoutes[routeKey];
		}
	}

	// determine whether the given route matches the given path
	routeMatchesPath (route, path, request) {
		const pathParts = path.split('/');
		const routeParts = route.split('/');
		if (pathParts.length !== routeParts.length) {
			return false;
		}
		let i = -1;
		const params = {};
		const matches = !routeParts.find(routePart => {
			i++;
			const pathPart = pathParts[i];
			return !this.routePartMatchesPathPart(routePart, pathPart, params);
		});
		if (matches) {
			Object.assign(request.params, params);
		}
		return matches;
	}

	// determine whether the given part of a route matches the given part of a path
	routePartMatchesPathPart (routePart, pathPart, params) {
		if (routePart.startsWith(':')) {
			if (pathPart) {
				params[routePart.slice(1)] = pathPart;
				return true;
			}
			else {
				return false;
			}
		}
		else {
			return routePart === pathPart;
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
