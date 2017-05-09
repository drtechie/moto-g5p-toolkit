# Moto G5 Plus Toolkit

[![JavaScript Standard Style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](http://standardjs.com)

This is a desktop app that combines the awesomeness of [ES2015](http://babeljs.io/docs/learn-es2015/) and [XDA](https://forum.xda-developers.com/). The app allows you to unlock the bootloader and root a Motorola G5 Plus smartphone with a few button clicks.
It's built with Electron and hence will work on Windows, macOS and Linux operating systems.


## Using

You can [download the latest release](https://github.com/drtechie/moto-gp5-toolkit/releases) for your operating system or build it yourself (see below).

## Building

You'll need [Node.js](https://nodejs.org) installed on your computer in order to build this app.

This project depends on [electron-usb](https://github.com/marcopiraccini/electron-usb)

After installation of NPM dependencies build the same

```bash
$ ./node_modules/.bin/electron-rebuild

# On Windows if you have trouble, try:
.\node_modules\.bin\electron-rebuild.cmd
```

### Extra note - building on Windows

1. Make sure you install all the prerequisite build tools for Windows
Refer Prerequisite section [here](https://electron.atom.io/docs/development/build-instructions-windows/)

2. Set the VisualStudio version
```bash
npm config set msvs_version=2013
```
3. If you encounter  ```'timespec': 'struct' type redefinition``` error
comment out the following lines from header file

```
 struct timespec
    {
        time_t tv_sec;  // Seconds - >= 0
        long   tv_nsec; // Nanoseconds - [0, 999999999]
    };
```

and rebuild again.
