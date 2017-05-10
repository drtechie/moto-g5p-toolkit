const ipc = require('electron').ipcMain
const child = require('child_process').exec
const files = require('../common/files')
const isRunningInAsar = require('electron-is-running-in-asar')

ipc.on('install-32bit-driver', () => {
  let file = files.get32BitDriver()
  this.executeFile(file)
})

ipc.on('install-64bit-driver', () => {
  let file = files.get64BitDriver()
  this.executeFile(file)
})

exports.executeFile = (file) => {
  if (isRunningInAsar()) {
    file = file.replace('app.asar', 'app.asar.unpacked')
  }
  child('"' + file + '"')
}
