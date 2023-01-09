'use strict';

const Restful = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful');
const DemoTemplate = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/demo_templates/demo_template');

class DemoTemplates extends Restful {
    constructor (options) {
        super(options);
    }

    get collectionName () {
        return 'demoTemplates';	// name of the data collection
    }

    get modelName () {
        return 'demoTemplate';	// name of the data model
    }

    get modelClass () {
        return DemoTemplate;	// use this class for the data model
    }
}

module.exports = DemoTemplates;
