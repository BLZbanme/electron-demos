const {app, BrowserWindow, globalShortcut} = require('electron')
// const isDev = require('electron-is-dev')
// const path = require('path')
const handleIPC = require('./ipc')
const {create: createMainWindow, show: showMainWindow, close: closeMainWindow} = require('./windows/main.js')
// const {create: createControlWindow} = require('./windows/control.js')
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
    app.quit()
}
else {
    app.on('second-instance', () => {
        showMainWindow()
    })
    app.on('ready', () => {
        createMainWindow()
        // createControlWindow()
        handleIPC()
        require('./trayAndMenu')
        require('./robot.js')()
        
        // const ret = globalShortcut.register('CommandOrControl+Option+I', () => {
        //     console.log('CommandOrControl+Option+I is pressed')
        // })
        
        // if (!ret) {
        //     console.log('registration failed')
        // }
        
        // console.log(globalShortcut.isRegistered('CommandOrControl+Option+I'))
    })

    app.on('before-quit', () => {
        closeMainWindow()
    })

    app.on('activate', () => {
        showMainWindow()
    })
}

