from flask import Flask, send_file
from flask import request
import base64
import requests
import sys
import os
import json
from io import BytesIO

from PIL import Image, ImageDraw
from flask_cors import CORS

URL_IMAGEN_SERVER = 'http://35.206.191.68:5000/imagine'


app = Flask(__name__)
CORS(app)


@app.route("/full_canvas/")
def full_canvas():
    return send_file('./images/full_canvas.png', 'png')


@app.route("/imagine/")
def imagine():
    prompt = request.args.get('prompt')
    posX = int(request.args.get('posX'))
    posY = int(request.args.get('posY'))
    width = int(request.args.get('width'))
    height = int(request.args.get('height'))
    
    url_with_params = f'{URL_IMAGEN_SERVER}?prompt={prompt}&posX={posX}&posY={posY}&width={width}&height={height}' 
    print(url_with_params)
    response = requests.get(url_with_params)
    generated = Image.open(BytesIO(base64.b64decode(response.text)))
    print(response.text)

    canvas = Image.open('./images/full_canvas.png')
    canvas.paste(generated, (posX, posY))
    canvas.save('./images/full_canvas.png', quality=100)

    return 'ok'



