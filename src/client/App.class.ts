import type { Message } from '../../models/index';

export class App {
    private connection = null;
    private clientID = 0;
    private $name: HTMLInputElement;
    private $text: HTMLInputElement;
    private $send: HTMLInputElement;
    private $chatbox: HTMLIFrameElement;
    private $userlistbox: HTMLElement;
    constructor() {
        this.$name = document.getElementById('name') as HTMLInputElement;
        this.$text = document.getElementById('text') as HTMLInputElement;
        this.$send = document.getElementById('send') as HTMLInputElement;
        this.$chatbox = document.getElementById('chatbox') as HTMLIFrameElement;
        this.$userlistbox = document.getElementById('userlistbox') as HTMLElement;
        this.addEventListeners();
    }

    addEventListeners = () => {
        const login = document.getElementById('login');
        login!.addEventListener('click', this.connect);
        this.$text!.addEventListener('keyup', this.handleKey);
        this.$send!.addEventListener('click', this.send);
    }

    setUsername = () => {
        console.log('***SETUSERNAME');
        const { value: name } = this.$name;
        var msg = {
            name: name,
            date: Date.now(),
            id: this.clientID,
            type: 'username'
        };
        this.connection.send(JSON.stringify(msg));
    }

    connect = () => {
        var scheme = 'ws';

        // If this is an HTTPS connection, we have to use a secure WebSocket
        // connection too, so add another "s" to the scheme.

        if (document.location.protocol === 'https:') {
            scheme += 's';
        }

        const serverUrl = scheme + '://' + document.location.hostname + ':3000';

        this.connection = new WebSocket(serverUrl, 'json');
        console.log('***CREATED WEBSOCKET');

        this.connection.onopen = (evt) => {
            console.log('***ONOPEN');
            this.$text.disabled = false;
            this.$send.disabled = false;
        };
        console.log('***CREATED ONOPEN');

        this.connection.onmessage = (evt) => {
            console.log('***ONMESSAGE');
            var f = this.$chatbox.contentDocument;
            var text = '';
            var msg = JSON.parse(evt.data);
            console.log('Message received: ');
            console.dir(msg);
            var time = new Date(msg.date);
            var timeStr = time.toLocaleTimeString();

            switch (msg.type) {
                case 'id':
                    this.clientID = msg.id;
                    this.setUsername();
                    break;
                case 'username':
                    text = '<b>User <em>' + msg.name + '</em> signed in at ' + timeStr + '</b><br>';
                    break;
                case 'message':
                    text = '(' + timeStr + ') <b>' + msg.name + '</b>: ' + msg.text + '<br>';
                    break;
                case 'rejectusername':
                    text = '<b>Your username has been set to <em>' + msg.name + '</em> because the name you chose is in use.</b><br>';
                    break;
                case 'userlist':
                    var ul = '';
                    var i;

                    for (i = 0; i < msg.users.length; i++) {
                        ul += msg.users[i] + '<br>';
                    }
                    this.$userlistbox.innerHTML = ul;
                    break;
            }

            if (text.length) {
                f.write(text);
                // this.$chatbox.contentWindow.scrollByPages(1);
            }
        };
        console.log('***CREATED ONMESSAGE');
    }

    send = () => {
        console.log('***SEND');
        const msg: Message = {
            text: this.$text.value,
            type: 'message',
            id: this.clientID,
            date: Date.now()
        };
        this.connection.send(JSON.stringify(msg));
        this.$text.value = '';
    }

    handleKey = (evt) => {
        if (evt.keyCode === 13 || evt.keyCode === 14) {
            if (!this.$send.disabled) {
                this.send();
            }
        }
    }
}
