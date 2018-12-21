// this class should be used to create all slack-post documents in the database

'use strict';

const SlackPost = require('./slack_post');
const ModelCreator = require(process.env.CS_API_TOP + '/lib/util/restful/model_creator');
const ModelSaver = require(process.env.CS_API_TOP + '/lib/util/restful/model_saver');

class SlackPostCreator extends ModelCreator {

	get modelClass () {
		return SlackPost;	// class to use to create a slack-post model
	}

	get collectionName () {
		return 'slackPosts';	// data collection to use
	}

	// convenience wrapper
	async createSlackPost (attributes) {
		return await this.createModel(attributes);
	}

	// get attributes that are required for post creation, and those that are optional,
	// along with their types
	getRequiredAndOptionalAttributes () {
		return {
			required: {
				string: ['teamId', 'streamId', 'postId']
			},
			optional: {
				string: ['parentPostId']
			}
		};
	}

	// called before the post is actually saved
	async preSave () {
		this.attributes.creatorId = this.user.id;
		this.attributes.createdAt = Date.now();
		this.attributes.origin = this.request.request.headers['x-cs-plugin-ide'] || '';
		if (this.request.isForTesting()) { // special for-testing header for easy wiping of test data
			this.attributes._forTesting = true;
		}
		await this.bumpPostsForUser();
		await super.preSave();			// base-class preSave
	}

	// bump the user's totalPosts count
	async bumpPostsForUser () {
		let totalPosts = this.user.get('totalPosts') || 0;
		totalPosts++;
		const op = { 
			$set: {
				totalPosts,
				modifiedAt: Date.now()
			}
		};
		this.updateOp = await new ModelSaver({
			request: this.request,
			collection: this.data.users,
			id: this.user.id
		}).save(op);
	}
}

module.exports = SlackPostCreator;
