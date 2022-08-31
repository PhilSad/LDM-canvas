from flask import Flask, send_file, Response
from flask import request
import base64
from io import BytesIO
import time

from PIL import Image, ImageDraw
from models_bindings.dalle_mini_mega import DalleGenerator
from flask_cors import CORS


from google.cloud import storage

storage_client = storage.Client()

bucket = storage_client.bucket('aicanvas-public-bucket')

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

    # todo save image

    buffered = BytesIO()
    generated.save(buffered, format="JPEG")
    img_str = base64.b64encode(buffered.getvalue())

    return Response(img_str, status=200)

@app.route("/hello/")
def hello():
    return 'hello'