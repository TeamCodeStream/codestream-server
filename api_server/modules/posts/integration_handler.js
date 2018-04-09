// handle integrations that should be triggered when a new post comes in

'use strict';

class IntegrationHandler {

	constructor (options) {
		Object.assign(this, options);
	}

	// handle any integrations related to new posts coming in
	async handleNewPost (info) {
		this.info = info;
		if (!await this.collectHooks()) {
			return;	// no hooks to call
		}
		await this.getParentPostCreator();
		await this.getMentionedUsers();
		await this.getMentionedUsersForParentPost();
		await this.executeHooks();
	}

	// collect the integration hooks that are actually going to be called ...
	// if there are hooks, there is no other work to be done
	async collectHooks () {
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
		return this.hooks.length !== 0;	// we'll short-circuit if there are no hooks
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
	async getParentPostCreator () {
		if (!this.info.parentPost) { return; }
		this.info.parentPostCreator = await this.request.data.users.getById(
			this.info.parentPost.get('creatorId')
		);
	}

	// get all the users mentioned in the main post, as needed
	async getMentionedUsers () {
		await this.getMentionedUsersForPost(this.info.post, 'mentionedUsers');
	}

	// get all the users mentioned in the parent post, as needed
	async getMentionedUsersForParentPost () {
		if (!this.info.parentPost) {
			return;
		}
		await this.getMentionedUsersForPost(this.info.parentPost, 'mentionedUsersForParentPost');
	}

	// get all the users mentioned in the given post, and store their usernames as needed
	async getMentionedUsersForPost (post, which) {
		const mentionedUserIds = post.get('mentionedUserIds');
		if (!mentionedUserIds) { return ; }
		const users = await this.request.data.users.getByIds(mentionedUserIds);
		this.info[which] = users.map(user => user.get('username'));
	}

	// handle all integrations for a new post coming in
	async executeHooks () {
		await Promise.all(this.hooks.map(async hook => {
			await this.executeHook(hook);
		}));
	}

	// handle a single integration hook for a new post coming in
	async executeHook (hook) {
		try {
			await hook.hook(this.info, { request: this.request });
		}
		catch (error) {
			this.request.warn(`Unable to perform integration hook for ${hook.name}: ${JSON.stringify(error)}`);
		}
	}
}

module.exports = IntegrationHandler;
