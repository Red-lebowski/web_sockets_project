import {spawn, MachineConfig, assign, send, Interpreter} from 'xstate'

import {getWebSocketMachine} from './webSocket'
import { IsOddData } from '../@types'

// States
export enum States {
    IS_ODD = 'IS_ODD',
    CURRENT_SECOND = 'CURRENT_SECOND',
}

export type AutomataSchema = {
	states: {
		[key in States]: {}
	}
}

export enum Events {
    NEW_RESPONSE = 'NEW_RESPONSE' ,

}

export type NEW_RESPONSE = {
    type: Events.NEW_RESPONSE,
    data: any
}

export type AutomataEvents = 
    | NEW_RESPONSE


// context
export type AutomataContext = Partial<{
    is_odd_child: any,
    current_second_child: any,
    showSpinner: boolean,
    isOddResponses: Array<string>,
    currentSecond: string,
}>

const serverURL = process.env.REACT_APP_SERVER_URL

const config: MachineConfig<AutomataContext, AutomataSchema, AutomataEvents> = {
    id: 'current_second',
    type: 'parallel',
    context: {
        is_odd_child: Interpreter,
        current_second_child: Interpreter,
        showSpinner: false,
        isOddResponses: [],
        currentSecond: ''
    },
    states: {
        [States.IS_ODD]: {
            initial: 'idle',
            states: {
                idle:{
                    entry: assign({
                        current_second_child: () => spawn(getWebSocketMachine(`ws://${serverURL}/now-updated`, t.any))     
                    })
                },
                CONNECTED: {
                    on: {
                        [Events.NEW_RESPONSE]: {
                            actions: assign<AutomataContext, AutomataEvents>({
                                currentSecond: (c,e) => e.data
                            })
                        }
                    }
                }
            },
        },
        [States.CURRENT_SECOND]:{
            initial: 'idle',
            states:{
                idle: {
                    entry: assign({
                        is_odd_child: () => spawn(getWebSocketMachine(`ws://${serverURL}/is-odd`, IsOddData)),
                    })
                },
                CONNECTING:{
                    entry: send('CONNECT', {to: (context: AutomataContext) => context.is_odd_child})
                },
                CONNECTED:{
                    on:{
                        [Events.NEW_RESPONSE]:{
                            actions: assign<AutomataContext, AutomataEvents>({
                                isOddResponses: (c,e) => {
                                    const {isOddResponses} = c
                                    isOddResponses?.push(e.data)
                                    return isOddResponses
                                }
                            })
                        },
        
                    }
                }
            },
        }
    }
}
