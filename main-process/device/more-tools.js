const ipc = require('electron').ipcMain
const adbTools = require('../common/adb')
const fastbootTools = require('../common/fastboot')

ipc.on('reboot-to-bootloader', function (event, arg) {
  event.sender.send('reboot-to-bootloader-button-reply', 'Sending command via ADB')
  adbTools.rebootToBootloader().then((data) => {
    event.sender.send('reboot-to-bootloader-button-reply', data)
  }).catch((error) => {
    event.sender.send('reboot-to-bootloader-button-reply', error)
  })
})

ipc.on('reboot-to-recovery', function (event, arg) {
  event.sender.send('reboot-to-recovery-button-reply', 'Sending command via ADB')
  adbTools.rebootToRecovery().then((data) => {
    event.sender.send('reboot-to-recovery-button-reply', data)
  }).catch((error) => {
    event.sender.send('reboot-to-recovery-button-reply', error)
  })
})

ipc.on('reboot-system', function (event, arg) {
  event.sender.send('reboot-system-button-reply', 'Sending command via ADB')
  adbTools.rebootSystem().then((data) => {
    event.sender.send('reboot-system-button-reply', data)
  }).catch((error) => {
    event.sender.send('reboot-system-button-reply', error)
  })
})

ipc.on('reboot-to-bootloader-fb', function (event, arg) {
  event.sender.send('reboot-to-bootloader-fb-button-reply', 'Sending command via Fastboot')
  fastbootTools.rebootToBootloader().then((data) => {
    event.sender.send('reboot-to-bootloader-fb-button-reply', data)
  }).catch((error) => {
    event.sender.send('reboot-to-bootloader-fb-button-reply', error)
  })
})

ipc.on('reboot-backup-fb', function (event, arg) {
  event.sender.send('reboot-backup-fb-button-reply', 'Sending command via Fastboot')
  fastbootTools.rebootSystem().then((data) => {
    event.sender.send('reboot-backup-fb-button-reply', data)
  }).catch((error) => {
    event.sender.send('reboot-backup-fb-button-reply', error)
  })
})
