from turtle import width
from flask import Flask, send_file, Response
from flask import request
import base64
import requests
import sys
import os
from io import BytesIO

from PIL import Image, ImageDraw
sys.path.append('../imagen_api/models_bindings/')
from dalle_mini_mega import DalleGenerator
from flask_cors import CORS
import jsonpickle



app = Flask(__name__)
CORS(app)
print('bbbb')
generator = DalleGenerator()
print('aaaa')


@app.route("/imagine/")
def imagine():

    b64prompt = request.args.get('prompt')
    posX = int(request.args.get('posX'))
    posY = int(request.args.get('posY'))
    width = int(request.args.get('width'))
    height = int(request.args.get('height'))

    prompt = base64.b64decode(b64prompt)
    print(prompt)
    prompt = prompt.decode("utf-8")
    print(prompt)
    generated = generator.imagine(prompt)

    generated = generated.resize((width, height))

    buffered = BytesIO()
    generated.save(buffered, format="JPEG")
    img_str = base64.b64encode(buffered.getvalue())

    return Response(img_str, status=200)

