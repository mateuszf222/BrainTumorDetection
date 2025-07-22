import { Request, Response } from 'express';
import auth from './auth';
import {websocketHandler} from './websocket';


export const whoGet = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!auth.User) {
        res.status(400).json({ error: 'User model is not initialized' });
        return;
      }
  
      // Correct way to access sessionStore
      const sessionStore = (req.sessionStore || req.session?.store);
      if (!sessionStore) {
        res.status(400).json({ error: 'Session store is not available' });
        return;
      }
  
      const usersFromDB = await auth.User.find();
      const users: Record<string, { sessions?: number; websocket?: boolean }> = {};
  
      usersFromDB.forEach(user => {
        users[user.username] = {};
      });
  
      sessionStore.all((err: any, sessions: any) => {
        if (err) {
          res.status(400).json({ error: 'Cannot retrieve sessions' });
          return;
        }
  
        for (const sessionID in sessions) {
          const session = sessions[sessionID];
          if (session.passport && session.passport.user) {
            const username = session.passport.user;
  
            users[username].sessions = (users[username].sessions || 0) + 1;
  
            if (websocketHandler.map[sessionID]) {
              users[username].websocket = true;
            }
          }
        }
  
        res.json(users);
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
};
  