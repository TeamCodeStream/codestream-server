
FROM node:10.15.3

ADD config /opt/api/api_server/config
ADD lib /opt/api/api_server/lib
ADD modules /opt/api/api_server/modules
ADD server_utils /opt/api/api_server/server_utils
ADD codestream-configs /opt/api/api_server/codestream-configs
ADD etc/webmail_companies.js /opt/api/api_server/etc/webmail_companies.js
ADD etc/capabilities.js /opt/api/api_server/etc/capabilities.js
ADD bin/api_server.js /opt/api/api_server/bin/api_server.js
ADD bin/cs_api-start-docker /opt/api/api_server/bin/cs_api-start-docker
ADD bin/ensure-indexes.js /opt/api/api_server/bin/ensure-indexes.js
ADD package.json /opt/api/api_server/package.json
ADD package-lock.json /opt/api/api_server/package-lock.json

# This directory will be mounted from the host OS
RUN mkdir /opt/config

WORKDIR /opt/api
RUN mkdir log tmp pid

WORKDIR /opt/api/api_server
RUN npm install --no-save

EXPOSE 443

ENV CS_API_TOP=/opt/api/api_server
ENV CSSVC_CFG_FILE=/opt/config/codestream-services-config.json
# ENV CS_API_SHOW_CFG=1

CMD [ "/opt/api/api_server/bin/cs_api-start-docker" ]
