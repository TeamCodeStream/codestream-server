// handle unit tests for the "PUT /codemarks/:id/add-markers" request to add markers to a codemark

'use strict';

const AddMarkersTest = require('./add_markers_test');
const MessageTest = require('./message_test');
const InsertMarkersTest = require('./insert_markers_test');
const CodemarkNotFoundTest = require('./codemark_not_found_test');
const ACLTest = require('./acl_test');
const ACLCreatorTest = require('./acl_creator_test');
const AdminCanAddTest = require('./admin_can_add_test');
const ParameterRequiredTest = require('./parameter_required_test');
const TooManyMarkersTest = require('./too_many_markers_test');
const TooFewMarkersTest = require('./too_few_markers_test');
const NoCommitHashTest = require('./no_commit_hash_test');
const NoCommitHashWithFileTest = require('./no_commit_hash_with_file_test');
const NoCommitHashWithStreamTest = require('./no_commit_hash_with_stream_test');
const NoCommitHashWithStreamIdTest = require('./no_commit_hash_with_stream_id_test');
const MarkersNotArrayTest = require('./markers_not_array_test');
const MarkersTooLongTest = require('./markers_too_long_test');
const MarkerNotObjectTest = require('./marker_not_object_test');
const MarkerAttributeRequiredTest = require('./marker_attribute_required_test');
const LocationTooLongTest = require('./location_too_long_test');
const LocationTooShortTest = require('./location_too_short_test');
const LocationMustBeNumbersTest = require('./location_must_be_numbers_test');
const InvalidCoordinateObjectTest = require('./invalid_coordinate_object_test');
const NoLocationOkTest = require('./no_location_ok_test');
const TooManyRemotesTest = require('./too_many_remotes_test');
const TooManyKnownCommitHashesTest = require('./too_many_known_commit_hashes_test');
const MarkerHasInvalidStreamIdTest = require('./marker_has_invalid_stream_id_test');
const MarkerHasUnknownStreamIdTest = require('./marker_has_unknown_stream_id_test');
const MarkerHasInvalidRepoIdTest = require('./marker_has_invalid_repo_id_test');
const MarkerHasUnknownRepoIdTest = require('./marker_has_unknown_repo_id_test');
const MarkerForBadStreamTypeTest = require('./marker_for_bad_stream_type_test');
const MarkerFromDifferentTeamTest = require('./marker_from_different_team_test');
const MarkerStreamOnTheFly = require('./marker_stream_on_the_fly_test');
const FindRepoByRemotesTest = require('./find_repo_by_remotes_test');
const FindRepoByKnownCommitHashesTest = require('./find_repo_by_known_commit_hashes_test');
const FindRepoByCommitHashTest = require('./find_repo_by_commit_hash_test');
const UpdateMatchedRepoWithRemotesTest = require('./update_matched_repo_with_remotes_test');
const UpdateSetRepoWithRemotesTest = require('./update_set_repo_with_remotes_test');
const CreateRepoOnTheFlyTest = require('./create_repo_on_the_fly_test');
const CreateRepoOnTheFlyWithCommitHashesTest = require('./create_repo_on_the_fly_with_commit_hashes_test');
const DuplicateFileStreamTest = require('./duplicate_file_stream_test');
const UpdatedSetRepoMessageTest = require('./updated_set_repo_message_test');
const UpdatedKnownCommitHashesForRepoMessageTest = require('./updated_known_commit_hashes_for_repo_test');
const OnTheFlyMarkerStreamFromDifferentTeamTest = require('./on_the_fly_marker_stream_from_different_team_test');
const OnTheFlyMarkerStreamRepoNotFoundTest = require('./on_the_fly_marker_stream_repo_not_found_test');
const OnTheFlyMarkerStreamNoRemotesTest = require('./on_the_fly_marker_stream_no_remotes_test');
const OnTheFlyMarkerStreamInvalidRepoIdTest = require('./on_the_fly_marker_stream_invalid_repo_id_test');

class AddMarkersRequestTester {

	test() {
		new AddMarkersTest().test();
		new MessageTest().test();
		new InsertMarkersTest().test();
		new CodemarkNotFoundTest().test();
		new ACLTest().test();
		new ACLCreatorTest().test();
		new AdminCanAddTest().test();
		new ParameterRequiredTest({ parameter: 'markers' }).test();
		new TooManyMarkersTest().test();
		new TooFewMarkersTest().test();
		new NoCommitHashTest().test();
		new NoCommitHashWithFileTest().test();
		new NoCommitHashWithStreamTest().test();
		new NoCommitHashWithStreamIdTest().test();
		new MarkersNotArrayTest().test();
		new MarkersTooLongTest().test();
		new MarkerNotObjectTest().test();
		new MarkerAttributeRequiredTest({ attribute: 'code' }).test();
		new LocationTooLongTest().test();
		new LocationTooShortTest().test();
		new LocationMustBeNumbersTest().test();
		new InvalidCoordinateObjectTest().test();
		new NoLocationOkTest().test();
		new TooManyRemotesTest().test();
		new TooManyKnownCommitHashesTest().test();
		new MarkerHasInvalidStreamIdTest().test();
		new MarkerHasUnknownStreamIdTest().test();
		new MarkerHasInvalidRepoIdTest().test();
		new MarkerHasUnknownRepoIdTest().test();
		new MarkerForBadStreamTypeTest({ streamType: 'direct' }).test();
		new MarkerForBadStreamTypeTest({ streamType: 'channel' }).test();
		new MarkerFromDifferentTeamTest().test();
		new MarkerStreamOnTheFly().test();
		new FindRepoByRemotesTest().test();
		new FindRepoByKnownCommitHashesTest().test();
		new FindRepoByCommitHashTest().test();
		new UpdateMatchedRepoWithRemotesTest().test();
		new UpdateSetRepoWithRemotesTest().test();
		new CreateRepoOnTheFlyTest().test();
		new CreateRepoOnTheFlyWithCommitHashesTest().test();
		new DuplicateFileStreamTest().test();
		new UpdatedSetRepoMessageTest().test();
		new UpdatedKnownCommitHashesForRepoMessageTest().test();
		new OnTheFlyMarkerStreamFromDifferentTeamTest().test();
		new OnTheFlyMarkerStreamRepoNotFoundTest().test();
		new OnTheFlyMarkerStreamNoRemotesTest().test();
		new OnTheFlyMarkerStreamInvalidRepoIdTest().test();
	}
}

module.exports = new AddMarkersRequestTester();
