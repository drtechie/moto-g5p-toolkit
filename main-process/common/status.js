const ipc = require('electron').ipcMain
const adbTools = require('../common/adb')
const fastbootTools = require('../common/fastboot')
const usb = require('electron-usb')

exports.setStatus = (deviceID, connection, labelColor) => {
  global.mainWindow.webContents.send('statusDeviceID', deviceID)
  global.mainWindow.webContents.send('statusConnection', connection)
  global.mainWindow.webContents.send('statusLabelColorChange', labelColor)
}

exports.setDevice = (deviceID, connection) => {
  global.deviceID = deviceID
  global.connection = connection
}

/**
 *  Check if a Moto is connected.
 *  ADB > Fastboot > Recovery
 * */
exports.checkStatus = () => {
  this.setStatus('Checking...', 'No Connection', 'blue')
  adbTools.getMoto().then(() => {
    let label
    if (global.connection === global.strings.adbUnauthorized ||
      global.connection === global.strings.adbOffline ||
      global.connection === global.strings.adbNoPermissions ) {
      label = 'red'
    } else if (global.connection === global.strings.recovery) {
      label = 'orange'
    } else {
      label = 'green'
    }
    this.setStatus(global.deviceID, global.connection, label)
  }).catch(() => {
    fastbootTools.getMoto().then(() => {
      this.setStatus(global.deviceID, global.connection, 'yellow')
    }).catch((error) => {
      if (error === global.strings.fastbootNoPermissions) {
        this.setStatus('???????', global.strings.fastbootNoPermissions, 'red')
      } else {
        this.setStatus(global.strings.noDevice, global.strings.noConnection, 'red')
      }
    })
  })
}

/**
 *  Detect USB attach and detach events.
 *  Check whether a Moto is connected.
 *  Try 5 times because cancelling
 * */
exports.listenUSB = () => {
  usb.on('attach', () => {
    let count = 0
    let intervalObject = setInterval(() => {
      count++
      this.checkStatus()
      if (global.deviceID) {
        clearInterval(intervalObject)
      }
      if (count > 5) {
        this.checkStatus()
        clearInterval(intervalObject)
      }
    }, 1500)
  })
  usb.on('detach', () => { this.checkStatus() })
}

/**
*  On detecting event from renderer process
* */
ipc.on('check-status', () => {
  this.checkStatus()
})
