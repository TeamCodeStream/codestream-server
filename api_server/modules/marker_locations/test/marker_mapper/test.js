'use strict';

var NodeGit = require('nodegit');
var GitRepo = require(process.env.CS_API_TOP + '/lib/util/git_repo/git_repo');
var MarkerMapper = require('../../marker_mapper');
var Assert = require('assert');
var Async = require('async');
const TestConstants = require('./test_constants');
const TEST_REPO_PATH = process.env.CS_API_TEST_REPO_PATH;

// make eslint happy
/* globals describe, before, it */

describe('MarkerMapper', () => {
	var git, repo;

	// open git repository before all tests
	before (callback => {
		NodeGit.Repository.open(TEST_REPO_PATH)
			.then(_git => {
				git = _git;
				repo = new GitRepo(git);
				callback();
			})
			.catch(callback);
	});

	// get the deltas resulting from setting the head to a given commit hash
	function getDeltas (hash, callback) {
		git.setHeadDetached(hash);
		repo.getCurrentCommit((error, commit) => {
			if (error) { return callback(error); }
			repo.getDeltas(commit, callback);
		});
	}

	// build markers representing the whole line for every line line up to totalLines
	function buildSingleLineMarkers(totalLines) {
		let line = 1;
		let markerLocations = {};
		while (line <= totalLines) {
			markerLocations[line] = [ line, 1, line, 100 ];
			line++;
		}
		return markerLocations;
	}

	// expect marker locations for each line to match the expected lines
	function expectMarkers(markerLocations, expectedLines) {
		for (let i = 0; i < Object.keys(markerLocations).length; i++) {
			let actual = markerLocations[i+1][0];
			let expected = expectedLines[i];
			Assert.equal(expected, actual, `marker ${i+1} should be at ${expected}`);
		}
	}

	// test marker relocations for a given set of marker locations and a given delta,
	// against an expected result set
	async function testMarkerRelocationsForDelta (markerLocations, delta, expected, callback) {
		let markerMapper = new MarkerMapper(markerLocations, delta.edits);
		let updatedMarkerLocations;
		try {
			updatedMarkerLocations = await markerMapper.getUpdatedMarkerData();
		}
		catch (error) {
			callback(error);
		}
		expectMarkers(updatedMarkerLocations, expected);
		callback();
	}

	// test marker relocations for a given index into the commit history,
	// based on single line marker results expected
	function testMarkerRelocations (commitIndex, callback) {
		let commit = TestConstants.COMMITS[commitIndex - 1];
		let testResults = TestConstants.SINGLE_LINE_MARKER_RESULTS[commitIndex];
		let markerLocationsForFile = [];
		for (let fileIndex in testResults) {
			if (testResults.hasOwnProperty(fileIndex)) {
				let numLines = testResults[fileIndex].length;
				let markerLocations = buildSingleLineMarkers(numLines);
				markerLocationsForFile.push(markerLocations);
			}
		}
		getDeltas(commit, (error, deltas) => {
			Assert(deltas.length === markerLocationsForFile.length);
			Async.timesSeries(
				testResults.length,
				(n, timesCallback) => {
					testMarkerRelocationsForDelta(markerLocationsForFile[n], deltas[n], testResults[n], timesCallback);
				},
				callback
			);
		});

	}

	// test multi-line marker relocations for a given description
	async function testMultiLineRelocations (description, callback) {
		let test = TestConstants.MULTI_LINE_MARKER_TESTS[description];
		let commit = TestConstants.COMMITS[test.commitIndex - 1];
		getDeltas(commit, async (error, deltas) => {
			let markerMapper = new MarkerMapper(test.inputLocations, deltas[0].edits);
			let updatedMarkerLocations;
			try {
				updatedMarkerLocations = await markerMapper.getUpdatedMarkerData();
			}
			catch (error) {
				callback(error);
			}
			for (let markerId in test.inputLocations) {
				if (test.inputLocations.hasOwnProperty(markerId)) {
					Assert.deepEqual(test.outputLocations[markerId], updatedMarkerLocations[markerId]);
				}
			}
			callback();
		});
	}

	describe('getUpdatedMarkerData()', () => {

		describe('when markers are single-line', () => {
			Async.forEachSeries(
				Object.keys(TestConstants.SINGLE_LINE_MARKER_RESULTS),
				(commitIndex, foreachCallback) => {
					it(`recalculates positions for commit #${commitIndex}`, itCallback => {
						testMarkerRelocations(commitIndex, itCallback);
					});
					foreachCallback();
				}
			);
		});

		describe('when markers are multi-line', () => {
			Async.forEachSeries(
				Object.keys(TestConstants.MULTI_LINE_MARKER_TESTS),
				(description, foreachCallback) => {
					it(description, itCallback => {
						testMultiLineRelocations(description, itCallback);
					});
					foreachCallback();
				}
			);
		});
	});
});
