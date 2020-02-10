#!/usr/bin/env node

/* eslint no-console: 0 */

'use strict';

const MongoClient = require(process.env.CS_API_TOP + '/server_utils/mongo/mongo_client');
const MongoConfig = require(process.env.CS_API_TOP + '/config/mongo');
const Commander = require('commander');
const CodemarkIndexes = require(process.env.CS_API_TOP + '/modules/codemarks/indexes');
const UserIndexes = require(process.env.CS_API_TOP + '/modules/users/indexes');
const StreamIndexes = require(process.env.CS_API_TOP + '/modules/streams/indexes');
const PubNub = require('pubnub');
const PubNubClient = require(process.env.CS_API_TOP + '/server_utils/pubnub/pubnub_client_async');
const PubNubConfig = require(process.env.CS_API_TOP + '/config/pubnub');
const UUID = require('uuid/v4');
const OS = require('os');

Commander
	.option('-t, --teamId <teamId>', 'Team ID to convert from MSTeams, specify "all" for all MSTeams teams (be careful!)')
	.option('--dryrun', 'Do a dry run, meaning don\'t actually write anything to our database, but report on numbers')
	.option('--throttle <throttle>', 'Pause this number of milliseconds between teams')
	.option('--verbose', 'Verbose output')
	.option('--debug', 'Debug output')
	.option('--dieonwarn <dieonwarn>', 'Die on a warning', parseInt)
	.parse(process.argv);

const COLLECTIONS = ['teams', 'posts', 'codemarks', 'users', 'streams', 'teams', 'markers'];
const DEFAULT_THROTTLE_TIME = 1000;

const Logger = console;
const ThrottleTime = Commander.throttle ? parseInt(Commander.throttle) : DEFAULT_THROTTLE_TIME;

// wait this number of milliseconds
const Wait = function(time) {
	return new Promise(resolve => {
		setTimeout(resolve, time);
	});
};

class TeamCodemarkConverter {

	constructor (options) {
		Object.assign(this, options);
		this.streamSeqNums = {};
		this.streams = {};
		this.warnCount = 0;
		this.totalCodemarks = 0;
		this.numSkipped = 0;
		this.codemarksConverted = 0;
	}

	// fetch all the replies to codemarks for a team and turn them into posts
	async convertForTeam (team) {
		this.team = team;
		await this.getTeamUsers();
		await this.setUserFlags();
		await this.ensureTeamStream();
		await this.processCodemarks();
		await this.updateTeam();
		await this.clearUserFlags();
		this.log(`\tCODEMARKS: ${this.totalCodemarks}`);
		this.log(`\tSKIPPED: ${this.numSkipped}`);
		this.log(`\tCONVERTED: ${this.codemarksConverted}`);
		this.log(`\tWARNINGS: ${this.warnCount}`);
		this.log('==============================================================');
	}

	// get all the users on the given team
	async getTeamUsers () {
		this.debug('\tGetting users on team...');
		const users = await this.data.users.getByQuery(
			{
				teamIds: this.team.id
			},
			{
				hint: UserIndexes.byTeamIds
			}
		);
		this.users = users.reduce((usersHash, user) => {
			usersHash[user.id] = user;
			return usersHash;
		}, {});
		this.debug(`\t${Object.keys(this.users).length} users found on team`);
	}

	// set maintenance mode, must set password, and clear provider info flags for all users on the team
	async setUserFlags () {
		if (Commander.dryrun) {
			this.log('\tWould have set user flags');
			return;
		}
		else {
			this.log('\tSetting user flags...');
		}
		const op = {
			$set: {
				inMaintenanceMode: true,
				mustSetPassword: true,
				clearProviderInfo: true
			}
		};

		await this.data.users.updateDirect({ teamIds: this.team.id }, op);
		await this.sendOpsToUsers(op);
	}

	// send pubnub message for all users on team
	async sendOpsToUsers (op) {
		const requestId = UUID();
		this.log(`\tSending Pubnub op to ${Object.keys(this.users).length} users, reqid=${requestId}...`);
		await Promise.all(Object.keys(this.users).map(async userId => {
			await this.sendUserOp(userId, op, requestId);
		}));
	}

	// send pubnub message for user
	async sendUserOp (userId, op, requestId) {
		// send pubnub update on user's me-channel
		const message = {
			user: Object.assign(op, { id: userId }),
			requestId
		};
		const channel = `user-${userId}`;
		try {
			await this.pubnub.publish(
				message,
				channel
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate
			this.warn(`WARNING: Unable to publish user op to channel ${channel}: ${JSON.stringify(error)}`);
		}
	}

	// make sure we have a team stream for the given team
	async ensureTeamStream () {
		this.debug('\tLooking for team stream...');
		const teamStreams = await this.data.streams.getByQuery(
			{
				teamId: this.team.id,
				isTeamStream: true
			},
			{
				hint: StreamIndexes.byIsTeamStream
			}
		);
		if (teamStreams.length > 0) {
			this.teamStream = teamStreams[0];
			this.debug(`\tFound team stream ${this.teamStream.id}`);
			return;
		}

		this.debug('\tCreating a team stream...');
		const id = this.data.streams.createId().toString();
		const stream = {
			id,
			version: 1,
			deactivated: false,
			createdAt: this.team.createdAt,
			modifiedAt: this.team.createdAt,
			teamId: this.team.id,
			type: 'channel',
			name: 'general',
			isTeamStream: true,
			privacy: 'public',
			creatorId: this.team.creatorId,
			sortId: id,
			nextSeqNum: 1
		};
		if (Commander.dryrun) {
			this.log(`\tWould have created team stream for team ${this.team.id}`);
			this.teamStream = stream;
		}
		else {
			this.log(`\tCreating team stream for team ${this.team.id}...`);
			this.teamStream = await this.data.streams.create(stream);
		}
		this.verbose(stream);
	}

	// process all the codemarks for the team
	async processCodemarks () {
		this.debug('\tProcessing codemarks...');
		let codemark;
		do {
			let n = 0;
			const query = {
				teamId: this.team.id,
				deactivated: false
			};
			if (codemark) {
				query.createdAt = { $gt: codemark.createdAt };
			}
			this.debug(`\tInitiating new query: ${JSON.stringify(query)}...`);
			const result = await this.data.codemarks.getByQuery(
				query,
				{
					stream: true,
					hint: CodemarkIndexes.byTeamId,
					sort: { createdAt: 1 }
				}
			);

			do {
				codemark = await result.next();
				if (codemark) {
					try {
						await this.processCodemark(codemark);
					}
					catch (error) {
						this.warn(`WARNING: Error thrown processing codemark ${codemark.id}, ignoring: ${error}`);
					}
					await Wait(ThrottleTime);
					n++;
				}
			} while (codemark && n < 500);
			result.done();
		} while (codemark);
	}

	// process a single codemark for a team
	async processCodemark (codemark) {
		this.totalCodemarks++;
		this.log(`\tProcessing codemark #${this.totalCodemarks}: ${codemark.id}...`);

		// link-type codemarks are not posted on MSTeams
		if (codemark.type === 'link') {
			this.log(`\t\tSkipping link-type codemark ${codemark.id}`);
			this.numSkipped++;
			return;
		}

		// create a post pointing to this codemark on CodeStream
		const postId = this.data.posts.createId().toString();
		const post = await this.createCodemarkPost(codemark, postId);

		// update the codemark and markers to actually point to the post
		await this.updateCodemark(codemark, post);
		await this.updateMarkers(codemark, post);

		this.codemarksConverted++;
	}

	// create a post pointing to a given codemark, the post will go into the team stream
	async createCodemarkPost (codemark, postId) {
		const seqNum = this.bumpSeqNum(this.teamStream);
		const postData = {
			id: postId,
			version: 1,
			deactivated: false,
			createdAt: codemark.createdAt,
			modifiedAt: codemark.createdAt,
			creatorId: codemark.creatorId,
			codemarkId: codemark.id,
			teamId: codemark.teamId,
			streamId: this.teamStream.id,
			seqNum
		};

		let post;
		if (Commander.dryrun) {
			this.log('\t\tWould have created post for codemark');
			post = postData;
		}
		else {
			this.log('\t\tCreating post for codemark...');
			post = await this.data.posts.create(postData);
		}
		this.verbose(postData);
		return post;
	}

	// each post we put in a stream has to have an ever-increasing sequence number, we'll keep
	// track of that here
	bumpSeqNum (stream) {
		this.streamSeqNums[stream.id] = this.streamSeqNums[stream.id] || 0;
		return ++this.streamSeqNums[stream.id];
	}

	// update the codemark to point to the created post
	async updateCodemark (codemark, post) {
		const op = {
			$unset: {
				providerType: true
			},
			$set: {
				postId: post.id,
				streamId: post.streamId
			}
		};

		if (Commander.dryrun) {
			this.log('\t\tWould have updated codemark');
		}
		else {
			await this.data.codemarks.applyOpById(codemark.id, op);
			this.log('\t\tUpdating codemark...');
		}
		this.verbose(op);
		Object.assign(codemark, op.$set);
		delete codemark.providerType;
	}

	// update markers associated with the codemark to point to the codemark's post and stream
	async updateMarkers (codemark, post) {
		const query = {
			teamId: this.team.id,
			codemarkId: codemark.id
		};
		const op = {
			$set: {
				postStreamId: post.streamId,
				postId: post.id
			}
		};

		if (Commander.dryrun) {
			this.log('\t\tWould have updated markers');
		}
		else {
			this.log('\t\tUpdating markers...');
			await this.data.markers.updateDirect(query, op);
		}
		this.verbose(query);
		this.verbose(op);
	}

	// update the team to no longer be a MSTeams team
	async updateTeam () {
		const providerIdentities = this.team.providerIdentities.filter(pi => !pi.startsWith('msteams'));
		const op = {
			$unset: {
				'providerInfo.msteams': true
			},
			$set: {
				providerIdentities
			}
		};
		if (Commander.dryrun) {
			this.log('\tWould have updated team');
		}
		else {
			await this.data.teams.applyOpById(this.team.id, op);
			this.log(`\tUpdating team ${this.team.id}...`);
		}
		this.verbose(op);
		Object.assign(this.team, op.$set);
		delete this.team.providerIdentities;
	}

	// clear maintenance mode flags for all users on the team
	async clearUserFlags () {
		if (Commander.dryrun) {
			this.log('\tWould have cleared user maintenance mode flags');
			return;
		}
		else {
			this.log('\tClearing user maintenance mode flags...');
		}

		const op = { 
			$unset: {
				inMaintenanceMode: true 
			}
		};

		await this.data.users.updateDirect({ teamIds: this.team.id }, op);
		await this.sendOpsToUsers(op);
	}

	log (msg) {
		Logger.log(msg);
	}

	warn (msg) {
		Logger.warn(msg);
		this.warnCount++;
		if (Commander.dieonwarn && this.warnCount === Commander.dieonwarn) {
			process.exit();
		}
	}

	debug (msg) {
		Commander.debug && Logger.log(msg);
	}

	verbose (obj) {
		Commander.verbose && Logger.log(JSON.stringify(obj, undefined, 10));
	}
}

class MSTeamsConverter {

	// main entry point
	async go (options = {}) {
		try {
			Object.assign(this, options);
			await this.openMongoClient();
			await this.openPubnubClient();

			if (this.teamId === 'all') {
				await this.processAllTeams();
			}
			else {
				await this.processSingleTeam();
			}
		}
		catch (error) {
			Logger.error(error);
			process.exit();
		}
		process.exit();
	}

	// process all MSTeams teams in our database! (this could take some time...)
	async processAllTeams () {
		const result = await this.data.teams.getByQuery(
			{
				'providerIdentities': /msteams::/,
				deactivated: false
			},
			{
				stream: true,
				overrideHintRequired: true,
				sort: { _id: -1 }
			}
		);

		let team;
		do {
			team = await result.next();
			if (team) {
				await this.processTeam(team);
				await Wait(ThrottleTime);
			}
		} while (team);
		result.done();
	}

	// process a single MSTeams team, as given by team ID
	async processSingleTeam () {
		const team = await this.data.teams.getById(this.teamId);
		if (!team) {
			throw 'team not found: ' + this.teamId;
		}
		return this.processTeam(team);
	}

	// process a single MSTeams team
	async processTeam (team) {
		Logger.log(`Processing team ${team.id}...`);
		await new TeamCodemarkConverter({ data: this.data, pubnub: this.pubnubClient }).convertForTeam(team);
	}

	// open a mongo client to do the dirty work
	async openMongoClient () {
		this.mongoClient = new MongoClient();
		let mongoConfig = Object.assign({}, MongoConfig, { collections: COLLECTIONS });
		delete mongoConfig.queryLogging;
		try {
			await this.mongoClient.openMongoClient(mongoConfig);
			this.data = this.mongoClient.mongoCollections;
		}
		catch (error) {
			throw `unable to open mongo client: ${JSON.stringify(error)}`;
		}
	}

	// open a Pubnub client for broadcasting the changes
	async openPubnubClient () {
		let config = Object.assign({}, PubNubConfig);
		config.uuid = 'API-' + OS.hostname();
		this.pubnub = new PubNub(config);
		this.pubnubClient = new PubNubClient({
			pubnub: this.pubnub
		});
		this.pubnubClient.init();
	}
}

(async function() {
	try {
		const teamId = Commander.teamId;
		if (!teamId) {
			throw 'must provide teamId or all';
		}
		await new MSTeamsConverter().go({ teamId });
	}
	catch (error) {
		console.error(error);
		process.exit();
	}
})();


