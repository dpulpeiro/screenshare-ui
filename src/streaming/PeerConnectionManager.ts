export class PeerConnectionManager {
  pcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
    ],
  }
  private peerConnections: { [key: string]: any } = {}

  private ws: WebSocket
  private stream: MediaStream | undefined;

  constructor(websocketUri: string) {
    this.ws = new WebSocket(websocketUri)
    this.ws.onmessage = (message: any) => {

      const msg = JSON.parse(message.data)
      if (msg.type == 'start-communication') {
        this.setupPeerConnection(msg.clientID)
      }
      if (msg.type == 'video-answer') {
        this.peerConnections[msg.clientID].setRemoteDescription(new RTCSessionDescription(msg.data))
      }
      if (msg.type === 'new-ice-candidate') {
        this.peerConnections[msg.clientID].addIceCandidate(new RTCIceCandidate(msg.data))
        this.peerConnections[msg.clientID].addIceCandidate(new RTCIceCandidate(msg.data))
      }
    }
  }

  setupPeerConnection = (clientID: string) => {
    this.peerConnections[clientID] = new RTCPeerConnection(this.pcConfig)
    this.peerConnections[clientID].addStream(this.stream)
    this.peerConnections[clientID].createOffer().then((sdp: any) => {
      this.peerConnections[clientID].setLocalDescription(sdp)
      const data = {
        type: 'video-offer',
        data: sdp,
        clientID: clientID,
      }
      this.ws.send(JSON.stringify(data))


    })
    this.peerConnections[clientID].onicecandidate = (e: any) => {
      if (e.candidate) {
        const data = { type: 'new-ice-candidate', data: e.candidate, clientID: clientID }
        this.ws.send(JSON.stringify(data))
      }
    }

  }

  setStream = (stream: MediaStream) => {
    console.log('setting stream',stream)
    this.stream = stream
    console.log(this.stream)
  }
}
