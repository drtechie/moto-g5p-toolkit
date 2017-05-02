const ipc = require('electron').ipcMain
const fastbootTools = require('../common/fastboot')

ipc.on('flash-twrp', function (event, arg) {
  event.sender.send('flash-twrp-button-reply', 'Preparing...')
  fastbootTools.startFlashTWRP().then((data) => {
    event.sender.send('flash-twrp-button-reply', data)
    event.sender.send('flash-twrp-done', null)
  }).catch((error) => {
    event.sender.send('flash-twrp-button-reply', error)
  })
})
