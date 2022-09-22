from flask import Flask, render_template, request
from flask_socketio import SocketIO
from flask_socketio import emit
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app)
socketio.init_app(app, cors_allowed_origins="*")


@app.route('/new_image/')
def handle_message():
    path = request.args.get('path')
    print('call new_image at ' + path)

    socketio.emit('new_image', path, broadcast=True)
    return "ok"


if __name__ == '__main__':
    socketio.run(app)