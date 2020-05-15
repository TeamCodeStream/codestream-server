'use strict';

const ArrayUtilities = require(process.env.CS_API_TOP + '/server_utils/array_utilities');

class ReviewHelper {

	// validate the repo change-sets sent with the review creation, this is too important to just drop,
	// so we return an error instead
	static async validateReviewChangesetsForTeamRepos (reviewChangesets, teamRepos, request) {
		if (!reviewChangesets) { return; }
		// check that all repo IDs are valid and owned by the team
		const teamRepoIds = teamRepos.map(repo => repo.id);
		const repoIds = reviewChangesets.map(set => set.repoId);
		const nonTeamRepoIds = ArrayUtilities.difference(repoIds, teamRepoIds);
		if (nonTeamRepoIds.length > 0) {
			throw request.errorHandler.error('notFound', { info: `repo(s) ${nonTeamRepoIds.join(',')}`});
		}
	}

	// handle any change sets tied to the code review
	static async handleReviewChangesets (attributes, checkpointReviewDiffsOnly = false) {
		if (!attributes.reviewChangesets || !attributes.reviewChangesets.length) {
			return;
		}

		// take the actual diff info out of the changesets and put them into their own structure
		// reviewDiffs is an object with repo IDs as keys, representing diffs per repo, to be phased out
		// checkpointReviewDiffs is an array of diffs which will stay in sync with reviewChangesets,
		// and can include checkpoint diffs as the review is amended
		if (!checkpointReviewDiffsOnly) {
			attributes.reviewDiffs = {};
		}
		attributes.checkpointReviewDiffs = [];
		for (let changeset of attributes.reviewChangesets) {
			if (!checkpointReviewDiffsOnly) {
				attributes.reviewDiffs[changeset.repoId] = changeset.diffs;
			}
			attributes.checkpointReviewDiffs.push({
				repoId: changeset.repoId,
				diffs: changeset.diffs
			});
			delete changeset.diffs;
		}
	}
}


module.exports = ReviewHelper;