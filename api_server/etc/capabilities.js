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
		restricted: true,
		supportedIdes: ['VS Code', 'JetBrains']
	},
	'xray': {
		description: 'Support for feature x-ray, to monitor what co-workers are actively working on',
		version: '1.21.33',
		restricted: true
	},
	'notificationDeliveryPreference': {
		description: 'Support for displaying the email/desktop delivery notification preference',
		version: '1.21.33'
	}
};
