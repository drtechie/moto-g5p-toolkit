const { exec } = require('child_process')
const deferred = require('deferred')
const _ = require('lodash')
const files = require('./files')
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
  let def = deferred()
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
    def.resolve(deviceArray)
  })
  return def.promise
}

exports.getMoto = () => {
  let def = deferred()
  this.getPhones().done(devices => {
    if (devices.length > 0) {
      forEach(devices, (device) => {
        this.checkMotoName(device.id).done(foundName => {
          if (foundName) {
            def.resolve(foundName)
          }
        })
      })
    } else {
      def.resolve(false)
    }
  })
  return def.promise
}

exports.checkMotoName = (deviceID) => {
  let def = deferred()
  let found = false
  this.execute('-s ' + deviceID + ' shell getprop ro.hw.device', name => {
    if (_.includes(name, 'potter')) {
      found = true
      global.deviceID = deviceID
      global.connection = 'ADB'
    } else {
      found = false
      global.deviceID = null
      global.connection = null
    }
    def.resolve(found)
  })
  return def.promise
}
