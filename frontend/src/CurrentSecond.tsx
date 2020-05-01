import React, { useState, useEffect } from 'react'

interface CurrentSecondResponse {
    time: String
}


async function getCurrentSecond(){
    const currentSecond: CurrentSecondResponse = await fetch(`http://${process.env.REACT_APP_SERVER_URL}/now`)
                                        .then(res => res.json())
                                        .catch(console.error)
    return currentSecond?.time || 'server error'
}


export default function CurrentSecond(){
    const [currentSecond, setCurrentSecond] = useState<String>('none')

    useEffect(()=>{
        const ws = new WebSocket(`ws://${process.env.REACT_APP_SERVER_URL}/now-updated`);
        ws.onmessage = function(event) {
            setCurrentSecond(event.data)
        };
    }, [])

    return (
        <div className="">
            The current second is: {currentSecond}
        </div>
    )
}