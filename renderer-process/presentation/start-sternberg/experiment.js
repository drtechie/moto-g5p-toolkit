const ipc = require('electron').ipcRenderer
const path = require('path')

const startSternbergBtn = document.getElementById('start-sternberg')
const clearLogsBtn = document.getElementById('clear-experiment-logs')
const clearResultsBtn = document.getElementById('clear-experiment-results')
let ongoingExp = false

startSternbergBtn.addEventListener('click', function (event) {
  if (ongoingExp) {
    ongoingExp = false
    ipc.send('stop-sternberg')
    startSternbergBtn.innerHTML = 'Start Sternberg Task'
  } else {
    ongoingExp = true
    ipc.send('start-sternberg')
    startSternbergBtn.innerHTML = 'Stop Task'
  }
})
clearLogsBtn.addEventListener('click', function (event) {
  document.getElementById('experiment-logs').innerHTML = ''
})
clearResultsBtn.addEventListener('click', function (event) {
  document.getElementById('experiment-results').innerHTML = ''
})
ipc.on('exp-log-reply', function (event, arg) {
  document.getElementById('experiment-logs').innerHTML += `\n${arg}`
  if (arg === 'Experiment Stopped.') {
    ongoingExp = false
    startSternbergBtn.innerHTML = 'Start Sternberg Task'
  }
})
ipc.on('exp-result-reply', function (event, arg) {
  document.getElementById('experiment-results').innerHTML += `\n${arg}`
})