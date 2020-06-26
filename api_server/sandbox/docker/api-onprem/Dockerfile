
FROM node:12.14.1

ADD api_server/config /opt/api/codestream-server/api_server/config
ADD api_server/lib /opt/api/codestream-server/api_server/lib
ADD api_server/modules /opt/api/codestream-server/api_server/modules
ADD shared /opt/api/codestream-server/shared
ADD api_server/etc/webmail_companies.js /opt/api/codestream-server/api_server/etc/webmail_companies.js
ADD api_server/etc/capabilities.js /opt/api/codestream-server/api_server/etc/capabilities.js
ADD api_server/bin/cs_api-start-docker /opt/api/codestream-server/api_server/bin/cs_api-start-docker
ADD api_server/bin/*.js /opt/api/codestream-server/api_server/bin/
ADD api_server/package.json /opt/api/codestream-server/api_server/package.json
ADD api_server/package-lock.json /opt/api/codestream-server/api_server/package-lock.json

# This directory will be mounted from the host OS
RUN mkdir /opt/config

WORKDIR /opt/api/codestream-server
RUN mkdir log tmp pid

WORKDIR /opt/api/codestream-server/api_server
RUN npm install --no-save

EXPOSE 443

ENV CSSVC_BACKEND_ROOT=/opt/api/codestream-server
ENV CSSVC_CFG_FILE=/opt/config/codestream-services-config.json
ENV NODE_PATH=/opt/api/codestream-server/api_server/node_modules
ENV CS_API_LOGS=/opt/api/codestream-server/log
ENV CS_API_TMP=/opt/api/codestream-server/tmp

CMD [ "/opt/api/codestream-server/api_server/bin/cs_api-start-docker" ]
