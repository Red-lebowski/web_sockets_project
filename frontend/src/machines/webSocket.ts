import { Machine, MachineConfig, MachineOptions, assign, Sender, EventObject, State, DoneInvokeEvent, StateSchema, StateNode, TransitionDefinitionMap, InvokeCreator } from 'xstate'


// states
export enum States {
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  CONNECTION_SUCCESS = 'CONNECTION_SUCCESS',
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
  messagesReceived: Array<any>,
  dataReceivedHandler: (e: MessageEvent) => any,
  webSocketUrl: string,
  webSocket?: WebSocket,
}

// this is just to stop typescript whinging when provided to withContext
export const initialContext: AutomataContext = {
  webSocketUrl: '',
  showSpinner: false,
  messagesReceived: [],
  dataReceivedHandler: e => '',
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
  webSocket: (c, event: NewConnectedWebSocket) =>  event.data.webSocket
})

export const handleWebSocketConnectionError = (context: AutomataContext, event: AutomataEvent) => {
  console.error(event)
  alert('Error connecting to websocket')
}

export const connectWebsocket: InvokeCreator<AutomataContext, AutomataEvent, any> = 
  (context: AutomataContext, e) => 
    (callback: Sender<NewMessage>) =>
      new Promise((resolve, reject) => {
        const webSocket = new WebSocket(context.webSocketUrl)

        webSocket.onerror = reject
        // this is another part that needs tobe flattened i think. rather than 
        webSocket.onopen = e => resolve({webSocket})
        webSocket.onmessage = function(this: WebSocket, ev: MessageEvent){
          callback({type: Events.NEW_MESSAGE, event: ev })
        }

      })
      

export const handleNewMessage = assign<AutomataContext, NewMessage>({
    messagesReceived: (context: AutomataContext, event: NewMessage) => {
      const {messagesReceived} = context
      const newMessage = context.dataReceivedHandler(event.event)
      messagesReceived.push(newMessage)
      return messagesReceived
    }
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
      invoke:{
        id: 'connect_websocket',
        src: connectWebsocket, 
        onDone: {
          target: States.CONNECTION_SUCCESS,
          actions: 'addWebSocket',
        },
        onError:{
          target: States.DISCONNECTED,
          actions: 'handleWebSocketConnectionError'
        }
      }
    },
    [States.CONNECTION_SUCCESS]:{
      after: {
        1000: {
          target: States.CONNECTED
        }
      }
    },
    [States.CONNECTED]: {
      entry: 'hideSpinner',
      on: {
        [Events.DISCONNECT]: {
          target: States.DISCONNECTED
        },
        [Events.SEND_DATA]: {
          actions: 'sendData'
        },
        [Events.NEW_MESSAGE]: {
          actions: 'handleNewMessage'
        }
      }
    },
    [States.DISCONNECTED]: {
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
    handleNewMessage,
  },
}

export function getWebSocketMachine(url: string, dataReceivedHandler: AutomataContext["dataReceivedHandler"]){
  return Machine(config, options)
          .withContext({
            ...initialContext, 
            dataReceivedHandler, 
            webSocketUrl: url,
          })
}
