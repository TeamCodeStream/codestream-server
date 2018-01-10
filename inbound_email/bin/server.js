#!/usr/bin/env node

var Cluster = require('cluster');
var OS = require('os');
var FS = require('fs');
var InboundEmailServer = require(process.env.CI_INMAIL_SRCTOP + '/lib/inbound_server');

var Args = process.argv.slice(2);
var ConfigFile = Args[0] || process.env.CI_INMAIL_SRCTOP + '/config/config.json';

// manage queue of dead workers
var Dead_Workers = [];

// manage worker information
var Worker_Info = {};

// During a clean (sigterm) shutdown, we don't want to spawn new children
var dont_spawn_new_workers = false;

if (Cluster.isMaster) {
	// master, fork one instance for each CPU
	Inbound_Email_Server.prototype.log('Inbound email server starting up...');
	var num_CPUs = 1 /* OS.cpus().length*/;
	for(var index=0; index<num_CPUs; index++) {
		Cluster.fork();
	}
	// revive dead instances
	Cluster.on('exit', function(worker) {
		Inbound_Email_Server.prototype.warn('Worker ' + worker.id + ' died');
		Dead_Workers.push({
			dead_worker_id: worker.id,
			sequence_number: Worker_Info[worker.id].sequence_number,
		});
		if (dont_spawn_new_workers !== true) {
			Cluster.fork();
		}
	});
	// handle worker online
	Cluster.on('online', function(worker) {
		Inbound_Email_Server.prototype.log('Worker '+worker.id+ ' is online');
		var worker_info = {
			sequence_number: Object.keys(Worker_Info).length,
		};
		Worker_Info[worker.id] = worker_info;
		var message = {
			worker_id: worker.id,
			sequence_number: worker_info.sequence_number,
			num_workers: num_CPUs,
		};
		if (Dead_Workers.length > 0) {
			_.extend(message, Dead_Workers.shift());
		}
		worker.send(message);
	});

	// Listen to signals sent to the master cluster process and handle appropriately
	//
	// SIGTERM (kill) - do a clean shutdown
	process.on('SIGTERM', function() {
		Inbound_Email_Server.prototype.warn("GOT SIGTERM");
		dont_spawn_new_workers = true;   // don't fire the auto-revive code
		for (var id in Cluster.workers) {
			// Tell workers to start cleaning up.  Not all services automatically listen to
			// disconnect.
			Cluster.workers[id].send({shutdown:true});
			// Disconnect from IPC.  Will allow thread to finish execution and die gracefully.
			Cluster.workers[id].disconnect();
		}
	});
}
else {
	var inbound_email_server = new Inbound_Email_Server({
		config_files: {
			email: process.env.SRCTOP + '/ec/config/email.json',
			secrets: process.env.SRCTOP + '/ec/config/secrets.json',
			redis: process.env.SRCTOP + '/ec/config/redis.json',
			s3: process.env.SRCTOP + '/ec/config/s3.json',
			api: process.env.SRCTOP + '/ec/config/api.json',
			product: process.env.SRCTOP + '/ec/config/product.json'
		},
	});
	Inbound_Email_Server.prototype.log("Starting instance...");
	inbound_email_server.start();
}
