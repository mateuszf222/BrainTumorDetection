import crypto from 'crypto';
import mongoose, { Document, Model, Mongoose } from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

import session from 'express-session';

declare module 'express-session' {
    interface SessionData {
        roles?: number[];
    }
    interface Session {
        store?: session.Store;
    }
}

declare global {
    namespace Express {
        interface User {
            _id: string;
            username: string;
            password: string;
            roles: number[];
        }
    }
}


// Define the user schema interface
interface IUser extends Document, Express.User {
    _id: string;
    username: string;
    password: string;
    roles: number[];
}

// Define the Mongoose schema
const schema = new mongoose.Schema<IUser>({
    _id: { type: String, default: uuidv4 },
    username: { type: String, required: true },
    password: { type: String, required: true },
    roles: { type: [Number], required: true }
}, { versionKey: false });

// Create a hash function for passwords
const makeHash = (password: string): string => {
    return crypto.createHash('sha256').update(password).digest('base64');
};

// Helper function to find the intersection of two arrays
const getIntersection = (array1: number[], array2: number[]): number[] => {
    const lookupSet = new Set(array2);
    return array1.filter(element => lookupSet.has(element));
};

// Authentication module
const auth = {
    User: null as Model<IUser> | null,

    init: (conn: Mongoose) => {
        auth.User = conn.model<IUser>('user', schema);

        // Create admin user if not exists
        auth.User.findOne({ username: 'admin' })
            .then(user => {
                if (!user) {
                    const admin = new auth.User!({ username: 'admin', password: makeHash('admin'), roles: [0] });
                    admin.save();
                    console.log('Tworzę użytkownika admin');
                }
            })
            .catch(err => console.error(err.message));

        // Create default user if not exists
        auth.User.findOne({ username: 'user' })
            .then(user => {
                if (!user) {
                    const userAccount = new auth.User!({ username: 'user', password: makeHash('user'), roles: [1] });
                    userAccount.save();
                    console.log('Tworzę użytkownika user');
                }
            })
            .catch(err => console.error(err.message));
    },

    checkCredentials: (username: string, password: string, nextTick: (error: any, user?: Express.User | false) => void) => {
        if (!auth.User) return nextTick(null, false);
        
        auth.User.findOne({ username, password: makeHash(password) })
            .then(user => nextTick(null, user as Express.User || false))
            .catch(() => nextTick(null, false));
    },
    

    checkIfInRole: (roleNums: number[]) => (req: Request, res: Response, next: NextFunction) :void=> {
        if (!req.isAuthenticated()) {
            res.status(401).json({ error: 'Unauthorized' });  // <-- important RETURN
            return;
        }
        
        const userRoles = req.user ? (req.user as IUser).roles || [] : [];
        const intersection = getIntersection(roleNums || [], userRoles);

        if (intersection.length > 0) {
            next();
        } else {
            res.status(403).json({ error: 'Permission denied' });
        }
    },

    serialize: (user: Express.User, nextTick: (error: any, id?: string) => void) => {
        nextTick(null, user.username);
    },

    deserialize: (username: string, nextTick: (error: any, user?:Express.User | null) => void) => {
        if (!auth.User) return nextTick(new Error('User model not initialized'), null);
        
        auth.User.findOne({ username })
            .then(user => {
                if (user) {
                    return nextTick(null, user);
                } else {
                    return nextTick(new Error('Nie ma takiego użytkownika'), null);
                }
            })
            .catch(err => nextTick(err, null));
    },

    login: (req: Request, res: Response) => auth.whoami(req, res),

    logout: (req: Request, res: Response) => req.logout(() => auth.whoami(req, res)),

    whoami: (req: Request, res: Response) => {
        req.session.roles = req.user ? (req.user as IUser).roles : [];
        req.session.save(() => {
            const data: Record<string, any> = { sessionid: req.session.id };
            if (req.user) {
                data.username = (req.user as IUser).username;
                data.roles = (req.user as IUser).roles;
            }
            res.json(data);
        });
    },

    errorHandler: (err: Error, req: Request, res: Response, _next: NextFunction) => {
        res.status(401).json({ error: `Błąd [${err.message}]` });
    },
};

export default auth;
