const ipc = require('electron').ipcRenderer
const $ = require('jquery')
const flashSuperSUButton = $('#flash-supersu-button')

flashSuperSUButton.on('click', function (event) {
  event.preventDefault()
  ipc.send('flash-supersu', null)
})

ipc.on('flash-supersu-button-reply', function (event, arg) {
  $('#flash-supersu-button-reply').html(arg)
})

ipc.on('flash-supersu-done', function (event, arg) {
  $('#flash-supersu-info-wrapper').removeClass('hidden')
  $('#flash-supersu-button-reply').html('Done')
})
