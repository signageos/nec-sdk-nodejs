#!/usr/bin/env sh

set -e

prebuild_target() {
    local target=$1
    cd "dist/$target"
    tar -xzf "signageos-$target.tar.gz"
    cd -
}

prebuild_target rpi
