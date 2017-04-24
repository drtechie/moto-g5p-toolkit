const ipc = require('electron').ipcMain
const adbTools = require('../common/adb')
const fastbootTools = require('../common/fastboot')
const me = this
const usb = require('electron-usb')

exports.setStatus = (deviceid, connection, labelColor) => {
  global.mainWindow.webContents.send('statusDeviceID', deviceid)
  global.mainWindow.webContents.send('statusConnection', connection)
  global.mainWindow.webContents.send('statusLabelColorChange', labelColor)
}

exports.checkStatus = () => {
  this.setStatus('Checking...', 'No Connection', 'blue')
  adbTools.getMoto().done(function (motoADB) {
    if (motoADB) {
      me.setStatus(`ONLINE: ${global.deviceID}`, global.connection, 'green')
    } else {
      fastbootTools.getMoto().done(function (motoFastboot) {
        if (motoFastboot) {
          me.setStatus(`ONLINE: ${global.deviceID}`, global.connection, 'yellow')
        } else {
          me.setStatus('No device', 'No Connection', 'red')
        }
      })
    }
  })
}

exports.listenUSB = () => {
  usb.on('attach', () => {
    let count = 0
    let intervalObject = setInterval(function () {
      count++
      me.checkStatus()
      if (global.deviceID) {
        clearInterval(intervalObject)
      }
      if (count > 5) {
        me.checkStatus()
        clearInterval(intervalObject)
      }
    }, 1500)
  })
  usb.on('detach', () => { this.checkStatus() })
}

ipc.on('check-status', function () {
  me.checkStatus()
})
