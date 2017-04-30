const { exec } = require('child_process')
const _ = require('lodash')
const files = require('./files')
const fastboot = files.getFastbootPath()
const adbTools = require('./adb')
const statusTools = require('./status')
const { forEach } = require('async-foreach')

exports.execute = (args, callback) => {
  let cmd = fastboot + ' ' + args
  exec(cmd, (error, stdout, stderr) => {
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

exports.getPhones = () => {
  return new Promise(
    (resolve, reject) => {
      this.execute('devices', data => {
        if (data !== 'undefined') {
          let deviceArray = []
          _.split(data, '\n').forEach((value) => {
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
            this.checkMotoName(device.id).then(foundName => {
              if (foundName) {
                resolve(foundName)
              }
            }).catch(() => {
              // do nothing
            })
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
      this.execute('getvar product', name => {
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
        this.execute('oem get_unlock_data', data => {
          data = this.prepareUnlockData(data)
          resolve(data)
        })
      } else {
        reject(global.strings.noDevice)
      }
    })
}

exports.prepareUnlockData = (data) => {
  return _.split(this.getSubString(data, 'data:\n', '\nOKAY'), '\n').join('').replace(/\(bootloader\) /g, '')
}

exports.getSubString = (data, firstVariable, secondVariable) => {
  return _.split(_.split(data, firstVariable)[1], secondVariable)[0]
}

exports.waitForDevice = () => {
  return new Promise(
    (resolve, reject) => {
      if (global.deviceID && global.connection === global.strings.fastboot) {
        resolve(true)
      } else {
        let count
        let intervalObject = setInterval(() => {
          count++
          this.getMoto().then(() => {
            clearInterval(intervalObject)
            resolve(true)
          }).catch(() => {
            // do nothing
          })
          if (count > 5) {
            clearInterval(intervalObject)
            reject(global.strings.noDevice)
          }
        }, 5000)
      }
    })
}

exports.startUnlockDataExtract = () => {
  return new Promise(
    (resolve, reject) => {
      if (global.deviceID && global.connection === global.strings.adb) {
        // If the phone is in ADB mode, reboot!
        adbTools.rebootToBootloader().then(() => {
          this.waitForDevice().then(() => {
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

