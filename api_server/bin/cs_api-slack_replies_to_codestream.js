#!/usr/bin/env node

/* eslint no-console: 0 */

'use strict';

const MongoClient = require(process.env.CS_API_TOP + '/server_utils/mongo/mongo_client');
const MongoConfig = require(process.env.CS_API_TOP + '/config/mongo');
const Commander = require('commander');
const CodemarkIndexes = require(process.env.CS_API_TOP + '/modules/codemarks/indexes');
const UserIndexes = require(process.env.CS_API_TOP + '/modules/users/indexes');
const StreamIndexes = require(process.env.CS_API_TOP + '/modules/streams/indexes');
const PasswordHasher = require(process.env.CS_API_TOP + '/modules/users/password_hasher');

const { WebClient } = require('@slack/web-api');

Commander
	.option('-t, --teamId <teamId>', 'Team ID to fetch Slack replies for, specify "all" for all Slack teams (be careful!)')
	.option('--dryrun', 'Do a dry run, meaning don\'t actually write the replies to our database, but report on numbers')
	.option('--throttle <throttle>', 'Pause this number of milliseconds between teams')
	.option('--verbose', 'Verbose output')
	.option('--debug', 'Debug output')
	.parse(process.argv);

const COLLECTIONS = ['teams', 'posts', 'codemarks', 'users', 'streams', 'teams'];
const DEFAULT_THROTTLE_TIME = 1000;

const Logger = console;
const ThrottleTime = Commander.throttle ? parseInt(Commander.throttle) : DEFAULT_THROTTLE_TIME;

// for paginated requests, we'll throttle repeated requested according to the tier
// the Slack API request is on for rate limiting
const SLACK_TIER_THROTTLE_TIMES = {
	1: 60000,
	2: 3000,
	3: 1200,
	4: 600
};

// wait this number of milliseconds
const Wait = function(time) {
	return new Promise(resolve => {
		setTimeout(resolve, time);
	});
};

class TeamReplyFetcher {

	constructor (options) {
		Object.assign(this, options);
		this.slackClients = {};
		this.streamSeqNums = {};
		this.slackStreams = {};
		this.streams = {};
	}

	// fetch all the replies to codemarks for a team and turn them into posts
	async fetchRepliesForTeam (team) {
		this.team = team;
		this.totalReplies = 0;
		await this.getTeamUsers();
		await this.ensureTeamStream();
		await this.processCodemarks();
		await this.updateTeam();
		await this.setUserPasswords();
		Logger.log(`\tTOTAL REPLIES FOR TEAM: ${this.totalReplies}`);
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
			Logger.log(`\tWould have created team stream for team ${this.team.id}`);
			this.teamStream = stream;
		}
		else {
			Logger.log(`\tCreating team stream for team ${this.team.id}...`);
			this.teamStream = await this.data.streams.create(stream);
		}
		this.verbose(stream);
	}

	// process all the codemarks for the team, looking for replies to convert into CodeStream posts
	async processCodemarks () {
		this.debug('\tProcessing codemarks...');
		const result = await this.data.codemarks.getByQuery(
			{
				teamId: this.team.id
			},
			{
				stream: true,
				hint: CodemarkIndexes.byTeamId,
				sort: { createdAt: 1 }
			}
		);

		let codemark;
		do {
			codemark = await result.next();
			if (codemark) {
				try {
					await this.processCodemark(codemark);
				}
				catch (error) {
					Logger.warn(`Error thrown processing codemark ${codemark.id}, ignoring: ${error}`);
				}
				await Wait(ThrottleTime);
			}
		} while (codemark);
		result.done();
	}

	// process a single codemark for a team
	async processCodemark (codemark) {
		Logger.log(`\tProcessing codemark ${codemark.id}...`);

		// for each codemark, we'll use the slack access token of the codemark creator to make our slack API calls
		this.debug(`\t\tGetting user slack client for creator of codemark, ${codemark.creatorId}...`);
		const slackClient = await this.getUserSlackClient(this.team, codemark);
		if (typeof slackClient === 'string') {
			Logger.warn(`WARNING: Could not connect to slack on behalf of codemark ${codemark.id} creator ${codemark.creatorId}, skipping this codemark: ${slackClient}`);
			return;
		}

		// get the Slack stream for this codemark's post on Slack
		this.debug('\t\tGetting the Slack stream...');
		const slackStream = await this.getSlackStream(codemark, slackClient);

		// ensure we have the appropriate stream for this codemark
		this.debug('\t\tEnsuring stream for this codemark...');
		const stream = await this.ensureStream(slackStream, slackClient, codemark);

		// create a post pointing to this codemark on CodeStream, and then handle the actual replies
		const postId = this.data.posts.createId().toString();
		const numReplies = await this.processCodemarkReplies(codemark, postId, stream, slackClient);
		const post = await this.createCodemarkPost(codemark, postId, stream, numReplies);

		// update the codemark to actually point to the post
		await this.updateCodemark(codemark, post, numReplies);

		this.totalReplies += numReplies;
	}

	// create a post pointing to a given codemark, possibly also creating a stream for the post to go in
	async createCodemarkPost (codemark, postId, stream, numReplies) {
		const seqNum = this.bumpSeqNum(stream);
		const postData = {
			id: postId,
			version: 1,
			deactivated: false,
			createdAt: codemark.createdAt,
			modifiedAt: codemark.createdAt,
			creatorId: codemark.creatorId,
			codemarkId: codemark.id,
			teamId: codemark.teamId,
			streamId: stream.id,
			seqNum,
			numReplies
		};

		let post;
		if (Commander.dryrun) {
			Logger.log('\t\tWould have created post for codemark');
			post = postData;
		}
		else {
			Logger.log('\t\tCreating post for codemark...');
			post = await this.data.posts.create(postData);
		}
		this.verbose(postData);
		return post;
	}

	// ensure we have an appropriate CodeStream stream for a codemark
	async ensureStream (slackStream, slackClient, codemark) {
		// cache the codemark stream for each Slack stream
		if (this.streams[slackStream.id]) {
			this.debug(`\t\tFound stream ${this.streams[slackStream.id]} for Slack stream ${slackStream.id}`);
			return this.streams[slackStream.id];
		}

		// for public channels on Slack, we'll just use the team stream on CodeStream
		let stream;
		if (slackStream.id.startsWith('C') && !slackStream.is_private) {
			this.debug(`\t\tWill use team stream ${this.teamStream.id} for Slack stream ${slackStream.id}`);
			this.streams[slackStream.id] = this.teamStream;
			return this.teamStream;
		}

		// for private channels, groups, and DMs, make sure we have all the members, 
		// create "faux users" as needed
		this.debug('\t\tEnsuring stream members...');
		const members = await this.ensureStreamMembers(slackClient, slackStream);

		// create the stream we need ... note that if it's a CodeStream DM, there might already be a 
		// stream with the necessary membership
		const memberIds = members.map(m => m.id);
		const type = slackStream.id.startsWith('C') ? 'channel' : 'direct';
		this.debug(`\t\tCreating ${type} stream with ${memberIds.length} members...`);
		stream = await this.createStream(type, memberIds, slackStream.name, slackStream, codemark);
		this.streams[slackStream.id] = stream;
		return stream;
	}

	// ensure we have CodeStream users for all the necessary members of a stream
	async ensureStreamMembers (slackClient, slackStream) {
		// first make sure we have all the Slack users for the workspace we are attached to
		await this.ensureSlackUsers(slackClient);

		// get the membership of the Slack stream
		this.debug('\t\tFetching Slack stream members...');
		const memberIds = await this.slackApiPaginated(
			slackClient,
			'conversations.members',
			{
				channel: slackStream.id
			},
			'members',
			4
		);
		
		// for each member of the Slack stream, ensure we have a corresponding CodeStream user
		this.debug(`\t\tEnsuring ${memberIds.length} users...`);
		const members = [];
		for (let memberId of memberIds) {
			const slackUser = this.slackUsers[memberId];
			if (!slackUser) {
				Logger.warn(`Slack user ${memberId} not found among slack users for workspace, will not be a member of stream created for ${slackStream.id}`);
				return;
			}
			const user = await this.ensureUser(slackUser);
			members.push(user);
		}
		return members;
	}
	
	// ensure we have a CodeStream user corresponding to the given Slack user
	async ensureUser (slackUser) {
		// first look through our existing users, looking for a match on the Slack ID, this could
		// be an actual registered user, a "faux user", or a match by email
		this.debug(`\t\t\tFinding match for Slack user ${slackUser.id}...`);
		let userId = Object.keys(this.users).find(userId => {
			const ourUser = this.users[userId]; 
			return (
				(ourUser.providerIdentities && ourUser.providerIdentities[`slack::${slackUser.id}`]) ||
				(ourUser.externalUserId === `slack::${this.team.id}::${slackUser.team_id}::${slackUser.id}`) ||
				(slackUser.profile && slackUser.profile.email && slackUser.profile.email === ourUser.email)
			);
		});
		const user = userId && this.users[userId];
		if (user) {
			this.debug(`\t\t\tFound matching user ${user.id} for Slack user ${slackUser.id}`);
			return user;
		}

		// no match found, so create a "faux user"
		this.debug(`\t\t\tCreating faux user for Slack user ${slackUser.id}...`);
		return await this.createFauxUser(slackUser);
	}

	// create a "faux user" - an unregistered user to stand in for the given Slack user
	// this user doesn't appear as an actual member of the team in the CodeStream UI, but they
	// have a CodeStream user ID for purposes of reply authorship
	async createFauxUser (slackUser) {
		const id = this.data.users.createId().toString();
		const now = Date.now();
		const userData = {
			id,
			version: 1,
			deactivated: false,
			createdAt: now,
			modifiedAt: now,
			username: slackUser.name,
			externalUserId: `slack::${this.team.id}::${slackUser.team_id}::${slackUser.id}`,
			creatorId: id,
			teamIds: [this.team.id],
			companyIds: [this.team.companyId]
		};
		if (slackUser && slackUser.profile && slackUser.profile.email) {
			userData.email = slackUser.profile.email;
		}
		if (slackUser && slackUser.profile && slackUser.profile.real_name) {
			userData.fullName = slackUser.profile.real_name;
		}
		if (slackUser && slackUser.tz) {
			userData.timeZone = slackUser.tz;
		}

		let user;
		if (Commander.dryrun) {
			Logger.log(`\t\t\tWould have created faux user for slack user ${slackUser.id}`);
			user = userData;
		}
		else {
			Logger.log(`\t\t\tCreating faux user for slack user ${slackUser.id}...`);
			user = await this.data.users.create(userData);
		}
		this.verbose(userData);
		this.users[user.id] = user;
		return user;
	}

	// create a stream of the given type with the given members
	async createStream (type, memberIds, name, slackStream, codemark) {
		let stream;
		if (type === 'direct') {
			// for direct streams, we might already have a stream with the same members
			this.debug('\t\tLooking for match to direct stream...');
			const streams = this.data.streams.getByQuery(
				{
					teamId: this.team.id,
					memberIds: memberIds,
					type: 'direct'
				},
				{
					hint: StreamIndexes.byMembers
				}
			);
			if (streams[0]) {
				this.debug(`\t\tFound matching direct stream ${streams[0].id}`);
				this.streams[slackStream.id] = streams[0];
				return streams[0];
			}
		}

		const id = this.data.streams.createId().toString();
		const now = Date.now();
		const streamData = {
			id,
			version: 1,
			deactivated: false,
			createdAt: now,
			modifiedAt: now,
			teamId: this.team.id,
			type,
			privacy: 'private',
			creatorId: codemark.creatorId,
			nextSeqNum: 1,
			sortId: id
		};
		if (type === 'channel') {
			streamData.name = name;
		}	

		if (Commander.dryrun) {
			Logger.log(`\t\tWould have created ${type} stream for codemark ${codemark.id}`);
			stream = streamData;
		}
		else {
			Logger.log(`\tCreating ${type} stream for codemark ${codemark.id}...`);
			stream = await this.data.streams.create(streamData);
		}
		this.verbose(streamData);
		this.streams[slackStream.id] = stream; // cache the stream as being the right one for the given Slack stream
		return stream;
	}

	// ensure we have all the Slack users for the workspace attached to the gien team
	async ensureSlackUsers (slackClient) {
		if (this.slackUsers) { 
			this.debug('\t\tAlready have Slack users for this workspace');
			return;
		}

		this.debug('\t\tFetching Slack users for this workspace...');
		const users = await this.slackApiPaginated(
			slackClient,
			'users.list',
			{ },
			'members',
			2
		);
		this.slackUsers = users.reduce((usersHash, user) => {
			usersHash[user.id] = user;
			return usersHash;
		}, {});
		this.debug(`\t\tFound ${Object.keys(this.slackUsers).length} users in this workspace`);
	}

	// each post we put in a stream has to have an ever-increasing sequence number, we'll keep
	// track of that here
	bumpSeqNum (stream) {
		this.streamSeqNums[stream.id] = this.streamSeqNums[stream.id] || 0;
		return ++this.streamSeqNums[stream.id];
	}

	// get the Slack stream this particular codemark was posted in
	async getSlackStream (codemark, slackClient) {
		// first check our cache
		if (this.slackStreams[codemark.streamId]) {
			this.debug(`\t\tFound stream ${this.slackStreams[codemark.streamId].id} for Slack stream ${codemark.streamId}`);
			return this.slackStreams[codemark.streamId];
		}

		// now call out to the Slack API
		this.debug(`\t\tGetting Slack stream ${codemark.streamId}...`);
		const response = await this.slackApi(
			slackClient,
			'conversations.info',
			{
				channel: codemark.streamId
			}
		);
		const stream = response.channel;
		this.slackStreams[codemark.streamId] = stream;
		return stream;
	}

	// process all the replies to a given codemark, creating CodeStream posts as needed
	async processCodemarkReplies (codemark, postId, stream, slackClient) {
		this.debug('\t\tProcessing codemark replies...');
		try {
			let numReplies = 0;
			const threadTs = codemark.postId.split('|')[1];
			const messages = await this.slackApiPaginated(
				slackClient,
				'conversations.replies',
				{
					channel: codemark.streamId,
					ts: threadTs
				},
				'messages',
				3
			);
			for (let message of messages) {
				if (message.ts !== threadTs) {
					await this.processCodemarkReply(codemark, message, postId, stream, slackClient);
					numReplies++;
				}
			}
			return numReplies;
		}
		catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			Logger.warn(`WARNING: Error getting replies to codemark ${codemark.id}, skipping this codemark: ${message}`);
		}
	}

	// process a single codemark reply, creating a CodeStream post for it
	async processCodemarkReply (codemark, message, postId, stream, slackClient) {
		// first make sure we have all the Slack users for the workspace we are attached to
		await this.ensureSlackUsers(slackClient);

		// make sure we have an author for the reply
		const slackUser = this.slackUsers[message.user];
		if (!slackUser) {
			Logger.warn(`Slack user ${message.user} not found among slack users for workspace, cannot create reply for message ${message.ts}`);
			return;
		}
		const user = await this.ensureUser(slackUser);

		// create a post for the reply
		Logger.log(`\t\t\tProcessing reply ${message.ts} to codemark ${codemark.id}...`);
		const id = this.data.posts.createId().toString();
		const now = Date.now();
		const seqNum = this.bumpSeqNum(stream);
		const postData = {
			id,
			version: 1,
			deactivated: false,
			numReplies: 0,
			createdAt: now,
			modifiedAt: now,
			streamId: stream.id,
			parentPostId: postId,
			teamId: this.team.id,
			creatorId: user.id,
			text: message.text,
			seqNum
		};

		let reply;
		if (Commander.dryrun) {
			Logger.log('\t\t\tWould have created reply post to codemark');
			reply = postData;
		}
		else {
			Logger.log('\t\t\tCreating reply post to codemark...');
			reply = await this.data.posts.create(postData);
		}
		this.verbose(postData);
		return reply;
	}

	// update the codemark to point to the created post
	async updateCodemark (codemark, post, numReplies) {
		const op = {
			$unset: {
				providerType: true
			},
			$set: {
				postId: post.id,
				streamId: post.streamId,
				numReplies
			}
		};
		if (Commander.dryrun) {
			Logger.log('\t\tWould have updated codemark');
		}
		else {
			await this.data.codemarks.applyOpById(codemark.id, op);
			Logger.log('\t\tUpdating codemark...');
		}
		this.verbose(op);
		Object.assign(codemark, op.$set);
		delete codemark.providerType;
	}

	// update the team to no longer be a slack team
	async updateTeam () {
		const providerIdentities = this.team.providerIdentities.filter(pi => !pi.startsWith('slack'));
		const op = {
			$unset: {
				'providerInfo.slack': true
			},
			$set: {
				providerIdentities
			}
		};
		if (Commander.dryrun) {
			Logger.log('\tWould have updated team');
		}
		else {
			await this.data.teams.applyOpById(this.team.id, op);
			Logger.log(`\tUpdating team ${this.team.id}...`);
		}
		this.verbose(op);
		Object.assign(this.team, op.$set);
		delete this.team.providerIdentities;
	}

	// update the users on the given team by giving them a temporary password so they can sign in
	async setUserPasswords () {
		for (let userId in this.users) {
			const user = this.users[userId];
			if (user.isRegistered && !user.passwordHash) {
				await this.setUserPassword(user);
			}
		}
	}

	// update the given user by giving them a temporary password so they can sign in
	async setUserPassword (user) {
		const passwordHash = await new PasswordHasher({
			password: 'temp123'
		}).hashPassword();
		const updateData = { passwordHash };
		if (Commander.dryrun) {
			Logger.log(`\t\tWould have set temporary password for user ${user.id}:${user.email}`);
		}
		else {
			await this.data.users.updateById(user.id, updateData);
			Logger.log('\t\tSetting temporary password for user ${user.id}:${user.email}...');
		}
		this.verbose(updateData);
		Object.assign(user, updateData);
	}

	// get a slack client object used to call out to the Slack API, we use the creator of the codemark
	// for the access token for the slack client
	async getUserSlackClient (team, codemark) {
		// do we already have a slack client for this codemark's creator?
		if (this.slackClients[codemark.creatorId]) {
			this.debug(`\t\tAlready have Slack client for ${codemark.creatorId}`);
			return this.slackClients[codemark.creatorId];
		}

		// do we already have the author of this codemark? (we should)
		let user;
		if (this.users[codemark.creatorId]) {
			this.debug(`\t\tAlready have user ${codemark.creatorId}`);
			user = this.users[codemark.creatorId];
		}

		// but just in case, find it in the database
		if (!user) {
			this.debug(`\t\tFetching user ${codemark.creatorId}`);
			user =  await this.data.users.getById(codemark.creatorId);
			if (!user) {
				return 'user not found';
			}
		}

		// now make sure that user has a Slack access token for this team
		this.users[codemark.creatorId] = user;
		const userId = user.id;
		const teamId = team.id;
		const token = (
			user.providerInfo &&
			user.providerInfo[teamId] &&
			user.providerInfo[teamId].slack &&
			user.providerInfo[teamId].slack.accessToken
		) || (
			user.providerInfo &&
			user.providerInfo.slack &&
			user.providerInfo.slack.accessToken
		);
		if (!token) {
			return 'user has no access token';
		}

		try {
			// form the slack client object
			this.debug(`\t\tMaking Slack client for ${codemark.creatorId}...`);
			const client = new WebClient(token);
			const authTestResponse = await client.auth.test();
			if (authTestResponse && authTestResponse.ok) {
				this.slackClients[userId] = client;
				return client;
			}
			else {
				return 'access token test failed';
			}
		}
		catch (error) {
			return `error testing access token: ${error}`;
		}
	}

	// make a slack call
	async slackApi (slackClient, moduleMethod, data) {
		try {
			this.debug(`\t\t\t\t\t\t\t(SLACK API: ${moduleMethod}...)`);
			const [module, method] = moduleMethod.split('.');
			this.verbose(data);
			return await slackClient[module][method](data);
		}
		catch (error) {
			throw (`slack call failed: ${error}`);
		}
	}

	// make a paginated slack call, accumulating the results, with possible throttling
	// based on the rate limiting tier of the slack API request
	async slackApiPaginated (slackClient, moduleMethod, data, collection, tier) {
		let responses = [];
		do {
			this.debug(`\t\t\t\t\t\t(SLACK API PAGINATED: ${moduleMethod}...)`);
			const response = await this.slackApi(slackClient, moduleMethod, data);
			if (collection) {
				responses = [...responses, ...response[collection]];
			}
			else {
				responses.push(response);
			}
			data.cursor = (response.response_metdata && response.response_metadata.next_cursor) || undefined;
			const throttle = SLACK_TIER_THROTTLE_TIMES[tier] || 0;
			if (data.cursor) {
				await Wait(throttle);
			}
		} while (data.cursor);
		return responses;
	}

	debug (msg) {
		Commander.debug && Logger.log(msg);
	}

	verbose (obj) {
		Commander.verbose && Logger.log(JSON.stringify(obj, undefined, 10));
	}
}

class SlackReplyFetcher {

	// main entry point
	async go (options = {}) {
		try {
			Object.assign(this, options);
			await this.openMongoClient();

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

	// process all Slack teams in our database! (this could take some time...)
	async processAllTeams () {
		const result = await this.data.teams.getByQuery(
			{
				'providerInfo.slack': {$exists: true},
				deactivated: false
			},
			{
				stream: true,
				overrideHintRequired: true
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

	// process a single Slack team, as given by team ID
	async processSingleTeam () {
		const team = await this.data.teams.getById(this.teamId);
		return this.processTeam(team);
	}

	// process a single Slack team
	async processTeam (team) {
		Logger.log(`Processing team ${team.id}...`);
		await new TeamReplyFetcher({ data: this.data }).fetchRepliesForTeam(team);
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
}

(async function() {
	try {
		const teamId = Commander.teamId;
		if (!teamId) {
			throw 'must provide teamId or all';
		}
		await new SlackReplyFetcher().go({ teamId });
	}
	catch (error) {
		console.error(error);
		process.exit();
	}
})();


