'use strict';

const CodeStreamMessageTest = require('../../../../lib/tester/codestream_message_test');
const RegistrationRequestTest = require('./registration_test_request_data');

module.exports = {
	...CodeStreamMessageTest,
	...RegistrationRequestTest,
	description: 'team members should receive a user message when a user registers, if they are already on a team',
	needStandardTeams: 1,
	inviteUserToTeam: 'unregistered',
	cacheLocal: {
		team: [ 'teams', 'standard', 'team' ]
	},
	channel: 'team-{{{ fromLocalCache(team.id) }}}',
	expectedMessage: '{{{ apiResponse }}}'
};
