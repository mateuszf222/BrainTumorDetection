import { WebSocket } from 'ws';
import { IncomingMessage } from 'node-http';
import session from 'express-session';
import chat from './chat.js';
import { Session } from 'inspector/promises';
type SessionStore = session.Store;

type WebSocketMap = Record<string, WebSocket>;

type SessionRequest = IncomingMessage & {
    sessionID: string;
    sessionStore: SessionStore;
};

const websocketMap: WebSocketMap = {};

export const websocketHandler = {
    map: websocketMap,

    handle: (ws: WebSocket & { sessionID?: string }, req: SessionRequest) => {

        const url = new URL(req.url || '', `http://${req.headers.host}`)
        const sessionID = url.searchParams.get('sessionID')

        const typedSession = req.session as Session & { passport?: { user: string } };

        if (sessionID) {
            ws.sessionID = sessionID
            websocketMap[sessionID] = ws
            console.log(`WebSocket associated with session ${sessionID}`)
        }

        ws.on('message', async (rawData) => {
            try {
                const dataStr = rawData.toString();
                const data = JSON.parse(dataStr);
        
                if (data.type === 'read-receipt') {
                    try {
                        await chat.model.updateMany(
                            { sender: data.to, receiver: data.from, status: { $ne: 'read' } },
                            { $set: { status: 'read' } }
                        );

                        // Notify sender that messages were read
                        req.sessionStore.all((err, sessions) => {
                            if (err) return console.error('Session store error:', err);

                            for (const sessionID in sessions) {
                                const session = sessions[sessionID];
                                if (session.passport?.user === data.to && websocketMap[sessionID]) {
                                    websocketMap[sessionID].send(JSON.stringify({
                                        type: 'read-receipt',
                                        from: data.from,
                                        to: data.to
                                    }));
                                }
                            }
                        });
                    } catch (err) {
                        console.error('Failed to update messages to read status:', err);
                    }
                    return; // Skip further processing for this event
                }
                
        
                // Standard message handling
                if (!data.from || !data.to || (!data.message && !data.image)) {
                    console.warn('Invalid message received', data);
                    return;
                }
        
                // Save message to the database, including image if present
                const chatMsg = new chat.model({
                    sender: data.from,
                    receiver: data.to,
                    message: data.message || null,
                    image: data.image || null, // Store the image Base64 or reference here
                    timestamp: Date.now(),
                    status: 'delivered'
                });
                await chatMsg.save();
        
                // Forward the message to both sender and receiver for status updates
                req.sessionStore.all((err, sessions) => {
                    if (err) return console.error('Session store error:', err);
        
                    for (const sessionID in sessions) {
                        const session = sessions[sessionID];
                        if (
                            (session.passport?.user === data.to || session.passport?.user === data.from) &&
                            websocketMap[sessionID]
                        ) {
                            websocketMap[sessionID].send(JSON.stringify(data));
                        }
                    }
                });
        
            } catch (err) {
                console.error('Failed to process WebSocket message:', err);
            }
        });
        
        

        ws.on('close', () => {
            if (ws.sessionID) {
                delete websocketMap[ws.sessionID];
            }
        });
    }
};