#!/usr/bin/env node
'use strict';

var API_Cluster = require(process.env.CS_API_TOP + '/lib/api_server/api_cluster.js');
const Config_Directory = process.env.CS_API_TOP + '/config';
const Module_Directory = process.env.CS_API_TOP + '/services/api/modules';
const Api_Config = require(Config_Directory + '/api.js');
const Express_Config = require(Config_Directory + '/express.js');
const Mongo_Config = require(Config_Directory + '/mongo.js');
const Secrets_Config = require(Config_Directory + '/secrets.js');
const PubNub_Config = require(Config_Directory + '/pubnub.js');
const Logger_Config = require(Config_Directory + '/logger.js');
const Email_Config = require(Config_Directory + '/email.js');
const Limits = require(Config_Directory + '/limits.js');
const Version = require(Config_Directory + '/version.js');
const Simple_File_Logger = require(process.env.CS_API_TOP + '/lib/util/simple_file_logger');

var Logger = new Simple_File_Logger(Logger_Config);

if (Mongo_Config.query_logging) {
	Object.assign(Mongo_Config.query_logging, Logger_Config, Mongo_Config.query_logging);
}

const data_collections = {
	users: require(Module_Directory + '/users/user'),
	companies: require(Module_Directory + '/companies/company'),
	teams: require(Module_Directory + '/teams/team'),
	repos: require(Module_Directory + '/repos/repo'),
	streams: require(Module_Directory + '/streams/stream'),
	posts: require(Module_Directory + '/posts/post')
};
const mongo_collections = Object.keys(data_collections);

var My_API_Cluster = new API_Cluster({
	module_directory: Module_Directory,
	api: Api_Config,
	version: Version,
	secrets: Secrets_Config,
	express: Express_Config,
	mongo: Object.assign(Mongo_Config, {
		collections: mongo_collections,
		logger: Logger
	}),
	pubnub: PubNub_Config,
	email: Email_Config,
	logger: Logger,
	limits: Limits,
	allow_config_override: true,
	data_collections: data_collections
}, Logger);

My_API_Cluster.start((error) => {
	if (error) {
		console.error('Failed to start: ' + error);
		process.exit(1);
	}
});
