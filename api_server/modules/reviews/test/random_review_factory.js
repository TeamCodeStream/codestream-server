// provide a factory for creating random reviews, for testing purposes

'use strict';

const RandomString = require('randomstring');

const SAMPLE_COMMITS =[
	{
		'info' : {
			'author' : 'Brian Canzanella',
			'authorDate' : '2020-01-31T17:20:15.000Z',
			'committerDate' : '2020-01-31T17:20:15.000Z',
			'email' : 'brian@codestream.com',
			'message' : 'adds a function',
			'ref' : 'c1c0a2b184d78effd74a0648aa0ab98badf87c55',
			'repoPath' : '/Users/pez/github/gore',
			'shortMessage' : 'adds a function'
		},
		'localOnly' : false,
		'sha' : 'c1c0a2b184d78effd74a0648aa0ab98badf87c55'
	},
	{
		'info' : {
			'author' : 'Peter Pezaris',
			'authorDate' : '2020-01-31T16:56:43.000Z',
			'committerDate' : '2020-01-31T16:56:43.000Z',
			'email' : 'pez@codestream.com',
			'message' : 'add a command to compute averages',
			'ref' : 'ddf99a20a45279695b191a0db37b4dfdba9621cd',
			'repoPath' : '/Users/pez/github/gore2',
			'shortMessage' : 'add a command to compute averages'
		},
		'localOnly' : false,
		'sha' : 'ddf99a20a45279695b191a0db37b4dfdba9621cd'
	},
	{
		'info' : {
			'author' : 'Colin Stryker',
			'authorDate' : '2020-02-01T17:20:15.000Z',
			'committerDate' : '2020-02-02T17:20:15.000Z',
			'email' : 'colin@codestream.com',
			'message' : 'does something',
			'ref' : 'e954da258bac1a0e2e3843e9b7bcf0b64ea1afbc',
			'repoPath' : '/Users/pez/github/gore3',
			'shortMessage' : 'does something'
		},
		'localOnly' : false,
		'sha' : 'e954da258bac1a0e2e3843e9b7bcf0b64ea1afbc'
	},
	{
		'info' : {
			'author' : 'David Hersh',
			'authorDate' : '2020-02-03T16:56:43.000Z',
			'committerDate' : '2020-02-03T16:56:43.000Z',
			'email' : 'dave@codestream.com',
			'message' : 'add a command to compute sums',
			'ref' : '7d180d74be8a209a5cc44d4cbb8103a540362404',
			'repoPath' : '/Users/pez/github/gore4',
			'shortMessage' : 'add a command to compute averages'
		},
		'localOnly' : false,
		'sha' : '7d180d74be8a209a5cc44d4cbb8103a540362404'
	}
];

const SAMPLE_DIFFS = [
	{
		'oldFileName' : '/dev/null',
		'oldHeader' : '',
		'newFileName' : 'b/.gitignore',
		'newHeader' : '',
		'hunks' : [
			{
				'oldStart' : 0,
				'oldLines' : 0,
				'newStart' : 1,
				'newLines' : 1,
				'lines' : [
					'+node_modules'
				],
				'linedelimiters' : [
					'\n'
				]
			}
		]
	},
	{
		'oldFileName' : 'a/input.pl',
		'oldHeader' : '',
		'newFileName' : 'b/input.pl',
		'newHeader' : '',
		'hunks' : [
			{
				'oldStart' : 6,
				'oldLines' : 6,
				'newStart' : 6,
				'newLines' : 6,
				'lines' : [
					'     my $url = shift;',
					'     my $html = qx{curl --silent $url};',
					'     while ($html =~ m/([A-Z0-9+_.-]+@[A-Z0-9.-]+)/gi) {',
					'-\t$emails_found{$1}++;',
					'+    \t$emails_found{$1}++;',
					'     }',
					' }'
				],
				'linedelimiters' : [
					'\n',
					'\n',
					'\n',
					'\n',
					'\n',
					'\n',
					'\n'
				]
			}
		]
	},
	{
		'oldFileName' : '/dev/null',
		'oldHeader' : '',
		'newFileName' : 'b/.gitignore',
		'newHeader' : '',
		'hunks' : [
			{
				'oldStart' : 2,
				'oldLines' : 2,
				'newStart' : 3,
				'newLines' : 3,
				'lines' : [
					'+node_modules'
				],
				'linedelimiters' : [
					'\n'
				]
			}
		]
	},
	{
		'oldFileName' : 'b/input.pl',
		'oldHeader' : '',
		'newFileName' : 'c/input.pl',
		'newHeader' : '',
		'hunks' : [
			{
				'oldStart' : 7,
				'oldLines' : 7,
				'newStart' : 8,
				'newLines' : 8,
				'lines' : [
					'     my $url = shift;',
					'     my $html = qx{curl --silent $url};',
					'     while ($html =~ m/([A-Z0-9+_.-]+@[A-Z0-9.-]+)/gi) {',
					'-\t$emails_found{$1}++;',
					'+    \t$emails_found{$1}++;',
					'     }',
					' }'
				],
				'linedelimiters' : [
					'\n',
					'\n',
					'\n',
					'\n',
					'\n',
					'\n',
					'\n'
				]
			}
		]
	}
];

const SAMPLE_MODIFIED_FILES = [
	{
		'file' : '.gitignore',
		'linesAdded' : 1,
		'linesRemoved' : 0,
		'status' : 'M'
	},
	{
		'file' : 'input.pl',
		'linesAdded' : 1,
		'linesRemoved' : 1,
		'status' : 'M'
	},
	{
		'file' : '.gitignore',
		'linesAdded' : 2,
		'linesRemoved' : 1,
		'status' : 'M'
	},
	{
		'file' : 'input.pl',
		'linesAdded' : 3,
		'linesRemoved' : 1,
		'status' : 'M'
	}
];

class RandomReviewFactory {

	constructor (options) {
		Object.assign(this, options);
	}

	// get some random codemark data
	getRandomReviewData (options = {}) {
		const data = {
			title: RandomString.generate(50),
			status: 'open',
			text: RandomString.generate(100),
			reviewChangesets: this.getRandomChangesets(options.numChanges, options)
		};
		if (options.wantMarkers) {
			data.markers = this.markerFactory.createRandomMarkers(options.wantMarkers, options);
		}
		return data;
	}

	// get some random marker data
	getRandomChangesetData (options = {}, n) {
		const repoId = options.changesetRepoIds ? options.changesetRepoIds[n] : options.changesetRepoId;
		const numChangesets = options.numChangesets || 2;
		const whichChangesets = options.whichChangesets || 0;
		const commits = SAMPLE_COMMITS.slice(whichChangesets, whichChangesets + numChangesets);
		const diffs = SAMPLE_DIFFS.slice(whichChangesets, whichChangesets + numChangesets);
		const modifiedFiles = SAMPLE_MODIFIED_FILES.slice(whichChangesets, whichChangesets + numChangesets);
		const data = {
			repoId,
			branch: this.markerFactory.randomBranch(),
			diffStart: this.repoFactory.randomCommitHash(),
			commits,
			diffs,
			modifiedFiles,
			includeSaved: true,
			includeStaged: true
		};
		return data;
	}

	// create a given number of random changesets, with options provided
	getRandomChangesets (n, options = {}) {
		const changesets = [];
		for (let i = 0; i < n; i++) {
			const changesetInfo = this.getRandomChangesetData(options, i);
			changesets.push(changesetInfo);
		}
		return changesets;
	}
}

module.exports = RandomReviewFactory;
