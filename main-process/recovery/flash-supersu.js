const ipc = require('electron').ipcMain
const adbTools = require('../common/adb')

ipc.on('flash-supersu', function (event, arg) {
  event.sender.send('flash-supersu-button-reply', 'Preparing...')
  adbTools.startFlashSuperSU().then((data) => {
    event.sender.send('flash-supersu-button-reply', data)
    event.sender.send('flash-supersu-done', null)
  }).catch((error) => {
    event.sender.send('flash-supersu-button-reply', error)
  })
})
