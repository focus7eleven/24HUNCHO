const api = {
  newInstance: () => {
    let Notification = window.Notification
    if (Notification.permission !== 'granted') {
      Notification.requestPermission().then(() => {
        return
      })
    }

    return api
  },

  isPermissible: () => {
    return window.Notification && window.Notification.permission === 'granted'
  },

  notice: (args) => {
    let myNotification = new window.Notification(args.message, {
      body: args.description,
    })
    myNotification.onclick = args.onClick
    myNotification.onclose = args.onClose
  }

}

export default api
