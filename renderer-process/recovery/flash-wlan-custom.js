const ipc = require('electron').ipcRenderer
const $ = require('jquery')
const flashWlanCustomButton = $('#flash-wlan-custom-button')

flashWlanCustomButton.on('click', function (event) {
  event.preventDefault()
  ipc.send('flash-wlan-custom', null)
})

ipc.on('flash-wlan-custom-button-reply', function (event, arg) {
  $('#flash-wlan-custom-button-reply').html(arg)
})

ipc.on('flash-wlan-custom-done', function (event, arg) {
  $('#flash-wlan-custom-button-reply').html('Done')
})
