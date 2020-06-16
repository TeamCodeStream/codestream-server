// this class should be used to create all provider-post documents in the database

'use strict';

const ProviderPost = require('./provider_post');
const ModelCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_creator');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');

class ProviderPostCreator extends ModelCreator {

	get modelClass () {
		return ProviderPost;	// class to use to create a provider-post model
	}

	get collectionName () {
		return 'providerPosts';	// data collection to use
	}

	// convenience wrapper
	async createProviderPost (attributes) {
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
		this.attributes.provider = this.request.request.params.provider.toLowerCase();
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

module.exports = ProviderPostCreator;
