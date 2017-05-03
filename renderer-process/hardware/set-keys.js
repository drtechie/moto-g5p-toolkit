const ipc = require('electron').ipcRenderer

const mriSyncBtn = document.getElementById('sync-set-button')
const syncKey = document.getElementById('sync-key')

const responseBtn = document.getElementById('response-set-button')
const responseCorrectKey = document.getElementById('response-correct')
const responseWrongKey = document.getElementById('response-wrong')

// For Sync button
mriSyncBtn.addEventListener('click', function (event) {
  event.preventDefault()
  let syncValue = syncKey.value
  ipc.send('set-new-sync', syncValue)
})
ipc.on('sync-set-reply', function (event, arg) {
  document.getElementById('sync-set-reply').innerHTML = arg
})
ipc.on('set-sync-key', function (event, arg) {
  syncKey.value = arg
})

responseBtn.addEventListener('click', function (event) {
  event.preventDefault()
  let correctValue = responseCorrectKey.value
  let wrongValue = responseWrongKey.value
  let arg = [['response-correct', correctValue],['response-wrong',wrongValue]]
  ipc.send('set-new-response', arg)
})
ipc.on('response-set-reply', function (event, arg) {
  document.getElementById('response-set-reply').innerHTML = arg
})
ipc.on('set-response-keys', function (event, arg) {
  for (var response of arg) {
    document.getElementById(response.type).value = response.value
  }
})

if (navigator.onLine) {
  ipc.send('app-online')
}