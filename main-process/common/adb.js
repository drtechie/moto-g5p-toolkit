const { exec } = require('child_process')
const _ = require('lodash')
const files = require('./files')
const statusTools = require('./status')
const adb = files.getAdbPath()
const { forEach } = require('async-foreach')

exports.execute = (args, callback) => {
  let cmd = adb + ' ' + args
  exec(cmd, (error, stdout, stderr) => {
    if (error) console.log(error)
    if (stderr) {
      callback(stderr)
    }
    if (stdout) {
      callback(stdout)
    } else {
      callback('Command got executed but there was no output from phone')
    }
  })
}

exports.getPhones = () => {
  return new Promise(
    (resolve) => {
      this.execute('devices', data => {
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
      })
    })
}

exports.getMoto = () => {
  return new Promise(
    (resolve, reject) => {
      this.getPhones().then(devices => {
        if (devices.length > 0) {
          forEach(devices, (device) => {
            this.checkMotoName(device.id, device.type).then(foundName => {
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
      })
    })
}

exports.checkMotoName = (deviceID, deviceType) => {
  return new Promise(
    (resolve, reject) => {
      if (deviceType === 'unauthorized') {
        statusTools.setDevice(deviceID, global.strings.adbUnauthorized)
        resolve(true)
      } else {
        this.execute('-s ' + deviceID + ' shell getprop ro.hw.device', name => {
          if (_.includes(name, global.strings.deviceName)) {
            statusTools.setDevice(deviceID, global.strings.adb)
            resolve(true)
          } else {
            statusTools.setDevice(null, null)
            reject(false)
          }
        })
      }
    })
}

exports.rebootToBootloader = () => {
  return new Promise(
    (resolve, reject) => {
      if (global.deviceID && global.connection === global.strings.adb) {
        this.execute('reboot bootloader', data => {
          resolve(data)
        })
      } else {
        reject(global.strings.noDevice)
      }
    })
}
