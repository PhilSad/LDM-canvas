from flask import Flask, send_file, Response
from flask import request
import base64
import requests
import sys
import os
from io import BytesIO
import time

from PIL import Image, ImageDraw
sys.path.append('/home/filou/LDM-canvas/api/imagen_api/models_bindings')
from dalle_mini_mega import DalleGenerator
from flask_cors import CORS
import jsonpickle


from google.cloud import storage

storage_client = storage.Client()

bucket = storage_client.bucket('aicanvas-public-bucket')

CUR_IMAGE_PATH = '/home/filou/LDM-canvas/api/imagen_api/images/cur_image.png'
app = Flask(__name__)
CORS(app)
generator = DalleGenerator()


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

    generated.save(CUR_IMAGE_PATH)

    # save to cloud
    storage_client = storage.Client()
    bucket = storage_client.bucket('aicanvas-public-bucket')
    blob_generated = bucket.blob('cur_generated.png')
    blob_history = bucket.blob(f'history/{str(time.time())}-{prompt}.png')

    blob_generated.upload_from_filename(CUR_IMAGE_PATH)
    blob_history.upload_from_filename(CUR_IMAGE_PATH)
    

    # todo save image

    buffered = BytesIO()
    generated.save(buffered, format="JPEG")
    img_str = base64.b64encode(buffered.getvalue())

    return Response(img_str, status=200)

@app.route("/hello/")
def hello():
    return 'hello'