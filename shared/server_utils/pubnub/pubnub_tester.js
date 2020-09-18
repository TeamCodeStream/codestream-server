#!/usr/bin/env node

// This script reproduces a bug in Pubnub, described in this support ticket:
// https://support.pubnub.com/support/tickets/29566

'use strict';

const PubNub = require('pubnub');

const PUBLISH_KEY = "GET...FROM...CONFIG";
const SUBSCRIBE_KEY = "GET...FROM...CONFIG";
const SECRET_KEY = "GET...FROM...CONFIG";
const SERVER_UUID = "CodeStreamServer";
const CLIENT_UUID = "ClientID";

const CHANNEL1 = '1';
const CHANNEL2 = '2';
const CHANNELS = [
	`channel-${CHANNEL1}`,
	`channel-${CHANNEL2}`
];
const AUTH_KEY = 'frankenstein';

const Send = process.argv[2] === 'send' || process.argv[2] === 'both' || !process.argv[2];
const Listen = process.argv[2] === 'listen' || process.argv[2] === 'both' || !process.argv[2];

class PubnubTester {

	constructor( ) {
		this.testNum = 0;
		this.lastPairReceived = 0;
		this.gotFirstOfPair = false;
	}

	async test() {
		if (Send) {
			await this.makePubnubClientForServer();
			await this.waitForGrant();
		}
		if (Listen) {
			this.makePubnubClientForClient();
			this.listenOnClient();
		}
		if (Send) {
			this.startSending();
		}
	}

	async makePubnubClientForServer () {
		this.log('Making Pubnub client for server...');
		const config = {
			publishKey: PUBLISH_KEY,
			subscribeKey: SUBSCRIBE_KEY,
			secretKey: SECRET_KEY,
			uuid: SERVER_UUID,
			ssl: true,
			keepAlive: true
		};
		this.log('Server config: ' + JSON.stringify(config, undefined, 5));
		this.pubnubServer = new PubNub(config);
		
		this.log('Granting subscription permission...');
		const result = await this.pubnubServer.grant(
			{
				channels: CHANNELS,
				authKeys: [AUTH_KEY],
				read: true
			}
		);
		if (result.error) {
			this.log(`Unable to grant access for token "${AUTH_KEY}" to ${CHANNELS}: ${JSON.stringify(result.errorData)}`);
		} else {
			this.log(`Successfully granted access for "${AUTH_KEY}" to ${CHANNELS}`);
		}
	}

	async waitForGrant () {
		this.log('Waiting for grant...');
		return new Promise(resolve => {
			setTimeout(resolve, 3000);
		});
	}

	makePubnubClientForClient () {
		this.log('Making Pubnub client for client...');
		const config = {
			subscribeKey: SUBSCRIBE_KEY,
			uuid: CLIENT_UUID,
			authKey: AUTH_KEY,
			ssl: true
		};
		this.log('Client config: ' + JSON.stringify(config, undefined, 5));
		this.pubnubClient = new PubNub(config);
		this.pubnubClient.addListener({
			message: this.handleMessage.bind(this),
			status: this.handleStatus.bind(this)
		});
	}

	async listenOnClient () {
		this.log('Client listening...');
		this.pubnubClient.subscribe({ channels: CHANNELS });
	}

	handleStatus (status) {
		if (status.error) {
			this.log('Pubnub status error: ' + JSON.stringify(status, undefined, 5));
		}
		else {
			this.log('Successfully subscribed to: ' + JSON.stringify(status.subscribedChannels));
		}
	}

	handleMessage (message) {
		const match = message.message.match(/^TEST-CH([0-9]+)-([0-9]+)$/);
		if (!match || !match[2]) {
			this.log('*************************************');
			this.log('GOT WEIRD MESSAGE: ' + message.message);
			this.log('*************************************');
		}
		const testNum = parseInt(match[2], 10);
		this.log(`CLIENT: Received test #${testNum} on channel ${message.channel}`);
		if (this.lastPairReceived !== 0 && testNum > this.lastPairReceived + 1) {
			this.log('*************************************');
			this.log(`GAP AT ${testNum}, LAST PAIR RECEIVED WAS ${this.lastPairReceived}`);
			this.log('*************************************');
			this.lastPairReceived = testNum - 1;
			this.gotFirstOfPair = true;
		} else if (testNum === this.lastPairReceived + 1) {
			if (CHANNELS.length === 1) {
				this.lastPairReceived = testNum;
			}
			else if (!this.gotFirstOfPair) {
				this.gotFirstOfPair = true;
			} else {
				this.lastPairReceived = testNum;
				this.gotFirstOfPair = false;
			}
		} else if (testNum <= this.lastPairReceived) {
			this.log('*************************************');
			this.log(`SOMETHING WENT WRONG... ALREADY GOT PAIR OF ${testNum}`);
			this.log('*************************************');
		}
	}

	startSending () {
		setInterval(this.sendMessages.bind(this), 1000);
	}

	sendMessages () {
		for (let i = 0; i < CHANNELS.length; i++) {
			const time = Math.random() * 0; // change this to increase the interval between messages within the pair
			setTimeout(() => {
				const message = `TEST-CH${i+1}-${this.testNum}`;
				const channel = CHANNELS[i];
				this.log(`SERVER: Publishing "${message} TO ${channel}...`);
				this.pubnubServer.publish({ message, channel });
			}, time);
		}
		this.testNum++;
	}

	log (msg) {
		console.log(`${Date.now()} - ${msg}`);
	}
}

(async () => {
	await new PubnubTester().test();
})();