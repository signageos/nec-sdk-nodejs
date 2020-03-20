# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- Video API acceptance tests
- When acceptance tests are running, mute applet so it doesn't conflict with the tests
- getTimers method in management API
- Support get/set system time, both manual and via NTP server
- Support PIP (only fullscreen)
- Support proximity sensor on NEC displays (there it's called "human sensor")
- Support reset NEC display settings as means of recovery from breaking external changes
- Internal client-server communication re-implemented using websocket instead of HTTP requests
- Manage compute module fan based on cpu temperature in NEC displays
- Support Network set manual & DHCP
- Support open browser window with an optional whitelist/blacklist of domains
- Handle deprovisioning directly on device
- New capability to get information about connected monitors
- Management get application version in front-applet `sos.management.app.getVersion()`
- Optional videoThumbnailUriTemplate in file properties
- File system methods copyFile and moveFile allow to optionally overwrite destination path
- FILE_SYSTEM_LINK capability

### Fixed
- Casually not loading of applet after restart app
- Better user information durring register, verify process (including offline page)
- Couldn't stop server because several child processes wouldn't close properly
- Proper processing of remote key presses; no more weird delays, ignored key presses in fast succession, etc.
- Didn't report it's current firmware version
- Fixed crash when trying to stop same stream multiple times 
- Test Framework now handles errors properly
- Ping period issue for open and platform
- Device Audio test fixed
- Device test framework malfunctions and misbehaving fixed
- Applet commands to device (timing commands) for Open builds
- sandbox embedded browser to prevent hostile JS within iframe affecting parent document
- First start of display when the applet is bundled inside app (Open)
- Open app installed to deprovisioned device
- Bug when collecting temperature and battery status on startup (critical when native methods throws error after boot)
- Longer deprovisioning timeout before reboot to give the display enough time to delete all cached data and files
- Use smaller resolution videos in acceptance tests that play multiple videos side by side because some platforms struggle to process more than one full HD video at a time

### Changed
- Updated setting of device DateTime according to changed interface
- Moved `getNetworkInfo()` as `network.getActiveInfo()`

### Deprecated
- Open browser in front-applet via method `sos.browser.openLink()`. Replaced by `sos.browser.open()`.

## [0.4.0] - 2019-06-10
### Added
- File System API supports copyFile, writeFile
- Applet DISABLE/ENABLE power actions
- Node.js servlets - scripts or services that can be pushed to the device from the server and run in the background, extending device's capabilities with custom logic, as long as the device supports it
- Support for controlling NEC display settings (brightness, volume, schedule, etc.) through internal RS232 communication when Raspberry Pi is a built-in compute module
- It's possible now to configure the application build to use a local applet file instead of getting applet timings from the cloud
- signageOS Open - build with an applet bundled inside the package and make the device automatically verify against the owner's organization on the server
- Always save applet and front applet binaries to internal memory to improve performance and stability

### Fixed
- If device took many screenshots that failed to upload, they wouldn't cleanup but stay in RAM until device ran of out RAM and crashed
- Invocations from front-applet has much better & descriptive error messages with links to docs
- Switching between multiple applet timings would freeze the second applet 

## [0.3.2] - 2019-03-22
### Fixed
- Accidently not changing orientation on management request
- Crashing when downloading large files
- Videos and other content now stop on application restart
- Set screen orientation sometimes didn't take effect

## [0.3.0] - 2019-01-23
### Added
- Support CEC (Consumer Electronics Control, i.e. remote control over HDMI)
- Support USB external storage
- Restart frontend if it stops responding
- Restart application won't reload the page anymore, instead it will restart whole frontend to force purge all browser cache
- Notify when storage units change
- Get extended file details (mime type, video duration)
- Support WiFi
- OSD
- Support setting volume
### Fixed
- Uploading screenshots
- When there are multiple requests to download a file, allow only one at a time to prevent running out of RAM
- Stop video doesn't throw error anymore if the video wasn't playing, only logs a warning
- Fixed video coordinates when not fullscreen
- Fixed video prepare/play returning a promise that never resolves at certain situations
- Fixed memory leaks when playing a single video in a loop

## [0.2.0] - 2018-12-14
### Added
- Update front display to version 5
- New improved file system management
- Out-of-the-box handling of overlay HTML elements

## [0.1.0] - 2018-11-21
### Added
- First version with all important functions implemented
