import { WebSocket } from 'ws';
import { IncomingMessage } from 'node-http';
import session from 'express-session';
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

        if (sessionID) {
            ws.sessionID = sessionID
            websocketMap[sessionID] = ws
            console.log(`WebSocket associated with session ${sessionID}`)
        }

        ws.on('message', (rawData: string) => {
            let data: { to?: string } = {};
            try {
                data = JSON.parse(rawData);
            } catch (err) {
                console.error((err as Error).message, rawData);
                return;
            }

            req.sessionStore.all((err, sessions) => {
                if (err) {
                    console.error('Cannot retrieve sessions');
                    return;
                }
                
                for (const sessionID in sessions) {
                    const session = sessions[sessionID] as any;
                    if (
                        websocketMap[sessionID] &&
                        session.passport &&
                        session.passport.user &&
                        session.passport.user === data.to
                    ) {
                        try {
                            websocketMap[sessionID].send(JSON.stringify(data));
                        } catch (err) {
                            console.error('WebSocket send error', (err as Error).message);
                        }
                    }
                }
            });
        });

        ws.on('close', () => {
            if (ws.sessionID) {
                delete websocketMap[ws.sessionID];
            }
        });
    }
};