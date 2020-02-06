// provide a factory for creating random changesets, for testing purposes

'use strict';

const SAMPLE_COMMIT1 = {
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
};

const SAMPLE_COMMIT2 = {
	'info' : {
		'author' : 'Peter Pezaris',
		'authorDate' : '2020-01-31T16:56:43.000Z',
		'committerDate' : '2020-01-31T16:56:43.000Z',
		'email' : 'pez@codestream.com',
		'message' : 'add a command to compute averages',
		'ref' : 'ddf99a20a45279695b191a0db37b4dfdba9621cd',
		'repoPath' : '/Users/pez/github/gore',
		'shortMessage' : 'add a command to compute averages'
	},
	'localOnly' : false,
	'sha' : 'ddf99a20a45279695b191a0db37b4dfdba9621cd'
};

const SAMPLE_DIFF1 = {
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
};

const SAMPLE_DIFF2 = {
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
};

const SAMPLE_MODIFIED_FILE1 = {
	'file' : '.gitignore',
	'linesAdded' : 1,
	'linesRemoved' : 0,
	'status' : 'M'
};

const SAMPLE_MODIFIED_FILE2 = {
	'file' : 'input.pl',
	'linesAdded' : 1,
	'linesRemoved' : 1,
	'status' : 'M'
};

class RandomChangesetFactory {

	constructor (options) {
		Object.assign(this, options);
	}

	// get some random marker data
	getRandomChangesetData (options = {}) {
		const data = {
			repoId: options.changesetRepoId,
			branch: this.markerFactory.randomBranch(),
			diffStart: this.repoFactory.randomCommitHash(),
			commits: [
				{ ...SAMPLE_COMMIT1 },
				{ ...SAMPLE_COMMIT2 }
			],
			diffs: [
				{ ...SAMPLE_DIFF1 },
				{ ...SAMPLE_DIFF2 }
			],
			modifiedFiles: [
				{ ...SAMPLE_MODIFIED_FILE1 },
				{ ...SAMPLE_MODIFIED_FILE2 }
			],
			includeSaved: true,
			includeStaged: true
		};
		return data;
	}

	// create a given number of random markers, with options provided
	getRandomChangesets (n, options = {}) {
		// for markers, we'll generate some random text for the code and a random
		// location structure, not a very accurate representation of real code
		const changesets = [];
		for (let i = 0; i < n; i++) {
			const changesetInfo = this.getRandomChangesetData(options);
			changesets.push(changesetInfo);
		}
		return changesets;
	}


}

module.exports = RandomChangesetFactory;
