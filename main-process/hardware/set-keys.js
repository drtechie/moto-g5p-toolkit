const ipc = require('electron').ipcMain

ipc.on('app-online', function (event) {
  // Once the app is online get sync key from database
  global.db.settings.findOne({setting: 'mri_sync'}, function (err, docs) {
    if (docs !== null) {
      global.mainWindow.webContents.send('set-sync-key', docs.value)
    }
  })
  // Once the app is online get sync key from database
  global.db.settings.find({setting: 'response'}, function (err, docs) {
    if (docs !== null) {
      global.mainWindow.webContents.send('set-response-keys', docs)
    }
  })
})

ipc.on('set-new-sync', function (event, arg) {
  let newDoc = { setting: 'mri_sync', value: arg }
  // Find document
  global.db.settings.findOne({ setting: 'mri_sync' }, function (err, docs) {
    if (docs === null) {
      // insert the new doc
      global.db.settings.insert(newDoc, function () {   // Callback is optional
        event.sender.send('sync-set-reply', 'MRI sync key set')
      })
    } else {
      // Replace a document by another
      global.db.settings.update(docs, newDoc, {}, function (err, numReplaced) {
        event.sender.send('sync-set-reply', 'MRI sync key updated')
      })
    }
  })
})
ipc.on('set-new-response', function (event, args) {
  let update = null
  for (var arg of args) {
    let newDoc = { setting: 'response', type: arg[0], value: arg[1] }
    // Find document
    global.db.settings.findOne({ setting: 'response', type: arg[0] }, function (err, docs) {
      if (docs === null) {
        // insert the new doc
        global.db.settings.insert(newDoc)
      } else {
        // Replace a document by another
        update = true
        global.db.settings.update(docs, newDoc)
      }
    })
  }
  if (update !== null) {
    event.sender.send('response-set-reply', `Response keys updated`)
  } else {
    event.sender.send('response-set-reply', `Response keys set`)
  }
})
