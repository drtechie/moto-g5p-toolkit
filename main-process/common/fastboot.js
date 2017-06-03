const { execFile, spawn } = require('child_process')
const _ = require('lodash')
const files = require('./files')
const fastboot = files.getFastbootPath()
const adbTools = require('./adb')
const statusTools = require('./status')
const { forEach } = require('async-foreach')

exports.execute = (args, callback) => {
  execFile(fastboot, args, (error, stdout, stderr) => {
    if (error) console.log(error)
    if (stderr) {
      callback(stderr)
    } else if (stdout) {
      callback(stdout)
    } else {
      callback()
    }
  })
}

exports.spawnCommand = (args) => {
  return new Promise(
    (resolve, reject) => {
      const spawning = spawn(fastboot, args)
      spawning.stdout.on('data', (data) => {
        global.mainWindow.webContents.send('flash-stock-rom-logs', data)
      })

      spawning.stderr.on('data', (data) => {
        global.mainWindow.webContents.send('flash-stock-rom-logs', data)
      })

      spawning.stderr.on('close', (data) => {
        resolve()
      })
    })
}

exports.getPhones = () => {
  return new Promise(
    (resolve, reject) => {
      this.execute(['devices'], data => {
        if (data !== 'undefined') {
          let deviceArray = []
          let devices
          if (process.platform === 'linux' || process.platform === 'darwin') {
            devices = _.split(data, '\n')
          } else if (process.platform === 'win32') {
            devices = _.split(data, '\r\n')
          }

          devices.forEach((value) => {
            let tmp = value.split('\t')
            if (tmp.length === 2) {
              deviceArray.push({
                'id': tmp[0],
                'type': tmp[1]
              })
            }
          })
          resolve(deviceArray)
        } else {
          reject(false)
        }
      })
    })
}

exports.getMoto = () => {
  return new Promise(
    (resolve, reject) => {
      this.getPhones().then(devices => {
        if (devices.length > 0) {
          forEach(devices, (device) => {
            if (_.includes(device.id, 'permissions')) {
              reject(global.strings.fastbootNoPermissions)
            } else {
              this.checkMotoName(device.id).then(foundName => {
                if (foundName) {
                  resolve(foundName)
                }
              }).catch(() => {
                // do nothing
              })
            }
          })
        } else {
          reject(false)
        }
      }).catch(() => {
        reject(false)
      })
    })
}

exports.checkMotoName = (deviceID) => {
  return new Promise(
    (resolve, reject) => {
      this.execute(['getvar', 'product'], name => {
        if (_.includes(name, global.strings.deviceName)) {
          statusTools.setDevice(deviceID, global.strings.fastboot)
          resolve(true)
        } else {
          statusTools.setDevice(null, null)
          reject(false)
        }
      })
    })
}

exports.getUnlockData = () => {
  return new Promise(
    (resolve, reject) => {
      if (global.deviceID && global.connection === global.strings.fastboot) {
        this.execute(['oem', 'get_unlock_data'], data => {
          data = this.prepareUnlockData(data)
          resolve(data)
        })
      } else {
        reject(global.strings.noDevice)
      }
    })
}

exports.unlockBootloader = (uniqueKey) => {
  return new Promise(
      (resolve, reject) => {
        if (global.deviceID && global.connection === global.strings.fastboot) {
          this.execute(['oem', 'unlock', uniqueKey], data => {
            resolve(data)
          })
        } else {
          reject(global.strings.noDevice)
        }
      })
}

exports.prepareUnlockData = (data) => {
  let linebreak
  if (process.platform === 'linux' || process.platform === 'darwin') {
    linebreak = '\n'
  } else if (process.platform === 'win32') {
    linebreak = '\r\n'
  }
  return _.split(this.getSubString(data, 'data:' + linebreak, linebreak + 'OKAY'), linebreak).join('').replace(/\(bootloader\) /g, '')
}

exports.getSubString = (data, firstVariable, secondVariable) => {
  return _.split(_.split(data, firstVariable)[1], secondVariable)[0]
}

exports.waitForFastbootDevice = () => {
  return new Promise(
    (resolve, reject) => {
      if (global.deviceID && global.connection === global.strings.fastboot) {
        resolve(true)
      } else {
        let count = 0
        let intervalObject = setInterval(() => {
          statusTools.setDevice(global.strings.waiting, global.strings.waitingFastboot)
          statusTools.setStatus('purple')
          count++
          this.getMoto().then(() => {
            if (global.deviceID && global.connection === global.strings.fastboot) {
              statusTools.setDevice(global.deviceID, global.connection)
              statusTools.setStatus('yellow')
              clearInterval(intervalObject)
              resolve(true)
            }
          }).catch(() => {
            // do nothing
          })
          if (count > 5) {
            clearInterval(intervalObject)
            statusTools.setDevice(global.strings.noDevice, global.strings.noConnection)
            statusTools.setStatus('red')
            reject(global.strings.noDevice)
          }
        }, 5000)
      }
    })
}

exports.rebootToBootloader = () => {
  return new Promise(
    (resolve, reject) => {
      if (global.deviceID && global.connection === global.strings.fastboot) {
        this.execute(['reboot-bootloader'], data => {
          resolve(data)
        })
      } else {
        reject(global.strings.noDevice)
      }
    })
}

exports.rebootSystem = () => {
  return new Promise(
    (resolve, reject) => {
      if (global.deviceID && global.connection === global.strings.fastboot) {
        this.execute(['reboot'], data => {
          resolve(data)
        })
      } else {
        reject(global.strings.noDevice)
      }
    })
}

exports.startUnlockDataExtract = () => {
  return new Promise(
    (resolve, reject) => {
      if (global.deviceID && global.connection === global.strings.adb) {
        // If the phone is in ADB mode, reboot!
        adbTools.rebootToBootloader().then(() => {
          this.waitForFastbootDevice().then(() => {
            this.getUnlockData().then((data) => {
              resolve(data)
            })
          }).catch((error) => {
            reject(error)
          })
        }).catch((error) => {
          reject(error)
        })
      } else if (global.deviceID && global.connection === global.strings.fastboot) {
        // Phone is connected in Fastboot already
        this.getUnlockData().then((data) => {
          resolve(data)
        }).catch((error) => {
          reject(error)
        })
      } else {
        reject(global.strings.noDevice)
      }
    })
}

exports.startUnlockBootloader = (uniqueKey) => {
  return new Promise(
      (resolve, reject) => {
        if (global.deviceID && global.connection === global.strings.adb) {
          // If the phone is in ADB mode, reboot!
          adbTools.rebootToBootloader().then(() => {
            this.waitForFastbootDevice().then(() => {
              this.unlockBootloader(uniqueKey).then((data) => {
                resolve(data)
              })
            }).catch((error) => {
              reject(error)
            })
          }).catch((error) => {
            reject(error)
          })
        } else if (global.deviceID && global.connection === global.strings.fastboot) {
          // Phone is connected in Fastboot already
          this.unlockBootloader(uniqueKey).then((data) => {
            resolve(data)
          }).catch((error) => {
            reject(error)
          })
        } else {
          reject(global.strings.noDevice)
        }
      })
}

exports.flashTWRP = () => {
  return new Promise(
    (resolve, reject) => {
      if (global.deviceID && global.connection === global.strings.fastboot) {
        this.execute(['flash', 'recovery', files.getTWRP()], () => {
          resolve('Recovery flashed. Rebooting to Recovery.')
        })
      } else {
        reject(global.strings.noDevice)
      }
    })
}

exports.bootTWRP = () => {
  return new Promise(
    (resolve, reject) => {
      if (global.deviceID && global.connection === global.strings.fastboot) {
        this.execute(['boot', files.getTWRP()], () => {
          resolve('Device booted to Recovery')
        })
      } else {
        reject(global.strings.noDevice)
      }
    })
}

exports.startFlashTWRP = () => {
  return new Promise(
    (resolve, reject) => {
      if (global.deviceID && global.connection === global.strings.adb) {
        // If the phone is in ADB mode, reboot!
        adbTools.rebootToBootloader().then(() => {
          this.waitForFastbootDevice().then(() => {
            this.flashTWRP().then((data) => {
              resolve(data)
            })
          }).catch((error) => {
            reject(error)
          })
        }).catch((error) => {
          reject(error)
        })
      } else if (global.deviceID && global.connection === global.strings.fastboot) {
        // Phone is connected in Fastboot already
        this.flashTWRP().then((data) => {
          resolve(data)
        }).catch((error) => {
          reject(error)
        })
      } else {
        reject(global.strings.noDevice)
      }
    })
}

exports.flashBootImage = () => {
  return new Promise(
    (resolve, reject) => {
      if (global.deviceID && global.connection === global.strings.fastboot) {
        this.execute(['flash', 'boot', files.getBootImage()], () => {
          resolve('Recovery flashed. Rebooting to Recovery.')
        })
      } else {
        reject(global.strings.noDevice)
      }
    })
}

exports.startFlashBootImage = () => {
  return new Promise(
    (resolve, reject) => {
      if (global.deviceID && (global.connection === global.strings.adb || global.connection === global.strings.recovery)) {
        // If the phone is in ADB mode, reboot!
        adbTools.rebootToBootloader().then(() => {
          this.waitForFastbootDevice().then(() => {
            this.flashBootImage().then((data) => {
              resolve(data)
            })
          }).catch((error) => {
            reject(error)
          })
        }).catch((error) => {
          reject(error)
        })
      } else if (global.deviceID && global.connection === global.strings.fastboot) {
        // Phone is connected in Fastboot already
        this.flashBootImage().then((data) => {
          resolve(data)
        }).catch((error) => {
          reject(error)
        })
      } else {
        reject(global.strings.noDevice)
      }
    })
}
