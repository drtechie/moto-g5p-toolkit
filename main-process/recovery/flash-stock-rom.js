const ipc = require('electron').ipcMain
const dialog = require('electron').dialog
const fastbootTools = require('../common/fastboot')
const adbTools = require('../common/adb')
const fs = require('fs')
const path = require('path')
const util = require('util')
const parseString = require('xml2js').parseString

ipc.on('flash-stock-rom', function (event, arg) {
  event.sender.send('flash-stock-rom-button-reply', 'Preparing')
  const options = {
    properties: ['openDirectory']
  }
  dialog.showOpenDialog(options, (foldername) => {
    if (foldername === undefined) {
      event.sender.send('flash-stock-rom-button-reply', 'No folder selected')
      return
    }
    fs.readFile(path.join(foldername[0], 'flashfile.xml'), 'utf8', (err, data) => {
      if (err) {
        console.log(err)
        event.sender.send('flash-stock-rom-button-reply', 'Could not read flashfile.xml')
      } else {
        let content = util.format(data)
        parseString(content, (err, result) => {
          if (isArray(result.flashing.steps) && result.flashing.header[0].phone_model[0].$.model === global.strings.deviceName) {
            event.sender.send('flash-stock-rom-logs', 'Parsing flashfile.xml')
            let steps = result.flashing.steps[0].step
            if (global.deviceID && (global.connection === global.strings.adb || global.connection === global.strings.recovery)) {
              adbTools.rebootToBootloader().then(() => {
                fastbootTools.waitForFastbootDevice().then(() => {
                  doFlashStockROM(steps, foldername).then(() => {
                    event.sender.send('flash-stock-rom-logs', 'DONE, Reboot your phone!')
                  }).catch(() => {
                    global.mainWindow.webContents.send('flash-stock-rom-logs', 'Error during flashing')
                  })
                }).catch(() => {
                  global.mainWindow.webContents.send('flash-stock-rom-logs', global.strings.noDevice)
                })
              }).catch(() => {
                global.mainWindow.webContents.send('flash-stock-rom-logs', 'Error occured when rebooting')
              })
            } else if (global.deviceID && global.connection === global.strings.fastboot) {
              doFlashStockROM(steps, foldername).then(() => {
                global.mainWindow.webContents.send('flash-stock-rom-logs', 'DONE, Reboot your phone!')
              }).catch(() => {
                global.mainWindow.webContents.send('flash-stock-rom-logs', 'Error occured when flashing')
              })
            } else {
              event.sender.send('flash-stock-rom-button-reply', global.strings.noDevice)
              event.sender.send('flash-stock-rom-logs', global.strings.noDevice)
            }
          } else if (err) {
            event.sender.send('flash-stock-rom-button-reply', 'Error parsing flashfile.xml')
          }
        })
      }
    })
  })
})

function isArray (what) {
  return Object.prototype.toString.call(what) === '[object Array]'
}
/*
*  https://www.bennadel.com/blog/3123-using-es6-generators-and-yield-to-implement-asynchronous-workflows-in-javascript.htm
* */

function doFlashStockROM (steps, foldername) {
  let workflowProxy = createPromiseWorkflow(flashingGenerator)
  return (workflowProxy(steps, foldername))
}

function* flashingGenerator (steps, foldername) {
  let operations = []
  for (let step of steps) {
    if (typeof step.$.MD5 !== 'undefined') {
      let args = [step.$.operation, step.$.partition, path.resolve(foldername[0], step.$.filename)]
      operations.push(yield (fastbootTools.spawnCommand(args)))
    } else if (typeof step.$.var !== 'undefined') {
      let args = [step.$.operation, step.$.var]
      operations.push(yield (fastbootTools.spawnCommand(args)))
    } else if (typeof step.$.partition !== 'undefined') {
      let args = [step.$.operation, step.$.partition]
      operations.push(yield (fastbootTools.spawnCommand(args)))
    }
  }
  return (operations)
}

function createPromiseWorkflow (generatorFunction) {
  return (iterationProxy)
  function iterationProxy () {
    let iterator = generatorFunction.apply(this, arguments)
    try {
      return (pipeResultBackIntoGenerator(iterator.next()))
    } catch (error) {
      return (Promise.reject(error))
    }
    function pipeResultBackIntoGenerator (iteratorResult) {
      if (iteratorResult.done) {
        return (Promise.resolve(iteratorResult.value))
      }
      let intermediaryPromise = Promise
        .resolve(iteratorResult.value)
        .then(
          function handleResolve (value) {
            return (pipeResultBackIntoGenerator(iterator.next(value)))
          },
          function handleReject (reason) {
            return (pipeResultBackIntoGenerator(iterator.throw(reason)))
          }
        )
      return (intermediaryPromise)
    }
  }
}
