'use strict';

const PostIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/indexes');
const RepoIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/repos/indexes');
const StreamIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/streams/indexes');
const MarkerIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/markers/indexes');
const ReviewIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/reviews/indexes');
const ArrayUtilities = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/array_utilities');

// CONSIDERATIONS:
//
// x merge admins
// x consolidate team settings that aren't defaults (use first team that isn't default)
// x consolidate user's integrations
// x bring over non-duplicative blame maps

// IF REPOS NEED TO BE MERGED:
//  reviews: reviewChangesets, reviewDiffs, checkpointReviewDiffs all key off repo ID
//  reposByCommitHash
//  fileStreams
//  user.compactifiedModifiedRepos
//  user.modifiedReposModifiedAt

const COLLECTIONS_TO_MIGRATE = [
	'codemarkLinks',
	'codemarks',
	'markerLocations',
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

	async migrate (options) {
		try {
			Object.assign(this, options);
			this.data = this.api.data;
			this.requestId = `M-${this.company.id}`;

			this.log(`Migrating multi-team company ${this.company.id}:${this.company.name} to company-centric paradigm...`);
			await this.getTeams();
			await this.getTeamStreams();
			await this.determineEveryoneTeam();
			await this.flagReposForMerge();
			await this.migrateContent();
			await this.mergeToEveryoneTeam();
			await this.mergeUserIntegrations();
			await this.setCompanyMigrated();
		} catch (error) {
			this.warn(`Caught error migrating multi-team company ${this.company.id}: ${error.message}`);
		}
	}

	// get the teams owned by this company
	async getTeams () {
		this.teams = await this.data.teams.getByIds(this.company.teamIds || [], { requestId: this.requestId });
		if (this.teams.length === 0) {
			// wha?? a company with no teams?? this really shouldn't happen
			this.warn(`Company ${this.company.id}:${this.company.name} has no teams!!!`);
		}
	}

	// get the team-stream for every team
	async getTeamStreams () {
		return Promise.all(this.teams.map(async team => {
			team.teamStream = (await this.data.streams.getByQuery(
				{ teamId: team.id, isTeamStream: true },
				{ hint: StreamIndexes.byIsTeamStream, requestId: this.requestId }
			))[0];
			if (!team.teamStream) {
				this.warn(`Team ${team.id} from company ${this.company.id} has no team stream!!!`);
			}
		}));
	}

	// determine which team should be the everyone team, based on which one has the most content
	async determineEveryoneTeam () {
		this.everyoneTeam = null;
		this.postsByTeam = {};
		let maxCount = 0;

		// count the posts on all the teams owned by the company, and make the everyone team
		// the one with the most posts
		const activeTeams = [];
		for (const team of this.teams) {
			this.postsByTeam[team.id] = await this .data.posts.countByQuery(
				{
					teamId: team.id
				},
				{
					hint: PostIndexes.byId,
					requestId: this.requestId
				}
			);
			this.log(`Team ${team.id} has ${this.postsByTeam[team.id]} posts`);
			if (!team.deactivated && this.postsByTeam[team.id] > maxCount) {
				this.everyoneTeam = team;
				maxCount = this.postsByTeam[team.id];
			}
			if (!team.deactivated) {
				activeTeams.push(team);
			}
		}

		// handle rare cases where no appropriate "everyone" team is found
		if (!this.everyoneTeam) {
			// this happens if there is no content in any active teams, so just make it the
			// first active team
			this.everyoneTeam = activeTeams[0];
			if (!this.everyoneTeam) {
				// this happens if there are no active teams, which shouldn't really happen,
				// but just create one
				this.warn(`No everyone team established for company ${this.company.id} migration, creating...`);
				this.everyoneTeam = await this.data.teams.create({
					companyId: this.company.id,
					name: 'Everyone',
					isEveryoneTeam: true
				}, {
					requestId: this.requestId
				});
			}
		}
		this.log(`Everyone team for company migration ${this.company.id} will be ${this.everyoneTeam.id}`);
	}

	// migrate all content belonging to other teams besides the everyone team to point to the everyone team
	async migrateContent () {
		for (const team of this.teams) {
			if (team.id !== this.everyoneTeam.id) {
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
	}

	// migrate all content belonging to one team to the everyone team
	async migrateContentForTeam (team) {
		for (const collection of COLLECTIONS_TO_MIGRATE) {
			await this.migrateContentForCollection(team, collection);
		}
	}

	// migrate all content in one collection belonging to one team to the everyone team
	async migrateContentForCollection (team, collection) {
		// this is the core performance hit ... changing all these teamIds at once
		// could hurt indexing, but let's hope not
		this.log(`Migrating ${collection} for team ${team.id} of company ${this.company.id} to company-centric...`);
		const op = {
			$set: {
				originalTeamId: team.id,
				teamId: this.everyoneTeam.id
			}
		};

		if (this.dryRun) {
			this.log(`Would have updated ${collection} documents in team ${team.id} to point to everyone team ${this.everyoneTeam.id} with op:\n${JSON.stringify(op, undefined, 5)}`);
		} else {
			await this.data[collection].updateDirect({ teamId: team.id }, op, { requestId: this.requestId });
		}

		// certain collections have pointers to the stream, which for the team stream, should also be merged
		// into the team stream for the team
		const everyoneTeamStreamId = this.everyoneTeam.teamStream && this.everyoneTeam.teamStream.id;
		const teamStreamId = team.teamStream && team.teamStream.id;
		if (everyoneTeamStreamId && COLLECTIONS_WITH_TEAM_STREAM[collection]) {
			const streamIdField = COLLECTIONS_WITH_TEAM_STREAM[collection];
			const query = {
				[streamIdField]: teamStreamId
			};
			const streamOp = {
				$set: {
					[`original${capitalize(streamIdField)}`]: teamStreamId,
					[streamIdField]: everyoneTeamStreamId
				}
			};

			if (this.dryRun) {
				this.log(`Would have moved ${collection} to merged team stream ${everyoneTeamStreamId} with op:\n${JSON.stringify(streamOp, undefined, 5)}`);
			} else {
				await this.data[collection].updateDirect(query, streamOp);
			}
		}
	}

	// look for any repos that seem duplicative between the merged teams and the everyone team,
	// and flag for merge if the team that owns the duplicate repo has any content pointing to the repo
	// (we're not going to deal with the actual merge at this time)
	async flagReposForMerge () {
		for (const team of this.teams) {
			if (team.id !== this.everyoneTeam.id && this.postsByTeam[team.id] > 0) {
				await this.flagReposForMergeForTeam(team);
			}
		}
	}

	// look for any repos that seem duplicative between the merged team and the everyone team,
	// and flag for merge if the team that owns the duplicate repo has any content pointing to the repo
	// (we're not going to deal with the actual merge at this time)
	async flagReposForMergeForTeam (team) {
		const mergingRepos = await this.data.repos.getByQuery(
			{ teamId: team.id },
			{ hint: RepoIndexes.byTeamId, requestId: this.requestId }
		);
		const everyoneRepos = await this.data.repos.getByQuery(
			{ teamId: this.everyoneTeam.id },
			{ hint: RepoIndexes.byTeamId, requestId: this.requestId }
		);

		// lovely quadruple nested loop, let's just hope the numbers are small
		for (const mergingRepo of mergingRepos) {
			for (const everyoneRepo of everyoneRepos) {
				this.log(`Everyone repo ${everyoneRepo.id} remotes: ${(everyoneRepo.remotes || []).map(rem => rem.normalizedUrl)}`);
				this.log(`Merging repo ${mergingRepo.id} remotes: ${(mergingRepo.remotes || []).map(rem => rem.normalizedUrl)}`);
				if ((everyoneRepo.remotes || []).find(everyoneRemote => {
					return (mergingRepo.remotes || []).find(mergingRemote => {
						return everyoneRemote.normalizedUrl === mergingRemote.normalizedUrl;
					});
				})) {
					this.log(`Will possibly flag repo ${mergingRepo.id} for merge to ${everyoneRepo.id}`);
					await this.possiblyFlagReposForMerge(mergingRepo, everyoneRepo);
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
				hint: PostIndexes.byId ,
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
		this.log(`Repo ${fromRepo.id} is being flagged for merge because ${reason}`);
		if (this.dryRun) {
			this.log(`Would have flagged repo ${fromRepo.id} for merge with op:\n${JSON.stringify(op, undefined, 5)}`);
		} else {
			await this.data.repos.updateDirect({ id: this.data.repos.objectIdSafe(fromRepo.id) }, op, { requestId: this.requestId });
		}
	}

	// merge each team's membership and settings into the everyone team for the company
	async mergeToEveryoneTeam () {
		// merge team memberships and settings
		const { memberIds, adminIds, removedMemberIds } = this.mergeMemberships();
		const settings = this.mergeSettings();
		this.allMemberIds = memberIds;

		// for providerIdentities, the everyone team wins
		let providerIdentities = undefined;
		for (const team of this.teams) {
			if (
				team.id !== this.everyoneTeam.id && 
				team.providerIdentities instanceof Array &&
				team.providerIdentities.length > 0
			 ) {
				if (
					!(this.everyoneTeam.providerIdentities instanceof Array) ||
					this.everyoneTeam.providerIdentities.length === 0
				) {
					providerIdentities = team.providerIdentities;
				} else {
					this.log(`NOTE: everyone team ${this.everyoneTeam.id} has providerIdentities that can not be overridden by team ${team.id}`);
				}
			}
		}

		const op = {
			$set: {
				isEveryoneTeam: true,
				memberIds,
				removedMemberIds,
				adminIds,
				settings,
				originalMemberIds: this.everyoneTeam.memberIds || [],
				providerIdentities,
				originalRemovedMemberIds: this.everyoneTeam.removedMemberIds || [],
				originalAdminIds: this.everyoneTeam.adminIds || [],
				originalSettings: this.everyoneTeam.settings
			}
		};
		this.log(`Updating team ${this.everyoneTeam.id} to an everyone team with op:\n${JSON.stringify(op, undefined, 5)}`);
		if (this.dryRun) {
			this.log(`Would have updated team ${this.everyoneTeam.id} to an everyone team with op:\n${JSON.stringify(op, undefined, 5)}`);
		} else {
			// store this membership to the everyone team, also saving what the original membership
			// details were, in case we need to back off
			return this.data.teams.updateDirect({ id: this.data.teams.objectIdSafe(this.everyoneTeam.id) }, op, { requestId: this.requestId });
		}
	}

	// merge the membership of all teams into the everyone team
	mergeMemberships () {
		// merge memberIds array by determining all the ACTIVE members first,
		// the ultimate removed members are those who are not active on any of the teams
		let activeMemberIds = [];
		let possibleRemovedMemberIds = [];
		let adminIds = [];
		for (const team of this.teams) {
			activeMemberIds = ArrayUtilities.unique([
				...activeMemberIds,
				...ArrayUtilities.difference(team.memberIds || [], team.removedMemberIds || [])
			]);
			possibleRemovedMemberIds = [
				...possibleRemovedMemberIds,
				...(team.removedMemberIds || [])
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

		// sort and unique-ify everything
		const memberIds = ArrayUtilities.unique([
			...activeMemberIds,
			...removedMemberIds
		]).sort();
		removedMemberIds = ArrayUtilities.unique(removedMemberIds).sort();
		adminIds = ArrayUtilities.unique(adminIds).sort();

		return { memberIds, adminIds, removedMemberIds };
	}

	// merge the settings for all the teams, according to various strategies
	mergeSettings () {
		const everyoneSettings = this.everyoneTeam.settings || {};
		for (const team of this.teams) {
			if (team.id !== this.everyoneTeam.id) {
				this.mergeTeamSettings(everyoneSettings, team.settings || {});
			}
		}
		return everyoneSettings;
	}

	// merge the settings for one team into the everyone team, according to various strategies
	mergeTeamSettings (everyoneSettings, teamSettings) {
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

		// for these settings, any team with a non-default value gets set in the everyone team,
		// unless the everyone team already has such a setting ... first team wins
		for (const setting in SETTING_DEFAULTS) {
			if (
				(
					everyoneSettings[setting] === undefined ||
					everyoneSettings[setting] === SETTING_DEFAULTS[setting]
				) &&
				teamSettings[setting] !== undefined &&
				teamSettings[setting] !== SETTING_DEFAULTS[setting]
			) {
				everyoneSettings[setting] = teamSettings[setting];
			}
		}

		// for "autoJoinRepos", merge and unique-ify the arrays
		if (teamSettings.autoJoinRepos instanceof Array) {
			everyoneSettings.autoJoinRepos = [
				...(everyoneSettings.autoJoinRepos || []),
				...(teamSettings.autoJoinRepos)
			];
		}
		if (everyoneSettings.autoJoinRepos) {
			everyoneSettings.autoJoinRepos = ArrayUtilities.unique(everyoneSettings.autoJoinRepos);
		}

		// for "dontSuggestInvitees", merge keys that are set to true
		if (typeof teamSettings.dontSuggestInvitees === 'object') {
			everyoneSettings.dontSuggestInvites = everyoneSettings.dontSuggestInvites || {};
			Object.keys(teamSettings.dontSuggestInvites).forEach(email => {
				if (teamSettings.dontSuggestInvites[email]) {
					everyoneSettings.dontSuggestInvites[email] = true;
				}
			});
		}

		// for "blameMap", merge blame settings that don't override whatever is in the everyone team blame map
		if (typeof teamSettings.blameMap === 'object') {
			everyoneSettings.blameMap = everyoneSettings.blameMap || {};
			Object.keys(teamSettings.blameMap).forEach(email => {
				if (
					teamSettings.blameMap[email] &&
					!everyoneSettings.blameMap[email]
				) {
					everyoneSettings.blameMap[email] = teamSettings.blameMap[email];
				}
			});
		}
	}

	// for users with integrations in other teams, bring those over to the everyone team
	// if they don't overwrite one already established for the everyone team
	async mergeUserIntegrations () {
		const allMembers = await this.data.users.getByIds(this.allMemberIds, { requestId: this.requestId });
		return Promise.all(allMembers.map(async user => {
			await this.mergeUserIntegrationsForMember(user);
		}));
	}

	// if this user has integrations in other teams, bring those over to the everyone team
	// if they don't overwrite one already established for the everyone team
	async mergeUserIntegrationsForMember (user) {
		const providerInfo = user.providerInfo || {};
		const everyoneTeamProviderInfo = providerInfo[this.everyoneTeam.id] || {};
		let providerInfoWasUpdated = false;
		for (const teamId in providerInfo) {
			if (teamId === this.everyoneTeam.id) {
				continue;
			}
			for (const provider in providerInfo[teamId]) {
				if (!providerInfo[this.everyoneTeam.id][provider]) {
					this.log(`Copying ${provider} provider info on team ${teamId} for user ${user.id} to everyone team ${this.everyoneTeam.id}`);
					providerInfoWasUpdated = true;
					everyoneTeamProviderInfo[provider] = providerInfo[teamId][provider];
				} else {
					this.log(`NOTE: user ${user.id} has providerInfo for ${provider} in everyone team ${this.everyoneTeam.id} that cannot be overriden by the info for team ${teamId}`);
				}
			}
		}

		if (providerInfoWasUpdated) {
			const op = {
				$set: {
					[`providerInfo.${this.everyoneTeam.id}`]: everyoneTeamProviderInfo
				}
			};
			this.log(`Merging provider info for user ${user.id} with op:\n${JSON.stringify(op, undefined, 5)}`);
			if (this.dryRun) {
				this.log(`Would have merged provider info for user ${user.id} with op:\n${JSON.stringify(op, undefined, 5)}`);
			} else {
				return this.data.users.updateDirect({ id: this.data.users.objectIdSafe(user.id) }, op, { requestId: this.requestId });
			}
		}
	}

	// set the company as migrated, once and for all!
	async setCompanyMigrated () {
		const op = {
			$set: {
				everyoneTeamId: this.everyoneTeam.id,
				hasBeenMigratedToCompanyCentric: true
			},
			$unset: {
				isBeingMigratedToCompanyCentric: true
			}
		}
		this.log(`Migrating multi-team company ${this.company.id} to company-centric...`);
		if (this.dryRun) {
			this.log(`Would have migrated multi-team company ${this.company.id} to company-centric with op:\n${JSON.stringify(op, undefined, 5)}`);
		} else {
			return this.data.companies.updateDirect({ id: this.data.companies.objectIdSafe(this.company.id) }, op, { requestId: this.requestId });
		}
	}

	warn (msg) {
		this.api.warn('*************************************************************************************');
		this.api.warn('*************************************************************************************');
		this.api.warn('*************************************************************************************');
		this.api.warn(`${this.requestId} ${msg}`);
		this.api.warn('*************************************************************************************');
		this.api.warn('*************************************************************************************');
		this.api.warn('*************************************************************************************');
	}
	
	log (msg) {
		this.api.log('*************************************************************************************');
		this.api.log(`${this.requestId} ${msg}`);
		this.api.log('*************************************************************************************');
	}
}

module.exports = MultiTeamMigrator;