const path = require('path')
const glob = require('glob')
const electron = require('electron')
const { listenUSB } = require('./main-process/common/status')
const adbTools = require('./main-process/common/adb')

const BrowserWindow = electron.BrowserWindow
const app = electron.app

const debug = /--debug/.test(process.argv[2])

global.mainWindow = null
global.db = {}

/**
* Various strings used across the app
* */
global.strings = {}
global.strings.deviceName = 'potter'
global.strings.adb = 'ADB'
global.strings.adbUnauthorized = 'ADB UNAUTHORIZED'
global.strings.adbNoPermissions = 'NO PERMISSIONS'
global.strings.fastbootNoPermissions = 'NO PERMISSIONS'
global.strings.fastboot = 'FASTBOOT'
global.strings.recovery = 'RECOVERY'
global.strings.adbOffline = 'OFFLINE'
global.strings.noDevice = 'NO DEVICE'
global.strings.noConnection = 'NO CONNECTION'

function initialize () {
  let shouldQuit = makeSingleInstance()
  if (shouldQuit) return app.quit()

  loadMainJS()
  function createWindow () {
    let windowOptions = {
      width: 1080,
      minWidth: 680,
      height: 840
    }
    if (process.platform === 'linux') {
      windowOptions.icon = path.join(__dirname, '/assets/app-icon/png/512.png')
    }
    global.mainWindow = new BrowserWindow(windowOptions)
    global.mainWindow.loadURL(path.join('file://', __dirname, '/index.html'))
    // Launch fullscreen with DevTools open, usage: npm run debug
    if (debug) {
      global.mainWindow.webContents.openDevTools()
      global.mainWindow.maximize()
    }
    global.mainWindow.on('closed', function () {
      global.mainWindow = null
    })
    listenUSB()
  }
  app.on('ready', function () {
    createWindow()
  })
  app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
  app.on('activate', function () {
    if (global.mainWindow === null) {
      createWindow()
    }
  })
  app.on('will-quit', function () {
    if (process.platform !== 'win32') {
      adbTools.execute('kill-server', () => {})
    } else {
      adbTools.execute('kill-server')
    }
  })
}

// Make this app a single instance app.
//
// The main window will be restored and focused instead of a second window
// opened when a person attempts to launch a second instance.
//
// Returns true if the current version of the app should quit instead of
// launching.
function makeSingleInstance () {
  return app.makeSingleInstance(function () {
    if (global.mainWindow) {
      if (global.mainWindow.isMinimized()) global.mainWindow.restore()
      global.mainWindow.focus()
    }
  })
}

// Require each JS file in the main-process dir
function loadMainJS () {
  let files = glob.sync(path.join(__dirname, 'main-process/**/*.js'))
  files.forEach(function (file) {
    require(file)
  })
}

initialize()
