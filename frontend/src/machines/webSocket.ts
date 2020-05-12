import { Machine, MachineConfig, MachineOptions, assign, Sender, DoneInvokeEvent, InvokeCreator, send, sendParent, StateNode } from 'xstate'
import * as t from 'io-ts'
import { Either, fold, isLeft, isRight, right } from 'fp-ts/lib/Either'
import { validateResponse } from '../handlers/webSocketHandlers'
import {ApiResponses} from '../@types'


// states
export enum States {
	CONNECTING = 'CONNECTING',
	CONNECTED = 'CONNECTED',
	DISCONNECTED = 'DISCONNECTED',
	CONNECTION_SUCCESS = 'CONNECTION_SUCCESS',
	NEW_MESSAGE_RECEIVED = 'NEW_MESSAGE_RECEIVED',
	INVALID_MESSAGE = 'INVALID_MESSAGE',
	VALID_MESSAGE = 'VALID_MESSAGE',
}

// i might wanna add the events to this?
export type AutomataSchema = {
	states: {
		[key in States]: {}
	}
}


// Events
export enum Events {
	CONNECT = 'CONNECT',
	CONNECTED = 'CONNECTED',
	DISCONNECT = 'DISCONNECT',
	SEND_DATA = 'SEND_DATA',
	NEW_MESSAGE = 'NEW_MESSAGE',
	NEW_MESSAGE_ERROR = 'NEW_MESSAGE_ERROR',
	NEW_MESSAGE_VALID = 'NEW_MESSAGE_VALID',
}

export type Connect = {
	type: Events.CONNECT
}
export type Connected = {
	type: Events.CONNECTED
}
export type Disconnect = {
	type: Events.DISCONNECT
}
export type SendData = {
	type: Events.SEND_DATA
	data: any
}
export type NewMessage = {
	type: Events.NEW_MESSAGE
	event: MessageEvent
}
export type NewConnectedWebSocket = DoneInvokeEvent<{
	webSocket: WebSocket
}>
export type NEW_MESSAGE_ERROR = {
	type: Events.NEW_MESSAGE_ERROR,
	errors: t.Errors
}
export type NEW_MESSAGE_VALID = {
	type: Events.NEW_MESSAGE_VALID,
	msg: any
}

export type AutomataEvent =
	| Connect
	| Connected
	| Disconnect
	| NewMessage
	| SendData
	| NewConnectedWebSocket


// Context
export type AutomataContext = {
	showSpinner: boolean,
	webSocketUrl: string,
	webSocket?: WebSocket,
	dataType: t.Mixed,
	isConnected: boolean,
	// any should be the type of the api response
	msgE: Either<t.Errors, any>,
}

// this is just to stop typescript whinging when provided to withContext
export const initialContext: AutomataContext = {
	isConnected: false,
	webSocketUrl: '',
	showSpinner: false,
	dataType: t.any,
	msgE: right(null),
}


// Services

export const showSpinner = assign<AutomataContext>({
	showSpinner: (c: AutomataContext, e: any): any => true
})

export const hideSpinner = assign<AutomataContext>({
	showSpinner: (c: AutomataContext, e: any): any => false
})

export const sendData = (context: AutomataContext, event: SendData) =>
	context.webSocket?.send(JSON.stringify(event.data))

export const addWebSocket = assign<AutomataContext, NewConnectedWebSocket>({
	webSocket: (c, event: NewConnectedWebSocket) => event.data.webSocket
})
export const msgIsLeft = (c: AutomataContext, e: AutomataEvent) => {
	console.log({m: c.msgE, l: isLeft(c.msgE), r: isRight(c.msgE)})
	return isLeft(c.msgE)
}
export const msgIsRight = (c: AutomataContext, e: AutomataEvent) => isRight(c.msgE)

export const handleWebSocketConnectionError = (context: AutomataContext, event: AutomataEvent) => {
	console.error(event)
	alert('Error connecting to websocket')
}

export const sendNewMessageToParent =  
	sendParent<AutomataContext, AutomataEvent>((c: AutomataContext)=>({
		type: 'NEW_MESSAGE',
		// this should extract the actual message data from the message validation
		data: fold(
				e => null, 
				(m: ApiResponses) => {
					console.log({m,c})

					return m.data
				}
			)(c.msgE)
	}))

export const connectWebsocket: InvokeCreator<AutomataContext, AutomataEvent, any> =
	(context: AutomataContext, e) =>
		(callback: Sender<NewMessage>) =>
			new Promise((resolve, reject) => {
				const webSocket = new WebSocket(context.webSocketUrl)

				webSocket.onerror = reject
				// this is another part that needs tobe flattened i think. rather than 
				webSocket.onopen = e => resolve({ webSocket })
				webSocket.onmessage = function (this: WebSocket, ev: MessageEvent) {
					const event = ev
					console.log({ev})
					callback({ type: Events.NEW_MESSAGE, event })
				}
			})

export const validateNewMessage =
		assign<AutomataContext, NewMessage>({
			msgE:(c: AutomataContext, e: NewMessage) =>  validateResponse(e.event, c.dataType)
		})
	


// Config
export const config: MachineConfig<AutomataContext, AutomataSchema, AutomataEvent> = {
	id: 'ws_connection',
	initial: States.DISCONNECTED,
	context: initialContext,
	states: {
		[States.CONNECTING]: {
			entry: 'showSpinner',
			on: {
				[Events.CONNECTED]: {
					target: States.CONNECTED
				}
			},
			invoke: {
				id: 'connect_websocket',
				src: connectWebsocket,
				onDone: {
					target: States.CONNECTION_SUCCESS,
					actions: 'addWebSocket',
				},
				onError: {
					target: States.DISCONNECTED,
					actions: 'handleWebSocketConnectionError'
				}
			}
		},
		[States.CONNECTION_SUCCESS]: {
			after: {
				1000: {
					target: States.CONNECTED
				}
			}
		},
		[States.CONNECTED]: {
			entry: [
				assign<AutomataContext>({isConnected: true}),
				// TODO: change string to Event references and have the parent 
				// reference that too.
				sendParent('CONNECTED'),
			],
			on: {
				[Events.DISCONNECT]: {
					target: States.DISCONNECTED
				},
				[Events.SEND_DATA]: {
					// TODO: flatten this to account for errors when sending data
					actions: 'sendData'
				},
				[Events.NEW_MESSAGE]: {
					target: States.NEW_MESSAGE_RECEIVED
				},
			}
		},
		[States.NEW_MESSAGE_RECEIVED]: {
			entry: 'validateNewMessage',
			on: {
				'': [
					{target: States.INVALID_MESSAGE, cond: 'msgIsLeft'},
					{target: States.VALID_MESSAGE, cond: 'msgIsRight'},
				]
			}
		},
		[States.VALID_MESSAGE]: {
			entry: 'sendNewMessageToParent',
			on:{
				'': States.CONNECTED
			}
		},
		[States.INVALID_MESSAGE]: {
			entry: ()=> console.log('error with message'),
			after:{
				500: {
					target: States.CONNECTED
				}
			}
		},
		[States.DISCONNECTED]: {
			entry: [
				assign<AutomataContext>({isConnected: false}),
				sendParent('DISCONNECTED')
			],
			on: {
				[Events.CONNECT]: {
					target: States.CONNECTING,
				}
			}
		}
	}
}


// Options
export const options: Partial<MachineOptions<AutomataContext, any>> = {
	actions: {
		showSpinner,
		hideSpinner,
		sendData,
		addWebSocket,
		handleWebSocketConnectionError,
		connectWebsocket,
		validateNewMessage,
		sendNewMessageToParent
	},
	guards:{
		msgIsLeft,
		msgIsRight,
	}
}

export const getWebSocketMachine = (url: string, dataType: t.Mixed) => 
	Machine(config, options).withContext({
			...initialContext,
			dataType,
			webSocketUrl: url,
		})
