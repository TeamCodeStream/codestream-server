'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
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

	loadModules (callback) {
		BoundAsync.series(this, [
			this.readModuleDirectory,
			this.processModuleFiles,
			this.collectDependencies,
			this.resolveDependencies,
			this.registerModules
		], callback);
	}

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

	processModuleFiles (callback) {
		BoundAsync.forEachLimit(
			this,
			this.moduleFiles,
			10,
			this.processModuleFile,
			callback
		);
	}

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

	processModuleDirectory (moduleDirectory, stats, callback) {
		if (!stats.isDirectory()) {
			return process.nextTick(callback);
		}
		const moduleJS = Path.join(moduleDirectory, 'module.js');
		const name = Path.basename(moduleDirectory);
		let module = this.instantiateModule(moduleJS, name);
		if (typeof module === 'string') {
			return callback(module);
		}
		this.api.log(`Accepted module ${moduleJS}`);
		this.modules[name] = module;
		process.nextTick(callback);
	}

	instantiateModule (moduleJS, name) {
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

	resolveDependencies (callback) {
		let sorted;
		try {
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
		this.modules = sorted.map(moduleName => this.modules[moduleName]);
		this.modules.reverse();
		process.nextTick(callback);
	}

	registerModules (callback) {
		BoundAsync.forEachSeries(
			this,
			this.modules,
			this.registerModule,
			callback
		);
	}

	registerModule (module, callback) {
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

	getMiddlewareFunctions () {
		return this.middlewares;
	}

	getServiceFunctions () {
		return this.services;
	}

	getDataSourceFunctions () {
		return this.dataSources;
	}

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

	registerOneModuleRoute (module, route, callback) {
		let routeObject = this.normalizeRoute(route, module);
		if (!routeObject) {
			return process.nextTick(callback);
		}
		this.routes.push(routeObject);
		process.nextTick(callback);
	}

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
			if (typeof module[route.func] === 'function') {
				func = (request, response, next) => {
					module[route.func].call(module, request, response, next);
				};
			}
		}
		else if (route.func && typeof route.func === 'function') {
			func = (request, response, next) => {
				route.func.call(module, request, response, next);
			};
		}
		else if (route.requestClass) {
			func = this.requestClassFulfiller(route.requestClass, route, module);
		}
		if (!func) {
			this.api.warn(`Invalid callback function for module ${module.name}`, route);
			return false;
		}
		return { method, path, func };
	}

	validateRoute (route, module) {
		if (typeof route !== 'object') {
			this.api.warn(`Bad route object for module ${module.name}`, route);
			return false;
		}
		if (route.method && typeof route.method !== 'string') {
			this.api.warn(`Bad method for module ${module.name}`, route);
			return false;
		}
		const validMethods = ['get', 'post', 'put', 'delete', 'options'];
		route.method = (route.method || 'get').toLowerCase();
		if (validMethods.indexOf(route.method) === -1) {
			this.api.warn(`Invalid route method "${route.method}" for module ${module.name}`, route);
			return false;
		}
		if (typeof route.path !== 'string') {
			this.api.warn(`Invalid path for module ${module.name}`, route);
			return false;
		}
		return true;
	}

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

	getRouteObjects () {
		return this.routes;
	}
}

module.exports = APIServerModules;
