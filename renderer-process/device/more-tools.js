const ipc = require('electron').ipcRenderer
const abdRebootBootloader = document.getElementById('reboot-to-bootloader-button')

// For Reboot to Bootloader button
abdRebootBootloader.addEventListener('click', function (event) {
  event.preventDefault()
  ipc.send('reboot-to-bootloader', null)
})
ipc.on('reboot-to-bootloader-button-reply', function (event, arg) {
  console.log(arg)
  document.getElementById('reboot-to-bootloader-button-reply').innerHTML = arg
})
