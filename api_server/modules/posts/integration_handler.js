// handle integrations that should be triggered when a new post comes in

'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class IntegrationHandler {

	constructor (options) {
		Object.assign(this, options);
	}

	// handle any integrations related to new posts coming in
	handleNewPost (info, callback) {
		this.info = info;
		BoundAsync.series(this, [
			this.collectHooks,
			this.getParentPostCreator,
			this.getMentionedUsers,
			this.getMentionedUsersForParentPost,
			this.executeHooks
		], () => {
			// ignore errors, they are handled by each hook ... if we get an error, it is "true",
			// meaning there were no hooks to call at all
			callback();
		});
	}

	// collect the integration hooks that are actually going to be called ...
	// if there are hooks, there is no other work to be done
	collectHooks (callback) {
		const integrationNames = Object.keys(this.request.api.integrations || {});
		this.hooks = integrationNames.reduce(
			(hooks, integrationName) => {
				const integration = this.request.api.integrations[integrationName];
				if (this.hookEnabled(integrationName)) {
					hooks.push({
						name: integrationName,
						hook: integration.postHook.bind(integration)
					});
				}
				return hooks;
			},
			[]
		);
		if (this.hooks.length === 0) {
			return callback(true);	// short-circuit everything, get us out of here!
		}
		process.nextTick(callback);
	}

	// is the post hook enabled for the given integration?
	hookEnabled (integrationName) {
		const integration = this.request.api.integrations[integrationName];
		return (
			typeof integration.isEnabled === 'function' &&
			integration.isEnabled(this.info) &&
			typeof integration.postHook === 'function' &&
			this.info.post.get('origin') !== integrationName	// don't send post back to origin
		);
	}

	// get the creator of the parent post, as needed
	getParentPostCreator (callback) {
		if (!this.info.parentPost) { return callback(); }
		this.request.data.users.getById(
			this.info.parentPost.get('creatorId'),
			(error, parentPostCreator) => {
				if (error) { return callback(error); }
				if (!parentPostCreator) {
					return callback();	// this really shouldn't happen, but it's not worth an error
				}
				this.info.parentPostCreator = parentPostCreator;
				callback();
			}
		);
	}

	// get all the users mentioned in the main post, as needed
	getMentionedUsers (callback) {
		this.getMentionedUsersForPost(this.info.post, 'mentionedUsers', callback);
	}

	// get all the users mentioned in the parent post, as needed
	getMentionedUsersForParentPost (callback) {
		if (!this.info.parentPost) {
			return callback();
		}
		this.getMentionedUsersForPost(this.info.parentPost, 'mentionedUsersForParentPost', callback);
	}

	// get all the users mentioned in the given post, and store their usernames as needed
	getMentionedUsersForPost (post, which, callback) {
		const mentionedUserIds = post.get('mentionedUserIds');
		if (!mentionedUserIds) { return callback(); }
		this.request.data.users.getByIds(
			mentionedUserIds,
			(error, users) => {
				if (error) { return callback(error); }
				this.info[which] = users.map(user => user.get('username'));
				callback();
			}
		);
	}

	// handle all integrations for a new post coming in
	executeHooks (callback) {
		BoundAsync.forEachLimit(
			this,
			this.hooks,
			10,
			this.executeHook,
			callback
		);
	}

	// handle a single integration hook for a new post coming in
	executeHook (hook, callback) {
		hook.hook(
			this.info,
			error => {
				if (error) {
					this.request.warn(`Unable to perform integration hook for ${hook.name}: ${JSON.stringify(error)}`);
				}
				process.nextTick(callback);
			},
			{
				request: this.request
			}
		);
	}
}

module.exports = IntegrationHandler;
