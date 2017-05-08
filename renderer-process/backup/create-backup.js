const ipc = require('electron').ipcRenderer
const $ = require('jquery')
const createAndroidBackup = $('#android-backup-create-button')
const createNANDroidBackup = $('#nandroid-backup-create-button')

createAndroidBackup.on('click', function (event) {
  event.preventDefault()
  ipc.send('create-android-backup', null)
})

ipc.on('android-backup-create-button-reply', function (event, arg) {
  $('#android-backup-create-button-reply').html(arg)
})

createNANDroidBackup.on('click', function (event) {
  event.preventDefault()
  let destination
  if ($('#backup-destination-phone').checkbox('is checked')) {
    destination = 'phone'
  } else if ($('#backup-destination-computer').checkbox('is checked')) {
    destination = 'computer'
  }
  let data = {
    destination: destination,
    system: $('#backup-partition-system').checkbox('is checked'),
    boot: $('#backup-partition-boot').checkbox('is checked'),
    data: $('#backup-partition-data').checkbox('is checked'),
    cache: $('#backup-partition-cache').checkbox('is checked'),
    compress: $('#backup-option-compress').checkbox('is checked')
  }
  ipc.send('create-nandroid-backup', data)
})

ipc.on('nandroid-backup-create-button-reply', function (event, arg) {
  $('#nandroid-backup-create-button-reply').html(arg)
})
