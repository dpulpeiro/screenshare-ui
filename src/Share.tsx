import {Listbox, Transition} from '@headlessui/react'
import React, {Fragment, useEffect, useRef, useState} from 'react'
import {toast} from 'react-hot-toast'
import {CheckIcon, ChevronUpDownIcon} from '@heroicons/react/20/solid'
const aspectRatioMap = {
  '16:9':1.77, '4:3':1.33, '21:9':2.35, '14:10':1.4, '19:10':1.9
}
const config = {
  aspectRatio: ['default', '16:9', '4:3', '21:9', '14:10', '19:10'],
  frameRate: ['default', '5', '10', '15', '20', '30', '60'],
  resolutions: ['default', 'fit-screen', '4k', '1080p', '720p','480p','360p'],
  cursor: ['default', 'always', 'never', 'motion'],
  displaySurface: ['default', 'monitor', 'window', 'application', 'browser'],
  logicalSurface: ['default', 'true'],
}

function Share() {
  const uuid = crypto.randomUUID()
  const ws = useRef<WebSocket>(
    new WebSocket(
      `${process.env.NODE_ENV === 'development' ? 'ws' : 'wss'}://${
        process.env.REACT_APP_API
      }/ws/${uuid}`,
    ),
  )
  const url = useRef(`${process.env.NODE_ENV === 'development' ? 'http' : 'https'}://${
    process.env.REACT_APP_APP
  }/view/${uuid}`)
  const pc = useRef<any>()
  const [uptade, setUpdate] = useState(false)
  const toggle=()=>setUpdate(!uptade)
  const [options, setOptions] = useState({
    video: {
      aspectRatio: 'default',
      frameRate: '30',
      resolutions: '1080p',
      cursor: 'never',
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
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
      ],
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
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      videoConstraints.aspectRatio = aspectRatioMap[(options.video.aspectRatio as string)]
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
      <div className={'px-10 max-w-3xl w-full'}>
        <div className={'grid grid-cols-2 md:grid-cols-3 gap-4'}>
          {Object.keys(config).map((key: string) => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const currentOptions = config[key]
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const selectedOption = options.video[key] as string
            return (
              <Listbox
                key={key}
                value={selectedOption}
                onChange={(option) => {
                  const opt = options
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore
                  opt.video[key] = option
                  setOptions(opt)
                  toggle()
                }}
              >
                <div className='relative mt-1'>
                  <Listbox.Button className='relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm'>
                    <span className='block truncate'><span className={'capitalize font-bold'}>{key}</span>: {selectedOption}</span>
                    <span className='pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2'>
                      <ChevronUpDownIcon className='h-5 w-5 text-gray-400' aria-hidden='true' />
                    </span>
                  </Listbox.Button>
                  <Transition
                    as={Fragment}
                    leave='transition ease-in duration-100'
                    leaveFrom='opacity-100'
                    leaveTo='opacity-0'
                  >
                    <Listbox.Options className='absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm'>
                      {currentOptions.map((opt: string, personIdx: number) => (
                        <Listbox.Option
                          key={personIdx}
                          className={({ active }) =>
                            `relative cursor-default select-none py-2 pl-10 pr-4 ${
                              active ? 'bg-amber-100 text-amber-900' : 'text-gray-900'
                            }`
                          }
                          value={opt}
                        >
                          {({ selected }) => (
                            <>
                              <span
                                className={`block truncate ${
                                  selected ? 'font-medium' : 'font-normal'
                                }`}
                              >
                                {opt}
                              </span>
                              {selected ? (
                                <span className='absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600'>
                                  <CheckIcon className='h-5 w-5' aria-hidden='true' />
                                </span>
                              ) : null}
                            </>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </div>
              </Listbox>
            )
          })}
        </div>
        <button
          type='button'
          onClick={startSharingScreen}
          className='w-full text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:bg-gradient-to-l focus:ring-4
           focus:outline-none focus:ring-purple-200 dark:focus:ring-purple-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center mb-4 mt-20'
        >
          Start Sharing screen
        </button>
        <div className='relative rounded-lg '>
          <input
            value={url.current}
            className='block p-[7px]  pl-4 w-full text-sm text-gray-900 bg-white rounded-lg border border-gray-300'
            disabled
          />
          <button
            onClick={() => {
              navigator.clipboard.writeText(url.current)
              toast.success('Link copied to clipboard')
            }}
            className='text-white font-bold absolute right-1.5 bottom-1 focus:outline-none  bg-gradient-to-r from-purple-500 to-pink-500 hover:bg-gradient-to-l
           focus:outline-none font-medium rounded-lg text-sm px-2 py-1'
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  )
}

export default Share
