from crypt import methods
import dotenv
dotenv.load_dotenv('.env')

from flask import Flask
from flask_cors import CORS
from flask import request
from operations import *

app = Flask(__name__)
CORS(app)

@app.route("/get_images_for_room/")
def get_images_for_room():
    room = request.args.get('room')

    room_images = db_operations.get_images_from_room(room)
    return (dict(message=room_images), 201)

@app.route("/imagen/", methods=['POST'])
def imagen():
    
    action = request.args.get('action')
    params = request.get_json()
    
    err = gpu_operations.imagen(action, params)

    if err == -1:
        return('Unable to verify auth token. Did you login?', 501)
    else:
        return ('generating, ....', 201)


@app.route("/update_bdd_after_image_generation/")
def update_bdd_after_image_generation():
    params = request.get_json()
    db_operations.update_from_sql('images', params)
    return 'ok'

@app.route("/hello/")
def hello():
    return 'hello'

if __name__ == "__main__":
    app.run()