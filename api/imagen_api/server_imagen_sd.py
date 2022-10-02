from models_bindings.stable_diffusion import StableDiffusionGenerator
from flask import Flask, send_file, Response
from flask import request
import base64
from io import BytesIO
import time
from PIL import Image, ImageDraw
from flask_cors import CORS


from google.cloud import storage

storage_client = storage.Client()

bucket = storage_client.bucket('aicanvas-public-bucket')

app = Flask(__name__)
CORS(app)


generator = StableDiffusionGenerator()

MAX_SIZE = 512

@app.route("/imagine/")
def imagine():
    b64prompt = request.args.get('prompt')
    posX = int(request.args.get('posX'))
    posY = int(request.args.get('posY'))
    width = int(request.args.get('width'))
    height = int(request.args.get('height'))

    print(width, height)

    ratio = width/height
    if(ratio > 1):
        width = MAX_SIZE
        height = ((round(MAX_SIZE * 1/ratio) + 32) // 64) * 64
        height= int(max(height, 64))
    else:
        height = MAX_SIZE
        width = ((round(MAX_SIZE * ratio) + 32) // 64) * 64
        width = int(max(width, 64))

    prompt = base64.b64decode(b64prompt)
    prompt = prompt.decode("utf-8")

    print(width, height)

    generated = generator.imagine(prompt, width, height)

    # save to cloud
    storage_client = storage.Client()
    bucket = storage_client.bucket('aicanvas-public-bucket')

    # todo save image

    buffered = BytesIO()
    generated.save(buffered, format="JPEG")
    img_str = base64.b64encode(buffered.getvalue())

    return Response(img_str, status=200)

@app.route("/hello/")
def hello():
    return 'hello'
