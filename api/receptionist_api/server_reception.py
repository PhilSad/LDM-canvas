from turtle import width
from flask import Flask, send_file
from flask import request
import base64
import requests
import sys
import os

from PIL import Image, ImageDraw
sys.path.append('../imagen_api/models_bindings/')
from dalle_mini_mega import DalleGenerator
from flask_cors import CORS

URL_IMAGEN_SERVER = 'http://35.206.191.68/'


app = Flask(__name__)
CORS(app)
print('bbbb')
generator = DalleGenerator()
print('aaaa')

@app.route("/full_canvas/")
def full_canvas():
    return send_file('./images/full_canvas.png', 'png')


@app.route("/imagine/")
def imagine():

    b64prompt = request.args.get('prompt')
    posX = int(request.args.get('posX'))
    posY = int(request.args.get('posY'))
    width = int(request.args.get('width'))
    height = int(request.args.get('height'))
    
    url_with_params = f'{URL_IMAGEN_SERVER}:5000?prompt={prompt}&posX={posX}&posY={posY}&width={width}&height={height}' 

    response = requests.post(url_with_params)

    canvas = Image.open('./images/full_canvas.png')
    canvas.paste(generated, (posX, posY))
    canvas.save('./images/full_canvas.png', quality=100)

    return 'ok'

