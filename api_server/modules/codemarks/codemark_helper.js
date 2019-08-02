'use strict';

const ArrayUtilities = require(process.env.CS_API_TOP + '/server_utils/array_utilities');
const ModelSaver = require(process.env.CS_API_TOP + '/lib/util/restful/model_saver');

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

		// get the users and make sure they're on the same team
		const users = await this.request.data.users.getByIds(
			newAttributes.assignees,
			{
				fields: ['id', 'teamIds'],
				noCache: true
			}
		);
		if (
			users.length !== newAttributes.assignees.length ||
			users.find(user => !user.hasTeam(teamId))
		) {
			throw this.request.errorHandler.error('validation', { info: 'assignees must contain only users on the team' });
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
}

module.exports = CodemarkHelper;
