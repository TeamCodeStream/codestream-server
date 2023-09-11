FROM cf-registry.nr-ops.net/nd-ma/base-node:16

RUN mkdir /opt/config
WORKDIR /opt/api
RUN mkdir log tmp pid

WORKDIR /opt/api/codestream-server
ADD api_server/config /opt/api/codestream-server/api_server/config
ADD api_server/lib /opt/api/codestream-server/api_server/lib
ADD api_server/modules /opt/api/codestream-server/api_server/modules
ADD shared /opt/api/codestream-server/shared
ADD api_server/etc/webmail_companies.js /opt/api/codestream-server/api_server/etc/webmail_companies.js
ADD api_server/etc/capabilities.js /opt/api/codestream-server/api_server/etc/capabilities.js
ADD api_server/etc/version_matrix.json /opt/api/codestream-server/api_server/etc/version_matrix.json
ADD api_server/etc/configs /opt/api/codestream-server/api_server/etc/configs
ADD api_server/bin/cs_api-start-docker /opt/api/codestream-server/api_server/bin/cs_api-start-docker
ADD api_server/bin/*.js /opt/api/codestream-server/api_server/bin/
ADD api_server/package.json /opt/api/codestream-server/api_server/package.json
ADD api_server/package-lock.json /opt/api/codestream-server/api_server/package-lock.json
ADD codestream-docker.json /opt/config/codestream-services-config.json
ADD certs/localhost.codestream.* /opt/api/codestream-server/api_server/etc/certs/

WORKDIR /opt/api/codestream-server/api_server
RUN npm install --no-save

EXPOSE 8443

RUN chmod +700 /opt/api/codestream-server/api_server/etc/certs && \
    chmod +700 /opt/api/codestream-server/api_server/etc/certs/* && \
    chmod +777 /opt/config && \
    chmod +777 /opt/api/log && \
    chmod +777 /opt/config/codestream-services-config.json

ENV CSSVC_BACKEND_ROOT=/opt/api/codestream-server
ENV CSSVC_CFG_FILE=/opt/config/codestream-services-config.json
ENV CS_API_PORT=8443
#ENV CSSVC_CFG_URL=mongodb://host/codestream
ENV NODE_PATH=/opt/api/codestream-server/api_server/node_modules
ENV CS_API_TOP=/opt/api/codestream-server/api_server
ENV CS_API_LOGS=/opt/api/log
ENV CS_API_TMP=/opt/api/tmp
ENV CS_API_ASSET_ENV=docker
ENV CS_API_SANDBOX=/opt/api
ENV SSL_CA_FILE=/opt/api/codestream-server/api_server/etc/certs/localhost.codestream.us.csr
ENV SSL_CERT_FILE=/opt/api/codestream-server/api_server/etc/certs/localhost.codestream.us.crt
ENV SSL_KEY_FILE=/opt/api/codestream-server/api_server/etc/certs/localhost.codestream.us.key

CMD [ "/opt/api/codestream-server/api_server/bin/cs_api-start-docker" ]
