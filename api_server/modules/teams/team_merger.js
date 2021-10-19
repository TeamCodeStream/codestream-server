'use strict';

const PostIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/indexes');
const RepoIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/repos/indexes');
const StreamIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/streams/indexes');
const MarkerIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/markers/indexes');
const ReviewIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/reviews/indexes');
const ArrayUtilities = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/array_utilities');

// IF REPOS NEED TO BE MERGED:
//  reviews: reviewChangesets, reviewDiffs, checkpointReviewDiffs all key off repo ID
//  reposByCommitHash
//  fileStreams
//  user.compactifiedModifiedRepos
//  user.modifiedReposModifiedAt

const COLLECTIONS_TO_MIGRATE = [
	'codemarkLinks',
	'codemarks',
	//'markerLocations',
	'markers',
	'posts',
	'codeErrors',
	'providerPosts',
	'repos',
	'reviews',
	'signupTokens',
	'streams'
];

const COLLECTIONS_WITH_TEAM_STREAM = {
	'posts': 'streamId',
	'codemarks': 'streamId',
	'reviews': 'streamId',
	'codeErrors': 'streamId',
	'markers': 'postStreamId'
}

const capitalize = str => {
	return str.substring(0, 1).toUpperCase() + str.substring(1);
}

class MultiTeamMigrator {

	constructor (options) {
		Object.assign(this, options);
	}

	// merge all teams within a company into a single "everyone" team, selecting the "everyone" team as the
	// one with the most posts
	async mergeAllTeams (company) {
		this.company = company;
		this.log(`Migrating multi-team company ${this.company.id} to company-centric paradigm...`);
		await this.getCompanyTeams();
		await this.countPostsPerTeam();
		await this.determineEveryoneTeam();
		await this.mergeTeams();
		await this.setCompanyMigrated();
	}

	// merge two companies, effectively merging their "everyone" teams
	async mergeCompanies (fromCompanyId, toCompanyId) {
		this.fromCompanyId = fromCompanyId;
		this.toCompanyId = toCompanyId;
		this.log(`Merging company ${this.fromCompanyId} to ${this.toCompanyId}...`);
		await this.getCompaniesAndTeams();
		await this.countPostsPerTeam();
		await this.mergeTeams();
		await this.deactivateFromCompany();
		await this.moveTeams();
	}

	// get all the teams owned by the single company
	async getCompanyTeams () {
		const teamIds = this.company.teamIds || [];
		this.allTeams = await this.data.teams.getByIds(teamIds, { requestId: this.requestId });
		if (this.allTeams.length === 0) {
			// wha?? a company with no teams?? this really shouldn't happen
			this.warn(`Company ${this.company.id}:${this.company.name} has no teams!!!`);
		}
	}

	// get the companies and teams being merged
	async getCompaniesAndTeams () {
		this.fromCompany = await this.data.companies.getById(this.fromCompanyId);
		if (!this.fromCompany) {
			throw new Error('company not found: ' + this.fromCompanyId);
		}
		if (!this.fromCompany.everyoneTeamId) {
			const possibleTeams = await this.data.teams.getByQuery({companyId: this.fromCompany.id}, { overrideHintRequired: true });
			if (possibleTeams.length > 1) {
				throw new Error(`From company ${this.fromCompany.id} has no everyone team, and has more than one team`);
			} else {
				this.log(`NOTE: From company ${this.fromCompany.id} has no everyone team, but has only one team`);
				this.fromTeam = possibleTeams[0];
			}
		} else {
			this.fromTeam = await this.data.teams.getById (this.fromCompany.everyoneTeamId);
		}
		if (!this.fromTeam) {
			throw new Error('did not find everyone team for from company');
		}
		this.mergingTeams = [this.fromTeam];
		this.log(`Teams to merge will be: ${this.mergingTeams.map(team => team.id)}`);

		this.toCompany = await this.data.companies.getById(this.toCompanyId);
		if (!this.toCompany) {
			throw new Error('company not found: ' + this.toCompanyId);
		}
		if (!this.toCompany.everyoneTeamId) {
			throw new Error('to company has no everyone team');
		}
		this.mergeToTeam = await this.data.teams.getById(this.toCompany.everyoneTeamId);
		this.log(`Will merge into team ${this.mergeToTeam.id}`);
		if (!this.mergeToTeam) {
			throw new Error('did not find everyone team for to company');
		}

		this.allTeams = [this.fromTeam, this.mergeToTeam];
	}

	// count the number of posts in each team
	async countPostsPerTeam () {
		this.postsByTeam = {};
		for (const team of this.allTeams) {
			this.postsByTeam[team.id] = await this .data.posts.countByQuery(
				{
					teamId: team.id
				},
				{
					hint: PostIndexes.byTeamId,
					requestId: this.requestId
				}
			);
		}
	}

	// for migration to company-centric...
	// determine which team should be the everyone team, based on which one has the most content
	async determineEveryoneTeam () {
		this.mergeToTeam = null;
		let maxCount = -1;

		// count the posts on all the teams owned by the company, and make the everyone team
		// the one with the most posts
		let everyoneTeamIndex = -1;
		for (let i = 0; i < this.allTeams.length; i++) {
			const team = this.allTeams[i];
			this.log(`Team ${team.id} has ${this.postsByTeam[team.id]} posts`);
			if (!team.deactivated && this.postsByTeam[team.id] > maxCount) {
				everyoneTeamIndex = i;
				maxCount = this.postsByTeam[team.id];
			}
			else if (maxCount === -1 && !team.deactivated) {
				everyoneTeamIndex = i;
			}
		}
		if (everyoneTeamIndex !== -1) {
			this.mergeToTeam = this.allTeams[everyoneTeamIndex];
			this.mergingTeams = [
				...this.allTeams.slice(0, everyoneTeamIndex),
				...this.allTeams.slice(everyoneTeamIndex + 1)
			]
		} else {
			// handle rare cases where no appropriate "everyone" team is found
			// this happens if there are no active teams, which shouldn't really happen,
			// but just create one
			this.warn(`No everyone team established for company ${this.company.id} migration, creating...`);
			this.mergeToTeam = await this.data.teams.create({
				companyId: this.company.id,
				name: 'Everyone',
				isEveryoneTeam: true
			}, {
				requestId: this.requestId
			});
			this.mergingTeams = this.allTeams;f
		}
		this.log(`Everyone team for company migration ${this.company.id} will be ${this.mergeToTeam.id}`);
	}

	// merge a set of teams into a single team, either within a single company or from one company to another
	async mergeTeams () {
		await this.getTeamStreams();
		await this.flagReposForMerge();
		await this.migrateContent();
		await this.updateTeamStreams();
		await this.updateTeam();
		await this.updateUsers();
	}

	// get the team-stream for every team
	async getTeamStreams () {
		return Promise.all(this.allTeams.map(async team => {
			team.teamStream = (await this.data.streams.getByQuery(
				{ teamId: team.id, isTeamStream: true },
				{ hint: StreamIndexes.byIsTeamStream, requestId: this.requestId }
			))[0];
			if (!team.teamStream) {
				throw new Error(`Team ${team.id} has no team stream!!!`);
			}
		}));
	}

	// migrate all content belonging to other teams besides the merge-to team to point to the merge-to team
	async migrateContent () {
		for (const team of this.mergingTeams) {
			await this.migrateContentForTeam(team);
			if (this.postsByTeam[team.id] > 50) {
				// we are just going to hope that this is enough time for the indexing to catch up:
				// one millisecond per post
				const throttleTime = this.postsByTeam[team.id];
				this.log(`Team ${team.id} has ${this.postsByTeam[team.id]} posts, waiting ${throttleTime} ms...`);
				await new Promise(resolve => {
					setTimeout(resolve, throttleTime);
				});
			}
		}
	}

	// migrate all content belonging to one team to the merge-to team
	async migrateContentForTeam (team) {
		for (const collection of COLLECTIONS_TO_MIGRATE) {
			await this.migrateContentForCollection(team, collection);
		}
	}

	// migrate all content in one collection belonging to one team to the merge-to team
	async migrateContentForCollection (team, collection) {
		// certain collections have pointers to the stream, which for the team stream, should also be merged
		// into the team stream for the team
		const mergeToTeamStreamId = this.mergeToTeam.teamStream && this.mergeToTeam.teamStream.id;
		const teamStreamId = team.teamStream && team.teamStream.id;
		if (mergeToTeamStreamId && COLLECTIONS_WITH_TEAM_STREAM[collection]) {
			const streamIdField = COLLECTIONS_WITH_TEAM_STREAM[collection];
			const query = {
				teamId: team.id,
				[streamIdField]: teamStreamId
			};
			const streamOp = {
				$set: {
					[`original${capitalize(streamIdField)}`]: teamStreamId,
					[streamIdField]: mergeToTeamStreamId
				}
			};

			await this.doDirect(`Moving ${collection} to merged team stream ${mergeToTeamStreamId}...`, collection, query, streamOp);
		}

		// this is the core performance hit ... changing all these teamIds at once
		// could hurt indexing, but let's hope not
		const op = {
			$set: {
				originalTeamId: team.id,
				teamId: this.mergeToTeam.id
			}
		};

		const query = { teamId: team.id };
		await this.doDirect(`Moving ${collection} documents in team ${team.id} to point to team ${this.mergeToTeam.id}...`, collection, query, op);
	}

	// look for any repos that seem duplicative between the merging teams and the merge-to team,
	// and flag for merge if the team that owns the duplicate repo has any content pointing to the repo
	// (we're not going to deal with the actual merge at this time)
	async flagReposForMerge () {
		for (const team of this.mergingTeams) {
			if (this.postsByTeam[team.id] > 0) {
				await this.flagReposForMergeForTeam(team);
			}
		}
	}

	// look for any repos that seem duplicative between the merging team and the merge-to team,
	// and flag for merge if the team that owns the duplicate repo has any content pointing to the repo
	// (we're not going to deal with the actual merge at this time)
	async flagReposForMergeForTeam (team) {
		const mergingRepos = await this.data.repos.getByQuery(
			{ teamId: team.id },
			{ hint: RepoIndexes.byTeamId, requestId: this.requestId }
		);
		const mergeToRepos = await this.data.repos.getByQuery(
			{ teamId: this.mergeToTeam.id },
			{ hint: RepoIndexes.byTeamId, requestId: this.requestId }
		);

		// lovely quadruple nested loop, let's just hope the numbers are small
		for (const mergingRepo of mergingRepos) {
			for (const mergeToRepo of mergeToRepos) {
				//this.log(`Merge-to repo ${mergeToRepo.id} remotes: ${(mergeToRepo.remotes || []).map(rem => rem.normalizedUrl)}`);
				//this.log(`Merging repo ${mergingRepo.id} remotes: ${(mergingRepo.remotes || []).map(rem => rem.normalizedUrl)}`);
				if ((mergeToRepo.remotes || []).find(mergeToRemote => {
					return (mergingRepo.remotes || []).find(mergingRemote => {
						return mergeToRemote.normalizedUrl === mergingRemote.normalizedUrl;
					});
				})) {
					this.log(`Will possibly flag repo ${mergingRepo.id} for merge to ${mergeToRepo.id}`);
					await this.possiblyFlagReposForMerge(mergingRepo, mergeToRepo);
				}
			}
		}
	}

	// possibly flag a repo for merging, by checking for whether the team that owns the
	// second one has any content pointing at that repo
	async possiblyFlagReposForMerge (fromRepo, toRepo) {
		// get any file streams in the "from" repo
		const fileStreams = await this.data.streams.getByQuery(
			{
				teamId: fromRepo.teamId,
				repoId: fromRepo.id
			},
			{
				hint: StreamIndexes.byFile,
				requestId: this.requestId
			}
		);
		this.log(`Repo ${fromRepo.id} has ${fileStreams.length} file streams`);

		// if at least one marker pointing to these file streams, then we need to merge
		if (fileStreams.length > 0) {
			const markerCount = await this.data.markers.countByQuery(
				{ 
					teamId: fromRepo.teamId,
					fileStreamId: this.data.markers.inQuery(fileStreams.map(s => s.id))
				},
				{
					hint: MarkerIndexes.byFileStreamId,
					requestId: this.requestId
				}
			);
			this.log(`Repo ${fromRepo.id} has ${markerCount} markers`);
			if (markerCount > 0) {
				await this.flagRepoForMerge(fromRepo, toRepo, 'at least one code block points to this repo');
				return;
			}
		}

		// if at least one review references the "from" repo, then flag to merge
		const reviews = await this.data.reviews.getByQuery(
			{ teamId: fromRepo.teamId },
			{ hint: ReviewIndexes.byTeamId, requestId: this.requestId }
		);
		let needsMerge = false;
		for (const review of reviews) {
			if ((review.reviewChangesets || []).find(cs => cs.repoId === fromRepo.id)) {
				needsMerge = true;
				break;
			}
			if (Object.keys(review.reviewDiffs || {}).find(rId => rId === fromRepo.id)) {
				needsMerge = true;
				break;
			}
			if ((review.checkpointReviewDiffs || []).find(diff => diff.repoId === fromRepo.id)) {
				needsMerge = true;
				break;
			}
		}
		if (needsMerge) {
			await this.flagRepoForMerge(fromRepo, toRepo, 'at least one review refers to this repo');
		}
	}

	// flag the first repo for merge into the second repo
	async flagRepoForMerge (fromRepo, toRepo, reason) {
		// get the most recent post in the team, which gives us a sense of the team's recent activity
		const latestPosts = await this.data.posts.getByQuery(
			{ teamId: fromRepo.teamId },
			{ 
				hint: PostIndexes.byTeamId ,
				sort: { _id: -1 }, 
				limit: 1,
				requestId: this.requestId
			}
		);
		const latestPost = latestPosts[0];
		if (!latestPost) return; // shouldn't happen

		const op = {
			$set: {
				shouldMergeToRepo: {
					toRepoId: toRepo.id,
					latestPostCreatedAt: latestPost.createdAt,
					teamPostCount: this.postsByTeam[fromRepo.teamId]
				}
			}
		};
		const query = {
			id: this.data.repos.objectIdSafe(fromRepo.id)
		};
		await this.doDirect(`Flagging repo ${fromRepo.id} for merge because ${reason}...`, 'repos', query, op);
	}

	// for each merged team, update its team stream to no longer be a team stream
	async updateTeamStreams () {
		const teamStreamIds = this.mergingTeams.map(team => team.teamStream.id);
		const op = {
			$unset: {
				isTeamStream: true
			}
		};
		const query = {
			id: this.data.streams.inQuerySafe(teamStreamIds)
		};
		await this.doDirect(`Deleting team stream flag from streams ${teamStreamIds}...`, 'streams', query, op);
	}

	// merge each team's membership and settings into the merge-to team 
	async updateTeam () {
		// merge team memberships and settings
		const { memberIds, adminIds, removedMemberIds, foreignMemberIds } = this.mergeMemberships();
		const settings = this.mergeSettings();
		this.allMemberIds = memberIds;
		this.removedMemberIds = removedMemberIds;
		this.foreignMemberIds = foreignMemberIds;

		// merge provider identities
		const providerIdentities = this.mergeProviderIdentities();

		const op = {
			$set: {
				memberIds,
				removedMemberIds,
				foreignMemberIds,
				adminIds,
				settings,
				providerIdentities,
				originalMemberIds: this.mergeToTeam.memberIds || [],
				originalRemovedMemberIds: this.mergeToTeam.removedMemberIds || [],
				originalForeignMemberIds: this.mergeToTeam.foreignMemberIds || [],
				originalAdminIds: this.mergeToTeam.adminIds || [],
				originalSettings: this.mergeToTeam.settings
			}
		};
		if (this.company) {
			op.$set.isEveryoneTeam = true;
		}
		const query = {
			id: this.data.teams.objectIdSafe(this.mergeToTeam.id)
		};
		await this.doDirect(`Merging to team ${this.mergeToTeam.id}...`, 'teams', query, op);
	}

	// merge the membership of all teams into the merge-to team
	mergeMemberships () {
		// merge memberIds array by determining all the ACTIVE members first,
		// the ultimate removed members are those who are not active on any of the teams
		let activeMemberIds = [];
		let possibleRemovedMemberIds = [];
		let possibleForeignMemberIds = [];
		let adminIds = [];
		for (const team of this.allTeams) {
			const activeTeamMemberIds = ArrayUtilities.difference(
				ArrayUtilities.difference(team.memberIds || [], team.removedMemberIds || []),
				team.foreignMemberIds || []);
			activeMemberIds = ArrayUtilities.unique([
				activeMemberIds,
				activeTeamMemberIds
			]);
			possibleRemovedMemberIds = [
				...possibleRemovedMemberIds,
				...(team.removedMemberIds || [])
			];
			possibleForeignMemberIds = [
				...possibleForeignMemberIds,
				...(team.foreignMemberIds || [])
			];
			adminIds = [
				...adminIds,
				...(team.adminIds || [])
			];
		}

		// any of the candidate removed members are truly removed if they are not active
		// members of any of the merged teams
		let removedMemberIds = [];
		possibleRemovedMemberIds.forEach(id => {
			if (!activeMemberIds.includes(id)) {
				removedMemberIds.push(id);
			}
		});

		// same for foreign members
		let foreignMemberIds = [];
		possibleForeignMemberIds.forEach(id => {
			if (!activeMemberIds.includes(id)) {
				foreignMemberIds.push(id);
			}
		});

		// sort and unique-ify everything
		const memberIds = ArrayUtilities.unique([
			...activeMemberIds,
			...removedMemberIds,
			...foreignMemberids
		]).sort();
		removedMemberIds = ArrayUtilities.unique(removedMemberIds).sort();
		foreignMemberIds = ArrayUtilities.unique(foreignMemberIds).sort();
		adminIds = ArrayUtilities.unique(adminIds).sort();

		return { memberIds, adminIds, removedMemberIds, foreignMemberIds };
	}

	// set the providerIdentities for the merge-to team as long as it doesn't already have it
	mergeProviderIdentities () {
		let providerIdentities = undefined;
		for (const team of this.mergingTeams) {
			if (
				team.providerIdentities instanceof Array &&
				team.providerIdentities.length > 0
			 ) {
				if (
					!(this.mergeToTeam.providerIdentities instanceof Array) ||
					this.mergeToTeam.providerIdentities.length === 0
				) {
					this.log(`Will copy providerIdentities from team ${team.id} to team ${this.mergeToTeam.id}`);
					providerIdentities = team.providerIdentities;
				} else {
					this.log(`NOTE: team ${this.mergeToTeam.id} has providerIdentities that can not be overridden by team ${team.id}`);
				}
			}
		}
		return providerIdentities;
	}

	// merge the settings for all the teams, according to various strategies
	mergeSettings () {
		const mergeToSettings = this.mergeToTeam.settings || {};
		for (const team of this.mergingTeams) {
			this.mergeTeamSettings(mergeToSettings, team.settings || {});
		}
		return mergeToSettings;
	}

	// merge the settings for one team into the merge-to team, according to various strategies
	mergeTeamSettings (mergeToSettings, teamSettings) {
		const SETTING_DEFAULTS = {
			branchMaxLength: 40,
			branchPreserveCase: false,
			branchTicketTemplate: 'feature/{title}',
			xray: 'on',
			gitLabMultipleAssignees: false,
			reviewApproval: 'anyone',
			reviewAssignment: 'none',
			limitAuthentication: false,
			limitCodeHost: false,
			limitMessaging: false,
			limitIssues: false,
			authenticationProviders: undefined,
			codeHostProviders: undefined,
			messagingProviders: undefined,
			issuesProviders: undefined
		};

		// for these settings, any team with a non-default value gets set in the merge-to team,
		// unless the merge-to team already has such a setting ... first team wins
		for (const setting in SETTING_DEFAULTS) {
			if (
				(
					mergeToSettings[setting] === undefined ||
					mergeToSettings[setting] === SETTING_DEFAULTS[setting]
				) &&
				teamSettings[setting] !== undefined &&
				teamSettings[setting] !== SETTING_DEFAULTS[setting]
			) {
				mergeToSettings[setting] = teamSettings[setting];
			}
		}

		// for "autoJoinRepos", merge and unique-ify the arrays
		if (teamSettings.autoJoinRepos instanceof Array) {
			mergeToSettings.autoJoinRepos = [
				...(mergeToSettings.autoJoinRepos || []),
				...(teamSettings.autoJoinRepos)
			];
		}
		if (mergeToSettings.autoJoinRepos) {
			mergeToSettings.autoJoinRepos = ArrayUtilities.unique(mergeToSettings.autoJoinRepos);
		}

		// for "dontSuggestInvitees", merge keys that are set to true
		if (typeof teamSettings.dontSuggestInvitees === 'object') {
			mergeToSettings.dontSuggestInvites = mergeToSettings.dontSuggestInvites || {};
			Object.keys(teamSettings.dontSuggestInvites || {}).forEach(email => {
				if (teamSettings.dontSuggestInvites[email]) {
					mergeToSettings.dontSuggestInvites[email] = true;
				}
			});
		}

		// for "blameMap", merge blame settings that don't override whatever is in the merge-to team blame map
		if (typeof teamSettings.blameMap === 'object') {
			mergeToSettings.blameMap = mergeToSettings.blameMap || {};
			Object.keys(teamSettings.blameMap || {}).forEach(email => {
				if (
					teamSettings.blameMap[email] &&
					!mergeToSettings.blameMap[email]
				) {
					mergeToSettings.blameMap[email] = teamSettings.blameMap[email];
				}
			});
		}
	}

	// update all members of all teams as needed
	async updateUsers () {
		const allMembers = await this.data.users.getByIds(this.allMemberIds, { requestId: this.requestId });
		return Promise.all(allMembers.map(async user => {
			await this.updateUser(user);
		}));
	}

	// update this member as merged into the merge-to team
	async updateUser (user) {
		const op = {};
		let needsUpdate = false;

		// ensure user has the merge-to team (and possibly company)
		const teamIds = user.teamIds || [];
		const companyIds = user.companyIds || [];
		let newCompanyIds = [...companyIds];
		if (!this.removedMemberIds.includes(user.id) && !this.foreignMemberIds.includes(user.id)) {
			if (!teamIds.includes(this.mergeToTeam.id)) {
				op.$push = op.$push || {};
				op.$push.teamIds = this.mergeToTeam.id;
				needsUpdate = true;
			}
			if (this.toCompany && !newCompanyIds.includes(this.toCompany.id)) {
				newCompanyIds.push(this.toCompany.id);
				needsUpdate = true;
			}
			if (this.fromCompany && newCompanyIds.includes(this.fromCompany.id)) {
				const idx = newCompanyIds.indexOf(this.fromCompany.id);
				if (idx !== -1) {
					newCompanyIds.splice(idx, 1);
				}
				needsUpdate = true;
			}
		}

		// if this user has integrations in other teams, bring those over to the merge-to team
		// if they don't overwrite one already established for the merge-to team
		const providerInfo = user.providerInfo || {};
		const mergeToTeamProviderInfo = providerInfo[this.mergeToTeam.id] || {};
		let providerInfoWasUpdated = false;
		for (const teamId in providerInfo) {
			if (teamId === this.mergeToTeam.id) {
				continue;
			}
			for (const provider in providerInfo[teamId]) {
				if (!(providerInfo[this.mergeToTeam.id] || {})[provider]) {
					this.log(`Copying ${provider} provider info on team ${teamId} for user ${user.id} to team ${this.mergeToTeam.id}`);
					needsUpdate = true;
					providerInfoWasUpdated = true;
					mergeToTeamProviderInfo[provider] = providerInfo[teamId][provider];
				} else {
					this.log(`NOTE: user ${user.id} has providerInfo for ${provider} in team ${this.mergeToTeam.id} that cannot be overriden by the info for team ${teamId}`);
				}
			}
		}

		if (providerInfoWasUpdated) {
			op.$set = op.$set || {};
			op.$set[`providerInfo.${this.mergeToTeam.id}`] = mergeToTeamProviderInfo;
			this.log(`Merging provider info for user ${user.id}...`);
		}

		if (needsUpdate) {
			op.$set = op.$set || {};
			op.$set.companyIds = newCompanyIds;
			const query = {
				id: this.data.users.objectIdSafe(user.id)	
			};
			await this.doDirect(`Updating user ${user.id}`, 'users', query, op);
		}
	}

	// set the company as migrated, once and for all!
	async setCompanyMigrated () {
		if (!this.company) { return; } // only applies to company-centric migration operation
		const op = {
			$set: {
				everyoneTeamId: this.mergeToTeam.id,
				hasBeenMigratedToCompanyCentric: true
			},
			$unset: {
				isBeingMigratedToCompanyCentric: true
			}
		}
		const query = {
			id: this.data.companies.objectIdSafe(this.company.id)
		};
		await this.doDirect(`Migrating multi-team company ${this.company.id} to company-centric...`, 'companies', query, op);
	}

	// when merging from one company to another, deactivate the "from" company
	async deactivateFromCompany () {
		const now = Date.now();
		const companyOp = {
			$set: {
				deactivated: true,
				name: `${this.fromCompany.name}-deactivated${now}`
			}
		};
		const teamOp = {
			$unset: {
				isEveryoneTeam: true
			}
		};

		const companyQuery = {
			id: this.data.companies.objectIdSafe(this.fromCompany.id)
		};
		await this.doDirect(`Deactivating from-company ${this.fromCompany.id}`, 'companies', companyQuery, companyOp);

		const teamQuery = {
			id: this.data.teams.objectIdSafe(this.fromTeam.id)
		};
		await this.doDirect(`Demoting from-team ${this.fromTeam.id} from being everyone team...`, 'teams', teamQuery, teamOp);
	}

	// when merging from one company to another, move all teams from the "from" company to the other, just in case we need them
	async moveTeams () {
		const teamIds = this.fromCompany.teamIds || [];
		const teamOp = {
			$set: {
				companyId: this.toCompany.id,
				originalCompanyId: this.fromCompany.id
			}
		};
		const teamQuery = {
			id: this.data.teams.inQuerySafe(teamIds)
		};
		await this.doDirect(`Moving all teams in company ${this.fromCompany.id} to company ${this.toCompany.id}...`, 'teams', teamQuery, teamOp);
	
		// update the to-company with all these new teams
		const newTeamIds = [...this.toCompany.teamIds, ...this.fromCompany.teamIds].sort();
		const companyOp = {
			$set: {
				teamIds: newTeamIds,
				originalTeamIds: this.toCompany.teamIds
			}
		};
		const companyQuery = {
			id: this.data.companies.objectIdSafe(this.toCompany.id)
		};
		await this.doDirect(`Updating company ${this.toCompany.id} with new teams ${teamIds}...`, 'companies', companyQuery, companyOp);
	}

	async doDirect (msg, collection, query, op) {
		let log = `${msg}\nON ${collection}:\n${JSON.stringify(query, undefined, 10)}\nOP:\n${JSON.stringify(op, undefined, 10)}`;
		if (this.dryRun) {
			this.log(`WOULD HAVE PERFORMED: ${log}`);
		} else {
			this.log(log);
		}
		if (!this.dryRun) {
			await this.data[collection].updateDirect(query, op, { requestId: this.requestId });
		}
	}

	warn (msg) {
		this.logger.warn('*************************************************************************************');
		this.logger.warn('*************************************************************************************');
		this.logger.warn('*************************************************************************************');
		this.logger.warn(`${this.requestId || ''} ${msg}`);
		this.logger.warn('*************************************************************************************');
		this.logger.warn('*************************************************************************************');
		this.logger.warn('*************************************************************************************');
	}
	
	log (msg) {
		this.logger.log('*************************************************************************************');
		this.logger.log(`${this.requestId || ''} ${msg}`);
		this.logger.log('*************************************************************************************');
	}
}

module.exports = MultiTeamMigrator;