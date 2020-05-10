import {Machine, spawn, MachineConfig, assign} from 'xstate'

import {getWebSocketMachine} from './webSocket'
import { handleIsOddWebSocketResponse } from '../webSocketHandlers'

const serverURL = process.env.REACT_APP_SERVER_URL

const config: MachineConfig<any, any, any> = {
    id: 'current_second',
    context: {
        is_odd_child: null,
        current_second_child: null,
    },
    states: {
        init: {
            entry: assign({
                is_odd_child: () => getWebSocketMachine(`ws://${serverURL}/now-updated`, handleIsOddWebSocketResponse),
                current_second_child: () => getWebSocketMachine(`ws://${serverURL}/now-updated`)     
            })        
        }
    }
}
