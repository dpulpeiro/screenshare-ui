import React, { useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'

function View() {
  const { uuid } = useParams()
  const remoteVideoref = React.useRef<any>()
  const textref = React.useRef<any>()
  const clientID = crypto.randomUUID()
  const ws = useRef<WebSocket>(
    new WebSocket(
      `${process.env.NODE_ENV === 'development' ? 'ws' : 'wss'}://${
        process.env.REACT_APP_API
      }/ws/${uuid}/${clientID}`,
    ),
  )

  const pc = useRef<any>()
  useEffect(() => {
    const pcConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
      ],
    }
    ws.current.onopen = (m) => {
      ws.current.send(JSON.stringify({ type: 'start-communication', clientID: clientID }))
    }
    ws.current.onmessage = (message: any) => {
      const data = JSON.parse(message.data)
      if (data.type == 'video-offer') {
        pc.current.setRemoteDescription(new RTCSessionDescription(data.data))
        pc.current.createAnswer().then((sdp: any) => {
          const data = { type: 'video-answer', data: sdp }
          ws.current.send(JSON.stringify(data))
          pc.current.setLocalDescription(sdp)
        })
      }
      if (data.type === 'new-ice-candidate') {
        pc.current.addIceCandidate(new RTCIceCandidate(data.data))
      }
    }
    // const pc_config1 = {
    //   "iceServers": [
    //     {
    //       urls: 'stun:[STUN_IP]:[PORT]',
    //       'credentials': '[YOR CREDENTIALS]',
    //       'username': '[USERNAME]'
    //     }
    //   ]
    // }

    // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection
    // create an instance of RTCPeerConnection
    pc.current = new RTCPeerConnection(pcConfig)

    // triggered when a new candidate is returned
    pc.current.onicecandidate = (e: any) => {
      // send the candidates to the remote peer
      // see addCandidate below to be triggered on the remote peer
      if (e.candidate) {
        const data = { type: 'new-ice-candidate', data: e.candidate }
        ws.current.send(JSON.stringify(data))
      }
    }

    // triggered when there is a change in connection state
    pc.current.oniceconnectionstatechange = (e: any) => {
      console.log(e)
    }

    pc.current.ontrack = (e: any) => {
      remoteVideoref.current.srcObject = e.streams[0]
    }
  }, [])

  return (
    <div className={'h-screen w-screen bg-gradient-to-r from-blue-300 via-green-200 to-yellow-300'}>
      <video
        className={'h-screen w-screen bg-gradient-to-r from-blue-300 via-green-200 to-yellow-300'}
        ref={remoteVideoref}
        controls
        autoPlay={true}
        playsInline={true}
        muted={true}
      ></video>
    </div>
  )
}

export default View
