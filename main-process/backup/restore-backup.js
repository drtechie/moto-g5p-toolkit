const ipc = require('electron').ipcMain
const dialog = require('electron').dialog
const adbTools = require('../common/adb')
const _ = require('lodash')

ipc.on('check-nandroid-backup', function (event) {
  event.sender.send('nandroid-backup-check-button-reply', 'Checking...')
  adbTools.checkTWRPBackups().then((data) => {
    let backups
    if (process.platform === 'linux' || process.platform === 'darwin') {
      backups = _.split(data, '\n')
    } else if (process.platform === 'win32') {
      backups = _.split(data, '\r\n')
    }
    backups = _.compact(backups)
    let backupOptions = ''
    backups.forEach((value, index) => {
      backupOptions += `<div class='item' data-value='${value}'>${value}</div>`
    })
    event.sender.send('nandroid-backup-options', backupOptions)
    event.sender.send('nandroid-backup-check-button-reply', 'Done')
  }).catch((error) => {
    event.sender.send('nandroid-backup-check-button-reply', error)
  })
})

ipc.on('check-partitions', function (event, arg) {
  adbTools.checkTWRPPartitions(arg).then((data) => {
    let partitions = {
      system: _.includes(data, 'system'),
      boot: _.includes(data, 'boot'),
      data: _.includes(data, 'data'),
      cache: _.includes(data, 'cache')
    }
    event.sender.send('nandroid-partitions-available', partitions)
  }).catch((error) => {
    //
  })
})


ipc.on('restore-nandroid-backup', function (event, arg) {
  event.sender.send('nandroid-backup-restore-button-reply', 'Your device will be restored')
  adbTools.restoreNANDroidBackup(arg).then((data) => {
    event.sender.send('nandroid-backup-restore-button-reply', data)
  }).catch((error) => {
    event.sender.send('nandroid-backup-restore-button-reply', error)
  })
})
