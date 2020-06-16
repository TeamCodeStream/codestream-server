#!/usr/bin/env node

'use strict';

const SocketClusterClient = require('./socketcluster_client');
const ApiConfig = require(process.env.CS_API_TOP + '/config/config'); // NOTE: only works in api server sandbox
const Commander = require('commander');

Commander
	.option('-c, --channel <channel>', 'Listen and/or send on this channel')
	.option('-l, --listen', 'Listen on the given channel')
	.option('-s, --send <sendInterval>', 'Send to the given channel (in seconds)', parseInt)
	.option('--host <host>', 'Override broadcaster hostname in config file')
	.option('--port <port>', 'Override broadcaster port in config file', parseInt)
	.parse(process.argv);

class SocketClusterTester {
	
	constructor () {
		this.testNum = 0;
	}

	async initialize () {
		if(!Commander.send && !Commander.listen) {
			console.error('-s and/or -l required');
			process.exit(1);
		}
		this.config = await ApiConfig.loadPreferredConfig();
		if (Commander.host) {
			console.log(`overriding broadcaster host with ${Commander.host}`);
			this.config.socketCluster.host = Commander.host;
		}
		if (Commander.port) {
			console.log(`overriding broadcaster port with ${Commander.host}`);
			this.config.socketCluster.port = Commander.port;
		}
		this.channel = Commander.channel || `${this.config.socketCluster.host}-tester-default`;
	}

	async test () {
		const scConfig = { ...this.config.socketCluster, uid: 'API' };
		this.client = new SocketClusterClient(scConfig);

		try {
			await this.client.init();
		}
		catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			console.error(`Error connecting to SocketCluster: ${message}`);
			process.exit();
		}

		console.log('Connection successful');

		if (Commander.listen) {
			console.log(`Subscribing to ${this.channel}...`);
			this.client.subscribe(this.channel, (_, message) => {
				console.log(`Message received on ${message.channel}: ${message.message}`);
			});
		}
		
		if (Commander.send) {
			setInterval(this.sendMessage.bind(this), Commander.send * 1000);
		}
	}

	sendMessage () {
		console.log(`Sending message #${++this.testNum}...`);
		this.client.publish(`${this.testNum}`, this.channel);
	}
}

(async () => {
	var tester = new SocketClusterTester();
	await tester.initialize();
	await tester.test();
})();