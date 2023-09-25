FROM ubuntu:23.10

# Avoid warnings by switching to noninteractive
ENV DEBIAN_FRONTEND=noninteractive

# Configure apt and install packages
RUN apt-get update
RUN apt-get upgrade -y
RUN apt-get -y install --no-install-recommends git gcc vim npm nodejs 
# Clean up
RUN apt-get autoremove -y
RUN apt-get clean -y
# Install pages requirements
RUN npm install --global gulp-cli
