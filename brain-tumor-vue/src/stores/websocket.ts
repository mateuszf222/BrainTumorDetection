import { defineStore } from 'pinia'
import mitt from 'mitt'; // Simple event bus
const emitter = mitt();


export const useWebSocketStore = defineStore('websocket', {
  state: () => ({
    socket: null as WebSocket | null,
    connected: false,
    sessionID: '' // optional but useful for debugging
  }),

  actions: {
    connect(sessionID: string) {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) return

      const ws = new WebSocket(`ws://${window.location.host}/ws?sessionID=${sessionID}`)
      this.sessionID = sessionID

      ws.onopen = () => {
        this.connected = true
        console.log('✅ WebSocket connected')
      }

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        console.log('📥 WebSocket message:', data)
        // You can emit events or update other stores here
        emitter.emit('new-message', data); // Emit globally
      }

      ws.onclose = () => {
        this.connected = false
        this.socket = null
        console.warn('⚠️ WebSocket disconnected')
      }

      ws.onerror = (err) => {
        console.error('WebSocket error:', err)
      }

      this.socket = ws
    },

    send(data: any) {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify(data))
      } else {
        console.warn('⚠️ WebSocket not connected, cannot send')
      }
    }
  }
})
export { emitter };
