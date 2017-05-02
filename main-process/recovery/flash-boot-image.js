const ipc = require('electron').ipcMain
const fastbootTools = require('../common/fastboot')

ipc.on('flash-boot-image', function (event, arg) {
  event.sender.send('flash-boot-image-button-reply', 'Preparing...')
  fastbootTools.startFlashBootImage().then((data) => {
    event.sender.send('flash-boot-image-button-reply', data)
    event.sender.send('flash-boot-image-done', null)
  }).catch((error) => {
    event.sender.send('flash-boot-image-button-reply', error)
  })
})
