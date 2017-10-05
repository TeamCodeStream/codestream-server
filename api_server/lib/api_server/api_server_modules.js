'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var TopoSort = require('toposort');
var FS = require('fs');
var Path = require('path');

class API_Server_Modules {

	constructor (options) {
		this.options = options || {};
		this.api = options.api;
		if (!this.api) {
			throw 'API_Server instance required for API_Server_Modules';
		}
		this.config = this.api.config;
		this.logger = options.logger || this.api;
		this.modules = {};
		this.middlewares = [];
		this.services = [];
		this.routes = [];
		this.data_sources = [];
	}
	 
	load_modules (callback) {
		Bound_Async.series(this, [
			this.read_module_directory,
			this.process_module_files,
			this.collect_dependencies,
			this.resolve_dependencies,
			this.register_modules
		], callback);
	}

	read_module_directory (callback) {
		if (!this.config.module_directory) {
			return process.nextTick(callback);
		}
		FS.readdir(
			this.config.module_directory,
			(error, module_files) => {
				if (error) { return callback(error); }
				this.module_files = module_files;
				process.nextTick(callback);
			}
		);
	}

	process_module_files (callback) {
		Bound_Async.forEachLimit(
			this,
			this.module_files,
			10,
			this.process_module_file,
			callback
		);
	}

	process_module_file (module_file, callback) {
		var module_path = Path.join(this.config.module_directory, module_file);
		FS.stat( 
			module_path,
			(error, stats) => {
				if (error) {
					this.api.warn(`Could not stat ${module_file}: ${error}`);
					return process.nextTick(callback);
				}
				else {
					this.process_module_directory(module_path, stats, callback);
				}
			}
		);
	}

	process_module_directory (module_directory, stats, callback) {
		if (!stats.isDirectory()) {
			return process.nextTick(callback);
		}
		var module_js = Path.join(module_directory, 'module.js');
		var name = Path.basename(module_directory);
		var module = this.instantiate_module(module_js, name);
		if (typeof module === 'string') {
			return callback(module);
		}
		this.api.log(`Accepted module ${module_js}`);
		this.modules[name] = module;
		process.nextTick(callback);
	}

	instantiate_module (module_js, name) {
		var module_class;
		try {
			module_class = require(module_js);
		}
		catch(error) {
			return `Error requiring ${module_js}: ${error}\n${error.stack}`;
		}
		if (!module_class) {
			return `No exported class found in ${module_js}`;
		}
		var module;
		try {
			module = new module_class({
				modules: this,
				api: this.api
			});
			module.name = module.name || name;
		}
		catch(error) {
			return `Unable to instantiate module class in ${module_js}: ${error}\n${error.stack}`;
		}
		return module;
	}

	collect_dependencies (callback) {
		this.module_names = Object.keys(this.modules);
		this.module_dependencies = [];
		Bound_Async.forEachSeries(
			this,
			this.module_names,
			this.collect_module_dependencies,
			callback
		);
	}

	collect_module_dependencies (module_name, callback) {
		var module = this.modules[module_name];
		var dependencies = module.get_dependencies();
		if (dependencies instanceof Array) {
			dependencies.forEach(dep => {
				this.module_dependencies.push(
					[module.name, dep]
				);
			});
		}
		process.nextTick(callback);
	}

	resolve_dependencies (callback) {
		var sorted;
		try {
			sorted = TopoSort.array(
				this.module_names,
				this.module_dependencies
			);
		}
		catch(error) {
			if (error) { 
				return callback(`Error resolving module dependencies: ${error}`); 
			}
		}
		this.modules = sorted.map(module_name => this.modules[module_name]);
		this.modules.reverse();
		process.nextTick(callback);
	}

	register_modules (callback) {
		Bound_Async.forEachSeries(
			this,
			this.modules,
			this.register_module,
			callback
		);
	}

	register_module (module, callback) {
		Bound_Async.forEachSeries(
			this,
			['middlewares', 'services', 'data_sources'],
			(type, foreach_callback) => {
				this.register_module_functions(module, type, foreach_callback);
			},
			() => {
				this.register_module_routes(module, callback);
			}
		);
	}

	register_module_functions (module, type, callback) {
		if (typeof module[type] !== 'function') {
			return process.nextTick(callback);
		}
		var functions = module[type]();
		if (!functions) {
			return process.nextTick(callback);
		}
		functions = functions instanceof Array ? functions : [functions];
		Bound_Async.forEachLimit(
			this,
			functions,
			10,
			(func, foreach_callback) => {
				this.register_one_module_function(module, type, func, foreach_callback);
			},
			callback
		);
	}

	register_one_module_function (module, type, func, callback) {
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

	get_middleware_functions () {
		return this.middlewares;
	}

	get_service_functions () {
		return this.services;
	}

	get_data_source_functions () {
		return this.data_sources;
	}

	register_module_routes (module, callback) {
		var routes = module.get_routes();
		if (!routes || !(routes instanceof Array)) {
			return process.nextTick(callback);
		}
		Bound_Async.forEachLimit(
			this,
			routes,
			10,
			(route, foreach_callback) => {
				this.register_one_module_route(module, route, foreach_callback);
			},
			callback
		);
	}

	register_one_module_route (module, route, callback) {
		var route_object = this.normalize_route(route, module);
		if (!route_object) {
			return process.nextTick(callback);
		}
		this.routes.push(route_object);
		process.nextTick(callback);
	}

	normalize_route (route, module) {
		if (!this.validate_route(route, module)) {
			return;
		}
		var method = route.method;
		var path = route.path;
		if (path.substring(0, 1) !== '/') {
			path = '/' + path;
		}
		var func;
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
		else if (route.request_class) {
			func = this.request_class_fulfiller(route.request_class, route, module);
		}
		if (!func) {
			this.api.warn(`Invalid callback function for module ${module.name}`, route);
			return false;
		}
		return { method, path, func };
	}

	validate_route (route, module) {
		if (typeof route !== 'object') {
			this.api.warn(`Bad route object for module ${module.name}`, route);
			return false;
		}
		if (route.method && typeof route.method !== 'string') {
			this.api.warn(`Bad method for module ${module.name}`, route);
			return false;
		}
		var valid_methods = ['get', 'post', 'put', 'delete', 'options'];
		route.method = (route.method || 'get').toLowerCase();
		if (valid_methods.indexOf(route.method) === -1) {
			this.api.warn(`Invalid route method "${route.method}" for module ${module.name}`, route);
			return false;
		}
		if (typeof route.path !== 'string') {
			this.api.warn(`Invalid path for module ${module.name}`, route);
			return false;
		}
		return true;
	}

	request_class_fulfiller (request_class, route, module) {
		return (request, response) => {
			var api_request = new request_class({
				api: this.api,
				module: module,
				request: request,
				response: response
			});
			api_request.fulfill();
		};
	}

	get_route_objects () {
		return this.routes;
	}
}

module.exports = API_Server_Modules;

