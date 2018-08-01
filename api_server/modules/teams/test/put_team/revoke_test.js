/* eslint no-console: 0 */

'use strict';

const Pubnub = require('pubnub');

const CHANNEL = 'channel';
const CLIENT_KEY = '123456';
const MESSAGE = {
	test: 'hello'
};

const server = new Pubnub({
	subscribeKey: 'sub-c-fba8e75c-f498-11e7-9723-66707ad51ffc',
	publishKey: 'pub-c-dac9f3d2-896f-4b7f-bc98-f0a4d38bb231',
	secretKey: 'sec-c-MTY4YjA4ODItNTY3Yi00ZDQ2LTg1NzgtNzQ4NmM1NDI1ZmE3',
	uuid: 'CodeStreamServer'
});

const client = new Pubnub({
	subscribeKey: 'sub-c-fba8e75c-f498-11e7-9723-66707ad51ffc',
	uuid: 'client',
	authKey: '123456',
	keepAlive: true
});

let didReceiveMessage = false;

client.addListener({
	message: message => {
		console.log('RX', message);
		if (didReceiveMessage) {
			console.warn('RECEIVED SECOND MESSAGE!!!');
			process.exit(1);
		}
		else {
			didReceiveMessage = true;
		}
	},
	status: status => {
		console.log('STATUS', status);
		if (
			status.subscribedChannels instanceof Array &&
            status.subscribedChannels.includes(CHANNEL)
		) {
			console.log('Subscribed!');
		}

	}
});

const asyncTimeout = async function(n) {
	return new Promise((resolve) => {
		setTimeout(resolve, n);
	});
};

(async function() {

	try {

		console.log('Server granting...');
		await server.grant({
			channels: [CHANNEL],
			authKeys: [CLIENT_KEY],
			read: true,
			ttl: 0
		});

		await asyncTimeout(5000);

		console.log('Client subscribing...');
		client.subscribe({
			channels: [CHANNEL]
		});

		await asyncTimeout(3000);

		console.log('Server publishing...');
		await server.publish({
			message: MESSAGE,
			channel: CHANNEL
		});

		await asyncTimeout(3000);

		console.log('Server revoking...');
		await server.grant({
			channels: [CHANNEL],
			authKeys: [CLIENT_KEY],
			read: false
		});

		await asyncTimeout(10000);

		/*
        console.log('Client subscribing again...');
        client.subscribe({
            channels: [CHANNEL]
        });
*/

		console.log('Server publishing again...');
		await server.publish({
			message: MESSAGE,
			channel: CHANNEL
		});

		await asyncTimeout(10000);
		console.log('never received message, good deal!');
		process.exit(0);
	}
	catch (error) {
		console.error('ERROR', error);
	}
})();
