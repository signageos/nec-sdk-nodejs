#!/bin/sh

set -e

ROOTFS_DIR=rootfs
CACHE_DIR=`pwd`/cache # must be absolute path

if [ -z "$TARGET" ]; then
    echo "TARGET must be specified"
    exit 1
fi

if [ -z "$ARCHITECTURE" ]; then
    echo "ARCHITECTURE must be specified"
    exit 1
fi

if [ -z "$VERSION" ]; then
    echo "VERSION must be specified"
    exit 1
fi

overlay_path=$1
cache_path=$2

if [ -z "$overlay_path" ] || [ -z "$cache_path" ]; then
    echo "usage: $0 <overlay_path> <cache_path>"
    exit 1
fi

enable_service() {
    local service=$1
    local runlevel=$2
    ln -s /etc/init.d/$service $ROOTFS_DIR/etc/runlevels/$runlevel/$service
}

disable_service() {
    local service=$1
    local runlevel=$2
    rm -f $ROOTFS_DIR/etc/runlevels/$runlevel/$service
}

create_runlevel() {
    local runlevel=$1
    install -d $ROOTFS_DIR/etc/runlevels/$runlevel
}

apkargs="--arch $ARCHITECTURE --root $ROOTFS_DIR"
apkaddargs="--repository `pwd`/apks --no-scripts"

# base
rm -rf $ROOTFS_DIR $CACHE_DIR
mkdir $ROOTFS_DIR $CACHE_DIR
apk add $apkargs $apkaddargs\
    --keys-dir `pwd`/etc/apk/keys \
    --initdb \
    alpine-base openssl tzdata chrony openssh
cp -r etc/apk/* $ROOTFS_DIR/etc/apk
ROOT=$ROOTFS_DIR setup-hostname sos
ROOT=$ROOTFS_DIR setup-timezone -i -z UTC
ROOT=$ROOTFS_DIR setup-lbu mmcblk0p1
ROOT=$ROOTFS_DIR setup-apkcache $CACHE_DIR
apk update $apkargs
apk add $apkargs $apkaddargs eudev

# configure services
disable_service hwdrivers sysinit
disable_service mdev sysinit
disable_service swclock boot
enable_service devfs sysinit
enable_service dmesg sysinit
enable_service modloop sysinit
enable_service udev-trigger sysinit
enable_service udev sysinit
enable_service bootmisc boot
enable_service hostname boot
enable_service networking boot
enable_service modules boot
enable_service sysctl boot
enable_service syslog boot
enable_service urandom boot
enable_service chronyd default
enable_service sshd default
enable_service udev-postmount default
enable_service killprocs shutdown
enable_service mount-ro shutdown
enable_service savecache shutdown

# ssh server
ssh-keygen -A -f $ROOTFS_DIR
echo 'PermitRootLogin no' >> $ROOTFS_DIR/etc/ssh/sshd_config
echo 'PasswordAuthentication no' >> $ROOTFS_DIR/etc/ssh/sshd_config
echo 'AllowUsers debug' >> $ROOTFS_DIR/etc/ssh/sshd_config

# install signageos packages
apk add $apkargs --no-scripts signageos-$TARGET=$VERSION

# create custom runlevels
create_runlevel app_upgrade
create_runlevel factory_reset
create_runlevel overwrite_system

# configure signageos services
enable_service settermblank sysinit
enable_service signageos-clock boot
enable_service signageos-firstboot default
enable_service signageos-usbmountall default
enable_service crond default
enable_service signageos-appupgrade app_upgrade
enable_service signageos-factoryreset factory_reset
enable_service signageos-overwritesystem overwrite_system
enable_service loader boot
enable_service loader app_upgrade
enable_service loader factory_reset
enable_service loader overwrite_system

# copy custom etc files
cp -rT etc $ROOTFS_DIR/etc

# Change cache symlink from local path to how it has to be in production.
# During the whole build process we have to use a local cache dir because all the operations generate some content there.
# We inject that content later inside the disk image.
# Once the build process is done, we have to manually change the symlink from a local dir to the path used on an actual device.
# Otherwise it wouldn't know where to read the cache from.
rm $ROOTFS_DIR/etc/apk/cache
ln -s /media/mmcblk0p1/cache $ROOTFS_DIR/etc/apk/cache

# pack overlay files
ROOT=$ROOTFS_DIR lbu package $overlay_path

# pack cache
tar -czf $cache_path cache
