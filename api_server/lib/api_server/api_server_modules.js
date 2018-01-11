// The APIServerModules class manages reading in all modules and pre-processing them
// for the actual API Server to take over

'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var TopoSort = require('toposort');
var FS = require('fs');
var Path = require('path');

class APIServerModules {

	constructor (options) {
		this.options = options || {};
		this.api = options.api;
		if (!this.api) {
			throw 'APIServer instance required for APIServerModules';
		}
		this.config = this.api.config;
		this.logger = options.logger || this.api;
		this.modules = {};
		this.middlewares = [];
		this.services = [];
		this.routes = [];
		this.dataSources = [];
	}

	// load all modules we find in the modules directory, and process
	loadModules (callback) {
		BoundAsync.series(this, [
			this.readModuleDirectory,
			this.processModuleFiles,
			this.collectDependencies,
			this.resolveDependencies,
			this.registerModules
		], callback);
	}

	// read the modules directory, see what we find...
	readModuleDirectory (callback) {
		if (!this.config.moduleDirectory) {
			return process.nextTick(callback);
		}
		FS.readdir(
			this.config.moduleDirectory,
			(error, moduleFiles) => {
				if (error) { return callback(error); }
				this.moduleFiles = moduleFiles;
				process.nextTick(callback);
			}
		);
	}

	// process whatever directories we find in the modules directory
	processModuleFiles (callback) {
		BoundAsync.forEachLimit(
			this,
			this.moduleFiles,
			10,
			this.processModuleFile,
			callback
		);
	}

	// process a file or directory in the modules directory (but we're just looking for directories)
	processModuleFile (moduleFile, callback) {
		const modulePath = Path.join(this.config.moduleDirectory, moduleFile);
		FS.stat(
			modulePath,
			(error, stats) => {
				if (error) {
					this.api.warn(`Could not stat ${moduleFile}: ${error}`);
					return process.nextTick(callback);
				}
				else {
					this.processModuleDirectory(modulePath, stats, callback);
				}
			}
		);
	}

	// process a module directory found in the modules directory
	processModuleDirectory (moduleDirectory, stats, callback) {
		if (!stats.isDirectory()) {
			// we're only interested in directories
			return process.nextTick(callback);
		}
		// we're looking for a module.js file, if we find it, we'll read in the module contents
		const moduleJS = Path.join(moduleDirectory, 'module.js');
		const name = Path.basename(moduleDirectory);
		let module = this.instantiateModule(moduleJS, name);
		if (typeof module === 'string') {
			// really an error
			return callback(module);
		}
		this.api.log(`Accepted module ${moduleJS}`);
		this.modules[name] = module;
		process.nextTick(callback);
	}

	// instantiate a module, as given by the module.js file found in the module directory
	instantiateModule (moduleJS, name) {
		// we should get a class, derived from APIServerModule
		let moduleClass;
		try {
			moduleClass = require(moduleJS);
		}
		catch(error) {
			return `Error requiring ${moduleJS}: ${error}\n${error.stack}`;
		}
		if (!moduleClass) {
			return `No exported class found in ${moduleJS}`;
		}
		// instantiate that class and it becomes the module!
		let module;
		try {
			module = new moduleClass({
				modules: this,
				api: this.api
			});
			module.name = module.name || name;
		}
		catch(error) {
			return `Unable to instantiate module class in ${moduleJS}: ${error}\n${error.stack}`;
		}
		return module;
	}

	// figure out which modules may be dependent on which others ... this mainly concerns
	// setting the correct order for middleware routines
	collectDependencies (callback) {
		this.moduleNames = Object.keys(this.modules);
		this.moduleDependencies = [];
		BoundAsync.forEachSeries(
			this,
			this.moduleNames,
			this.collectModuleDependencies,
			callback
		);
	}

	// collect the module dependencies for a specific module
	collectModuleDependencies (moduleName, callback) {
		let module = this.modules[moduleName];
		let dependencies = module.getDependencies();
		if (dependencies instanceof Array) {
			dependencies.forEach(dep => {
				this.moduleDependencies.push(
					[module.name, dep]
				);
			});
		}
		process.nextTick(callback);
	}

	// resolve the dependencies by forming a dependency order, with the guarantee
	// that modules dependent on other modules are registered later
	resolveDependencies (callback) {
		let sorted;
		try {
			// we use the toposort module to figure this out...
			sorted = TopoSort.array(
				this.moduleNames,
				this.moduleDependencies
			);
		}
		catch(error) {
			if (error) {
				return callback(`Error resolving module dependencies: ${error}`);
			}
		}
		// the result of the TopoSort is an array of module names, where those
		// dependent on others come first ... we need to reverse this so those
		// dependent on others are registered later
		this.modules = sorted.map(moduleName => this.modules[moduleName]);
		this.modules.reverse();
		process.nextTick(callback);
	}

	// register all our modules ... this is where we see what they're really offering
	registerModules (callback) {
		BoundAsync.forEachSeries(
			this,
			this.modules,
			this.registerModule,
			callback
		);
	}

	// register a given module
	registerModule (module, callback) {
		// first we look for middlewares, services, and dataSources...
		// then we'll register whatever routes for express js
		BoundAsync.forEachSeries(
			this,
			['middlewares', 'services', 'dataSources'],
			(type, foreachCallback) => {
				this.registerModuleFunctions(module, type, foreachCallback);
			},
			() => {
				this.registerModuleRoutes(module, callback);
			}
		);
	}

	// register module functions, this can be middleware, services, or dataSources...
	// they all follow the same pattern
	registerModuleFunctions (module, type, callback) {
		if (typeof module[type] !== 'function') {
			return process.nextTick(callback);
		}
		let functions = module[type]();
		if (!functions) {
			return process.nextTick(callback);
		}
		functions = functions instanceof Array ? functions : [functions];
		BoundAsync.forEachLimit(
			this,
			functions,
			10,
			(func, foreachCallback) => {
				this.registerOneModuleFunction(module, type, func, foreachCallback);
			},
			callback
		);
	}

	// register a single module function, be it middleware, service, or DataSource
	// the APIServer object will then execute these functions in order
	registerOneModuleFunction (module, type, func, callback) {
		if (typeof func === 'string' && typeof module[func] === 'function') {
			func = module[func];
		}
		else if (typeof func !== 'function') {
			return callback(`Bad registered ${type} function for module ${module.name}: ${func.toString()}`);
		}
		this[type].push((...args) => {
			return func.apply(module, args);
		});
		process.nextTick(callback);
	}

	// wrapper to get all registered middleware functions
	getMiddlewareFunctions () {
		return this.middlewares;
	}

	// wrapper to get all registered service functions
	getServiceFunctions () {
		return this.services;
	}

	// wrapper to get all registered DataSource functions
	getDataSourceFunctions () {
		return this.dataSources;
	}

	// register module routes for this module
	registerModuleRoutes (module, callback) {
		let routes = module.getRoutes();
		if (!routes || !(routes instanceof Array)) {
			return process.nextTick(callback);
		}
		BoundAsync.forEachLimit(
			this,
			routes,
			10,
			(route, foreachCallback) => {
				this.registerOneModuleRoute(module, route, foreachCallback);
			},
			callback
		);
	}

	// register a single module route for this module
	registerOneModuleRoute (module, route, callback) {
		let routeObject = this.normalizeRoute(route, module);
		if (!routeObject) {
			return process.nextTick(callback);
		}
		this.routes.push(routeObject);
		process.nextTick(callback);
	}

	// normalize the route before registration, making sure the path information
	// is consistent and valid
	normalizeRoute (route, module) {
		if (!this.validateRoute(route, module)) {
			return;
		}
		const method = route.method;
		let path = route.path;
		if (path.substring(0, 1) !== '/') {
			path = '/' + path;
		}
		let func;
		if (route.func && typeof route.func === 'string') {
			// the execution function can be the name of a method of the module
			if (typeof module[route.func] === 'function') {
				func = (request, response, next) => {
					module[route.func].call(module, request, response, next);
				};
			}
		}
		else if (route.func && typeof route.func === 'function') {
			// the execution function can be a method of the module
			func = (request, response, next) => {
				route.func.call(module, request, response, next);
			};
		}
		else if (route.requestClass) {
			// the execution can go through a class object, derived from APIRequest
			func = this.requestClassFulfiller(route.requestClass, route, module);
		}
		if (!func) {
			this.api.warn(`Invalid callback function for module ${module.name}`, route);
			return false;
		}
		return { method, path, func };
	}

	// validate a module route
	validateRoute (route, module) {
		// has to be an object
		if (typeof route !== 'object') {
			this.api.warn(`Bad route object for module ${module.name}`, route);
			return false;
		}
		// method has to be a string
		if (route.method && typeof route.method !== 'string') {
			this.api.warn(`Bad method for module ${module.name}`, route);
			return false;
		}
		// has to be one of these methods
		const validMethods = ['get', 'post', 'put', 'delete', 'options'];
		route.method = (route.method || 'get').toLowerCase();
		if (validMethods.indexOf(route.method) === -1) {
			this.api.warn(`Invalid route method "${route.method}" for module ${module.name}`, route);
			return false;
		}
		// path has to be a string
		if (typeof route.path !== 'string') {
			this.api.warn(`Invalid path for module ${module.name}`, route);
			return false;
		}
		return true;
	}

	// fulfill a request by instantiating the request class for a request
	// and calling its fulfill() function, see api_request.js
	requestClassFulfiller (requestClass, route, module) {
		return (request, response) => {
			let apiRequest = new requestClass({
				api: this.api,
				module: module,
				request: request,
				response: response
			});
			apiRequest.fulfill();
		};
	}

	// wrapper to get all registered routes
	getRouteObjects () {
		return this.routes;
	}
}

module.exports = APIServerModules;
