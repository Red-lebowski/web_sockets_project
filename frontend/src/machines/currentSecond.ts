import { Machine, MachineConfig, MachineOptions, assign, interpret } from 'xstate'


type AutomataContext = {
  showSpinner: boolean,
  webSocket: WebSocket | undefined
}

type AutomataSchema = any
type AutomataEvent = TransitionEvent

const toggleSpinner = (shouldShow: boolean) => assign<AutomataContext>({
  showSpinner: (c: AutomataContext, e: any): any => shouldShow
})

const showSpinner = toggleSpinner(true)
const hideSpinner = toggleSpinner(false)

const config: MachineConfig<AutomataContext, AutomataSchema, AutomataEvent> = {
  id: 'ws_connection',
  initial: 'disconnected',
  context: {
    showSpinner: false,
    webSocket: undefined
  },
  states: {
    connecting: {
      entry: 'showSpinner',
      exit: 'hideSpinner',
      on: {
        CONNECTED: 'connected'
      }
    },
    connected: {
      on: {
        DISCONNECT: 'disconnected'
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
  },
}

const webSocketMachine = Machine(config, options)

export {webSocketMachine}