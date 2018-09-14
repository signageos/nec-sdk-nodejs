#! /bin/bash

### BEGIN INIT INFO
# Provides:          signageos
# Required-Start:    $local_fs $network $syslog $nginx
# Required-Stop:     $local_fs $network $syslog $nginx
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: SignageOS background service
# Description:       SignageOS background service
### END INIT INFO

NAME=signageos
SOURCEC_DIR=/usr/lib/signageos/server
COMMAND=node
SOURCE_NAME=server.js
USER=signageos
NODE_ENVIRONMENT=production
FS_ROOT=/var/lib/signageos/fs

pidfile=/var/run/$NAME.pid
logfile=/var/log/signageos/$NAME.log
forever=forever


start() {
    echo "Starting $NAME node instance : "

    touch $pidfile
    chown $USER $pidfile

    touch $logfile
    chown $USER $logfile

    sudo -H -u $USER fs_root_path=$FS_ROOT $forever start --pidFile $pidfile -l $logfile -a --sourceDir $SOURCEC_DIR -c $COMMAND $SOURCE_NAME

    RETVAL=$?
}

restart() {
    echo -n "Restarting $NAME node instance : "
    sudo -H -u $USER $forever restart $SOURCE_NAME
    RETVAL=$?
}

status() {
    echo "Status for $NAME:"
    sudo -H -u $USER $forever list
    RETVAL=$?
}

stop() {
    echo -n "Shutting down $NAME node instance : "
    sudo -H -u $USER $forever stop $SOURCE_NAME
}


case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    status)
        status
        ;;
    restart)
        restart
        ;;
    *)
        echo "Usage:  {start|stop|status|restart}"
        exit 1
        ;;
esac
exit $RETVAL