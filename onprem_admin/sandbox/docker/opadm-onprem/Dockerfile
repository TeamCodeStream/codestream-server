
FROM node:12.14.1

# This directory will be mounted from the host OS
RUN mkdir /opt/config
WORKDIR /opt/opadm
RUN mkdir log tmp pid

WORKDIR /opt/opadm/codestream-server
ADD shared /opt/opadm/codestream-server/shared
ADD onprem_admin/api /opt/opadm/codestream-server/onprem_admin/api
ADD onprem_admin/config /opt/opadm/codestream-server/onprem_admin/config
ADD onprem_admin/lib /opt/opadm/codestream-server/onprem_admin/lib
ADD onprem_admin/public /opt/opadm/codestream-server/onprem_admin/public
ADD onprem_admin/src /opt/opadm/codestream-server/onprem_admin/src
ADD onprem_admin/views /opt/opadm/codestream-server/onprem_admin/views
ADD onprem_admin/*.json /opt/opadm/codestream-server/onprem_admin/
ADD onprem_admin/*.js /opt/opadm/codestream-server/onprem_admin/
ADD onprem_admin/*.md /opt/opadm/codestream-server/onprem_admin/
ADD onprem_admin/bin/admin_server.js /opt/opadm/codestream-server/onprem_admin/bin/admin_server.js
ADD onprem_admin/bin/opadm-start-docker /opt/opadm/codestream-server/onprem_admin/bin/opadm-start-docker
ADD dockerImage.json /opt/opadm/codestream-server/dockerImage.json

WORKDIR /opt/opadm/codestream-server/onprem_admin
RUN npm install --no-save
RUN npm run cibuild
RUN touch .DOCKER-CONTAINER

EXPOSE 8080/tcp
EXPOSE 8443/tcp

ENV CSSVC_BACKEND_ROOT=/opt/opadm/codestream-server
# ENV CSSVC_CFG_FILE=/opt/config/codestream-services-config.json
ENV NODE_PATH=/opt/opadm/codestream-server/onprem_admin/node_modules
ENV OPADM_TOP=/opt/opadm/codestream-server/onprem_admin
ENV OPADM_LOGS=/opt/opadm/log
ENV OPADM_TMP=/opt/opadm/tmp
ENV OPADM_ASSET_ENV=docker

CMD [ "/opt/opadm/codestream-server/onprem_admin/bin/opadm-start-docker" ]
