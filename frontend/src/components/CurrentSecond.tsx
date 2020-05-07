import React, { useState, useEffect, FormEvent } from 'react'

import { isOddString } from '../@types'
import { useMachine } from '@xstate/react';
import { handleIsOddWebSocketResponse } from '../webSocketHandlers'
import { webSocketMachine } from '../machines/currentSecond'

const serverURL = process.env.REACT_APP_SERVER_URL
const nowWebSocket = new WebSocket(`ws://${serverURL}/now-updated`)
const isOddWebSocket = new WebSocket(`ws://${serverURL}/is-odd`)

export default function CurrentSecond() {
  const [numberInput, setNumberInput] = useState<number>(0)
  const [isOddResults, setIsOddResults] = useState<Array<isOddString >>([])
  const [currentSecond, setCurrentSecond] = useState<String>('connecting...')
  const [webSocketStatus, setWebSocketStatus] = useState<string>('disconnected')
  const [webSocketState, updateWebSocket] = useMachine(webSocketMachine)

  useEffect(() => {

    nowWebSocket.onmessage = function (event: any) {
      setCurrentSecond(event.data)
    }

    isOddWebSocket.onmessage = function (event: MessageEvent) {
      const newResult: isOddString = handleIsOddWebSocketResponse(event)
      const newResults = isOddResults
      newResults.push(newResult)
      setIsOddResults(isOddResults)
    }

  })

  const sendNumber = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const number = numberInput
    isOddWebSocket.send(JSON.stringify({ number }))
  }
  
  const isConnected = webSocketStatus == 'connected'
  const canSubmitNumberStyle: string = webSocketState.value == 'connected' ? 
                      ''
                      : 'opacity-10 pointer-events-none'
  const inactiveButtonStyle = "opacity-50 cursor-not-allowed"

  return (
    <div className="flex justify-center bg-gray-200 w-full h-screen">

      <div className="flex flex-col w-1/3">

        <div className="w-auto underline text-center">
          {currentSecond} | {webSocketState.value}
        </div>

        <div className="flex items-stretch w-1/1 text-center">
          <div className={`flex-1 bg-blue-500 text-white font-bold py-2 px-4 rounded ${!isConnected ? '' : inactiveButtonStyle}`} 
              onClick={e => updateWebSocket('CONNECT')}
              >connect</div>
          <div className={`flex-1 bg-blue-500 text-white font-bold py-2 px-4 rounded ${isConnected ? '' : inactiveButtonStyle}`}
              onClick={e => updateWebSocket('DISCONNECT')}
          >disconnect</div>
        </div>

        <form className={`flex w-1/1 items-center border-b border-b-2 border-teal-500 py-2 ${canSubmitNumberStyle}`} onSubmit={sendNumber}>
          <input className='appearance-none bg-transparent border-none w-full text-gray-700 mr-3 py-1 px-2 leading-tight focus:outline-none' 
                type='number' onChange={e => setNumberInput(Number(e.target.value))} />
          <input className='flex-shrink-0 bg-teal-500 hover:bg-teal-700 border-teal-500 hover:border-teal-700 text-sm border-4 text-white py-1 px-2 rounded' 
                type='submit' value='is odd'/>
        </form>

        <div className="is-odd-results">
          {isOddResults.map( 
            (resultString: isOddString, id: number) => <li key={id}>{resultString}</li>
            )}
        </div>

      </div>
    </div>
  )
}
