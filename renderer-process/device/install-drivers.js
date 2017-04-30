const ipc = require('electron').ipcRenderer
const $ = require('jquery')
const thirtyTwoBitDriver = $('#32bit-driver-button')
const sixtyFourBitDriver = $('#64bit-driver-button')

thirtyTwoBitDriver.on('click', function (event) {
  event.preventDefault()
  ipc.send('install-32bit-driver', null)
})

sixtyFourBitDriver.on('click', function (event) {
  event.preventDefault()
  ipc.send('install-64bit-driver', null)
})
