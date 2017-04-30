const ipc = require('electron').ipcRenderer
const $ = require('jquery')
const unlockBootloaderUniqueKey = $('#unlock-bootloader-unique-key')
const unlockBootloader = $('#unlock-bootloader-button')

unlockBootloader.on('click', function (event) {
  event.preventDefault()
  ipc.send('unlock-bootloader', unlockBootloaderUniqueKey.val())
})

ipc.on('unlock-bootloader-button-reply', function (event, arg) {
  $('#unlock-bootloader-button-reply').html(arg)
})
