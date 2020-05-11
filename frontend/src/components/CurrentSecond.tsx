import React, { useState, useEffect, FormEvent } from 'react'

import { isOddString } from '../@types'
import { useMachine } from '@xstate/react';

import { handleIsOddWebSocketResponse } from '../webSocketHandlers'
import { getWebSocketMachine, States, Events } from '../machines/webSocket'
import Loader from './Loader/Loader'

const serverURL = process.env.REACT_APP_SERVER_URL
const nowWebSocket = new WebSocket(`ws://${serverURL}/now-updated`)

const isOddWebSocketMachine = getWebSocketMachine(`ws://${serverURL}/is-odd`, handleIsOddWebSocketResponse);

export default function CurrentSecond() {
  const [numberInput, setNumberInput] = useState<number>(0)
  const [currentSecond, setCurrentSecond] = useState<String>('connecting...')
  const [webSocketState, updateWebSocket] = useMachine(isOddWebSocketMachine)

  useEffect(() => {

    nowWebSocket.onmessage = function (event: any) {
      setCurrentSecond(event.data)
    }

  })

  const sendNumber = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const number = numberInput
    updateWebSocket({type: Events.SEND_DATA, data: {number}})
  }
  
  const isConnected = webSocketState.value == States.CONNECTED
  const canSubmitNumberStyle: string = isConnected ? 
                      ''
                      : 'opacity-10 pointer-events-none'
  const inactiveButtonStyle = "opacity-50 cursor-not-allowed"
  const {showSpinner} = webSocketState.context

  return (
    <div className="flex justify-center bg-gray-200 w-full h-screen">

      <div className="flex flex-col w-1/3">

        <div className="flex flex-row w-auto text-center">
          <span className="flex-1 underline"> {currentSecond} </span>
          <span className="flex-1">{webSocketState.value}</span>
        </div>

        <div className="flex flex-no-wrap items-stretch w-1/1 text-center">
          <div className={`w-1/2 bg-blue-500 text-white font-bold py-2 px-4 rounded ${!isConnected && !showSpinner ? '' : inactiveButtonStyle}`} 
              onClick={e => updateWebSocket('CONNECT')}
              >connect</div>
          <div className={`w-1/2 bg-blue-500 text-white font-bold py-2 px-4 rounded ${isConnected && !showSpinner ? '' : inactiveButtonStyle}`}
              onClick={e => updateWebSocket('DISCONNECT')}
          >disconnect</div>
          <span className='w-1/5 flex justify-around items-center'>
            {showSpinner ? <Loader/> : ''}
          </span>
        </div>

        <form className={`flex w-1/1 items-center border-b border-b-2 border-teal-500 py-2 ${canSubmitNumberStyle}`} onSubmit={sendNumber}>
          <input className='appearance-none bg-transparent border-none w-full text-gray-700 mr-3 py-1 px-2 leading-tight focus:outline-none' 
                type='number' onChange={e => setNumberInput(Number(e.target.value))} />
          <input className='flex-shrink-0 bg-teal-500 hover:bg-teal-700 border-teal-500 hover:border-teal-700 text-sm border-4 text-white py-1 px-2 rounded' 
                type='submit' value='is odd'/>
        </form>

        <div className="is-odd-results">
          {webSocketState.context.messagesReceived.map( 
            (resultString: isOddString, id: number) => <li key={id}>{resultString}</li>
            )}
        </div>

      </div>
    </div>
  )
}
