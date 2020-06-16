// provides the MSTeamsTeam model for handling MS Teams teams

'use strict';

const CodeStreamModel = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/models/codestream_model'); 

class MSTeamsTeam extends CodeStreamModel {}

module.exports = MSTeamsTeam;
