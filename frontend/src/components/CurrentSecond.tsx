import React, { useState, useEffect } from 'react'

import { useMachine } from '@xstate/react';

import {machine} from '../machines/currentSecond'
import Loader from './Loader/Loader'

export default function CurrentSecond() {
  const [numberInput, setNumberInput] = useState<number>(0)
  const [socketState, updateSocket] = useMachine(machine, {devTools: true})

  const sendNumber = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    // TODO: replace the state value to the value in event.target
    const number = numberInput
    // updateSocket({type: Events.SEND_DATA, data: {number}})
  }
  
  const isConnected = socketState.context.currentSecondIsConnected
  const canSubmitNumberStyle: string = isConnected ? 
                      ''
                      : 'opacity-10 pointer-events-none'
  const inactiveButtonStyle = "opacity-50 cursor-not-allowed"
  const showSpinner = Object.values(socketState.value).includes('CONNECTING')
  
  return (
    <div className="flex justify-center bg-gray-200 w-full h-screen">

      <div className="flex flex-col w-1/3">

        <div className="flex flex-row w-auto text-center">
          <span className="flex-1 underline"> {socketState.context.currentSecond} </span>
          <span className="flex-1">state</span>
        </div>

        <div className="flex flex-no-wrap items-stretch w-1/1 text-center">
          <div className={`w-1/2 bg-blue-500 text-white font-bold py-2 px-4 rounded ${!isConnected && !showSpinner ? '' : inactiveButtonStyle}`} 
              onClick={e => updateSocket('CONNECT')}
              >connect</div>
          <div className={`w-1/2 bg-blue-500 text-white font-bold py-2 px-4 rounded ${isConnected && !showSpinner ? '' : inactiveButtonStyle}`}
              onClick={e => updateSocket('DISCONNECT')}
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
          {socketState.context.isOddResponses.map( 
            (resultString: string, id: number) => <li key={id}>{resultString}</li>
            )}
        </div>

      </div>
    </div>
  )
}
