#!/usr/bin/env node

//desc// pull latest messages from SendGrid and ping Segment for each delivered email

/* eslint no-console: 0 */

'use strict';

const Fetch = require('node-fetch');
const ApiConfig = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/config/config');
const AnalyticsNode = require('analytics-node');
const MongoClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/mongo/mongo_client');

const ONE_DAY = 24 * 60 * 60 * 1000;
const MESSAGE_LIMIT = 1000;
const THROTTLE_TIME = 200;
const DEBUG = false;
const RUN_INTERVAL = 23 * 55 * 60 * 1000;

const CATEGORIES = [
	'email_confirmation',
	'invitation',
	'notification',
	'notification_invite',
	'password_reset',
	'reinvitation',
	'weekly',
	'weekly_invite'
];

class TransferSendGridData {

	constructor (options) {
		Object.assign(this, options);
		this.messages = [];
		this.numRateLimitHits = 0;
	}

	async go () {
		await this.openMongoClient();
		if (await this.abortIfDoneAlready()) {
			console.log('*** This script was already run within 24 hours, aborting... ***');
			return;
		}
		await this.updateLastRunAt();
		await this.connectToSegment();
		await this.getSendGridMessages();
		await this.writeToSegment();
		console.log('Waiting 5 seconds for tracking to complete...');
		await this.wait(5000);
	}

	// open a mongo client to read from
	async openMongoClient () {
		this.mongoClient = new MongoClient({ collections: ['users', 'sendGridToSegmentLastRunAt'] });
		try {
			console.log('Connecting to Mongo...');
			await this.mongoClient.openMongoClient(this.config.storage.mongo);
			this.data = this.mongoClient.mongoCollections;
		}
		catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			throw `unable to open mongo client: ${message}`;
		}
	}

	// if another instance of this script already ran, just abort
	async abortIfDoneAlready () {
		const lastRunAt = await this.data.sendGridToSegmentLastRunAt.getByQuery({}, { overrideHintRequired: true });
		if (lastRunAt && lastRunAt[0] && lastRunAt[0].lastRunAt > Date.now() - RUN_INTERVAL) {
			return true;
		}
	}

	// update when this script was last run so other running instances don't try
	async updateLastRunAt () {
		await this.data.sendGridToSegmentLastRunAt.updateDirect(
			{ }, 
			{ $set: { lastRunAt: Date.now() } },
			{ upsert: true}
		);
	}

	async connectToSegment () {
		console.log('Connecting to Segment...');
		this.segment = new AnalyticsNode(this.config.telemetry.segment.token);
	}

	async getSendGridMessages () {
		console.log('Fetching SendGrid messages...');
		for (let category of CATEGORIES) {
			await this.getSendGridMessagesByCategory(category);
		}
		this.messages.sort((b, a) => {
			return a.last_event_time.localeCompare(b.last_event_time);
		});
	}

	async getSendGridMessagesByCategory (category) {
		let numMessages = 0;
		const now = Date.now();
		const lastMidnight = this.midnight(now);
		const previousMidnight = lastMidnight - ONE_DAY;
		let lastTime = lastMidnight;
		let nPages = 0;
		do {
			nPages++;
			console.log(`\tFetching page ${nPages} of SendGrid messages, category="${category}"...`);
			let messages = await this.getSendGridMessagePage(category, lastTime, previousMidnight);
			messages = messages.filter(message => {
				return !this.messages.find(haveMessage => haveMessage.msg_id === message.msg_id);
			});
			console.log(`\t\t(fetched ${messages.length} "${category}" messages)`);
			if (DEBUG) {
				console.log('####################################################################################');
				console.log(JSON.stringify(messages, undefined, 5));
				console.log('####################################################################################');
			}
			messages = messages.filter(message => {
				return message.opens_count > 0;
			});
			numMessages = messages.length;
			this.messages = [...this.messages, ...messages];
			if (numMessages > 0) {
				console.log(`\t\t(${messages.length} "${category}" emails have been opened)`);
				const lastMessage = messages[messages.length - 1];
				lastTime = new Date(lastMessage.last_event_time);
			}
		} while (numMessages > 0 && this.messages.length < MESSAGE_LIMIT);
	}

	async getSendGridMessagePage (category, latest, earliest) {
		const token = this.config.emailDeliveryService.sendgrid.apiKey;
		const apiKey = token.split('.')[1];
		const latestISO = new Date(latest).toISOString();
		const earliestISO = new Date(earliest).toISOString();
		const query = `
			api_key_id="${apiKey}" AND 
			last_event_time BETWEEN TIMESTAMP "${earliestISO}" AND TIMESTAMP "${latestISO}" AND 
			status="delivered" AND
			(Contains(categories,"${category}"))
		`;
		const limit = Math.min(1000, MESSAGE_LIMIT);
		const params = `limit=${limit}&query=${encodeURIComponent(query)}`;
		const url = `https://api.sendgrid.com/v3/messages?${params}`;
		const response = await Fetch(url, {
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json'
			}
		});
		if (!response.ok) {
			const json = await response.json();
			if (json.errors && json.errors[0] && json.errors[0].message === 'too many requests') {
				this.numRateLimitHits++;
				if (this.numRateLimitHits === 20) {
					console.error('Too many rate limit hits, aborting...');
					process.exit(1);
				}
				console.warn('*** Hit SendGrid rate limit, waiting 5 minutes... ***');
				await this.wait(300000);
				return this.getSendGridMessagePage(category, latest, earliest);
			}
			console.error(`Unable to fetch from SendGrid: ${response.statusText}`);
			console.error(`returned: ${JSON.stringify(json, 0, 5)}`);
			console.error(`response headers: ${JSON.stringify(response.headers.raw(), 0, 5)}`);
			process.exit(1);
		}

		const messages = (await response.json()).messages;
		messages.forEach(message => {
			message.category = category;
		});
		return messages;
	}

	async writeToSegment () {
		console.log(`Writing ${this.messages.length} events to Segment...`);
		let n = 0;
		for (let message of this.messages) {
			n++;
			await this.writeMessageToSegment(message, n, this.messages.length);
			await this.wait(THROTTLE_TIME);
		}
	}

	async writeMessageToSegment (message, n, total) {
		const user = await this.data.users.getOneByQuery(
			{ searchableEmail: message.to_email.toLowerCase() }
		);
		if (!user) {
			console.warn(`*** Could not find matching user for ${message.to_email} ***`);
			return;
		}

		try {
			console.log(`\t${n} of ${total}: ${message.to_email}...`);
			const trackObject = {
				event: 'Sendgrid Opens',
				userId: user.id,
				timestamp: new Date(message.last_event_time),
				integrations: { All: false, Postgres: true }, // only send to PostGres
				properties: {
					distinct_id: user.id,
					'$email': user.email,
					name: user.fullName || '',
					msg_id: message.msg_id,
					category: message.category
				}
			};
			if (user.registeredAt) {
				trackObject.properties['$created'] = new Date(user.registeredAt).toISOString();
				trackObject.integrations.Intercom = true; // also send to Intercom, if user is registered
			}
			this.segment.track(trackObject);
		} catch (error) {
			const msg = error instanceof Error ? error.message : JSON.stringify(error);
			console.warn(`*** Exception writing to Segment: ${msg} ***`);
		}
	}

	midnight (timestamp) {
		const msSinceMidnightGmt = timestamp % ONE_DAY;
		return timestamp - msSinceMidnightGmt;
	}

	async wait (ms) {
		await new Promise(resolve => {
			setTimeout(resolve, ms);
		});
	}
}

(async function() {
	try {
		const Config = await ApiConfig.loadPreferredConfig();
		await new TransferSendGridData({ config: Config }).go();
	}
	catch (error) {
		const msg = error instanceof Error ? error.message : JSON.stringify(error);
		console.error(msg);
		process.exit(1);
	}
	process.exit(0);
})();
