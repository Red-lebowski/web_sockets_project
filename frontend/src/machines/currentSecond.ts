import {spawn, MachineConfig, assign, send, Interpreter, MachineOptions, Machine} from 'xstate'

import {getWebSocketMachine} from './webSocket'
import { IsOddData, NewTimestampData } from '../@types'

// States
export enum States {
    IS_ODD = 'IS_ODD',
    CURRENT_SECOND = 'CURRENT_SECOND',
}

export type AutomataSchema = {
	states: {
        [States.IS_ODD]:{},
        [States.CURRENT_SECOND]: {}
	}
}

export enum Events {
    NEW_MESSAGE = 'NEW_MESSAGE' ,
    CONNECT = 'CONNECT',
    DISCONNECT = 'DISCONNECT',

}

export type NEW_MESSAGE = {
    type: Events.NEW_MESSAGE,
    data: any
}

export type AutomataEvents = 
    | NEW_MESSAGE
    | {type: Events.CONNECT}
    | {type: Events.DISCONNECT}
    // TODO: this is only here to not break the frontend stuff. frontend needs
    // to import the event enums from here.
    | any


// context
export type AutomataContext = {
    is_odd_child: any,
    current_second_child: any,
    showSpinner: boolean,
    isOddResponses: Array<string>,
    currentSecond: string,
    currentSecondIsConnected: boolean,
    isOddIsConnected: boolean,
}

const serverURL = process.env.REACT_APP_SERVER_URL

// TODO: i have to define the substates for parralell or else it throws a type 
// error. figure out how to do that.
const config: MachineConfig<AutomataContext, any, AutomataEvents> = {
    id: 'current_second',
    type: 'parallel',
    context: {
        is_odd_child: Interpreter,
        current_second_child: Interpreter,
        showSpinner: false,
        isOddResponses: [],
        currentSecond: 'connecting...',
        currentSecondIsConnected: false,
        isOddIsConnected: false,
    },
    states: {
        [States.CURRENT_SECOND]:{
            initial: 'IDLE',
            states:{
                IDLE: {
                    entry: assign<AutomataContext>({
                        current_second_child: () => spawn(getWebSocketMachine(`ws://${serverURL}/now-updated`, NewTimestampData)),
                    }),
                    on:{
                        CONNECT: {
                            actions: send<AutomataContext, AutomataEvents>('CONNECT', {to:(c,e) => c.current_second_child})
                        },
                        CONNECTED: {
                            target: 'CONNECTED'
                        }
                    }
                },
                CONNECTING:{
                    entry: send('CONNECT', {to: (context: AutomataContext) => context.is_odd_child}),
                    on: {
                        CONNECTED:{
                            target: 'CONNECTED'
                        }
                    }
                },
                CONNECTED:{
                    entry: assign<AutomataContext>({currentSecondIsConnected: true}),
                    on:{
                        [Events.NEW_MESSAGE]:{
                            actions: assign<AutomataContext, AutomataEvents>({
                                currentSecond: (c,e) => {
                                    console.log({newMessage: e})
                                    return e.data
                                }
                            })
                        },
        
                    }
                }
            },
        },
        [States.IS_ODD]: {
            initial: 'IDLE',
            states: {
                IDLE:{
                    entry: assign<AutomataContext>({
                        is_odd_child: () => spawn(getWebSocketMachine(`ws://${serverURL}/is-odd`, IsOddData))     
                    })
                },
                CONNECTED: {
                    entry: assign<AutomataContext>({isOddIsConnected: true}),
                    on: {
                        [Events.NEW_MESSAGE]: {
                            actions:[
                                (c,e) => console.log(c,e),
                                assign<AutomataContext, AutomataEvents>({
                                    currentSecond: (c,e) => e.data
                                })
                            ]
                        }
                    }
                }
            },
        },
    }
}


export const machine = Machine(config)