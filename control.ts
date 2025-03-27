import { Request, Response } from 'express';
import auth from './auth';
import {websocketHandler} from './websocket';

interface UserSessions {
    [username: string]: {
        sessions?: number;
        websocket?: boolean;
    };
}

export const whoGet = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!auth.User) {
            res.status(400).json({ error: 'User model is not initialized' });
            return;
        }

        if (!req.session || !req.sessionStore) {
            res.status(400).json({ error: 'Session store is not initialized' });
            return;
        }
        
        const usersFromDB = await auth.User.find();
        const users: UserSessions = {};

        usersFromDB.forEach(userFromDB => {
            users[userFromDB.username] = {};
        });

        req.session.store.all((err, sessions) => {
            if (err) {
                res.status(400).json({ error: 'Cannot retrieve sessions' });
                return;
            }

            for (const sessionID in sessions) {
                const session = sessions[sessionID];
                if (session.passport && session.passport.user) {
                    const username: string = session.passport.user;
                    
                    if (users[username].sessions) {
                        users[username].sessions!++;
                    } else {
                        users[username].sessions = 1;
                    }

                    if (websocketHandler.map[sessionID]) {
                        users[username].websocket = true;
                    }
                }
            }

            res.json(users);
        });
    } catch (err) {
        res.status(400).json({ error: (err as Error).message });
    }
};