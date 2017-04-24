const ipc = require('electron').ipcRenderer
const path = require('path')

const startSimulationBtn = document.getElementById('start-simulation')
const startMRISimulationBtn = document.getElementById('start-mri-simulation')
const startImageSimulationBtn = document.getElementById('start-image-simulation')
const clearLogsBtn = document.getElementById('clear-simulation-logs')
const clearResultsBtn = document.getElementById('clear-simulation-results')
let ongoingExp = false

startSimulationBtn.addEventListener('click', function (event) {
    if (ongoingExp) {
        ongoingExp = false
        ipc.send('stop-simulation')
        startSimulationBtn.innerHTML = 'Assess text stimuli latency'
    } else {
        ongoingExp = true
        ipc.send('start-simulation')
        startSimulationBtn.innerHTML = 'Stop simulation'
    }
})
startMRISimulationBtn.addEventListener('click', function (event) {
    if (ongoingExp) {
        ongoingExp = false
        ipc.send('stop-mri-simulation')
        startMRISimulationBtn.innerHTML = 'Assess MRI timing'
    } else {
        ongoingExp = true
        ipc.send('start-mri-simulation')
        startMRISimulationBtn.innerHTML = 'Stop simulation'
    }
})
startImageSimulationBtn.addEventListener('click', function (event) {
    if (ongoingExp) {
        ongoingExp = false
        ipc.send('stop-image-simulation')
        startImageSimulationBtn.innerHTML = 'Assess image stimuli latency'
    } else {
        ongoingExp = true
        ipc.send('start-image-simulation')
        startImageSimulationBtn.innerHTML = 'Stop simulation'
    }
})
clearLogsBtn.addEventListener('click', function (event) {
    document.getElementById('simulation-logs').innerHTML = ''
})
clearResultsBtn.addEventListener('click', function (event) {
    document.getElementById('simulation-results').innerHTML = ''
})
ipc.on('sim-log-reply', function (event, arg) {
    document.getElementById('simulation-logs').innerHTML += `\n${arg}`
    if (arg === 'Simulation Stopped.') {
        ongoingExp = false
        startSimulationBtn.innerHTML = 'Assess text stimuli latency'
        startMRISimulationBtn.innerHTML = 'Assess MRI timing'
        startImageSimulationBtn.innerHTML = 'Assess image stimuli latency'
    }
})
ipc.on('sim-result-reply', function (event, arg) {
    document.getElementById('simulation-results').innerHTML += `\n${arg}`
})