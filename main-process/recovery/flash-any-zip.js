const ipc = require('electron').ipcMain
const dialog = require('electron').dialog
const adbTools = require('../common/adb')

ipc.on('flash-any-zip', function (event, arg) {
  const options = {
    title: 'Choose ZIP file',
    filters: [
      { name: 'TWRP ZIP file', extensions: ['zip'] }
    ],
    properties: ['openFile']
  }
  dialog.showOpenDialog(options, (fileName) => {
    if (fileName) {
      event.sender.send('flash-any-zip-button-reply', 'Preparing...')
      adbTools.flashZIPFile(fileName).then((data) => {
        event.sender.send('flash-any-zip-button-reply', data)
      }).catch((error) => {
        event.sender.send('flash-any-zip-button-reply', error)
      })
    }
  })
})