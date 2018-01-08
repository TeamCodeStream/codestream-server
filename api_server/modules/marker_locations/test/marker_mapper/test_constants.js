'use strict';

module.exports = {
	COMMITS: [
		'5c255290f37247acb227d9d9e9595d32ef3eb786',
		'dfa7aeb2db7f5981a07c43f723d5e9df4724429c',
		'1f2a13b7597f67f02ccf4089581f3d956dfea308',
		'7d312dc8cb00194b0506077f3db0e1c9ad4ced2e',
		'6aad7d350476b703a8cb616119fbc100476da25b',
		'7c1e4d89c8d0fea47a9eafbdb80d64d1823a5676',
		'5ea06042f2d8a85559d512bb66f3ced96f35cd2c',
		'36d3853d08eb8213f6c6b966b547e1dc6071ef8b',
		'5ee40509569188da0b7012ef586ff85b8b5d1543'
	],

	SINGLE_LINE_MARKER_RESULTS: {
		'2': [
			[ 4, 4, 5, 10, 11, 12, 19 ]
		],
		'6': [
			[ 1, 2, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 20, 21, 22, 23, 24, 25 ],
			[ 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9, 9, 9, 10, 11 ]
		],
		'7': [
			[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 20, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29]
		]
	},

	MULTI_LINE_MARKER_TESTS: {

		'recalculates positions when lines are modified within the marker range': {
			commitIndex: 8,
			inputLocations: {
				'1': [ 15, 1, 20, 100 ]
			},
			outputLocations: {
				'1': [ 15, 1, 31, 100 ]
			}
		},

		'recalculates position when a function moved down': {
			commitIndex: 9,
			inputLocations: {
				'1': [ 5, 1, 7, 100 ]
			},
			outputLocations: {
				'1': [ 9, 1, 11, 100 ]
			}
		},

		'recalculates column positions when text is changed': {
			commitIndex: 7,
			inputLocations: {
				'1': [ 15, 10, 15, 23 ],
				'2': [ 16, 21, 16, 36 ]
			},
			outputLocations: {
				'1': [ 15, 10, 15, 30 ],
				'2': [ 16, 14, 16, 29 ]
			}
		},

		'recalculates column positions when a function is moved down': {
			commitIndex: 9,
			inputLocations: {
				'1': [ 5, 5, 5, 13 ],
				'2': [ 5, 5, 7, 5 ]
			},
			outputLocations: {
				'1': [ 9, 5, 9, 13 ],
				'2': [ 9, 5, 11, 5 ]
			}
		}
	}
};
