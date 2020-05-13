import {spawn, MachineConfig, assign, send, Interpreter, MachineOptions, Machine} from 'xstate'

import {
    getWebSocketMachine, 
    Events as WS_Events, 
    AutomataEvent as WS_AutomataEvent,
} from './webSocket'
import { IsOddData, NewTimestampData } from '../@types'

// States
export enum States {
    IDLE = 'IDLE',
    IS_ODD = 'IS_ODD',
    CONNECTED = 'CONNECTED',
    CONNECTING = 'CONNECTING',
    DISCONNECTED = 'DISCONNECTED',
    CURRENT_SECOND = 'CURRENT_SECOND',
}

export type AutomataSchema = {
	states: {
        [States.CURRENT_SECOND]: {
            states:{
                [States.IDLE]:{},
                [States.CONNECTING]: {},
                [States.CONNECTED]: {},
                [States.DISCONNECTED]: {},
            }
        
        },
        [States.IS_ODD]: {
            states:{
                [States.IDLE]:{},
                [States.CONNECTING]: {},
                [States.CONNECTED]: {},
                [States.DISCONNECTED]: {},
            }
        },
	}
}

// Events
export enum Events {
    CONNECT = 'CONNECT',
    DISCONNECT = 'DISCONNECT',
    NEW_MESSAGE = 'NEW_MESSAGE',
    IS_ODD_FORM_SUBMIT = 'IS_ODD_FORM_SUBMIT',
}

export type IS_ODD_FORM_SUBMIT = {
    type: Events.IS_ODD_FORM_SUBMIT,
    data: {
        number: number
    }
}
export type CONNECT = {
    type: Events.CONNECT
}
export type DISCONNECT = {
    type: Events.DISCONNECT
}

export type AutomataEvents = 
    | IS_ODD_FORM_SUBMIT
    | CONNECT
    | DISCONNECT
    | WS_AutomataEvent
    | any


// context
export type AutomataContext = {
    is_odd_child: any,
    current_second_child: any,
    showSpinner: boolean,
    isOddResponses: Array<IsOddData>,
    currentSecond: Date | String,
    currentSecondIsConnected: boolean,
    isOddIsConnected: boolean,
}

// actions
const serverURL = process.env.REACT_APP_SERVER_URL
export const spawnCurrentSecondChild = assign<AutomataContext>({
    current_second_child: () => spawn(getWebSocketMachine(`ws://${serverURL}/now-updated`, NewTimestampData)),
})
export const spawnIsOddChild = assign<AutomataContext>({
    is_odd_child: () => spawn(getWebSocketMachine(`ws://${serverURL}/is-odd`, IsOddData))     
})


// this event should match the schema defined in the webSocket machine.
// issue here is the input event is expected to be the output event type aswell.
export const sendFormDataToChild = send<AutomataContext, any>(
    (c: AutomataContext,e: any) => ({
            type: WS_Events.SEND_DATA,
            data: {number: e.data.number}
        })
    ,{
        to: c => c.is_odd_child
    })

export const appendIsOddResponse = assign<AutomataContext, any>({
    isOddResponses: (c, e) => {
        const {isOddResponses} = c
        isOddResponses.push(e.data)
        return isOddResponses
    }
})

// guards
export const isIsOddEvent = (c: AutomataContext, e: WS_AutomataEvent) => 
    e.socketUrl.includes('is-odd')
export const isNewTimestampEvent = (c: AutomataContext, e: WS_AutomataEvent) => 
    e.socketUrl.includes('now-updated')

// Config
const config: MachineConfig<AutomataContext, AutomataSchema, AutomataEvents> = {
    id: 'current_second',
    type: 'parallel',
    context: {
        is_odd_child: Interpreter,
        current_second_child: Interpreter,
        showSpinner: false,
        isOddResponses: [],
        currentSecond: 'disconnected',
        currentSecondIsConnected: false,
        isOddIsConnected: false,
    },
    states: {
        [States.CURRENT_SECOND]:{
            initial: States.IDLE,
            states: {
                IDLE: {
                    entry: 'spawnCurrentSecondChild',
                    on:{
                        '': 'DISCONNECTED'
                    }
                },
                CONNECTING:{
                    entry: send('CONNECT', {to: (context: AutomataContext) => context.current_second_child}),
                    on: {
                        [WS_Events.CONNECTED]:{
                            target: 'CONNECTED',
                            cond: isNewTimestampEvent,
                        }
                    }
                },
                CONNECTED:{
                    entry: assign<AutomataContext>({currentSecondIsConnected: true}),
                    on:{
                        [Events.NEW_MESSAGE]:{
                            actions: assign<AutomataContext, AutomataEvents>({
                                currentSecond: (c,e) => e.data.timestamp
                            }),
                            cond: isNewTimestampEvent,
                        },
                        [Events.DISCONNECT]:{
                            actions: send<AutomataContext, AutomataEvents>(
                                'DISCONNECT',
                                {to: c => c.current_second_child}
                            )
                        },
                        [WS_Events.DISCONNECTED]:{
                            target: 'DISCONNECTED',
                            cond: isNewTimestampEvent,
                        }
                    },
                },
                DISCONNECTED:{
                    entry: assign<AutomataContext>({currentSecondIsConnected: false}),
                    on:{
                        CONNECT: {
                            target: 'CONNECTING'
                        }
                    }
                }
            },
        },
        [States.IS_ODD]: {
            initial: States.IDLE,
            states: {
                IDLE:{
                    entry: 'spawnIsOddChild',
                    on:{
                        '': {
                            target: 'DISCONNECTED'
                        }
                    }
                },
                CONNECTING:{
                    entry: send<AutomataContext, AutomataEvents>(
                                WS_Events.CONNECT,
                                {to: context => context.is_odd_child},
                            ),
                    on: {
                        [WS_Events.CONNECTED]:{
                            target: States.CONNECTED,
                            cond: isIsOddEvent,
                        }
                    }
                },
                CONNECTED: {
                    entry: assign<AutomataContext>({isOddIsConnected: true}),
                    on: {
                        [Events.IS_ODD_FORM_SUBMIT]: {
                            actions: 'sendFormDataToChild'
                        },
                        [Events.DISCONNECT]: {
                            actions: send<AutomataContext, WS_AutomataEvent>(
                                WS_Events.DISCONNECT,
                                {to: c => c.is_odd_child},
                            )
                        },
                        [WS_Events.NEW_MESSAGE]: {
                            actions: 'appendIsOddResponse',
                            cond: isIsOddEvent,
                        },
                        [WS_Events.DISCONNECTED]: {
                            target: States.DISCONNECTED,
                            cond: isIsOddEvent,
                        }
                    }
                },
                DISCONNECTED:{
                    entry: assign<AutomataContext>({isOddIsConnected: false}),
                    on:{
                        // this is a shared event with current_second. They're controlled by the same button so it makes sense
                        CONNECT: {
                            target: States.CONNECTING
                        }
                    }
                }
            },
        },
    },
}

export const options: Partial<MachineOptions<AutomataContext, AutomataEvents>> = {
    actions: {
        sendFormDataToChild,
        appendIsOddResponse,
        spawnCurrentSecondChild,
        spawnIsOddChild,
    },
    guards: {
        isIsOddEvent,
        isNewTimestampEvent,
    }
}


export const machine = Machine(config, options)