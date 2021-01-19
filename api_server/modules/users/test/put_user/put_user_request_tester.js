// handle unit tests for the "PUT /users" request

'use strict';

const PutUserTest = require('./put_user_test');
const PutUserFetchTest = require('./put_user_fetch_test');
const UpdateMeTest = require('./update_me_test');
const ACLTest = require('./acl_test');
const ACLTeamTest = require('./acl_team_test');
const MessageToTeamTest = require('./message_to_team_test');
const NoUpdateOtherAttributeTest = require('./no_update_other_attribute_test');
const UsernameNotUniqueTest = require('./username_not_unique_test');
const NoCodestreamUsernameTest = require('./no_codestream_username_test');
const UsernameNotUniqueForSecondTeamTest = require('./username_not_unique_for_second_team_test');
const ModifiedReposTest = require('./modified_repos_test');
const ModifiedReposFetchTest = require('./modified_repos_fetch_test');
const ModifiedReposACLTest = require('./modified_repos_acl_test');
const ModifiedReposInvalidTeamTest = require('./modified_repos_invalid_team_test');
const CompactModifiedReposTest = require('./compact_modified_repos_test');
const CompactModifiedReposFetchTest = require('./compact_modified_repos_fetch_test');
const CompactModifiedReposACLTest = require('./compact_modified_repos_acl_test');
const CompactModifiedReposInvalidTeamTest = require('./compact_modified_repos_invalid_team_test');
const NoCompactAndModifiedReposTest = require('./no_compact_and_modified_repos_test');

const UserAttributes = require('../../user_attributes');
const CAN_UPDATE_ATTRIBUTES = ['username', 'fullName', 'timeZone', 'phoneNumber', 'iWorkOn', 'status', 'avatar', 'hasGitLens'];

class PutUserRequestTester {

	putUserTest () {
		new PutUserTest().test();
		new PutUserFetchTest().test();
		new UpdateMeTest().test();
		CAN_UPDATE_ATTRIBUTES.forEach(attribute => {
			new PutUserTest({ 
				attributes: [attribute],
				attributeType: UserAttributes[attribute].type
			}).test();
		});
		new ACLTest().test();
		new ACLTeamTest().test();
		new MessageToTeamTest().test();
		Object.keys(UserAttributes).forEach(attribute => {
			if (attribute === 'modifiedRepos' || attribute === 'compactModifiedRepos') { return; } // this is handled separately
			if (!CAN_UPDATE_ATTRIBUTES.includes(attribute)) {
				new NoUpdateOtherAttributeTest({ 
					otherAttribute: attribute, 
					otherAttributeType: UserAttributes[attribute].type
				}).test();
			}
		});
		new UsernameNotUniqueTest().test();
		new NoCodestreamUsernameTest().test();
		new UsernameNotUniqueForSecondTeamTest().test();
		new ModifiedReposTest().test();
		new ModifiedReposFetchTest().test();
		new ModifiedReposACLTest().test();
		new ModifiedReposInvalidTeamTest().test();
		new CompactModifiedReposTest().test();
		new CompactModifiedReposFetchTest().test();
		new CompactModifiedReposACLTest().test();
		new CompactModifiedReposInvalidTeamTest().test();
		new NoCompactAndModifiedReposTest().test();
	}
}

module.exports = PutUserRequestTester;
