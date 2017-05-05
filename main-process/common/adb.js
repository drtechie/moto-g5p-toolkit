const { exec } = require('child_process')
const _ = require('lodash')
const files = require('./files')
const fastbootTools = require('./fastboot')
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
      } else if (_.includes(deviceType, 'permissions')) {
        statusTools.setDevice(deviceID, global.strings.adbNoPermissions)
        resolve(true)
      } else if (deviceType === 'offline') {
        statusTools.setDevice(deviceID, global.strings.adbOffline)
        resolve(true)
      } else if (deviceType === 'recovery') {
        statusTools.setDevice(deviceID, global.strings.recovery)
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
      if (global.deviceID && (global.connection === global.strings.adb || global.connection === global.strings.recovery)) {
        this.execute('reboot bootloader', data => {
          resolve(data)
        })
      } else {
        reject(global.strings.noDevice)
      }
    })
}

exports.rebootToRecovery = () => {
  return new Promise(
    (resolve, reject) => {
      if (global.deviceID && (global.connection === global.strings.adb || global.connection === global.strings.recovery)) {
        this.execute('reboot recovery', data => {
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
      if (global.deviceID && (global.connection === global.strings.adb || global.connection === global.strings.recovery)) {
        this.execute('reboot', data => {
          resolve(data)
        })
      } else {
        reject(global.strings.noDevice)
      }
    })
}

exports.flashWlanCustom = () => {
  return new Promise(
    (resolve, reject) => {
      if (global.deviceID && global.connection === global.strings.recovery) {
        this.execute('shell twrp install /sdcard/wlan_custom.zip', (data) => {
          resolve('Installed zip')
        })
      } else {
        reject(global.strings.noDevice)
      }
    })
}

exports.pushWlanCustom = () => {
  return new Promise(
    (resolve, reject) => {
      if (global.deviceID && global.connection === global.strings.recovery) {
        this.execute('push ' + files.getWlanCustom() + ' /sdcard/', () => {
          resolve('File Pushed')
        })
      } else {
        reject('Pushing file failed.')
      }
    })
}

exports.flashSuperSU = () => {
  return new Promise(
    (resolve, reject) => {
      if (global.deviceID && global.connection === global.strings.recovery) {
        this.execute('shell twrp install /sdcard/SR3-SuperSU-v2.79-SR3-20170114223742.zip', (data) => {
          resolve('Installed zip')
        })
      } else {
        reject(global.strings.noDevice)
      }
    })
}

exports.pushSuperSU = () => {
  return new Promise(
    (resolve, reject) => {
      if (global.deviceID && global.connection === global.strings.recovery) {
        this.execute('push ' + files.getSuperSU() + ' /sdcard/', () => {
          resolve('File Pushed')
        })
      } else {
        reject('Pushing file failed.')
      }
    })
}

exports.waitForRecoveryDevice = () => {
  return new Promise(
    (resolve, reject) => {
      if (global.deviceID && global.connection === global.strings.recovery) {
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
          if (count > 10) {
            clearInterval(intervalObject)
            reject(global.strings.noDevice)
          }
        }, 5000)
      }
    })
}

exports.waitForADBDevice = () => {
  return new Promise(
    (resolve, reject) => {
      if (global.deviceID && global.connection === global.strings.adb) {
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

exports.startFlashWlanCustom = () => {
  return new Promise(
    (resolve, reject) => {
      if (global.deviceID && global.connection === global.strings.adb) {
        // If the phone is in ADB mode, reboot to recovery!
        this.rebootToRecovery().then(() => {
          this.waitForRecoveryDevice().then(() => {
            this.pushWlanCustom().then(() => {
              this.flashWlanCustom().then((data) => {
                resolve(data)
              }).catch((error) => {
                reject(error)
              })
            }).catch((error) => {
              reject(error)
            })
          }).catch((error) => {
            reject(error)
          })
        }).catch((error) => {
          reject(error)
        })
      } else if (global.deviceID && global.connection === global.strings.fastboot) {
        reject('Reboot device to recovery mode')
      } else if (global.deviceID && global.connection === global.strings.recovery) {
        this.pushWlanCustom().then(() => {
          this.flashWlanCustom().then((data) => {
            resolve(data)
          }).catch((error) => {
            reject(error)
          })
        }).catch((error) => {
          reject(error)
        })
      } else {
        reject(global.strings.noDevice)
      }
    })
}

exports.startFlashSuperSU = () => {
  return new Promise(
    (resolve, reject) => {
      if (global.deviceID && global.connection === global.strings.adb) {
        // If the phone is in ADB mode, reboot to recovery!
        this.rebootToRecovery().then(() => {
          this.waitForRecoveryDevice().then(() => {
            this.pushSuperSU().then(() => {
              this.flashSuperSU().then((data) => {
                resolve(data)
              }).catch((error) => {
                reject(error)
              })
            }).catch((error) => {
              reject(error)
            })
          }).catch((error) => {
            reject(error)
          })
        }).catch((error) => {
          reject(error)
        })
      } else if (global.deviceID && global.connection === global.strings.fastboot) {
        reject('Reboot device to recovery mode')
      } else if (global.deviceID && global.connection === global.strings.recovery) {
        this.pushSuperSU().then(() => {
          this.flashSuperSU().then((data) => {
            resolve(data)
          }).catch((error) => {
            reject(error)
          })
        }).catch((error) => {
          reject(error)
        })
      } else {
        reject(global.strings.noDevice)
      }
    })
}

exports.doADBBackup = (filename) => {
  return new Promise(
    (resolve, reject) => {
      if (global.deviceID && global.connection === global.strings.adb) {
        this.execute('backup -all -apk -f ' + filename, () => {
          resolve('Backup created')
        })
      } else {
        reject('Backup creation failed.')
      }
    })
}

exports.createAndroidBackup = (filename) => {
  return new Promise(
    (resolve, reject) => {
      if (global.deviceID && global.connection === global.strings.adb) {
        this.doADBBackup(filename).then((data) => {
          resolve(data)
        }).catch((error) => {
          reject(error)
        })
      } else if (global.deviceID && global.connection === global.strings.fastboot) {
        fastbootTools.rebootSystem().then(() => {
          this.waitForADBDevice().then(() => {
            this.doADBBackup(filename).then((data) => {
              resolve(data)
            }).catch((error) => {
              reject(error)
            })
          }).catch((error) => {
            reject(error)
          })
        }).catch((error) => {
          reject(error)
        })
      } else if (global.deviceID && global.connection === global.strings.recovery) {
        this.rebootSystem().then(() => {
          this.waitForADBDevice().then(() => {
            this.doADBBackup(filename).then((data) => {
              resolve(data)
            }).catch((error) => {
              reject(error)
            })
          }).catch((error) => {
            reject(error)
          })
        }).catch((error) => {
          reject(error)
        })
      } else {
        reject(global.strings.noDevice)
      }
    })
}

exports.doTWRPBackup = (filename, arg) => {
  return new Promise(
    (resolve, reject) => {
      if (global.deviceID && global.connection === global.strings.recovery) {
        let command = ''
        if (filename) {
          command += 'backup --twrp -f '+ filename + ' '
        } else {
          command += 'shell twrp backup '
        }
        if (arg.system) {
          switch(filename) {
            case null:
              command += 'S'
              break;
            default:
              command += '--system '
          }
        }
        if (arg.data) {
          switch(filename) {
            case null:
              command += 'D'
              break;
            default:
              command += '--data '
          }
        }
        if (arg.cache) {
          switch(filename) {
            case null:
              command += 'C'
              break;
            default:
              command += '--cache '
          }
        }
        if (arg.boot) {
          switch(filename) {
            case null:
              command += 'B'
              break;
            default:
              command += '--boot '
          }
        }
        if (arg.compress) {
          switch(filename) {
            case null:
              command += 'O'
              break;
            default:
              command += '--compress '
          }
        }
        this.execute(command, () => {
          resolve('Backup created')
        })
      } else {
        reject('Backup creation failed.')
      }
    })
}

exports.createNANDroidBackup = (filename, args) => {
  return new Promise(
    (resolve, reject) => {
      if (!args.system && !args.data && !args.cache && !args.boot) {
        reject('Select atleast one partition!')
      }
      else if (global.deviceID && global.connection === global.strings.adb) {
        // If the phone is in ADB mode, reboot to recovery!
        this.rebootToRecovery().then(() => {
          this.waitForRecoveryDevice().then(() => {
            this.doTWRPBackup(filename, args).then((data) => {
              resolve(data)
            }).catch((error) => {
              reject(error)
            })
          }).catch((error) => {
            reject(error)
          })
        }).catch((error) => {
          reject(error)
        })
      } else if (global.deviceID && global.connection === global.strings.fastboot) {
        reject('Reboot device to recovery mode')
      } else if (global.deviceID && global.connection === global.strings.recovery) {
        this.doTWRPBackup(filename, args).then((data) => {
          resolve(data)
        }).catch((error) => {
          reject(error)
        })
      } else {
        reject(global.strings.noDevice)
      }
    })
}

exports.checkTWRPBackups = () => {
  return new Promise(
    (resolve, reject) => {
      if (global.deviceID && (global.connection === global.strings.adb || global.connection === global.strings.recovery)) {
        this.execute('shell ls /sdcard/TWRP/BACKUPS/' + global.deviceID + '/', (data) => {
          resolve(data)
        })
      } else {
        reject('Checking backups failed.')
      }
    })
}

exports.checkTWRPPartitions = (folder) => {
  return new Promise(
    (resolve, reject) => {
      if (global.deviceID && (global.connection === global.strings.adb || global.connection === global.strings.recovery)) {
        this.execute('shell ls /sdcard/TWRP/BACKUPS/' + global.deviceID + '/' + folder + '/', (data) => {
          resolve(data)
        })
      } else {
        reject('Checking backups failed.')
      }
    })
}


exports.doTWRPRestore = (arg) => {
  return new Promise(
    (resolve, reject) => {
      if (global.deviceID && global.connection === global.strings.recovery) {
        let command = 'shell twrp restore /sdcard/TWRP/BACKUPS/' + global.deviceID +'/' + arg.folder + ' '

        if (arg.system) {
          command += 'S'
        }
        if (arg.data) {
          command += 'D'
        }
        if (arg.cache) {
          command += 'C'
        }
        if (arg.boot) {
          command += 'B'
        }
        this.execute(command, () => {
          resolve('Restored')
        })
      } else {
        reject('Restore failed.')
      }
    })
}

exports.restoreNANDroidBackup = (args) => {
  return new Promise(
    (resolve, reject) => {
      if (!args.system && !args.data && !args.cache && !args.boot) {
        reject('Select atleast one partition!')
      }
      else if (global.deviceID && global.connection === global.strings.adb) {
        // If the phone is in ADB mode, reboot to recovery!
        this.rebootToRecovery().then(() => {
          this.waitForRecoveryDevice().then(() => {
            this.doTWRPRestore(args).then((data) => {
              resolve(data)
            }).catch((error) => {
              reject(error)
            })
          }).catch((error) => {
            reject(error)
          })
        }).catch((error) => {
          reject(error)
        })
      } else if (global.deviceID && global.connection === global.strings.fastboot) {
        reject('Reboot device to recovery mode')
      } else if (global.deviceID && global.connection === global.strings.recovery) {
        this.doTWRPRestore(args).then((data) => {
          resolve(data)
        }).catch((error) => {
          reject(error)
        })
      } else {
        reject(global.strings.noDevice)
      }
    })
}