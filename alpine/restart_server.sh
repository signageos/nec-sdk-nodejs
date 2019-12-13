#!/usr/bin/env sh

# restart application
nohup service signageos-display-linux-server restart | /usr/bin/logger -p local0.info &
