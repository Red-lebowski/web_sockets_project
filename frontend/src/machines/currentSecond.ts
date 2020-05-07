import { Machine, MachineConfig, MachineOptions, assign, Receiver, Sender, EventObject } from 'xstate'


type NewMessageEvent = {
  type: 'NEW_MESSAGE';
  event: MessageEvent;
}

type SendData = {
  type: 'SEND_DATA';
  data: any;
}

type AutomataEvent = 
  | NewMessageEvent
  | SendData
  | {type: 'DISCONNECT'}
  | {type: 'CONNECT'}
  | {type: 'CONNECTED'}

type DataReceivedHandler = (e:any) => any

type AutomataContext = {
  showSpinner: boolean,
  messagesReceived: Array<any>,
  dataReceivedHandler: DataReceivedHandler,
  webSocketUrl: string,
  webSocket?: WebSocket,
}

type AutomataSchema = any

const toggleSpinner = (shouldShow: boolean) => assign<AutomataContext>({
  showSpinner: (c: AutomataContext, e: any): any => shouldShow
})

const showSpinner = toggleSpinner(true)
const hideSpinner = toggleSpinner(false)

async function connectWebsocket(c: AutomataContext, e: AutomataEvent, callback: Sender<NewMessageEvent>){
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(c.webSocketUrl)
    ws.onopen = e => resolve(ws)
    ws.onerror = reject
    ws.onmessage = function(this: WebSocket, ev: MessageEvent){
      callback({type: 'NEW_MESSAGE', event: ev })
    }
  })
}

function sendData(c: AutomataContext, e: SendData){
  c.webSocket?.send(JSON.stringify(e.data))
}

function handleNewMessage(c: AutomataContext, e: NewMessageEvent){
    const n = c.messagesReceived
    const newValue = c.dataReceivedHandler(e.event)
    n.push(newValue)
    return n
}

// this is just to stop typescript whinging when provided to withContext
const initialContext: AutomataContext = {
  showSpinner: false,
  webSocketUrl: '',
  dataReceivedHandler: e => '',
  messagesReceived: [],
} 

const config: MachineConfig<AutomataContext, AutomataSchema, AutomataEvent> = {
  id: 'ws_connection',
  initial: 'disconnected',
  context: initialContext,
  states: {
    connecting: {
      entry: 'showSpinner',
      exit: 'hideSpinner',
      on: {
        CONNECTED: 'connected'
      },
      invoke:{
        id: 'connect_websocket',
        src: (context, event) => (callback, onReceive) => connectWebsocket(context,event,callback),
        onDone: {
          target: 'connected',
          actions: assign({
            webSocket: (context, event) => event.data
          })
        },
        onError:{
          target: 'disconnected',
          actions: (context, event) => {
            console.error(event)
            alert('Error connecting to websocket')
          }
        }
      }
    },
    connected: {
      on: {
        DISCONNECT: 'disconnected',
        SEND_DATA: {
          actions: 'sendData'
        },
        NEW_MESSAGE: {
          actions: assign({
            messagesReceived: (c,e) => handleNewMessage(c,e)
          })
        }
      }
    },
    disconnected: {
      on: {
        CONNECT: {
          target: 'connecting',
          actions: 'connectToWebsocket'
        }
      }
    }
  }
}

const options: Partial<MachineOptions<AutomataContext, any>> = {
  actions: {
    showSpinner,
    hideSpinner,
    sendData,
    handleNewMessage,
  },
}

export function getWebSocketMachine(url: string, dataReceivedHandler: DataReceivedHandler){
  return Machine(config, options)
          .withContext({
            ...initialContext, 
            dataReceivedHandler, 
            webSocketUrl: url,
          })
}

