import React, { useState, useEffect } from 'react'

interface CurrentSecondResponse {
    time: String
}


async function getCurrentSecond(){
    console.log(process.env.REACT_APP_SERVER_URL)
    const currentSecond: CurrentSecondResponse = await fetch(`${process.env.REACT_APP_SERVER_URL}/now`)
                                        .then(res => res.json())
                                        .catch(console.error)
    return currentSecond?.time || 'server error'
}


export default function CurrentSecond(){
    const [currentSecond, setCurrentSecond] = useState<String>('none')

    useEffect(() => {
        async function updateSecond(){
            const newSecond: String = await getCurrentSecond()
            setCurrentSecond(newSecond)
        }
        updateSecond()
    }, [])

    return (
        <div className="">
            The current second is: {currentSecond}
        </div>
    )
}