import React, { useState, useEffect } from 'react'

const nowWebSocket = new WebSocket(`ws://${process.env.REACT_APP_SERVER_URL}/now-updated`)
const isOddWebSocket = new WebSocket(`ws://${process.env.REACT_APP_SERVER_URL}/is-odd`)

async function getCurrentSecond(){
    const currentSecond: CurrentSecondResponse = await fetch(`http://${process.env.REACT_APP_SERVER_URL}/now`)
                                        .then(res => res.json())
                                        .catch(console.error)
    return currentSecond?.time || 'server error'
}

function send(webSocket:any, message:any, callback:any) {
    waitForConnection(webSocket, function () {
        webSocket.send(message);
        if (typeof callback !== 'undefined') {
          callback();
        }
    }, 1000);
};

function waitForConnection(webSocket:any, callback:any, interval:number) {
    if (webSocket.readyState === 1) {
        callback();
    } else {
        // optional: implement backoff for interval here
        setTimeout(function () {
            waitForConnection(webSocket, callback, interval);
        }, interval);
    }
};


export default function CurrentSecond(){
    const [currentSecond, setCurrentSecond] = useState<String>('none')
    const [numbers, setNumbers] = useState<any>([])
    const [numberInput, setNumberInput] = useState<number>(0)

    useEffect(() => {
        nowWebSocket.onmessage = function(event: any) {
            setCurrentSecond(event.data)
        }
        // TODO: defint the structure of the websocket event in a type
        isOddWebSocket.onmessage = function(event){
            const result: IsOddObject = JSON.parse(event.data)
            const newNumbers = numbers
            newNumbers.push(result)
            setNumbers(newNumbers)
        }
        send(isOddWebSocket, JSON.stringify({number: 20}), console.log)
    }, [])

    const sendNumber = (number: Number) => {
        console.log('go')
        send(isOddWebSocket, JSON.stringify({number}), console.log)
    }

    return (
        <div className="">
            The current second is: {currentSecond}
            <div className="">
                <input type='number' onChange={e => setNumberInput(Number(e.target.value))}/>
                <input type='submit' value='is odd' onClick={() => sendNumber(numberInput)}/>
                {numbers.map(function(item:IsOddObject, id:number){
                    return (<li key={id}>{item.number}|{item.is_odd}</li>)
                })}
            </div>
        </div>
    )
}

interface CurrentSecondResponse {
    time: String
}

interface IsOddObject {
    number: number
    is_odd: string
}