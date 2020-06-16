// provides the msteams_conversation model for handling msteams_conversations

'use strict';

const CodeStreamModel = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/models/codestream_model'); 

class MSTeamsConversation extends CodeStreamModel {}

module.exports = MSTeamsConversation;
