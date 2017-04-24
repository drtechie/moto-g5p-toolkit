const ipc = require('electron').ipcMain
const adbTools = require('../common/adb')

ipc.on('reboot-to-bootloader', function (event, arg) {
  const sendReply = (data) => {
    event.sender.send('reboot-to-bootloader-button-reply', data)
  }
  event.sender.send('reboot-to-bootloader-button-reply', 'Sending command via ADB')
  adbTools.execute('reboot bootloader', sendReply)
})
