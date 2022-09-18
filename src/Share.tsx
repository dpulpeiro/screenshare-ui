import React, { useEffect, useRef, useState } from 'react'
import {toast} from 'react-hot-toast';

function Share() {
  const uuid = crypto.randomUUID()
  const ws = useRef<WebSocket>(
    new WebSocket(
      `${process.env.NODE_ENV === 'development' ? 'ws' : 'wss'}://${
        process.env.REACT_APP_API
      }/ws/${uuid}`,
    ),
  )
  const url = `${process.env.NODE_ENV === 'development' ? 'http' : 'https'}://${
    process.env.REACT_APP_APP
  }/view/${uuid}`
  const pc = useRef<any>()
  const [options, setOptions] = useState({
    video: {
      aspectRatio: 'default',
      frameRate: '30',
      resolutions: '720p',
      cursor: 'default',
      displaySurface: 'default',
      logicalSurface: 'default',
    },
  })
  useEffect(() => {
    if (!navigator.mediaDevices.getDisplayMedia) {
      const error = 'Your browser does NOT supports getDisplayMedia API.'
      throw new Error(error)
    }
    // const pcConfig = undefined
    ws.current.onmessage = (message: any) => {
      const msg = JSON.parse(message.data)
      if (msg.type == 'start-communication') {
        const data = {
          type: 'video-offer',
          data: pc.current.localDescription,
          clientID: msg.clientID,
        }
        ws.current.send(JSON.stringify(data))
        pc.current.setLocalDescription(pc.current.localDescription)
      }
      if (msg.type == 'video-answer') {
        pc.current.setRemoteDescription(new RTCSessionDescription(msg.data))
      }
      if (msg.type === 'new-ice-candidate') {
        pc.current.addIceCandidate(new RTCIceCandidate(msg.data))
      }
    }
    const pcConfig = {
      'iceServers': [
        {
          urls: 'stun:openrelay.metered.ca:80',
        },
        {
          urls: 'turn:openrelay.metered.ca:80',
          username: 'openrelayproject',
          credential: 'openrelayproject',
        },
        {
          urls: 'turn:openrelay.metered.ca:443',
          username: 'openrelayproject',
          credential: 'openrelayproject',
        },
        {
          urls: 'turn:openrelay.metered.ca:443?transport=tcp',
          username: 'openrelayproject',
          credential: 'openrelayproject',
        },
      ]
    }

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
  })
  const startSharingScreen = () => {
    invokeGetDisplayMedia(
      (screen: any) => {
        pc.current.addStream(screen)
        pc.current.createOffer().then((sdp: any) => {
          pc.current.setLocalDescription(sdp)
        })

      },
      (e: any) => {
        const error = {
          name: e.name || 'UnKnown',
          message: e.message || 'UnKnown',
          stack: e.stack || 'UnKnown',
        }

        if (error.name === 'PermissionDeniedError') {
          if (location.protocol !== 'https:') {
            error.message = 'Please use HTTPs.'
            error.stack = 'HTTPs is required.'
          }
        }

        console.error(error.name)
        console.error(error.message)
        console.error(error.stack)

        alert(
          'Unable to capture your screen.\n\n' +
            error.name +
            '\n\n' +
            error.message +
            '\n\n' +
            error.stack,
        )
      },
    )
  }
  function invokeGetDisplayMedia(success: any, error: any) {
    let videoConstraints: any = {}

    if (options.video.aspectRatio !== 'default') {
      videoConstraints.aspectRatio = options.video.aspectRatio
    }

    if (options.video.frameRate !== 'default') {
      videoConstraints.frameRate = options.video.frameRate
    }

    if (options.video.cursor !== 'default') {
      videoConstraints.cursor = options.video.cursor
    }

    if (options.video.displaySurface !== 'default') {
      videoConstraints.displaySurface = options.video.displaySurface
    }

    if (options.video.logicalSurface !== 'default') {
      videoConstraints.logicalSurface = true
    }

    if (options.video.resolutions !== 'default') {
      if (options.video.resolutions === 'fit-screen') {
        videoConstraints.width = screen.width
        videoConstraints.height = screen.height
      }

      if (options.video.resolutions === '4K') {
        videoConstraints.width = 3840
        videoConstraints.height = 2160
      }

      if (options.video.resolutions === '1080p') {
        videoConstraints.width = 1920
        videoConstraints.height = 1080
      }

      if (options.video.resolutions === '720p') {
        videoConstraints.width = 1280
        videoConstraints.height = 720
      }

      if (options.video.resolutions === '480p') {
        videoConstraints.width = 853
        videoConstraints.height = 480
      }

      if (options.video.resolutions === '360p') {
        videoConstraints.width = 640
        videoConstraints.height = 360
      }
    }

    if (!Object.keys(videoConstraints).length) {
      videoConstraints = true
    }
    const displayMediaStreamConstraints = {
      audio: true,
      video: videoConstraints,
    }

    if (navigator.mediaDevices.getDisplayMedia) {
      navigator.mediaDevices
        .getDisplayMedia(displayMediaStreamConstraints)
        .then(success)
        .catch(error)
    } else {
      console.log('error')
    }
  }

  return (
    <div
      className={
        'flex items-center justify-center h-screen w-screen bg-gradient-to-r from-blue-300 via-green-200 to-yellow-300'
      }
    >
      <div>
        <button
          type='button'
          onClick={startSharingScreen}
          className='text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:bg-gradient-to-l focus:ring-4 focus:outline-none focus:ring-purple-200 dark:focus:ring-purple-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2'
        >
          Start Sharing screen
        </button>
        <div className="relative rounded-lg ">
          <input
              value={url}
              className="block p-[7px]  pl-4 w-full text-sm text-gray-900 bg-white rounded-lg border border-gray-300"
              disabled
          />
          <button
              onClick={()=>{
                navigator.clipboard.writeText(url)
                toast.success('Link copied to clipboard')
              }}
              className="text-white font-bold absolute right-1.5 bottom-1 focus:outline-none bg-orange-400 hover:bg-orange-500 font-medium rounded-lg text-sm px-2 py-1"
          >
            Crear
          </button>
        </div>

    </div>
    </div>
  )
}

export default Share
