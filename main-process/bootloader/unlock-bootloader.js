const ipc = require('electron').ipcMain
const fastbootTools = require('../common/fastboot')

ipc.on('unlock-bootloader', function (event, arg) {
  event.sender.send('unlock-bootloader-button-reply', 'Preparing...')
  fastbootTools.startUnlockBootloader(arg).then(() => {
    // command must be run twice
    fastbootTools.startUnlockBootloader(arg).then(() => {
      event.sender.send('unlock-bootloader-button-reply', 'Unique key sent!')
    }).catch((error) => {
      event.sender.send('unlock-bootloader-button-reply', error)
    })
  }).catch((error) => {
    event.sender.send('unlock-bootloader-button-reply', error)
  })
})
