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

exports.get32BitDriver = () => {
  return path.resolve(__dirname, '../../files/Motorola_End_User_Driver_Installation_6.3.0_32bit.msi')
}

exports.get64BitDriver = () => {
  return path.resolve(__dirname, '../../files/Motorola_End_User_Driver_Installation_6.3.0_64bit.msi')
}

exports.getTWRP = () => {
  return path.resolve(__dirname, '../../files/twrp-3.1.0-0-potter.img')
}

exports.getBootImage = () => {
  return path.resolve(__dirname, '../../files/potter_boot_test7.img')
}

exports.getWlanCustom = () => {
  return path.resolve(__dirname, '../../files/wlan_custom.zip')
}

exports.getSuperSU = () => {
  return path.resolve(__dirname, '../../files/SR3-SuperSU-v2.79-SR3-20170114223742.zip')
}
