'use strict';

const UserIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/indexes');
const PostIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/indexes');
const StreamIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/streams/indexes');
const TokenHandler = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/token_handler');

const USER_ATTRIBUTES_TO_COPY = [
	'createdAt',
	'deactivated',
	'modifiedAt',
	'creatorId',
	'email',
	'searchableEmail',
	'username',
	'isRegistered',
	'fullName',
	'passwordHash',
	'hasReceivedFirstEmail',
	'preferences',
	'registeredAt',
	'joinMethod',
	'primaryReferral',
	'originTeamId',
	'timeZone',
	'internalMethod',
	'internalMethodDetail',
	'phoneNumber',
	'iWorkOn',
	'lastActivityAt',
	'lastEmailsSent',
	'providerIdentities',
	'lastLogin',
	'lastOrigin',
	'lastOriginDetail',
	'firstSessionStartedAt',
	'lastInviteType',
	'firstInviteType',
	'inviteTrigger',
	'externalUserId',
	'avatar',
	'countryCode',
	'hasGitLens',
	'needsAutoReinvites',
	'lastInviteSentAt',
	'autoReinviteInfo',
	'source',
	'nrUserId'
];


class MigrationHandler {
	
	constructor (options) {
		Object.assign(this, options);
		this.data = this.data || this.api.data;
		this.logger = this.api || this.logger || console;
		this.throttle = this.throttle || 100;
		this.teamIdWithMostContentByUser = {};
		this.tokenHandler = new TokenHandler(this.tokenSecret);
	}

	// migrate this company to one-user-per-org
	async migrateCompany (company) {
		this.log(`Migrating users in company ${company.id}:${company.name}...`);
		const teamId = company.everyoneTeamId;
		company.team = await this.data.teams.getById(teamId);
		company.teamStream = await this.data.streams.getOneByQuery(
			{
				teamId,
				isTeamStream: true
			},
			{
				hint: StreamIndexes.byIsTeamStream
			} 
		);

		const users = await this.data.users.getByQuery(
			{
				teamIds: teamId
			},
			{
				hint: UserIndexes.byTeamIds
			}
		);

		// migrate each multi-org user in the everyone team of the company
		let numUsersMigrated = 0;
		let numUserRecordsCreated = 0;
		const userMappings = {};
		this.logVerbose(`\tFound ${users.length} users`);
		for (let user of users) {
			if ((user.teamIds || []).length > 1) {
				if (!this.teamIdWithMostContentByUser[user.id]) {
					numUsersMigrated++;
				}
				const userCopy = await this.migrateUserInCompany(user, company);
				if (userCopy) {
					userMappings[user.id] = userCopy.id;
					numUserRecordsCreated++;
					await this.wait(this.throttle);
				}
			} else {
				this.logVerbose(`\tUser ${user.id}:${user.email} is single-org, no need to migrate`);
			}
		}

		// update the company indicating it is fully migrated
		await this.data.companies.updateById(company.id, { hasBeenMigratedToOneUserPerOrg: true });

		return { numUsersMigrated, numUserRecordsCreated };
	}

	// migrate a single multi-org user to one-user-per-org
	async migrateUserInCompany (user, company) {
		this.log(`\tMigrating user ${user.id}:${user.email} for company ${company.id}:${company.name}...`);

		// we make a copy of the user for all orgs except the one they have the most content in
		const teamIdWithMostContent = await this.getTeamIdWithMostContent(user);
		if (teamIdWithMostContent === company.everyoneTeamId) {
			this.logVerbose(`\t\tThis is the company this user has the most content in, not migrating`);
			return false;
		}
		this.logVerbose(`\t\tThis is NOT the company this user has the most content in, will copy this user...`);

		// make a copy of the user record, making it a member of only this company
		// prepare to update the original user as needed
		const originalUserUnset = { };
		const userCopy = await this.makeUserCopy(user, company, originalUserUnset);

		// migrate all content in the company, making changes to the original user record as needed
		await this.migrateContent(user, userCopy, company);

		// update the original user
		await this.updateOriginalUser(user, userCopy, company, originalUserUnset);

		return userCopy;
	}

	// for multi-org users, get the org with the most content authored by that user
	// we'll migrate the user for all other orgs but that one
	async getTeamIdWithMostContent (user) {
		if (this.teamIdWithMostContentByUser[user.id]) {
			this.logVerbose(`\t\tteamIdWithMostContentByUser came from cache: ${this.teamIdWithMostContentByUser[user.id]}`)
			return this.teamIdWithMostContentByUser[user.id];
		}

		// count posts for each team the user is a member of
		const numPostsByTeamId = {};
		const teamIds = user.teamIds || [];
		await Promise.all(teamIds.map(async teamId => {
			numPostsByTeamId[teamId] = await this.data.posts.countByQuery({
				teamId,
				creatorId: user.id
			}, {
				hint: PostIndexes.byTeamId
			});
		}));

		// take maximum number of posts by team
		Object.keys(numPostsByTeamId).forEach(teamId => {
			if (!this.teamIdWithMostContentByUser[user.id]) {
				this.teamIdWithMostContentByUser[user.id] = teamId;
			} else if (numPostsByTeamId[teamId] > numPostsByTeamId[this.teamIdWithMostContentByUser[user.id]]) {
				this.teamIdWithMostContentByUser[user.id] = teamId;
			}
		});

		this.logVerbose(`\t\tteamIdWithMostContentByUser was determined: ${this.teamIdWithMostContentByUser[user.id]}`)
		return this.teamIdWithMostContentByUser[user.id];
	}

	// make a copy of the user that will only be a member of the passed company
	async makeUserCopy (user, company, originalUserUnset) {
		const teamId = company.everyoneTeamId;
		const teamStreamId = company.teamStream && company.teamStream.id;
		const newUserData = {
			id: this.data.users.createId().toString(),
			wasCopiedFrom: user.id, // breadcrumb
			teamIds: [teamId],
			companyIds: [company.id]
		};

		// copy these attributes verbatim
		for (let attr of USER_ATTRIBUTES_TO_COPY) {
			if (user[attr] !== undefined) {
				newUserData[attr] = user[attr];
			}
		}

		// generate a new access token, these must be distinct from team to team
		// since during token login they identify the particular team the user is logging into
		const token = this.tokenHandler.generate({ uid: newUserData.id });
		const minIssuance = this.tokenHandler.decode(token).iat * 1000;
		newUserData.accessTokens = {
			web: { token, minIssuance }
		};
		
		// copy lastReads only for the team stream for this team
		// and delete from the original user record
		if (teamStreamId && user.lastReads && user.lastReads[teamStreamId]) {
			newUserData[lastReads] = {
				[teamStreamId]: user.lastReads[teamStreamId]
			};
			originalUserUnset[`lastReads.${teamStreamId}`] = true;
		}

		// copy only global github providerInfo and providerInfo for this team
		if (user.providerInfo && user.providerInfo.github) {
			newUserData.providerInfo = {
				github: user.providerInfo.github
			};
		}
		if (user.providerInfo && user.providerInfo[teamId]) {
			newUserData.providerInfo = newUserData.providerInfo || {};
			newUserData.providerInfo[teamId] = user.providerInfo[teamId];
			originalUserUnset[`providerInfo.${teamId}`] = true;
		}

		// copy only status info for this team
		if (user.status && user.status[teamId]) {
			newUserData.status = {
				[teamId]: user.status[teamId]
			};
			originalUserUnset[`status.${teamId}`] = true;
		}

		// copy lastReadItems relevant to the team
		if (user.lastReadItems && Object.keys(user.lastReadItems).length > 0) {
			await this.copyLastReadItems(user, newUserData, teamId, user.lastReadItems, originalUserUnset);
		}

		// if the original user created themselves, set the creatorId to the copy
		if (user.creatorId === user.id) {
			newUserData.creatorId = newUserData.id;
		}

		// QUESTION:
			// totalPosts: these aren't going to be accurate anymore (we can't discern by team here)
			// lastPostCreatedAt: should we copy this for each user, and then let it get updated per team?
			// totalReviews: same concern as totalPosts
			// numMentions: same concern as totalPosts
			// numInvites: same concern as totalPosts

		const result = await this.data.users.create(newUserData);
		if (this.dryRun) {
			// no user was actually created, so simulate one
			return { ...newUserData };
		} else {
			return result;
		}
	}

	// copy the lastReadItems key/value pairs that correspond to this team,
	// unfortunately, this involves fetching the items in question
	async copyLastReadItems (user, newUserData, teamId, lastReadItems, originalUserUnset) {
 		const ids = Object.keys(lastReadItems);
		const codemarkIds = (await this.data.codemarks.getByIds(ids, { fields: ['id','teamId'] }))
			.filter(c => c.teamId === teamId)
			.map(c => c.id);
		const reviewIds = (await this.data.reviews.getByIds(ids, { fields: ['id', 'teamId'] }))
			.filter(r => r.teamId === teamId)
			.map(r => r.id);
		const codeErrorIds = (await this.data.codeErrors.getByIds(ids, { fields: ['id', 'teamId'] }))
			.filter(ce => ce.teamId === teamId)
			.map(ce => ce.id);
		const allItemIds = [...codemarkIds, ...reviewIds, ...codeErrorIds];

		newUserData.lastReadItems = {};
		allItemIds.forEach(itemId => {
			newUserData.lastReadItems[itemId] = user.lastReadItems[itemId];
			originalUserUnset[`lastReadItems.${itemId}`] = true;
		});
	}

	// migrate all the user content (interpreted broadly), given that the user ID has changed for the
	// given team
	async migrateContent (user, newUser, company) {
		await this.updateCompany(user, newUser, company);
		await this.updateTeam(user, newUser, company);
		await this.updateStreams(user, newUser, company);
		await this.updateRepos(user, newUser, company);
		await this.updatePosts(user, newUser, company);
		await this.updateCodemarks(user, newUser, company);
		await this.updateReviews(user, newUser, company);
		await this.updateCodeErrors(user, newUser, company);
		await this.updateMarkers(user, newUser, company);
	}

	// for the company, if the user being migrated was the creator, set to point to the new user record
	async updateCompany (user, newUser, company) {
		return this.updateCreatorId(this.data.companies, company, user.id, newUser.id);
	}

	// for the (everyone) team, if the user being migrated was the creator, set to point to the new user record
	// also update any of several membership arrays
	async updateTeam (user, newUser, company) {
		const { team } = company;

		// update creator if needed
		await this.updateCreatorId(this.data.teams, team, user.id, newUser.id);

		// update membership arrays, as needed
		const attrs = ['adminIds', 'memberIds', 'removedMemberIds', 'foreignMemberIds'];
		await Promise.all(attrs.map(async attr => {
			await this.updatePushPull(this.data.teams, team, user.id, newUser.id, attr);
		}));
	}

	// for any streams owned by the team, if the creator is the user, update to point to the new user record
	async updateStreams (user, newUser, company) {
		const teamId = company.everyoneTeamId;
		return this.updateCreatorIdByTeamId(this.data.streams, teamId, user.id, newUser.id);
	}

	// for any repos owned by the team, if the creator is the user, update to point to the new user record
	async updateRepos (user, newUser, company) {
		const teamId = company.everyoneTeamId;
		return this.updateCreatorIdByTeamId(this.data.repos, teamId, user.id, newUser.id);
	}

	// for any posts owned by the team, if the creator is the user, update to point to the new user record
	// also update mentioned users
	async updatePosts (user, newUser, company) {
		const teamId = company.everyoneTeamId;
		await this.updateCreatorIdByTeamId(this.data.posts, teamId, user.id, newUser.id);

		// update mentionedUserIds arrays as needed
		return this.updatePushPullByTeamId(this.data.posts, teamId, user.id, newUser.id, 'mentionedUserIds');
	}

	// for any codemarks owned by the team, if the creator is the user, update to point to the new user record
	// also update any assignees and followers
	async updateCodemarks (user, newUser, company) {
		const teamId = company.everyoneTeamId;
		await this.updateCreatorIdByTeamId(this.data.codemarks, teamId, user.id, newUser.id);

		// update assignees and followerIds arrays as needed
		const attrs = ['assignees', 'followerIds'];
		return Promise.all(attrs.map(async attr => {
			await this.updatePushPullByTeamId(this.data.codemarks, teamId, user.id, newUser.id, attr);
		}));
	}

	// for any reviews owned by the team, if the creator is the user, update to point to the new user record
	// also update any of several membership arrays
	async updateReviews (user, newUser, company) {
		const teamId = company.everyoneTeamId;
		await this.updateCreatorIdByTeamId(this.data.reviews, teamId, user.id, newUser.id);

		// update assignees and followerIds arrays as needed
		let attrs = ['reviewers', 'followerIds', 'codeAuthorIds'];
		await Promise.all(attrs.map(async attr => {
			await this.updatePushPullByTeamId(this.data.reviews, teamId, user.id, newUser.id, attr);
		}));

		// update authorByIds and approvedBy as needed, these have user IDs as keys
		attrs = ['authorsById', 'approvedBy'];
		return Promise.all(attrs.map(async attr => {
			await this.updateAttrKeyByTeamId(this.data.reviews, teamId, user.id, newUser.id, attr);
		}));
	}

	// for any code errors owned by the team, if the creator is the user, update to point to the new user record
	// also update any followers
	async updateCodeErrors (user, newUser, company) {
		const teamId = company.everyoneTeamId;
		await this.updateCreatorIdByTeamId(this.data.codeErrors, teamId, user.id, newUser.id);

		// update followerIds arrays as needed
		await this.updatePushPullByTeamId(this.data.codeErrors, teamId, user.id, newUser.id, 'followerIds');
	}

	// for any markers owned by the team, if the creator is the user, update to point to the new user record
	async updateMarkers (user, newUser, company) {
		const teamId = company.everyoneTeamId;
		return this.updateCreatorIdByTeamId(this.data.markers, teamId, user.id, newUser.id);
	}

	// for a given collection and object within that collection, if the creator is oldId,
	// update it to newId
	async updateCreatorId (collection, object, oldId, newId) {
		if (object.creatorId === oldId) {
			return collection.updateById(object.id, { creatorId: newId });
		}
	}

	// for a given collection, if objects belonging to that collection and to the given team
	// have oldId as the creator, update it to newId
	async updateCreatorIdByTeamId (collection, teamId, oldId, newId) {
		return collection.updateDirect(
			{ 
				teamId,
				creatorId: oldId
			},
			{ 
				$set: {
					creatorId: newId
				}
			}
		);
	}

	// for a given collection and object within that collection, if an array attribute
	// contains oldId, update it to newId by pushing and then pulling
	async updatePushPull (collection, object, oldId, newId, attr) {
		if ((object[attr] || []).includes(oldId)) {
			// mongo doesn't let us do these at the same time
			await collection.updateDirect(
				{ _id: collection.objectIdSafe(object.id) },
				{ $push: { [attr]: newId } }
			);
			await collection.updateDirect(
				{ _id: collection.objectIdSafe(object.id) },
				{ $pull: { [attr]: oldId } }
			);
		}
	}

	// for a given collection, if any objects owned by the team within that collection have oldId within
	// the given array attribute, update to newId by pushing and then pulling
	async updatePushPullByTeamId (collection, teamId, oldId, newId, attr) {
		await collection.updateDirect(
			{ 
				teamId,
				[attr]: oldId
			},
			{ 
				$push: {
					[attr]: newId
				}
			}
		);
		await collection.updateDirect(
			{
				teamId,
				[attr]: oldId
			},
			{ 
				$pull: {
					[attr]: oldId
				}
			}
		);
	}

	// for a given collection, if any objects owned by the team within that collection has oldId as
	// the key to a hash, update the key to newId by setting and then unsetting the oldId key
	async updateAttrKeyByTeamId (collection, teamId, oldId, newId, attr) {
		// unfortunately, there's no way to do this other than individually
		const objects = await collection.getByQuery(
			{
				teamId,
				[`${attr}.${oldId}`]: {
					$exists: true
				}
			},
			{
				overrideHintRequired: true
			}
		);

		return Promise.all(objects.map(async object => {
			await collection.updateDirect(
				{
					_id: collection.objectIdSafe(object.id)
				},
				{
					$set: {
						[`${attr}.${newId}`]: object[attr][oldId]
					},
					$unset: {
						[`${attr}.${oldId}`]: true
					}
				}
			);
		}));
	}

	// update the original user being migrated, remove them from the company and team
	// for which a migrated (copied) user was created
	async updateOriginalUser (user, userCopy, company, originalUserUnset) {
		const updateOp = {
			$pull: {
				teamIds: company.everyoneTeamId,
				companyIds: company.id
			},
			$push: {
				copies: userCopy.id // breadcrumb
			}
		};
		if (Object.keys(originalUserUnset).length > 0) {
			updateOp.$unset = originalUserUnset;
		}
		this.data.users.updateDirect(
			{
				_id: this.data.users.objectIdSafe(user.id) 
			},
			updateOp
		);
	}

	// wait this number of milliseconds
	async wait (time) {
		this.logVerbose(`\t\tWaiting ${time} ms...`);
		return new Promise(resolve => {
			setTimeout(resolve, time);
		});
	}

	warn (msg) {
		this.logger.warn('*************************************************************************************');
		this.logger.warn('*************************************************************************************');
		this.logger.warn('*************************************************************************************');
		this.logger.warn(msg);
		this.logger.warn('*************************************************************************************');
		this.logger.warn('*************************************************************************************');
		this.logger.warn('*************************************************************************************');
	}
	
	log (msg) {
		this.logger.log(msg);
	}

	logVerbose (msg) {
		if (this.verbose) {
			this.log(msg);
		}
	}
}

module.exports = MigrationHandler;