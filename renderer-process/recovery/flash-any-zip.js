const ipc = require('electron').ipcRenderer
const $ = require('jquery')
const flashAnyZIPButton = $('#flash-any-zip-button')

flashAnyZIPButton.on('click', function (event) {
  event.preventDefault()
  ipc.send('flash-any-zip', null)
})

ipc.on('flash-any-zip-button-reply', function (event, arg) {
  $('#flash-any-zip-button-reply').html(arg)
})
