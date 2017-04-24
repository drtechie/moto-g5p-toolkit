const path = require('path')
const electron = require('electron')
const {BrowserWindow, globalShortcut, dialog} = require('electron')
const request = require('request')
const ipc = electron.ipcMain

const NanoTimer = require('nanotimer')

let win
let controlwin
let expStarted
let message = ''
let trialsCount = 100
// Possible alphabets
let arr = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z']
let numOfChars = 6
// Loads
let loads
let loadCharacters
let images
let mriPulse = 0
let mainTime, stime, totalTime
var timer1 = new NanoTimer()
var timer2 = new NanoTimer()
var timer3 = new NanoTimer()
var timer4 = new NanoTimer()
let mriTimings = []
let i = 0
let diffTimings
let fetched = null
function prepareBlock() {
    loads = []
    loadCharacters = []
    i = 0
    diffTimings = []
    makeTexts()
}
function prepareImages() {
    // Wait for some time - for the window to be opened.
    images = []
    i = 0
    diffTimings = []
    timer1.setTimeout(function () {
        sendEvent('fetch-image-reply', 'Fetching Images')
        request('https://api.500px.com/v1/photos?feature=popular&sort=created_at&rpp=100&image_size=6&include_store=store_download&include_states=voted&consumer_key=2Gj1JA5YQie1Of1klyGVyrrEu4dHkh79YbL3FyL9', function (error, response, body) {
            if (!error && response.statusCode == 200) {
                let json = JSON.parse(body)
                for (var value of json.photos) {
                    images.push(value.images[0].url)
                }
                sendEvent('preload-image', images)
            }
        })
        timer2.clearTimeout()
    },'','2000000000n')
}
ipc.on('fetched-images', function () {
    fetched =  true
    sendEvent('fetch-image-reply', 'Images Preloaded. Waiting for MRI pulse.')
})
// Simulation of Text
ipc.on('start-simulation', function (event) {
    // Start the Experiment
    message = 'Starting Simulation.'
    global.mainWindow.webContents.send('sim-log-reply', message)
    prepareBlock()
    // Register a 'CommandOrControl+C' shortcut listener to stop presenting.
    globalShortcut.register('CommandOrControl+C', () => {
        stopExp()
    })
    // Register MRI Sync Pulse.
    global.db.settings.findOne({setting: 'mri_sync'}, function (err, docs) {
        if (docs !== null) {
            if (docs.value !== '') {
                globalShortcut.register(docs.value, () => {
                    gotSync()
                })
                global.mainWindow.webContents.send('sim-log-reply', 'Key bindings set.')
                openWindows()
            } else {
                // MRI Sync pulse not set
                // Throw error
                dialog.showErrorBox('MRI Sync pulse not set', 'Simulation cannot continue.')
                stopExp()
            }
        }
        else {
            // MRI Sync pulse not set
            // Throw error
            dialog.showErrorBox('MRI Sync pulse not set', 'Simulation cannot continue.')
            stopExp()
        }
    })
})
// Stop Text simulation
ipc.on('stop-simulation', function () {
    // Stop the Experiment
    stopExp()
})
// Start MRI sync timing simulation
ipc.on('start-mri-simulation', function (event) {
    // Start the Experiment
    message = 'Starting MRI timing simulation.'
    global.mainWindow.webContents.send('sim-log-reply', message)
    // Register a 'CommandOrControl+C' shortcut listener to stop presenting.
    globalShortcut.register('CommandOrControl+C', () => {
        stopExp()
    })
    // Register MRI Sync Pulse.
    global.db.settings.findOne({setting: 'mri_sync'}, function (err, docs) {
        if (docs !== null) {
            if (docs.value !== '') {
                globalShortcut.register(docs.value, () => {
                    gotMriSync()
                })
                global.mainWindow.webContents.send('sim-log-reply', 'Key bindings set.')
            } else {
                // MRI Sync pulse not set
                // Throw error
                dialog.showErrorBox('MRI Sync pulse not set', 'Simulation cannot continue.')
                stopExp()
            }
        }
        else {
            // MRI Sync pulse not set
            // Throw error
            dialog.showErrorBox('MRI Sync pulse not set', 'Simulation cannot continue.')
            stopExp()
        }
    })
})
// Stop MRI sync pulse simulation
ipc.on('stop-mri-simulation', function () {
    // Stop the Simulation
    stopExp()
})
// Stop MRI sync pulse simulation
ipc.on('find-diff', function () {
    diffTimings.push(process.hrtime(stime))
})
// Simulation of Text
ipc.on('start-image-simulation', function (event) {
    // Start the Experiment
    message = 'Starting Simulation.'
    global.mainWindow.webContents.send('sim-log-reply', message)
    // Register a 'CommandOrControl+C' shortcut listener to stop presenting.
    globalShortcut.register('CommandOrControl+C', () => {
        stopExp()
    })
    // Register MRI Sync Pulse.
    global.db.settings.findOne({setting: 'mri_sync'}, function (err, docs) {
        if (docs !== null) {
            if (docs.value !== '') {
                globalShortcut.register(docs.value, () => {
                    gotImageSync()
                })
                global.mainWindow.webContents.send('sim-log-reply', 'Key bindings set.')
                openImageWindows()
                prepareImages()
            } else {
                // MRI Sync pulse not set
                // Throw error
                dialog.showErrorBox('MRI Sync pulse not set', 'Simulation cannot continue.')
                stopExp()
            }
        }
        else {
            // MRI Sync pulse not set
            // Throw error
            dialog.showErrorBox('MRI Sync pulse not set', 'Simulation cannot continue.')
            stopExp()
        }
    })
})
// Stop Text simulation
ipc.on('stop-image-simulation', function () {
    // Stop the Experiment
    stopExp()
})
function stopExp() {
    if (!totalTime && mainTime) {
        // This means experiment was stopped before completion and clock had started
        // Output the total time anyways
        // Total experiment time
        totalTime = process.hrtime(mainTime)
        global.mainWindow.webContents.send('sim-log-reply', `Simulation lasted ${totalTime[0] * 1e9 + totalTime[1]} nanoseconds`)
    }
    timer1.clearTimeout()
    timer2.clearTimeout()
    timer3.clearTimeout()
    timer4.clearTimeout()
    globalShortcut.unregisterAll()
    expStarted = false
    mriPulse = 0
    global.mainWindow.webContents.send('sim-log-reply', `Simulation Stopped.`)
    if (win) {
        win.close()
    }
    if (controlwin) {
        controlwin.close()
    }
}
// Open the experiment windows
function openWindows() {
    // Open new Window
    const modalPath = path.join('file://', __dirname, '../../../sections/presentation/simulation-window.html')
    if (global.externalDisplay) {
        win = new BrowserWindow({
            x: externalDisplay.bounds.x + 50,
            y: externalDisplay.bounds.y + 50,
            frame: false, fullscreen: true
        })
        controlwin = new BrowserWindow()
        controlwin.loadURL(modalPath)
        controlwin.show()
    } else {
        win = new BrowserWindow({ frame: false, fullscreen: true })
    }
    win.on('closed', function () {
        win = null
        if (expStarted) {
            stopExp()
        }
    })
    if (controlwin) {
        controlwin.on('closed', function () {
            controlwin = null
            if (expStarted) {
                stopExp()
            }
        })
    }
    win.loadURL(modalPath)
    win.show()
    global.mainWindow.webContents.send('sim-log-reply', 'Simulation window opened.')
}
// Open the experiment windows
function openImageWindows() {
    // Open new Window
    const modalPath = path.join('file://', __dirname, '../../../sections/presentation/image-simulation.html')
    if (global.externalDisplay) {
        win = new BrowserWindow({
            x: externalDisplay.bounds.x + 50,
            y: externalDisplay.bounds.y + 50,
            frame: false, fullscreen: true
        })
    } else {
        win = new BrowserWindow({ frame: false, fullscreen: true })
    }
    win.on('closed', function () {
        win = null
        if (expStarted) {
            stopExp()
        }
    })
    win.loadURL(modalPath)
    win.show()
    global.mainWindow.webContents.send('sim-log-reply', 'Simulation window opened.')
}
// On getting MRI sync pulse for Text simulation
function gotSync() {
    if (mriPulse === 0) {
        mainTime = process.hrtime()
        global.mainWindow.webContents.send('sim-log-reply', `Starting clock!`)
        sendEvent('sync-reply', `Got MRI Sync pulse. Simulation will start after skipping a pulse.`)
    }
    if (mriPulse === 1) {
        expStarted = true
    }
    if (mriPulse >= 1) {
        stime = process.hrtime()
        nextTrial()
    }
    mriPulse++
    let diff = process.hrtime(mainTime)
    if (!totalTime) {
        // If experiment is over, ignore the pulses being sent to logs
        global.mainWindow.webContents.send('sim-log-reply', `Got MRI Pulse ${mriPulse} ${diff[0] * 1e9 + diff[1]} nanoseconds`)
    }
}
// On getting MRI sync pulse - timing simulation
function gotMriSync() {
    if (i === 0) {
        mainTime = process.hrtime()
    }
    let diff = process.hrtime(mainTime)
    mriTimings.push(diff)
    i++
    if (i >= trialsCount) {
        // End simulation
        global.mainWindow.webContents.send('sim-result-reply', 'MRI Sync timings' )
        for (var value of mriTimings) {
            global.mainWindow.webContents.send('sim-result-reply', value[0] * 1e9 + value[1] )
        }
        stopExp()
    }
}
// On getting MRI sync pulse for Text simulation
function gotImageSync() {
    if (fetched) {
        if (mriPulse === 0) {
            mainTime = process.hrtime()
            global.mainWindow.webContents.send('sim-log-reply', `Starting clock!`)
            sendEvent('sync-image-reply', `Got MRI Sync pulse. Simulation will start after skipping a pulse.`)
        }
        if (mriPulse === 1) {
            expStarted = true
        }
        if (mriPulse > 0) {
            stime = process.hrtime()
            nextImage()
        }
        mriPulse++
        let diff = process.hrtime(mainTime)
        if (!totalTime) {
            // If experiment is over, ignore the pulses being sent to logs
            global.mainWindow.webContents.send('sim-log-reply', `Got MRI Pulse ${mriPulse} ${diff[0] * 1e9 + diff[1]} nanoseconds`)
        }
    }
}
function nextTrial() {
    if (i < trialsCount) {
        // trials are left to be completed
        timing('Starting next trial after',stime)
        
        sendEvent('main-process-reply', loads[i])
        i++

    } else {
        // Simulation over
        let diff = process.hrtime(mainTime)
        global.mainWindow.webContents.send('sim-log-reply', `Simulation over at ${diff[0] * 1e9 + diff[1]} nanoseconds`)

        // Start showing onsets and durations for current run
        showTimeDifferences()
        // Stop the simulation
        // Total simulation time
        totalTime = process.hrtime(mainTime)
        global.mainWindow.webContents.send('sim-log-reply', `Experiment lasted ${totalTime[0] * 1e9 + totalTime[1]} nanoseconds`)
        stopExp()
    }
}

function nextImage() {
    if (i < trialsCount) {
        // trials are left to be completed
        timing('Starting next trial after',stime)

        sendEvent('main-process-image-reply', images[i])
        i++

    } else {
        // Simulation over
        let diff = process.hrtime(mainTime)
        global.mainWindow.webContents.send('sim-log-reply', `Simulation over at ${diff[0] * 1e9 + diff[1]} nanoseconds`)

        // Start showing onsets and durations for current run
        showTimeDifferences()
        // Stop the simulation
        // Total simulation time
        totalTime = process.hrtime(mainTime)
        global.mainWindow.webContents.send('sim-log-reply', `Experiment lasted ${totalTime[0] * 1e9 + totalTime[1]} nanoseconds`)
        stopExp()
    }
}

function makeTexts() {
    for (let k = 0; k < trialsCount; k++) {
        let loadChars = []
        loadChars = makeText(arr, numOfChars)
        let load = loadChars.join(' ')
        loads.push(load)
    }
}
function makeText(arr, size) {
    let shuffled = arr.slice(0), i = arr.length, temp, index
    while (i--) {
        index = Math.floor((i + 1) * Math.random())
        temp = shuffled[index]
        shuffled[index] = shuffled[i]
        shuffled[i] = temp
    }
    return shuffled.slice(0, size)
}
function timing(prefix, temptime){
    let diff = process.hrtime(temptime)
    global.mainWindow.webContents.send('sim-log-reply', `${prefix} ${diff[0] * 1e9 + diff[1]} nanoseconds`  )
}
function sendEvent (channel, reply) {
    win.webContents.send(channel, reply)
    if (controlwin) {
        controlwin.webContents.send(channel, reply)
    }
}
function showTimeDifferences() {
    global.mainWindow.webContents.send('sim-result-reply', 'Time Differences')
    for (var value of diffTimings) {
        global.mainWindow.webContents.send('sim-result-reply', value[0] * 1e9 + value[1])
    }
}