// attributes for msteams_state documents/models

'use strict';

module.exports = {	
	key:{
		type: 'string',
		maxLength: 256,
		description: 'the key of the state'
	}, 
	value: {
		type: 'object',
		description: 'the value for this key'
	}
};
