# Inbound Email Build Information

TeamCity Project: [inbound_email](http://redirector.codestream.us/builds/inbound_email)  

## GitFlow and Brief Overview
Read the [Build Overview](https://redirector.codestream.us/ops/workflows) page on the Ops Wiki site.

## Assets

| Type | Desc |
| --- | --- |
| info | asset info file |
| tgz | tarball of repo following an **npm install** for x86_64 |
| docker image | docker images are only stored in dockerhub repos |

| Asset Env | Asset | Branch | Location |
| --- | --- | --- | --- |
| dev | tgz | develop | [Asset server (dev/inbound-email)](http://assets.codestream.us/artifacts/dev/inbound-email/) |
| prod | tgz | master | [Asset server (prod/inbound-email)](http://assets.codestream.us/artifacts/prod/inbound-email/) |
| dev | docker image | develop | Published to dockerhub as [teamcodestream/mailin-onprem-dev](https://cloud.docker.com/u/teamcodestream/repository/docker/teamcodestream/mailin-onprem-dev) |
| prod | docker image | master | Published to dockerhub as [teamcodestream/mailin-onprem](https://cloud.docker.com/u/teamcodestream/repository/docker/teamcodestream/mailin-onprem) |

## Build Documentation

[TeamCity build documentation](https://github.com/TeamCodeStream/teamcity_tools/tree/master/docs)
