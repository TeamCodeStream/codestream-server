'use strict';

const ArrayUtilities = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/array_utilities');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');
const PostIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/indexes');

class CodemarkHelper {

	constructor (options) {
		Object.assign(this, options);
	}

	// if this is an issue, validate the assignees ... all users must be on the team
	async validateAssignees (existingAttributes, newAttributes) {
		const type = newAttributes.type || existingAttributes.type;
		const providerType = newAttributes.providerType || existingAttributes.providerType;
		const teamId = newAttributes.teamId || existingAttributes.teamId;

		// assignees only valid for issues
		if (type !== 'issue') {
			delete newAttributes.assignees;
			delete newAttributes.externalAssignees;
			return;
		}

		// if using a third-party provider, we don't care what goes in there
		else if (providerType || !newAttributes.assignees) {
			return;
		}

		// get the assignees and make sure they're on the same team
		await this.validateUsersOnTeam(newAttributes.assignees, teamId, 'assignees');
	}

	// validate the given users are all on the same team
	async validateUsersOnTeam (userIds, teamId, name, usersBeingAddedToTeam) {
		userIds = ArrayUtilities.difference(userIds, usersBeingAddedToTeam || []);
		const users = await this.request.data.users.getByIds(
			userIds,
			{
				fields: ['id', 'teamIds'],
				noCache: true
			}
		);
		if (
			users.length !== userIds.length ||
			users.find(user => !user.hasTeam(teamId))
		) {
			throw this.request.errorHandler.error('validation', { info: `${name} must contain only users on the team` });
		}
	}
	
	// if there are tags, each tag must be known to the team
	async validateTags (tags, team) {
		if (!tags) {
			return;
		}
		const teamTags = team.get('tags') || {};
		const teamTagIds = Object.keys(teamTags);
		let offendingTagId;
		if (tags.find(tagId => {
			if (!teamTagIds.find(teamTagId => {
				return teamTagId === tagId && !teamTags[teamTagId].deactivated;
			})) {
				offendingTagId = tagId;
				return true;
			}
		})) {
			throw this.request.errorHandler.error('notFound', { info: 'tag ' + offendingTagId });
		}
	}

	// for related codemarks, link the related codemarks to this one,
	// or if removing the relation, unlink
	async changeCodemarkRelations (existingAttributes, newAttributes, teamId) {
		if (!newAttributes.relatedCodemarkIds) {
			return;
		}
		const codemarkId = newAttributes.id || existingAttributes.id;
		const addingRelatedCodemarkIds = ArrayUtilities.difference(
			newAttributes.relatedCodemarkIds || [],
			existingAttributes.relatedCodemarkIds || []
		);
		const removingRelatedCodemarkIds = ArrayUtilities.difference(
			existingAttributes.relatedCodemarkIds || [],
			newAttributes.relatedCodemarkIds || []
		);
		const changingCodemarkIds = [...addingRelatedCodemarkIds, ...removingRelatedCodemarkIds]; 
		if (changingCodemarkIds.length === 0) {
			return;
		}

		// get the codemarks
		const changingCodemarks = await this.request.data.codemarks.getByIds(changingCodemarkIds);
		if (changingCodemarks.length !== changingCodemarkIds.length) {
			throw this.request.errorHandler.error('notFound', { info: 'related codemarks' });
		}

		// make sure the user has access to all the codemarks
		await Promise.all(changingCodemarks.map(async changingCodemark => {
			if (!await this.request.user.authorizeCodemark(changingCodemark.id, this.request)) {
				throw this.request.errorHandler.error('updateAuth', { reason: 'user does not have access to all related codemarks' });
			}
			if (changingCodemark.get('teamId') !== teamId) {
				throw this.request.errorHandler.error('updateAuth', { reason: 'all related codemarks must be for the same team' });
			}
		}));

		// for each related codemark, update the codemark to be related to this one
		this.request.transforms.updatedCodemarks = this.request.transforms.updatedCodemarks || [];
		await Promise.all(changingCodemarks.map(async changingCodemark => {
			const removing = removingRelatedCodemarkIds.indexOf(changingCodemark.id) !== -1;
			await this.changeCodemarkRelation(changingCodemark, codemarkId, removing);
		}));
	}

	// link or unlink a related codemark back to the codemark being created
	async changeCodemarkRelation (changingCodemark, codemarkId, removing) {
		const now = Date.now();
		const opCommand = removing ? '$pull' : '$addToSet';
		const op = {
			[opCommand]: {
				relatedCodemarkIds: codemarkId
			},
			$set: {
				modifiedAt: now
			}
		};
		const updateOp = await new ModelSaver({
			request: this.request,
			collection: this.request.data.codemarks,
			id: changingCodemark.id
		}).save(op);
		this.request.transforms.updatedCodemarks.push(updateOp);
	}

	// handle followers added to a codemark
	async handleFollowers (attributes, options) {
		// get the stream, if this is a codemark for a CodeStream team
		let stream;
		if (!attributes.providerType && attributes.streamId) {
			stream = options.stream || await this.request.data.streams.getById(attributes.streamId);
		}

		// get user preferences of all users who can see this codemark
		let preferences;
		if (!options.ignorePreferences) {
			preferences = await this.getUserFollowPreferences(stream, options.team, options.usersBeingAddedToTeam || []);
		} else {
			preferences = { all: [], involveMe: [] };
		}

		// add as followers any users who choose to follow all codemarks
		let followerIds = options.ignorePreferences ? [] : [...preferences.all];

		// ensure codemark creator is a follower if they want to be
		if (
			attributes.creatorId &&
			followerIds.indexOf(attributes.creatorId) === -1 &&
			(options.ignorePreferences || preferences.involveMe.indexOf(attributes.creatorId) !== -1)
		) {
			followerIds.push(attributes.creatorId);
		}

		// if the stream is a DM, everyone in the DM is a follower who wants to be
		// (deprecated)
		if (stream && stream.get('type') === 'direct') {
			const membersWhoWantToFollow = ArrayUtilities.intersection(preferences.involveMe, stream.get('memberIds') || []);
			followerIds = ArrayUtilities.union(followerIds, membersWhoWantToFollow);
		}

		// must validate mentioned users and explicit followers, since these come directly from the request
		let validateUserIds = ArrayUtilities.union(options.mentionedUserIds || [], attributes.followerIds || []);
		validateUserIds = ArrayUtilities.unique(validateUserIds);
		await this.validateUsersOnTeam(validateUserIds, attributes.teamId, 'followers', options.usersBeingAddedToTeam);

		// any mentioned users are followers if they want to be
		const mentionedWhoWantToFollow = options.ignorePreferences ? 
			(options.mentionedUserIds || []) : 
			ArrayUtilities.intersection(preferences.involveMe, options.mentionedUserIds || []);
		followerIds = ArrayUtilities.union(followerIds, mentionedWhoWantToFollow);

		// users who have replied to this codemark are followers, if they want to be
		if (options.parentPost) {
			const repliers = await this.getPostRepliers(options.parentPost.id, options.team.id, stream.id);
			const repliersWhoWantToFollow = options.ignorePreferences ?
				repliers :
				ArrayUtilities.intersection(preferences.involveMe, repliers);
			followerIds = ArrayUtilities.union(followerIds, repliersWhoWantToFollow);
		}

		// users passed in are explicitly followers, overriding other rules
		followerIds = ArrayUtilities.union(followerIds, attributes.followerIds || []);

		return followerIds;
	}

	// get user preferences of all users who can see this codemark, so we can determine who should follow a codemark
	async getUserFollowPreferences (stream, team, usersBeingAddedToTeam) {
		if (!team) {
			return { all: [], involveMe: [] };
		}
		let memberIds;
		if (
			stream &&
			!stream.get('isTeamStream') &&
			stream.get('type') !== 'object' &&
			stream.get('type') !== 'file'
		) {
			// members come from the stream
			memberIds = stream.get('memberIds') || [];
		}
		else {
			// members come from the team
			memberIds = team.getActiveMembers();
		}
		if (memberIds.length === 0) {
			return { all: [], involveMe: [] };
		}

		// fetch preferences for the members
		const users = await this.request.data.users.getByIds(
			memberIds,
			{
				fields: ['id', 'preferences'],
				noCache: true,
				ignoreCache: true
			}
		);

		// categorize users according to whether they want notifications for all codemarks,
		// or only those that involve them (meaning they are creator or mentioned)
		const categorizedPreferences = {
			all: [],
			involveMe: []
		};
		users.forEach(user => {
			if (!user.get('deactivated')) {
				const preferences = user.get('preferences');
				if (
					!preferences ||
					!preferences.notifications ||
					preferences.notifications === 'involveMe'
				) {
					categorizedPreferences.involveMe.push(user.id);
				}
				else if (preferences.notifications === 'all') {
					categorizedPreferences.all.push(user.id);
				}
			}
		});
		
		// users being added to team are assumed to be following
		categorizedPreferences.involveMe = ArrayUtilities.union(
			categorizedPreferences.involveMe,
			usersBeingAddedToTeam || []
		);
		
		return categorizedPreferences;
	}

	// get users who have replied to a post 
	async getPostRepliers (postId, teamId, streamId) {
		const replyPosts = await this.request.data.posts.getByQuery(
			{
				teamId,
				streamId,
				parentPostId: postId
			},
			{
				hint: PostIndexes.byParentPostId,
				fields: ['creatorId'],
				noCache: true,
				ignoreCache: true
			}
		);
		return replyPosts.map(post => post.creatorId);
	}
}

module.exports = CodemarkHelper;
