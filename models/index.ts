import type { connection } from 'websocket'

export interface Message {
    text?: string;
    name?: string;
    type: string;
    id: number;
    date?: number;
}

export interface Connection extends connection {
    clientID: number;
    username: string;
}
