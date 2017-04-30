const ipc = require('electron').ipcMain
const fastbootTools = require('../common/fastboot')

ipc.on('extract-unlock-data', function (event, arg) {
  const sendData = (data) => {
    event.sender.send('got-unlock-data', data)
  }
  event.sender.send('extract-unlock-data-button-reply', 'Extracting')
  fastbootTools.startUnlockDataExtract().then((data) => {
    sendData(data)
  }).catch((error) => {
    event.sender.send('extract-unlock-data-button-reply', error)
  })
})
