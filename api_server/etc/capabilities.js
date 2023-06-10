'use strict';

module.exports = {
	'sample': {
		description: 'SAMPLE',
		version: '1.0.0'
	},
	'multipleMarkers': {
		description: 'Ability to have multiple code blocks per codemark',
		version: '1.21.20'
	},
	'moveMarkers': {
		description: 'Ability to change the location of code blocks pointed to by codemarks',
		version: '1.21.20'
	},
	'moveMarkers2': {
		description: 'Ability to change the location of code blocks pointed to by codemarks, with essential API server fix',
		version: '1.21.23'
	},
	'repoCommitMatching': {
		description: 'Supports the /repos/match/:teamId call, which allows matches to be found for repos by remotes and known commit hashes',
		version: '1.21.24'
	},
	'follow': {
		description: 'Ability to follow or unfollow a codemark',
		version: '1.21.27'
	},
	'lightningCodeReviews': {
		description: 'Support for lightning code reviews',
		version: '1.21.33',
		supportedIdes: ['VS Code', 'JetBrains', 'VS']
	},
	'xray': {
		description: 'Support for feature x-ray, to monitor what co-workers are actively working on',
		version: '1.21.33',
		restricted: true
	},
	'notificationDeliveryPreference': {
		description: 'Support for displaying the email/desktop delivery notification preference',
		version: '1.21.33'
	},
	'multipleReviewersApprove': {
		description: 'Support for multiple reviewers being required to approve a review',
		version: '7.1.1'
	},
	'emailSupport': {
		description: 'Whether outbound emails are supported, value actually comes from configuration',
		version: '1.0.0'
	},
	'multiCheckpointReviews': {
		description: 'Reviews supporting multiple checkpoints',
		version: '7.2.0'
	},
	'inviteUsersOnTheFly': {
		description: 'Users can be invited on-the-fly in codemarks and reviews',
		version: '7.2.7'
	},
	'kickstart': {
		description: 'Kickstart features',
		version: '7.4.2'
	},
	'cr2pr': {
		description: 'Features supporting opening pull requests after code reviews',
		version: '7.4.2'
	},
	'shareStatusToSlack': {
		description: 'Whether the share to slack capability is supported, which requires a new scope for the slack app',
		version: '8.0.6'
	},
	'addBlameMap': {
		description: 'Supporting adding someone to the blame-map',
		version: '8.1.1'
	},
	'vsCodeGithubSignin': {
		description: 'Supports whether special VSCode GitHub signin is supported in the auth flow',
		version: '8.2.7'
	},
	'compactModifiedRepos': {
		description: 'Supports compact modifiedRepos structure',
		version: '8.2.8'
	},
	'providerReauth': {
		description: 'Supports re-authentication for providers if tokens are found to be invalid',
		version: '8.2.11'
	},
	'autoJoin': {
		description: 'Supports auto-join API call, to auto-join a team based on open repos in IDE',
		version: '8.2.13'
	},
	'testGroups': {
		description: 'Supports the /company-test-groups/:id call, to set randomized test groups for a company',
		version: '8.2.15'
	},
	'fileUploads': {
		description: 'Supports file uploading',
		version: '8.2.17',
		cloudOnly: true
	},
	'autoFR': {
		description: 'Supports automatic generation of feedback requests',
		version: '8.2.20'
	},
	'readItem': {
		description: 'Supports /read-item call to mark number of unread replies for an item',
		version: '8.2.33'
	},
	'echoes': {
		description: 'Supports periodic echoes to test broadcaster reliability',
		version: '8.2.39'
	},
	'multiRegion': {
		description: 'Supports multi-region switching',
		version: '12.0.7'
	},
	'showPreReleaseTos': {
		description: 'Show pre-release TOS to CLM beta testers',
		version: '12.0.13',
		restricted: true
	},
	'showVulnerabilityManagement': {
		description: 'Show vulnerability management tree under Observability',
		version: '14.0.8',
		restricted: true
	},
	'PDIdev': {
		description: 'User-level feature flag for PDI devs',
		version: '14.0.11',
		userRestricted: true 
	},
	'showAnomalies': {
		description: 'Show anomalous methods management tree under Observability',
		version: '14.17.1',
		restricted: true
	},
	'serviceGatewayAuth': {
		description: 'Indicates the API server is running behind Service Gateway and using login service for auth, governed by a global variable',
		version: '14.0.11',
		useGlobal: true
	},
	'showGrok': {
		description: 'Enable Grok AI Error analysis',
		version: '14.19.1',
		restricted: true
	}
};
