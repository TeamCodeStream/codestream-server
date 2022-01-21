
FROM node:16.13.2

# This directory will be mounted from the host OS
RUN mkdir /opt/config
WORKDIR /opt/broadcaster
RUN mkdir log tmp pid

WORKDIR /opt/broadcaster/codestream-server
ADD broadcaster/lib /opt/broadcaster/codestream-server/broadcaster/lib
ADD shared /opt/broadcaster/codestream-server/shared
ADD broadcaster/bin/broadcaster.js /opt/broadcaster/codestream-server/broadcaster/bin/broadcaster.js
ADD broadcaster/*.js broadcaster/*.json broadcaster/*.info /opt/broadcaster/codestream-server/broadcaster/

WORKDIR /opt/broadcaster/codestream-server/broadcaster
RUN npm install --no-save

EXPOSE 12080/tcp
EXPOSE 12443/tcp

ENV CSSVC_BACKEND_ROOT=/opt/broadcaster/codestream-server
ENV CSSVC_CFG_FILE=/opt/config/codestream-services-config.json
ENV NODE_PATH=/opt/broadcaster/codestream-server/broadcaster/node_modules
ENV CS_BROADCASTER_TOP=/opt/broadcaster/codestream-server/broadcaster
ENV CS_BROADCASTER_LOGS=/opt/broadcaster/log

CMD [ "/opt/broadcaster/codestream-server/broadcaster/bin/broadcaster.js" ]
