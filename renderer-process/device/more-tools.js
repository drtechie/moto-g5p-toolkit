const ipc = require('electron').ipcRenderer
const $ = require('jquery')
const adbRebootBootloader = $('#reboot-to-bootloader-button')
const adbRebootRecovery = $('#reboot-to-recovery-button')
const adbReboot = $('#reboot-system-button')
const fbRebootBootloader = $('#reboot-to-bootloader-fb-button')
const fbReboot = $('#reboot-backup-fb-button')

adbRebootBootloader.on('click', function (event) {
  event.preventDefault()
  ipc.send('reboot-to-bootloader', null)
})
ipc.on('reboot-to-bootloader-button-reply', function (event, arg) {
  document.getElementById('reboot-to-bootloader-button-reply').innerHTML = arg
})

adbRebootRecovery.on('click', function (event) {
  event.preventDefault()
  ipc.send('reboot-to-recovery', null)
})
ipc.on('reboot-to-recovery-button-reply', function (event, arg) {
  document.getElementById('reboot-to-recovery-button-reply').innerHTML = arg
})

adbReboot.on('click', function (event) {
  event.preventDefault()
  ipc.send('reboot-system', null)
})
ipc.on('reboot-system-button-reply', function (event, arg) {
  document.getElementById('reboot-system-button-reply').innerHTML = arg
})

fbRebootBootloader.on('click', function (event) {
  event.preventDefault()
  ipc.send('reboot-to-bootloader-fb', null)
})
ipc.on('reboot-to-bootloader-fb-button-reply', function (event, arg) {
  document.getElementById('reboot-to-bootloader-fb-button-reply').innerHTML = arg
})

fbReboot.on('click', function (event) {
  event.preventDefault()
  ipc.send('reboot-backup-fb', null)
})
ipc.on('reboot-backup-fb-button-reply', function (event, arg) {
  document.getElementById('reboot-backup-fb-button-reply').innerHTML = arg
})
