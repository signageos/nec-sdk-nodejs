#!/usr/bin/env bats

ROOT_DIR=$BATS_TEST_DIRNAME/../../../..
PATH=$PATH:$ROOT_DIR/rpi/api

export SIGNAGEOS_PREFIX=$ROOT_DIR/tmp

setup() {
	rm -rf $SIGNAGEOS_PREFIX/etc/wpewebkit
}

teardown() {
	rm -rf $SIGNAGEOS_PREFIX/etc
}

@test "debug on sets the .profile config file of wpewebkit" {
	signageos debug on

	[ $(cat $SIGNAGEOS_PREFIX/etc/wpewebkit/.profile | grep "export WEBKIT_INSPECTOR_SERVER='0.0.0.0:9998'" | wc -l) -eq 1 ]
}

@test "debug off resets the .profile config file of wpewebkit" {
	signageos debug on
	signageos debug off

	[ $(cat $SIGNAGEOS_PREFIX/etc/wpewebkit/.profile | grep "export WEBKIT_INSPECTOR_SERVER=" | wc -l) -eq 0 ]
}

@test "debug on called more times sets the .profile config file of wpewebkit only once" {
	signageos debug on
	signageos debug on
	signageos debug on

	[ $(cat $SIGNAGEOS_PREFIX/etc/wpewebkit/.profile | grep "export WEBKIT_INSPECTOR_SERVER='0.0.0.0:9998'" | wc -l) -eq 1 ]
}

@test "debug off called more times resets the .profile config file of wpewebkit only once" {
	signageos debug on
	signageos debug off
	signageos debug off

	[ $(cat $SIGNAGEOS_PREFIX/etc/wpewebkit/.profile | grep "export WEBKIT_INSPECTOR_SERVER=" | wc -l) -eq 0 ]
}

@test "debug is_enabled returns current state of .profile config file of wpewebkit" {
	result1=$(signageos debug is_enabled)
	[ "$result1" = "0" ]

	signageos debug on

	result2=$(signageos debug is_enabled)
    [ "$result2" = "1" ]

	signageos debug off

	result3=$(signageos debug is_enabled)
    [ "$result3" = "0" ]
}
