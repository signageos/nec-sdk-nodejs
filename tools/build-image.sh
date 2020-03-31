#!/bin/sh

set -e

PARTITION_SIZE_MB=512

if [ -z "$TARGET" ]; then
    echo "TARGET must be specified"
    exit 1
fi

arch=$1
version=$2
apks_archive=$3
output_file=$4

if [ -z "$arch" ] || [ -z "$version" ] || [ -z "$apks_archive" ] || [ -z "$output_file" ]; then
    echo "Usage: $0 <arch> <version> <apks_archive> <output_file>"
    exit 1
fi

generate_empty_image_file() {
    local outfile=$1
    local block_size=512
    local first_sector=2048
    local partition_size_bytes=$(( 1024 * 1024 * $PARTITION_SIZE_MB ))
    local partition_size_sectors=$(( $partition_size_bytes / $block_size ))
    local total_sectors=$(( $first_sector + $partition_size_sectors ))
    dd if=/dev/zero of=$outfile bs=$block_size count=$total_sectors
}

partition_image() {
    local imagefile=$1
    echo "n
        p
        1


        t
        e
        a

        w
    " | fdisk $imagefile
}

format_boot_partition() {
    local imagefile=$1
    sudo losetup --partscan --show --find $imagefile
    sudo mkfs.vfat -F 16 /dev/loop0p1
}

mount_boot_partition() {
    mkdir -p mnt
    sudo mount -o loop,uid=`whoami`,gid=`whoami` /dev/loop0p1 mnt
}

copy_files_to_boot_partition() {
    cp -rT "boot/$TARGET" mnt
    cp sos.apkovl.tar.gz mnt
    docker save wpewebkit:2.26.4 -o mnt/wpewebkit.2.26.4.tar.gz
    tar -xzf cache.tar.gz -C mnt
    tar -xzf $apks_archive -C mnt
    echo "$version" > mnt/sos_version
}

umount_boot_partition() {
    sudo umount mnt
    rmdir mnt
    sudo losetup -d /dev/loop0
}

tmp_file=.tmp_alpine.img
generate_empty_image_file $tmp_file
partition_image $tmp_file
format_boot_partition $tmp_file
mount_boot_partition
copy_files_to_boot_partition
umount_boot_partition

mv $tmp_file $output_file
