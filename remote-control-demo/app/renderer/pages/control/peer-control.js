const EventEmitter = require('events')
const peer = new EventEmitter()
//以下应该是peer-puppet的代码
const {ipcRenderer, desktopCapturer} = require('electron')

// peer.on('robot', (type, data) => {
//     if (type === 'mouse') {
//         data.screen = {
//             width: window.screen.width,
//             height: window.screen.height
//         }
//     }
//     setTimeout(() => {
//         ipcRenderer.send('robot', type, data)
//     }, 2000)
// })

const pc = new window.RTCPeerConnection({})
const dc = pc.createDataChannel('robotchannel', {reliable: false})
dc.onopen = function() {
    peer.on('robot', (type, data) => {
        dc.send(JSON.stringify({type, data}))
    })
}

dc.onmessage = function(event) {
    console.log('message', event)
}

dc.onerror = e => {
    console.log('Error' + e)
}

async function createOffer() {
    const offer = await pc.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: true
    })
    await pc.setLocalDescription(offer)
    console.log('pc offer', JSON.stringify(offer))
    return pc.localDescription
}

createOffer().then((offer) => {
    ipcRenderer.send('forward', 'offer', {type: offer.type, sdp: offer.sdp})
})

async function setRemote(answer) {
    console.log('这里暂时没问题')
    await pc.setRemoteDescription(answer)
    console.log('create-answer', pc)
}

ipcRenderer.on('answer', (e, answer) => {
    setRemote(answer)
})
window.setRemote = setRemote

pc.onicecandidate = e => {
    console.log('candidate', JSON.stringify(e.candidate))
    if (e.candidate) {
        ipcRenderer.send('forward', 'control-candidate', e.candidate)
    }
}

ipcRenderer.on('candidate', (e, candidate) => {
    addIceCandidate(candidate)
})

let candidates = []

async function addIceCandidate(candidate) {
    if (!candidate || !candidate.type) return
    candidates.push(candidate)
    if (pc.remoteDescription && pc.remoteDescription.type) {
        for (let i = 0; i < candidates.length; i++) {
            await pc.addIceCandidate(new RTCIceCandidate(candidates[i]))
        }
        candidates = []
    }
}

pc.onaddstream = function(e) {
    console.log('add-stream', e)
    peer.emit('add-stream', e.stream)
}

module.exports = peer