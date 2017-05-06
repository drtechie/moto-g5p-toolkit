const storage = require('electron-json-storage')

const toolkitBtns = document.querySelectorAll('.js-container-target')
// Listen for toolkit button clicks
Array.prototype.forEach.call(toolkitBtns, function (btn) {
  btn.addEventListener('click', function (event) {
    event.target.parentElement.classList.toggle('is-open')

    // Save currently active toolkit button in localStorage
    storage.set('activeToolkitButtonId', event.target.getAttribute('id'), function (err) {
      if (err) return console.error(err)
    })
  })
})

// Default to the toolkit that was active the last time the app was open
storage.get('activeToolkitButtonId', function (err, id) {
  if (err) return console.error(err)
  if (id && id.length) document.getElementById(id).click()
})
