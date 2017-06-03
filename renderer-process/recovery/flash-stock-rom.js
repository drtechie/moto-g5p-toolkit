const ipc = require('electron').ipcRenderer
const $ = require('jquery')
const flashStockROMButton = $('#flash-stock-rom-button')

flashStockROMButton.on('click', function (event) {
  event.preventDefault()
  ipc.send('flash-stock-rom', null)
})

ipc.on('flash-stock-rom-button-reply', function (event, arg) {
  $('#flash-stock-rom-button-reply').html(arg)
})

ipc.on('flash-stock-rom-logs', function (event, arg) {
  $('#flash-stock-rom-logs').append(`<br/>${arg}`)
})
