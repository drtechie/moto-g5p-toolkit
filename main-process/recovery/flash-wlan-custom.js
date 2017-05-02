const ipc = require('electron').ipcMain
const adbTools = require('../common/adb')

ipc.on('flash-wlan-custom', function (event, arg) {
  event.sender.send('flash-wlan-custom-button-reply', 'Preparing...')
  adbTools.startFlashWlanCustom().then((data) => {
    event.sender.send('flash-wlan-custom-button-reply', data)
    event.sender.send('flash-wlan-custom-done', null)
  }).catch((error) => {
    event.sender.send('flash-wlan-custom-button-reply', error)
  })
})
