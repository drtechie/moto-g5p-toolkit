const path = require('path')

exports.getAdbPath = () => {
  if (process.platform === 'linux') {
    return path.resolve(__dirname, '../../files/adbkit/linux/adb')
  } else if (process.platform === 'darwin') {
    return path.resolve(__dirname, '../../files/adbkit/osx/adb')
  } else if (process.platform === 'win32') {
    return path.resolve(__dirname, '../../files/adbkit/windows/adb.exe')
  }
}

exports.getFastbootPath = () => {
  if (process.platform === 'linux') {
    return path.resolve(__dirname, '../../files/adbkit/linux/fastboot')
  } else if (process.platform === 'darwin') {
    return path.resolve(__dirname, '../../files/adbkit/osx/fastboot')
  } else if (process.platform === 'win32') {
    return path.resolve(__dirname, '../../files/adbkit/windows/fastboot.exe')
  }
}
