
FROM node:12.14.1

ADD api_server/config /opt/api/codestream-server/api_server/config
ADD api_server/lib /opt/api/codestream-server/api_server/lib
ADD api_server/modules /opt/api/codestream-server/api_server/modules
ADD shared /opt/api/codestream-server/shared
ADD api_server/etc/webmail_companies.js /opt/api/codestream-server/api_server/etc/webmail_companies.js
ADD api_server/etc/capabilities.js /opt/api/codestream-server/api_server/etc/capabilities.js
ADD api_server/bin/api_server.js /opt/api/codestream-server/api_server/bin/api_server.js
ADD api_server/bin/cs_api-start-docker /opt/api/codestream-server/api_server/bin/cs_api-start-docker
ADD api_server/bin/ensure-indexes.js /opt/api/codestream-server/api_server/bin/ensure-indexes.js
ADD api_server/package.json /opt/api/codestream-server/api_server/package.json
ADD api_server/package-lock.json /opt/api/codestream-server/api_server/package-lock.json
# support tools
ADD api_server/bin/cs_deactivate.js /opt/api/codestream-server/api_server/bin/cs_deactivate.js
ADD api_server/bin/cs_api-slack_replies_to_codestream.js /opt/api/codestream-server/api_server/bin/cs_api-slack_replies_to_codestream.js

# This directory will be mounted from the host OS
RUN mkdir /opt/config

WORKDIR /opt/api/codestream-server
RUN mkdir log tmp pid

WORKDIR /opt/api/codestream-server/api_server
RUN npm install --no-save

EXPOSE 443

ENV CS_API_TOP=/opt/api/codestream-server/api_server
ENV CSSVC_BACKEND_ROOT=/opt/api/codestream-server
ENV NODE_PATH=/opt/api/codestream-server/api_server/node_modules
ENV CSSVC_CFG_FILE=/opt/config/codestream-services-config.json

CMD [ "/opt/api/codestream-server/api_server/bin/cs_api-start-docker" ]
