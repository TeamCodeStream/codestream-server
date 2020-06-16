// provides the MSTeamsTeam model for handling MS Teams state

'use strict';

const CodeStreamModel = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/models/codestream_model'); 

class MSTeamsState extends CodeStreamModel {}

module.exports = MSTeamsState;
