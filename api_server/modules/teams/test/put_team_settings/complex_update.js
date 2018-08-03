// provide some "complex" data for "PUT /team-settings" request testing

'use strict';

module.exports = {

	// these constants are inter-dependent, consider the impact if you alter
	// one of these constants on the others
	
	// set these settings initially
	INITIAL_SETTINGS: {
		A: 1,
		B: {
			B1: 'B1'
		},
		C: {
			C1: 'C1',
			C2: 'C2'
		},
		D: {
			D1: {
				D11: 'D11',
				D12: 'D12'
			}
		},
		E: 5,
		F: 'six',
		G: {
			G1: 'geeone',
			G2: 'geetwo',
			G3: {
				G31: 'g31',
				G32: 'g32'
			}
		}
	},

	// apply this op to update the settings
	UPDATE_OP: {
		$set: {
			A: 2,
			B: {
				B1: 'b1',
				B2: 'b2'
			},
			C: {
				C1: 'CeeOne',
				C3: 'CeeThree'
			},
			H: 'h'
		},
		$unset: {
			D: {
				D1: {
					D12: true
				}
			},
			F: true
		},
		'G.G2': 'g2',
		G: {
			G3: {
				G32: 'gthreetwo',
				G33: 'G33'
			}
		},
		I: 'i'
	},

	// after applying the update, we expect to see these settings
	EXPECTED_SETTINGS: {
		A: 2,
		B: {
			B1: 'b1',
			B2: 'b2'
		},
		C: {
			C1: 'CeeOne',
			C2: 'C2',
			C3: 'CeeThree'
		},
		D: {
			D1: {
				D11: 'D11'
			}
		},
		E: 5,
		G: {
			G1: 'geeone',
			G2: 'g2',
			G3: {
				G31: 'g31',
				G32: 'gthreetwo',
				G33: 'G33'
			}
		},
		H: 'h',
		I: 'i'
	},

	// after applying the op, we expect to see a pubnub message with this op to
	// apply on the client
	EXPECTED_OP: {
		$set: {
			'settings.A': 2,
			'settings.B.B1': 'b1',
			'settings.B.B2': 'b2',
			'settings.C.C1': 'CeeOne',
			'settings.C.C3': 'CeeThree',
			'settings.H': 'h',
			'settings.G.G2': 'g2',
			'settings.G.G3.G32': 'gthreetwo',
			'settings.G.G3.G33': 'G33',
			'settings.I': 'i'
		},
		$unset: {
			'settings.D.D1.D12': true,
			'settings.F': true
		}
	}
};
