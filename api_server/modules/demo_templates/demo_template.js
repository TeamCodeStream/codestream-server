// provides the DemoTemplate model for handling data for demo orgs

'use strict';

const CodeStreamModel = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/models/codestream_model');
const DemoAttributes = require('./demo_attributes');
const CodeStreamModelValidator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/models/codestream_model_validator');

class DemoTemplate extends CodeStreamModel {
    getValidator () {
        return new CodeStreamModelValidator(DemoAttributes);
    }
}

module.exports = DemoTemplate;
