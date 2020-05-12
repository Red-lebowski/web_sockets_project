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
    DISCONNECTED = 'DISCONNECTED',
    IS_ODD_FORM_SUBMIT = 'IS_ODD_FORM_SUBMIT',
}

export type NEW_MESSAGE = {
    type: Events.NEW_MESSAGE,
    data: any
}
export type IS_ODD_FORM_SUBMIT = {
    type: Events.IS_ODD_FORM_SUBMIT,
    number: number
}

export type AutomataEvents = 
    | NEW_MESSAGE
    | IS_ODD_FORM_SUBMIT
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

// actions
// this event should match the schema defined in the webSocket machine.
// export const spawnIsOddChild = 
export const sendFormDataToChild = send<AutomataContext, AutomataEvents>({
        type: 'SEND_DATA',
        data: (c: AutomataContext,e: IS_ODD_FORM_SUBMIT) => e.number
    },{
        to: c => c.is_odd_child
    })

export const appendIsOddResponse = assign<AutomataContext, AutomataEvents>({
    isOddResponses: (c, e) => {
        console.log(e)
        const {isOddResponses} = c
        isOddResponses.push(e.data)
        return isOddResponses
    }
})

// guards
export const isIsOddEvent = (c: AutomataContext, e: AutomataEvents) => 
    e.socketUrl.includes('is-odd')
export const isNewTimestampEvent = (c: AutomataContext, e: AutomataEvents) => 
    e.socketUrl.includes('now-updated')


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
                        current_second_child: () => spawn(getWebSocketMachine(`ws://${serverURL}/now-updated`, NewTimestampData), 'now'),
                    }),
                    on:{
                        '': 'DISCONNECTED'
                    }
                },
                CONNECTING:{
                    entry: send('CONNECT', {to: (context: AutomataContext) => context.current_second_child}),
                    on: {
                        CONNECTED:{
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
                                currentSecond: (c,e) => e.data
                            }),
                            cond: isNewTimestampEvent,

                        },
                        [Events.DISCONNECT]:{
                            actions: send<AutomataContext, AutomataEvents>(
                                'DISCONNECT',
                                {to: c => c.current_second_child}
                            )
                        },
                        [Events.DISCONNECTED]:{
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
            initial: 'IDLE',
            states: {
                IDLE:{
                    entry: assign<AutomataContext>({
                        is_odd_child: () => spawn(getWebSocketMachine(`ws://${serverURL}/is-odd`, IsOddData), 'is_odd')     
                    }),
                    on:{
                        '':{
                            target: 'DISCONNECTED'
                        }
                    }
                },
                CONNECTING:{
                    entry: send('CONNECT', {to: context => context.is_odd_child}),
                    on: {
                        CONNECTED:{
                            target: 'CONNECTED',
                            cond: isIsOddEvent,
                        }
                    }
                },
                CONNECTED: {
                    entry: assign<AutomataContext>({isOddIsConnected: true}),
                    on: {
                        [Events.IS_ODD_FORM_SUBMIT]:{
                            actions: 'sendFormDataToChild'
                        },
                        [Events.NEW_MESSAGE]: {
                            actions: 'appendIsOddResponse',
                            cond: isIsOddEvent,
                        },
                        [Events.DISCONNECT]:{
                            actions: send<AutomataContext, AutomataEvents>(
                                'DISCONNECT',
                                {to: c => c.is_odd_child}
                            )
                        },
                        [Events.DISCONNECTED]:{
                            target: 'DISCONNECTED',
                            cond: isIsOddEvent,
                        }
                    }
                },
                DISCONNECTED:{
                    entry: assign<AutomataContext>({isOddIsConnected: false}),
                    on:{
                        // this is a shared event with current_second. They're controlled by the same button so it makes sense
                        CONNECT: {
                            target: 'CONNECTING'
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
    },
    guards: {
        isIsOddEvent,
        isNewTimestampEvent,
    }
}


export const machine = Machine(config, options)