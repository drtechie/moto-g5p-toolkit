const ipc = require('electron').ipcMain
const child = require('child_process').exec
const files = require('../common/files')

ipc.on('install-32bit-driver', function (event, arg) {
  child(files.get32BitDriver())
})

ipc.on('install-64bit-driver', function (event, arg) {
  child(files.get64BitDriver())
})
