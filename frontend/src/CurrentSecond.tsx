import React, { useState, useEffect, FormEvent } from 'react'

const serverURL = process.env.REACT_APP_SERVER_URL
const nowWebSocket = new WebSocket(`ws://${serverURL}/now-updated`)
const isOddWebSocket = new WebSocket(`ws://${serverURL}/is-odd`)

export default function CurrentSecond() {
  const [numberInput, setNumberInput] = useState<number>(0)
  const [numbers, setNumbers] = useState<Array<IsOddObject>>([])
  const [currentSecond, setCurrentSecond] = useState<String>('connecting...')
  const [canSubmitNumber, setCanSubmitNumber] = useState<Boolean>(false)

  useEffect(() => {

    nowWebSocket.onmessage = function (event: any) {
      setCurrentSecond(event.data)
    }

    isOddWebSocket.onopen = () => setCanSubmitNumber(true)

    isOddWebSocket.onmessage = function (event) {
      const result: IsOddObject = JSON.parse(event.data)
      const newNumbers = numbers
      newNumbers.push(result)
      setNumbers(newNumbers)
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
          <input type='number' onChange={e => setNumberInput(Number(e.target.value))} />
          <input type='submit' value='is odd'/>
        </form>

        <div className="is-odd-results">
          {numbers.map(function (item: IsOddObject, id: number) {
            return (<li key={id}>{item.number}|{item.is_odd}</li>)
          })}
        </div>

      </div>
    </div>
  )
}

enum SocketState {
  Connecting = 0,
  Open = 1,
  Closing = 2,
  Closed = 3,
}

interface CurrentSecondResponse {
  time: String
}

interface IsOddObject {
  number: number
  is_odd: string
}