#!/usr/bin/env node

'use strict';

const SocketClusterClient = require('./socketcluster_client');
const ApiConfig = require(process.env.CS_API_TOP + '/config/config'); // NOTE: only works in api server sandbox
const Commander = require('commander');

Commander
	.option('-c, --channel <channel>', 'Listen and/or send on this channel')
	.option('-l, --listen', 'Listen on the given channel')
	.option('-s, --send', 'Send to the given channel')
	.parse(process.argv);

class SocketClusterTester {
	
	constructor () {
		this.testNum = 0;
	}

	async initialize () {
		this.config = await ApiConfig.loadPreferredConfig();
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
			console.log(`Subscribing to ${Commander.channel}...`);
			this.client.subscribe(Commander.channel, (_, message) => {
				console.log(`Message received on ${message.channel}: ${message.message}`);
			});
		}
		
		if (Commander.send) {
			setInterval(this.sendMessage.bind(this), 1000);
		}
	}

	sendMessage () {
		console.log(`Sending message #${++this.testNum}...`);
		this.client.publish(`${this.testNum}`, Commander.channel);
	}
}

(async () => {
	var tester = new SocketClusterTester();
	await tester.initialize();
	await tester.test();
})();