from tkinter import W
from flask import Flask, send_file, Response, request
from google.cloud import storage
from flask_cors import CORS
from io import BytesIO
import base64
import torch
import PIL

from diffusionui import StableDiffusionPipeline

storage_client = storage.Client()
bucket = storage_client.bucket('aicanvas-public-bucket')

app = Flask(__name__)
CORS(app)

# pipe initialization
device = "cuda"
model_path = "CompVis/stable-diffusion-v1-4"
pipe = StableDiffusionPipeline.from_pretrained(
    model_path,
    revision="fp16", 
    torch_dtype=torch.float16,
    use_auth_token=True
).to(device)

# pipe.disable_nsfw_filter()

MAX_SIZE = 512

def adjust_size(width,height):
    ratio = width/height
    if(ratio > 1):
        width = MAX_SIZE
        height = ((round(MAX_SIZE * 1/ratio) + 32) // 64) * 64
        height= int(max(height, 64))
    else:
        height = MAX_SIZE
        width = ((round(MAX_SIZE * ratio) + 32) // 64) * 64
        width = int(max(width, 64))

    return width, height

def diffuse(prompt, n_images=1, width=512, height=512, steps=50, init_image=None, mask_image=None, guidance_scale=7.5, strength=0.8, generator=None):
    from torch import autocast
    with autocast("cuda"):
        generated = pipe(
            prompt=[prompt]*n_images,
            height=height,
            width=width,
            num_inference_steps=steps,
            init_image=init_image,
            mask_image=mask_image,
            guidance_scale=guidance_scale,
            strength=strength,
            generator=generator
            ).images

    return generated

@app.route("/new_image/")
def new_image():
    b64prompt = request.args.get('prompt')
    width = int(request.args.get('width'))
    height = int(request.args.get('height'))

    width, height = adjust_size(width, height)

    prompt = base64.b64decode(b64prompt)
    prompt = prompt.decode("utf-8")

    generated = diffuse(
            prompt=prompt,
            height=height,
            width=width,
            steps=25
            )[0]

    # save to cloud
    storage_client = storage.Client()
    bucket = storage_client.bucket('aicanvas-public-bucket')

    # todo save image

    buffered = BytesIO()
    generated.save(buffered, format="JPEG")
    img_str = base64.b64encode(buffered.getvalue())

    return Response(img_str, status=200)

@app.route("/inpaint_alpha/", methods=['POST'])
def inpaint_alpha():
    params = request.get_json()

    b64prompt = params['prompt']
    width = int(params['width'])
    height = int(params['height'])
    
    init_image= params['init_image']

    # decode base64 image
    im = PIL.Image.open(BytesIO(base64.b64decode(init_image)))
    im = im.crop((0, 0, width, height))

    # get alpha channel as mask, and convert it to black and white
    mask = PIL.ImageOps.invert(im.split()[-1].convert('1'))
    mask = mask.crop((0, 0, width, height))

    width, height = adjust_size(width, height)

    prompt = base64.b64decode(b64prompt)
    prompt = prompt.decode("utf-8")

    generated = diffuse(
            prompt=prompt,
            height=height,
            width=width,
            init_image=im.convert('RGB'),
            mask_image=mask.convert('RGB'),
            steps=25
            )[0]

    # save to cloud
    storage_client = storage.Client()
    bucket = storage_client.bucket('aicanvas-public-bucket')

    # todo save image

    buffered = BytesIO()
    generated.save(buffered, format="JPEG")
    img_str = base64.b64encode(buffered.getvalue())

    return Response(img_str, status=200)

@app.route("/inpaint_mask/", methods=['POST'])
def inpaint_mask():
    b64prompt = request.args.get('prompt')
    width = int(request.args.get('width'))
    height = int(request.args.get('height'))
    
    init_image= request.args.get('init_image')
    mask= request.args.get('mask_image')

    # decode base64 image
    im = PIL.Image.open(BytesIO(base64.b64decode(init_image)))
    im = im.crop((0, 0, width, height))

    # get alpha channel as mask, and convert it to black and white
    mask = PIL.Image.open(BytesIO(base64.b64decode(init_image)))
    mask = mask.crop((0, 0, width, height))
    mask = im.convert('L').point(lambda x : 255 if x > 200 else 0, mode='1')

    width, height = adjust_size(width, height)

    prompt = base64.b64decode(b64prompt)
    prompt = prompt.decode("utf-8")

    generated = diffuse(
            prompt=prompt,
            height=height,
            width=width,
            init_image=im,
            mask_image=mask,
            steps=25
            )[0]

    # save to cloud
    storage_client = storage.Client()
    bucket = storage_client.bucket('aicanvas-public-bucket')

    # todo save image

    buffered = BytesIO()
    generated.save(buffered, format="JPEG")
    img_str = base64.b64encode(buffered.getvalue())

    return Response(img_str, status=200)