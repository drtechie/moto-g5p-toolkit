const ipc = require('electron').ipcRenderer
const $ = require('jquery')
const flashTWRPButton = $('#flash-twrp-button')

flashTWRPButton.on('click', function (event) {
  event.preventDefault()
  ipc.send('flash-twrp', null)
})

ipc.on('flash-twrp-button-reply', function (event, arg) {
  $('#flash-twrp-button-reply').html(arg)
})

ipc.on('flash-twrp-done', function (event, arg) {
  $('#flash-twrp-button-reply').html('Done')
})
