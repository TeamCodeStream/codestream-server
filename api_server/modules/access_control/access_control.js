'use strict';

var API_Server_Module = require(process.env.CS_API_TOP +
  '/lib/api_server/api_server_module.js');

class AccessControl extends API_Server_Module {
  middlewares() {
    return (request, response, next) => {
      // Seb: Pretty sure this fine for detecting local env, but feel free to change it not
      if (this.api.config.express.host === 'localhost') {
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Headers', '*');
      }
      next();
    };
  }
}

module.exports = AccessControl;
