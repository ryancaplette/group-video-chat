const socket = io.connect("/")
const myPeer = new Peer(undefined)
const peers = {}

const VIDEO_FEEDS = document.getElementById('video-feeds')
const ROOM_LINK = document.getElementById("room-link")
const ROOM_REDIRECT = document.getElementById("room-redirect")
const ROOM_ID = window.location.pathname.split('/')[1]
document.getElementById('room-name').innerText = `Current Room: ${ROOM_ID}`
document.getElementById('room-redirect').addEventListener("keyup", function(event) {
    if (event.key === 'Enter') {
        event.preventDefault()
        goLink()
    }
})

// most browsers require https for WebRTC to work
if (!navigator.mediaDevices && location.protocol !== 'https:') {
    location.replace(`https:${location.href.substring(location.protocol.length)}`)
}

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    const myVideo = document.createElement('video')
    myVideo.muted = true
    addStreamToVideoFeed(myVideo, stream)

    myPeer.on('call', call => {
        peers[call.peer] = call
        call.answer(stream)
        const video = document.createElement('video')
        video.id = call.peer
        call.on('stream', userVideoStream => {
            addStreamToVideoFeed(video, userVideoStream)
        })
    })

    socket.on('new-user', userId => {
        connectWithNewUser(userId, stream)
    })

    joinRoom()
})

function joinRoom() {
    if(myPeer.id !== null){
        socket.emit('joining-room', ROOM_ID, myPeer.id)
    }
    else{
        setTimeout(joinRoom, 250);
    }
}

function connectWithNewUser(userId, stream) {
    const call = myPeer.call(userId, stream)
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
        addStreamToVideoFeed(video, userVideoStream)
    })
    call.on('close', () => {
        video.remove()
    })

    peers[userId] = call
}


socket.on('user-disconnected', userId => {
    if (peers[userId]) {
      const peerVideo = document.getElementById(userId)
      if (peerVideo) {
        peerVideo.remove()
      }
      peers[userId].close()
    }
})

function addStreamToVideoFeed(video, stream) {
    video.autoplay = true
    video.playsInline = true
    video.srcObject = stream
    VIDEO_FEEDS.append(video)
}

ROOM_LINK.value = window.location
function copyRoomLink() {
  ROOM_LINK.select()
  ROOM_LINK.setSelectionRange(0, 99999)
  document.execCommand("copy")
}

function goLink() {
  window.location = ROOM_REDIRECT.value
}