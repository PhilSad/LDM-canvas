from crypt import methods
from random import random
import dotenv
dotenv.load_dotenv('.env')

from flask import Flask
from flask_cors import CORS
from flask import request
from operations import *
import random

DEFAULT_TOPIC_ID = "imagen-queue"


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
    print(type(params))
    colab_link_protocol = request.args.get('colabLinkProtocol')
    colab_link_adress = request.args.get('colabLinkAdress')
    colab_link = f"{colab_link_protocol}://{colab_link_adress}"
    
    err = gpu_operations.gpu_imagen(colab_link, action, params)

    if err == -1:
        return('Unable to verify auth token. Did you login?', 501)
    
    #todo: verify the image pass the content filter
    
    return "ok"


@app.route("/get_vm_status/")
def get_vm_status():
    
    return gpu_operations.get_vm_status()


@app.route("/update_bdd_after_image_generation/")
def update_bdd_after_image_generation():
    params = request.get_json()
    db_operations.update_from_sql('images', params)
    return 'ok'

@app.route("/register_user/", methods=['POST'])
def register_user():
    params = request.get_json()

    token = params['credential']
    pseudo = params.get('pseudo')
    if pseudo is None:
        pseudo = f"user_{str(random.randint(1000000000, 9000000000))}"

    idinfo = users_operations.validate_access_token_and_get_user(token, verify = False)
    if idinfo == False:
        return ('invalid token' , 502)
    if db_operations.check_if_user_exist(idinfo['email']):
        print("user exist")
        pseudo = db_operations.get_user_pseudo(idinfo['email'])
        return dict(pseudo=pseudo), 201
    print("user dont exist")
    print(idinfo)
    data_to_bdd = dict(email = idinfo['email'], name = idinfo.get('name'), pseudo = pseudo)

    db_operations.insert_to_sql('users', data_to_bdd)

    return (dict(pseudo=pseudo), 202)

@app.route("/update_user_pseudo/", methods=['POST'])
def update_user_pseudo():
    params = request.get_json()
    token = params['credential']
    pseudo = params['pseudo']
    idinfo = users_operations.validate_access_token_and_get_user(token, verify=False)
    if idinfo == False:
        return ('invalid token', 502)
    data_to_bdd = dict(email = idinfo['email'], pseudo = pseudo)
    db_operations.update_pseudo(idinfo['email'], pseudo)
    return('OK', 200)








@app.route("/hello/")
def hello():
    return 'hello'

if __name__ == "__main__":
    app.run()