// The APIServerModules class manages reading in all modules and pre-processing them
// for the actual API Server to take over

'use strict';

const TopoSort = require('toposort');
const FS = require('fs');
const Path = require('path');

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
	loadModules () {
		this.readModuleDirectory();
		this.processModuleFiles();
		this.collectDependencies();
		this.resolveDependencies();
		this.registerModules();
	}

	// read the modules directory, see what we find...
	readModuleDirectory () {
		if (!this.config.moduleDirectory) {
			return;
		}
		this.moduleFiles = FS.readdirSync(this.config.moduleDirectory);
	}

	// process whatever directories we find in the modules directory
	processModuleFiles () {
		this.moduleFiles.forEach(this.processModuleFile.bind(this));
	}

	// process a file or directory in the modules directory (but we're just looking for directories)
	processModuleFile (moduleFile) {
		const modulePath = Path.join(this.config.moduleDirectory, moduleFile);
		let stats;
		try {
			stats = FS.statSync(modulePath);
		}
		catch (error) {
			return this.api.warn(`Could not stat ${moduleFile}: ${error}`);
		}
		this.processModuleDirectory(modulePath, stats);
	}

	// process a module directory found in the modules directory
	processModuleDirectory (moduleDirectory, stats) {
		if (!stats.isDirectory()) {
			// we're only interested in directories
			return;
		}
		// we're looking for a module.js file, if we find it, we'll read in the module contents
		const moduleJS = Path.join(moduleDirectory, 'module.js');
		const name = Path.basename(moduleDirectory);
		let module = this.instantiateModule(moduleJS, name);
		if (typeof module === 'string') {
			// really an error
			throw module;
		}
		this.api.log(`Accepted module ${moduleJS}`);
		this.modules[name] = module;
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
	collectDependencies () {
		this.moduleNames = Object.keys(this.modules);
		this.moduleDependencies = [];
		this.moduleNames.forEach(this.collectModuleDependencies.bind(this));
	}

	// collect the module dependencies for a specific module
	collectModuleDependencies (moduleName) {
		let module = this.modules[moduleName];
		let dependencies = module.getDependencies();
		if (dependencies instanceof Array) {
			dependencies.forEach(dep => {
				this.moduleDependencies.push(
					[module.name, dep]
				);
			});
		}
	}

	// resolve the dependencies by forming a dependency order, with the guarantee
	// that modules dependent on other modules are registered later
	resolveDependencies () {
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
				throw `Error resolving module dependencies: ${error}`;
			}
		}
		// the result of the TopoSort is an array of module names, where those
		// dependent on others come first ... we need to reverse this so those
		// dependent on others are registered later
		this.modules = sorted.map(moduleName => this.modules[moduleName]);
		this.modules.reverse();
	}

	// register all our modules ... this is where we see what they're really offering
	registerModules () {
		this.modules.forEach(this.registerModule.bind(this));
	}

	// register a given module
	registerModule (module) {
		// first we look for middlewares, services, and dataSources...
		// then we'll register whatever routes for express js
		['middlewares', 'services', 'dataSources'].forEach(type => {
			this.registerModuleFunctions(module, type);
		});
		this.registerModuleRoutes(module);
	}

	// register module functions, this can be middleware, services, or dataSources...
	// they all follow the same pattern
	registerModuleFunctions (module, type) {
		if (typeof module[type] !== 'function') {
			return;
		}
		let functions = module[type]();
		if (!functions) {
			return;
		}
		functions = functions instanceof Array ? functions : [functions];
		functions.forEach(func => {
			this.registerOneModuleFunction(module, type, func);
		});
	}

	// register a single module function, be it middleware, service, or DataSource
	// the APIServer object will then execute these functions in order
	registerOneModuleFunction (module, type, func) {
		if (typeof func === 'string' && typeof module[func] === 'function') {
			func = module[func];
		}
		else if (typeof func !== 'function') {
			throw `Bad registered ${type} function for module ${module.name}: ${func.toString()}`;
		}
		this[type].push((...args) => {
			return func.apply(module, args);
		});
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
	registerModuleRoutes (module) {
		const routes = module.getRoutes();
		if (!routes || !(routes instanceof Array)) {
			return;
		}
		routes.forEach(route => {
			this.registerOneModuleRoute(module, route);
		});
	}

	// register a single module route for this module
	registerOneModuleRoute (module, route) {
		const routeObject = this.normalizeRoute(route, module);
		if (!routeObject) {
			return;
		}
		this.routes.push(routeObject);
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
		if (!validMethods.includes(route.method)) {
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

	// give modules a post-load opportunity to initialize
	initializeModules () {
		Object.keys(this.modules).forEach(moduleName => {
			this.modules[moduleName].initialize.bind(module);
		});
	}
}

module.exports = APIServerModules;
