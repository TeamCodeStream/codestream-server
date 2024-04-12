// provides the Entity model for handling New Relic entities

'use strict';

const CodeStreamModel = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/models/codestream_model');
const CodeStreamModelValidator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/models/codestream_model_validator');
const EntityAttributes = require('./entity_attributes');

class Entity extends CodeStreamModel {

	getValidator () {
		return new CodeStreamModelValidator(EntityAttributes);
	}
}

module.exports = Entity;
