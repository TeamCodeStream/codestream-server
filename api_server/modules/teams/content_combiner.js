// provides a class to combine the content for a team or teams into the single team-stream
// for the given team, for moving to the "one-stream" paradigm

'use strict';

const MongoClient = require(process.env.CS_API_TOP + '/lib/util/mongo/mongo_client');
const MongoConfig = require(process.env.CS_API_TOP + '/config/mongo');
const PostIndexes = require(process.env.CS_API_TOP + '/modules/posts/indexes');
const StreamIndexes = require(process.env.CS_API_TOP + '/modules/streams/indexes');

const COLLECTIONS = ['teams', 'streams', 'posts',];

// this class combines the content for a single team into the single team-stream for that team
class TeamContentCombiner {

	// combine the content for a single team (given by ID) into a single team-stream
	// for that team, creating the team-stream as needed
	async go (options) {
		Object.assign(this, options);
		await this.getOrCreateTeamStream();
		await this.moveContent();
		await this.getPosts();
		await this.setSeqNums();
	}

	// get the team's team-stream, or create it if needed
	async getOrCreateTeamStream () {
		this.teamStream = await this.getTeamStream();
		if (!this.teamStream) {
			this.teamStream = await this.createTeamStream();
		}
	}

	// get the team's team-stream
	async getTeamStream () {
		const query = {
			teamId: this.teamId,
			type: 'channel',
			isTeamStream: true
		};
		const streams = await this.data.streams.getByQuery(
			query,
			{ hint: StreamIndexes.byType } 
		);
		return streams[0];
	}

	// create a team-stream for the team
	async createTeamStream () {
		const streamData = {
			teamId: this.teamId,
			type: 'channel',
			name: 'general',
			isTeamStream: true
		};
		const stream = await this.data.streams.create(streamData);
		return stream;
	}

	// move the content for all the team's streams (all posts) to the one team-stream
	async moveContent () {
		await this.data.posts.updateDirect(
			{ teamId: this.teamId },
			{ $set: { streamId: this.teamStream._id } }
		);
	}

	// get all the posts that have now been moved to the team-stream, we need to 
	// update their sequence numbers, otherwise they will be all out of whack
	async getPosts () {
		this.posts = await this.data.posts.getByQuery(
			{ 
				teamId: this.teamId,
				streamId: this.teamStream._id
			},
			{ 
				hint: PostIndexes.byId,
				fields: ['_id', 'createdAt']
			}
		);
	}

	// set the sequence numbers for each post in the team-stream, according to their
	// creation time
	async setSeqNums () {
		this.posts.sort((a, b) => {
			return a.createdAt - b.createdAt;
		});
		for (let i = 0; i < this.posts.length; i++) {
			const post = this.posts[i];
			await this.data.posts.updateDirect(
				{ _id: this.data.posts.objectIdSafe(post._id) },
				{ $set: { seqNum: i + 1 } }
			);
		}
	}
}

// this class combines the content for any number of teams into the single team-stream 
// for the given team
class ContentCombiner {

	// main entry point
	async go (options) {
		Object.assign(this, options);
		this.logger = this.logger || console;
		await this.openMongoClient();
		const teamIds = this.teamIds || (await this.getTeams()).map(team => team._id);
		await Promise.all(teamIds.map(async teamId => {
			this.logger.log(`Moving posts for team ${teamId}...`);
			await new TeamContentCombiner().go({ 
				data: this.mongoClient.mongoCollections,
				teamId,
				logger: this.logger || console
			});
		}));
	}

	// open a mongo client to do the dirty work
	async openMongoClient () {
		this.mongoClient = new MongoClient();
		let mongoConfig = Object.assign({}, MongoConfig, { collections: COLLECTIONS });
		delete mongoConfig.queryLogging;
		try {
			await this.mongoClient.openMongoClient(mongoConfig);
		}
		catch (error) {
			throw `unable to open mongo client: ${JSON.stringify(error)}`;
		}
	}

	// if we weren't given team IDs, do it for all
	async getTeams () {
		return await this.mongoClient.mongoCollections.teams.getByQuery(
			{},
			{ 
				hint: { _id: 1 },
				fields: ['_id']
			}
		);
	}
}

module.exports = ContentCombiner;
