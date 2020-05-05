import React, { useState, useEffect, FormEvent } from 'react'
import { handleIsOddWebSocketResponse } from './webSocketHandlers'
import { isOddString } from './@types'

const serverURL = process.env.REACT_APP_SERVER_URL
const nowWebSocket = new WebSocket(`ws://${serverURL}/now-updated`)
const isOddWebSocket = new WebSocket(`ws://${serverURL}/is-odd`)

export default function CurrentSecond() {
  const [numberInput, setNumberInput] = useState<number>(0)
  const [isOddResults, setIsOddResults] = useState<Array<isOddString >>([])
  const [currentSecond, setCurrentSecond] = useState<String>('connecting...')
  const [canSubmitNumber, setCanSubmitNumber] = useState<Boolean>(false)

  useEffect(() => {

    nowWebSocket.onmessage = function (event: any) {
      setCurrentSecond(event.data)
    }

    isOddWebSocket.onopen = () => setCanSubmitNumber(true)

    isOddWebSocket.onmessage = function (event: MessageEvent) {
      const newResult: isOddString = handleIsOddWebSocketResponse(event)
      const newResults = isOddResults
      isOddResults.push(newResult)
      setIsOddResults(isOddResults)
    }

  })

  const sendNumber = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const number = numberInput
    isOddWebSocket.send(JSON.stringify({ number }))
  }

  const isOddStyle = canSubmitNumber ? 
                      {}
                      : {filter: 'blur(1px)', pointEvents: 'none'}

  return (
    <div className="current-second-container">
      <div className="current-second">
        The current second is: {currentSecond}
      </div>

      <div className="is-odd-calc" style={isOddStyle}>
        <form className="is-odd-form" onSubmit={sendNumber}>
          <input type='number' defaultValue={3} onChange={e => setNumberInput(Number(e.target.value))} />
          <input type='submit' value='is odd'/>
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
