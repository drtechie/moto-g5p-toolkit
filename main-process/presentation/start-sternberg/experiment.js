const path = require('path')
const electron = require('electron')
const ipc = electron.ipcMain
const {BrowserWindow, globalShortcut, dialog} = require('electron')
const NanoTimer = require('nanotimer')

let win
let controlwin
let expStarted
let message = ''
let trialsCount = 2
// Possible alphabets
let arr = ['B','C','D','F','G','H','J','K','L','M','N','P','Q','R','S','T','V','W','X','Y','Z']
// Create array of 3s
let threes = []
// Create array of 6s
let sixes = []
// Combine them
let threesSixes = []
// Create array of 0s
let zeroes = []
// Create array of 1s
let ones = []
// Combine them
let zeroesOnes = []
// Loads
let loads = []
let loadCharacters = []
let probes = []
let mriPulse = 0
let ongoing, i
let maintime, stime, starttime, endtime, totaltime
let timer1 = new NanoTimer()
let timer2 = new NanoTimer()
let timer3 = new NanoTimer()
let timer4 = new NanoTimer()
let loadOnsets, maintainOnsets, probeOnsets, probeDurations, Resp, subjectAnswers
let currentBlock = 1
let responseCorrect, responseWrong


function prepareBlock() {
  loads = []
  loadCharacters = []
  probes = []
  ongoing = false
  i = 0
  loadOnsets = []
  maintainOnsets = []
  probeOnsets = []
  probeDurations = []
  subjectAnswers = []
  Resp = []
  // Create array of 3s
  threes = Array.apply(null, Array(trialsCount)).map(function () {
    return 3
  })
  // Create array of 6s
  sixes = Array.apply(null, Array(trialsCount)).map(function () {
    return 6
  })
  // Combine them
  threesSixes = threes.concat(sixes)
  // Shuffle 3s and 6s
  threesSixes = shuffle(threesSixes)
  // Create array of 0s
  zeroes = Array.apply(null, Array(trialsCount)).map(function () {
    return false
  })
  // Create array of 1s
  ones = Array.apply(null, Array(trialsCount)).map(function () {
    return true
  })
  // Combine them
  zeroesOnes = ones.concat(zeroes)
  // Shuffle 0s and 1s
  zeroesOnes = shuffle(zeroesOnes)
  // Create the loads
  makeLoads()
}

ipc.on('start-sternberg', function (event) {
  // Start the Experiment
  message = 'Starting Experiment.'
  global.mainWindow.webContents.send('exp-log-reply', message)
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
        // Register responses
        global.db.settings.find({setting: 'response'}, function (err, respdocs) {
          let error = null
          if (respdocs !== null) {
            for (let doc of respdocs) {
              if (doc.value !== '') {
                if (doc.type === 'response-correct') {
                  responseCorrect = doc.value
                  globalShortcut.register(responseCorrect, () => {
                    gotResponse(responseCorrect)
                  })
                }
                if (doc.type === 'response-wrong') {
                  responseWrong = doc.value
                  globalShortcut.register(responseWrong, () => {
                    gotResponse(responseWrong)
                  })
                }
              } else {
                // If any of the responses are not set, its an error
                error = true
              }
            }
            if (error !== true) {
              // After registering responses open experiment
              openWindows()
            }
            else {
              // Responses are not set
              // Throw error
              dialog.showErrorBox('Response keys not set', 'Experiment cannot continue.')
              stopExp()
            }
          }
          else {
            // Responses are not set
            // Throw error
            dialog.showErrorBox('Response keys not set', 'Experiment cannot continue.')
            stopExp()
          }
        })
      } else {
        // MRI Sync pulse not set
        // Throw error
        dialog.showErrorBox('MRI Sync pulse not set', 'Experiment cannot continue.')
        stopExp()
      }
    }
    else {
      // MRI Sync pulse not set
      // Throw error
      dialog.showErrorBox('MRI Sync pulse not set', 'Experiment cannot continue.')
      stopExp()
    }
  })
})

ipc.on('stop-sternberg', function () {
  // Stop the Experiment
  stopExp()
})

function stopExp() {
  if (!totaltime && maintime) {
    // This means experiment was stopped before completion and clock had started
    // Output the total time anyways
    // Total experiment time
    totaltime = process.hrtime(maintime)
    global.mainWindow.webContents.send('exp-log-reply', `Experiment lasted ${totaltime[0] * 1e9 + totaltime[1]} nanoseconds`)
  }
  timer1.clearTimeout()
  timer2.clearTimeout()
  timer3.clearTimeout()
  timer4.clearTimeout()
  globalShortcut.unregisterAll()
  expStarted = false
  mriPulse = 0
  global.mainWindow.webContents.send('exp-log-reply', `Experiment Stopped.`)
  if (win) {
    win.close()
  }
  if (controlwin) {
    controlwin.close()
  }
}

function gotResponse(keynum) {
  if (expStarted) {
    if (!ongoing && (i < trialsCount * 2)) {
      i++
      // If trials are already shown, evaluate the RT, answer etc
      // Means at least one trial is over
      // Find whether subject input is correct
      endtime = process.hrtime(starttime)
      let RT = endtime[0] * 1e9 + endtime[1]

      // Add to probe duration
      probeDurations.push(RT)
      // Record subject answers
      subjectAnswers.push(keynum)

      sendEvent('main-process-reply', '')
      global.mainWindow.webContents.send('exp-log-reply', `Got response after ${RT} nanoseconds`)

      stime = process.hrtime()
      nextTrial()
    }
  }
}
// Open the experiment windows
function openWindows() {
  // Open new Window
  const modalPath = path.join('file://', __dirname, '../../../sections/presentation/experiment-window.html')
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
  global.mainWindow.webContents.send('exp-log-reply', 'Key bindings set. Experiment window opened.')
}
// On getting MRI sync pulse
function gotSync() {
  if (mriPulse === 0) {
    sendEvent('sync-reply', `Get Ready for Session ${currentBlock}`)
    maintime = process.hrtime()
    global.mainWindow.webContents.send('exp-log-reply', `Starting clock!`)
    global.mainWindow.webContents.send('exp-log-reply', `Starting Run ${currentBlock}`)
  }
  if (mriPulse === 2) {
    expStarted = true
    stime = process.hrtime()
    nextTrial()
  }
  mriPulse++
  let diff = process.hrtime(maintime)
  if (!totaltime) {
    // If experiment is over, ignore the pulses being sent to logs
    global.mainWindow.webContents.send('exp-log-reply', `Got MRI Pulse ${mriPulse} ${diff[0] * 1e9 + diff[1]} nanoseconds`)
  }
}


function nextTrial() {
  if (i < trialsCount * 2) {
    // trials are left to be completed
    timing('Starting next trial after',stime)
    stime = process.hrtime()

    ongoing = true
    let load = loads[i]
    sendEvent('main-process-reply', '')

    // Wait 3 seconds before showing load - ITI
    timer1.setTimeout(function () {

      timing('Displaying load after ITI of',stime)
      stime = process.hrtime()

      // Show the load
      sendEvent('main-process-reply', load)
      // Add to load onsets
      loadOnsets.push(process.hrtime(maintime))

      // Take away the load after 3 seconds
      timer2.setTimeout(function () {

        timing('Load taken away after',stime)
        stime = process.hrtime()

        sendEvent('main-process-reply', '')
        // Add to maintenance onsets
        maintainOnsets.push(process.hrtime(maintime))

        // After delay of 6 secs show the probe
        timer3.setTimeout(function () {

          timing('Showing probe after',stime)

          sendEvent('main-process-reply', probes[i][0])
          // Add to maintenance onsets
          probeOnsets.push(process.hrtime(maintime))

          // start the timer
          starttime = process.hrtime()
          ongoing = false
          timer3.clearTimeout()
        },'', '3000000000n')
        timer2.clearTimeout()
      },'', '2000000000n')
      timer1.clearTimeout()
    },'', '3000000000n')
  } else {
    // Block over
    let diff = process.hrtime(maintime)
    global.mainWindow.webContents.send('exp-log-reply', `Block ${currentBlock} over at ${diff[0] * 1e9 + diff[1]} nanoseconds`)
    if (currentBlock < 3) {
      // Start showing onsets and durations for current run
      showLoadOnsets()
      // Blocks are remaining
      // Increment block
      currentBlock++
      // Session over screen
      sendEvent('main-process-reply',`Session ${currentBlock -1} over`)
      timer1.setTimeout(function () {
        // Blank the screen
        sendEvent('main-process-reply','')
        // Wait for 30 seconds before next
        timer2.setTimeout(function () {
          sendEvent('main-process-reply', `Get Ready for Session ${currentBlock}`)
          global.mainWindow.webContents.send('exp-log-reply', `Starting Run ${currentBlock}`)
          prepareBlock()
          timer3.setTimeout(function () {
            // After 4 seconds (2 TRs) progress to next block
            nextTrial()
            timer3.clearTimeout()
          },'','4000000000n')
          timer2.clearTimeout()
        },'','30000000000n')
        timer1.clearTimeout()
      },'','2000000000n')
    } else {
      // Start showing onsets and durations for current run
      showLoadOnsets()
      // Stop the experiment
      // Total experiment time
      totaltime = process.hrtime(maintime)
      global.mainWindow.webContents.send('exp-log-reply', `Experiment lasted ${totaltime[0] * 1e9 + totaltime[1]} nanoseconds`)
      // Wait for a second before thanks
      timer1.setTimeout(function () {
        sendEvent('main-process-reply','Thankyou!')
        timer2.setTimeout(function () {
          // Stop the experiment
          stopExp()
        },'','2000000000n')
      },'','1000000000n')
    }
  }
}

function shuffle(array) {
  let currentIndex = array.length, temporaryValue, randomIndex

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex -= 1

    // And swap it with the current element.
    temporaryValue = array[currentIndex]
    array[currentIndex] = array[randomIndex]
    array[randomIndex] = temporaryValue
  }

  return array
}
function makeLoads() {
  for (let k = 0; k < trialsCount * 2; k++) {
    let loadChars = []
    let withHash = []
    loadChars = makeLoad(arr, threesSixes[k])
    let load = loadChars.join(' ')
    // Check if load was already generated
    while (!(loads.indexOf(load) == -1)) {
      // If exists generate load again
      loadChars = makeLoad(arr, threesSixes[k])
      load = loadChars.join(' ')
    }
    loadCharacters.push(loadChars)
    if (threesSixes[k] === 3) {
      withHash = shuffle(loadChars.concat(['#', '#', '#']))
      load = withHash.join(' ')
    }
    loads.push(load)
  }
  makeProbes()
}
function makeLoad(arr, size) {
  let shuffled = arr.slice(0), i = arr.length, temp, index
  while (i--) {
    index = Math.floor((i + 1) * Math.random())
    temp = shuffled[index]
    shuffled[index] = shuffled[i]
    shuffled[i] = temp
  }
  return shuffled.slice(0, size)
}
function makeProbes() {
  let probeFromLoad = false
  let probe = ''
  let potentialProbeCharacters = []
  for (let k = 0; k < trialsCount * 2; k++) {
    let subProbe = []
    // Decide a true or false
    probeFromLoad = zeroesOnes[k]
    if (probeFromLoad) {
      // Probe should be taken from load
      probe = loadCharacters[k][Math.floor(Math.random() * loadCharacters[k].length)]
    }
    else {
      // Probe is from other alphabets
      potentialProbeCharacters = arr.filter(function (el) {
        return loadCharacters[k].indexOf(el) < 0
      })
      probe = potentialProbeCharacters[Math.floor(Math.random() * potentialProbeCharacters.length)]
    }
    subProbe[0] = probe.toLowerCase()
    subProbe[1] = probeFromLoad
    probes.push(subProbe)
  }
}
function timing(prefix, temptime){
  let diff = process.hrtime(temptime)
  global.mainWindow.webContents.send('exp-log-reply', `${prefix} ${diff[0] * 1e9 + diff[1]} nanoseconds`  )
}
function sendEvent (channel, reply) {
  win.webContents.send(channel, reply)
  if (controlwin) {
    controlwin.webContents.send(channel, reply)
  }
}
function showProbeDurations() {
  global.mainWindow.webContents.send('exp-result-reply', '\nProbe Durations' )
  for (let value of probeDurations) {
    global.mainWindow.webContents.send('exp-result-reply', value )
  }
  showAnswers()
}
function showAnswers() {
  global.mainWindow.webContents.send('exp-result-reply', '\nAnswers' )
  global.mainWindow.webContents.send('exp-result-reply', 'Observed (Expected) [Assessment]' )
  let observed, expected, assessment
  for (let j = 0; j < subjectAnswers.length; j++) {
    // Observed Key presses
    if (subjectAnswers[j] == responseWrong) {
      observed = 'No'
    } else {
      observed = 'Yes'
    }
    // Expected Key presses
    if (!probes[j][1]) {
      expected = 'No'
    } else {
      expected = 'Yes'
    }
    if (probeDurations[j] > 3000000000) {
      assessment = 'Too Long'
    }
    else {
      if (expected !== observed) {
        // User input NO and Probe is YES
        // False Hit
        assessment = 'Wrong'
      } else {
        assessment = 'Correct'
      }
    }
    global.mainWindow.webContents.send('exp-result-reply', `${observed} (${expected}) [${assessment}]` )
  }
}
function showProbeOnsets() {
  global.mainWindow.webContents.send('exp-result-reply', '\nProbe Onsets' )
  for (let value of probeOnsets) {
    global.mainWindow.webContents.send('exp-result-reply', value )
  }
  // Show Probe Durations
  showProbeDurations()
}
function showMaintainOnsets() {
  global.mainWindow.webContents.send('exp-result-reply', '\nMaintain Onsets' )
  for (let value of maintainOnsets) {
    global.mainWindow.webContents.send('exp-result-reply', value )
  }
  // Show Probe Onsets
  showProbeOnsets()
}
function showLoadOnsets() {
  if (loadOnsets.length > 0 ) {
    global.mainWindow.webContents.send('exp-result-reply', `\n\nRun ${currentBlock}`)
    global.mainWindow.webContents.send('exp-result-reply', 'Load Onsets')
    for (let value of loadOnsets) {
      global.mainWindow.webContents.send('exp-result-reply', value)
    }
    // Show the Maintenance Onsets
    showMaintainOnsets()
  }
}