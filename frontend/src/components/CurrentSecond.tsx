import React, { useState } from 'react'

import { useMachine } from '@xstate/react';

import {machine, Events} from '../machines/currentSecond'
import Loader from './Loader/Loader'
import { IsOddData } from '../@types';

export default function CurrentSecond() {
  const [socketState, updateSocket] = useMachine(machine, {devTools: true})

  const sendNumber = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    // @ts-ignore
    const number = document.getElementById('number-input').value
    updateSocket({type: Events.IS_ODD_FORM_SUBMIT, data: {number}})
  }
  
  const isConnected = socketState.context.isOddIsConnected
  const inactiveStyle = 'opacity-50 pointer-events-none'
  const showSpinner = Object.values(socketState.value).includes('CONNECTING')
  const stateString = Object.values(socketState.value).join(' | ')

  return (
    <div className="flex justify-center bg-gray-200 w-full h-screen">

      <div className="flex flex-col w-2/3">

        <div className="flex flex-row w-auto text-center">
          <span className="flex-1 underline"> {socketState.context.currentSecond.toLocaleString('ko-KR', { timeZone: 'UTC' })} </span>
          <span className="flex-1">{stateString}</span>
        </div>

        <div className="flex flex-no-wrap items-stretch w-1/1 text-center">
          <div className={`w-1/2 bg-blue-500 text-white font-bold py-2 px-4 rounded ${!isConnected && !showSpinner ? '' : inactiveStyle}`} 
              onClick={e => updateSocket(Events.CONNECT)}
              >connect</div>
          <div className={`w-1/2 bg-blue-500 text-white font-bold py-2 px-4 rounded ${isConnected && !showSpinner ? '' : inactiveStyle}`}
              onClick={e => updateSocket(Events.DISCONNECT)}
              >disconnect</div>
          <span className='w-1/5 flex justify-around items-center'>
            {showSpinner ? <Loader/> : ''}
          </span>
        </div>

        <form className={`flex w-1/1 items-center border-b border-b-2 border-teal-500 py-2 ${!isConnected && inactiveStyle}`} onSubmit={sendNumber}>
          <input id='number-input' className='appearance-none bg-transparent border-none w-full text-gray-700 mr-3 py-1 px-2 leading-tight focus:outline-none' 
                type='number'/>
          <input className='flex-shrink-0 bg-teal-500 hover:bg-teal-700 border-teal-500 hover:border-teal-700 text-sm border-4 text-white py-1 px-2 rounded' 
                type='submit' value='is odd'/>
        </form>

        <div className="is-odd-results">
          {socketState.context.isOddResponses.map( 
            (result: IsOddData, id: number) => <li key={id}>{result.number}|{result.is_odd}</li>
            )}
        </div>

      </div>
    </div>
  )
}
