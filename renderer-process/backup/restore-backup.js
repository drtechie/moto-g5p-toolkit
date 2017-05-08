const ipc = require('electron').ipcRenderer
const $ = require('jquery')
const restoreAndroidBackup = $('#android-backup-restore-button')
const restoreNANDroidBackup = $('#nandroid-backup-restore-button')
const checkNANDroidBackup = $('#nandroid-backup-check-button')
const chooseNANDroidBackup = $('#nandroid-backup-choose-button')

restoreAndroidBackup.on('click', function (event) {
  event.preventDefault()
  ipc.send('restore-android-backup', null)
})

ipc.on('android-backup-restore-button-reply', function (event, arg) {
  $('#android-backup-restore-button-reply').html(arg)
})

restoreNANDroidBackup.on('click', function (event) {
  event.preventDefault()
  let folder = $('#restore-nandroid-folder').val()
  let data = {
    folder: folder,
    system: $('#restore-partition-system').checkbox('is checked'),
    boot: $('#restore-partition-boot').checkbox('is checked'),
    data: $('#restore-partition-data').checkbox('is checked'),
    cache: $('#restore-partition-cache').checkbox('is checked')
  }
  ipc.send('restore-nandroid-backup', data)
})

ipc.on('nandroid-backup-restore-button-reply', function (event, arg) {
  $('#nandroid-backup-restore-button-reply').html(arg)
})

checkNANDroidBackup.on('click', function (event) {
  event.preventDefault()
  ipc.send('check-nandroid-backup', null)
})

ipc.on('nandroid-backup-check-button-reply', function (event, arg) {
  $('#nandroid-backup-check-button-reply').html(arg)
})

ipc.on('nandroid-backup-options', function (event, arg) {
  $('#nandroid-available-backups').removeClass('hidden')
  $('#nandroid-backup-names').html(arg)
})

ipc.on('nandroid-partitions-available', function (event, arg) {
  $('#available-partitions').removeClass('hidden')
  $('#nandroid-backup-dropdown').removeClass('loading')
  if (arg.system) {
    $('#restore-partition-system')
      .removeClass('disabled')
      .find('input').attr('disabled', false)
      .checkbox('uncheck')
  }
  if (arg.data) {
    $('#restore-partition-data')
      .removeClass('disabled')
      .find('input').attr('disabled', false)
  }
  if (arg.cache) {
    $('#restore-partition-cache')
      .removeClass('disabled').find('input')
      .attr('disabled', false)
  }
  if (arg.boot) {
    $('#restore-partition-boot')
      .removeClass('disabled').find('input')
      .attr('disabled', false)
  }
})

chooseNANDroidBackup.on('click', function (event) {
  event.preventDefault()
  ipc.send('choose-and-restore-nandroid-backup', null)
})
