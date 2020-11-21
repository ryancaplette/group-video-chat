const socket = io.connect("/");
const myPeer = new Peer(undefined)
const peers = {}

const ROOM_ID = window.location.pathname.split('/')[1]
const VIDEO_FEEDS = document.getElementById('video-feeds')
const ROOM_LINK = document.getElementById("room-link")

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
})

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

myPeer.on('open', userId => {
    socket.emit('joining-room', ROOM_ID, userId)
})

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
    video.autoplay = true;
    video.srcObject = stream
    VIDEO_FEEDS.append(video)
}

ROOM_LINK.value = window.location
function copyRoomLink() {
  ROOM_LINK.select();
  ROOM_LINK.setSelectionRange(0, 99999);
  document.execCommand("copy");
}