const ipc = require('electron').ipcRenderer
const $ = require('jquery')
const flashBootImageButton = $('#flash-boot-image-button')

flashBootImageButton.on('click', function (event) {
  event.preventDefault()
  ipc.send('flash-boot-image', null)
})

ipc.on('flash-boot-image-button-reply', function (event, arg) {
  $('#flash-boot-image-button-reply').html(arg)
})

ipc.on('flash-boot-image-done', function (event, arg) {
  $('#flash-boot-image-button-reply').html('Done')
})
