const ipc = require('electron').ipcMain
const dialog = require('electron').dialog
const adbTools = require('../common/adb')

ipc.on('create-android-backup', function (event) {
  const options = {
    title: 'Save Android Backup',
    filters: [
      { name: 'Android Backup', extensions: ['ab'] }
    ]
  }
  dialog.showSaveDialog(options, (filename) => {
    event.sender.send('android-backup-create-button-reply', 'Confirm backup operation on your device')
    adbTools.createAndroidBackup(filename).then((data) => {
      event.sender.send('android-backup-create-button-reply', data)
    }).catch((error) => {
      event.sender.send('android-backup-create-button-reply', error)
    })
  })
})

ipc.on('create-nandroid-backup', function (event, arg) {
  const options = {
    title: 'Save Android Backup',
    filters: [
      { name: 'Android Backup', extensions: ['ab'] }
    ]
  }
  const doBackup = (filename) => {
    event.sender.send('nandroid-backup-create-button-reply', 'Your device will be backed up')
    adbTools.createNANDroidBackup(filename, arg).then((data) => {
      event.sender.send('nandroid-backup-create-button-reply', data)
    }).catch((error) => {
      event.sender.send('nandroid-backup-create-button-reply', error)
    })
  }
  if (arg.destination === 'computer') {
    dialog.showSaveDialog(options, (filename) => {
      doBackup(filename)
    })
  } else {
    doBackup(null)
  }
})