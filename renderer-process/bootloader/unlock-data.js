const ipc = require('electron').ipcRenderer
const { clipboard } = require('electron')
const $ = require('jquery')
const extractUnlockData = $('#extract-unlock-data-button')
const copyUnlockData = $('#copy-unlock-data-button')

extractUnlockData.on('click', function (event) {
  event.preventDefault()
  ipc.send('extract-unlock-data', null)
})

ipc.on('extract-unlock-data-button-reply', function (event, arg) {
  $('#extract-unlock-data-button-reply').html(arg)
})

ipc.on('got-unlock-data', function (event, arg) {
  $('#unlock-data').html(arg)
  $('#unlock-data-wrapper').removeClass('hidden')
  $('#extract-unlock-data-button-reply').html('Done')
})

copyUnlockData.on('click', function (event) {
  event.preventDefault()
  clipboard.writeText($('#unlock-data').text())
  $('#copy-unlock-data-button-reply').html('Copied!')
})
