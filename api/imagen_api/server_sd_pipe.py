from tkinter import W
from flask import Flask, send_file, Response, request
from google.cloud import storage
from flask_cors import CORS
from io import BytesIO
import base64
import torch
import PIL
import numpy as np

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

pipe.disable_nsfw_filter()

MAX_SIZE = 512
STEPS = 50

def get_mask(im):
    im = im.split()[-1].convert('1')
    return PIL.ImageOps.invert(im)

def get_noise(im):
    n = np.asarray(diffuse(prompt='', height=im.height, width=im.width, steps=1)[0])
        
    m = get_mask(im)

    # get masks and invert mask
    ma = np.asarray(m)
    ma = np.array([[[p] * 3 for p in r ] for r in ma])
    ma_i = np.asarray(PIL.ImageOps.invert(m))
    ma_i = np.array([[[p] * 3 for p in r ] for r in ma_i])

    # convert to rgb to keep same dimension
    ima = np.asarray(im.convert('RGB'))

    # add noise and original image
    final = ((ma_i + n) * ma) + (ima * ma_i)

    return PIL.Image.fromarray(final, mode="RGB")

def adjust_size(width,height):
    ratio = width/height
    if(ratio > 1):
        width = MAX_SIZE
        round_width = width

        height = round(MAX_SIZE * 1/ratio)
        round_height = ((height + 32) // 64) * 64
        round_height = int(max(round_height, 64))
    else:
        height = MAX_SIZE
        round_height = height

        width = round(MAX_SIZE * ratio) 
        round_width = ((width + 32) // 64) * 64
        round_width = int(max(round_width, 64))

    return width, height, round_width, round_height,

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

@app.route("/new_image/", methods=['POST'])
def new_image():
    params = request.get_json()

    b64prompt = params['prompt']
    width = int(params['width'])
    height = int(params['height'])

    width, height, round_width, round_height = adjust_size(width, height)

    prompt = base64.b64decode(b64prompt)
    prompt = prompt.decode("utf-8")

    generated = diffuse(
            prompt=prompt,
            height=round_height,
            width=round_width,
            steps=50
            )[0]

    generated = generated.resize((width, height), PIL.Image.ANTIALIAS)

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

    width, height, round_width, round_height = adjust_size(width, height)

    # decode base64 image
    im = PIL.Image.open(BytesIO(base64.b64decode(init_image)))
    im = im.crop((0, 0, width, height))
    im = im.resize((round_width, round_height), PIL.Image.ANTIALIAS)
    im = im.convert('RGBA')

    prompt = base64.b64decode(b64prompt)
    prompt = prompt.decode("utf-8")
    
    noise = get_noise(im)
    mask = get_mask(im)

    generated = diffuse(
            prompt=prompt,
            width=round_width,
            height=round_height,
            init_image=noise,
            mask_image=mask,
            steps=STEPS
            )[0]

    generated = generated.resize((width, height), PIL.Image.ANTIALIAS)

    # save to cloud
    storage_client = storage.Client()
    buffered = BytesIO()

    generated.save(buffered, format="JPEG")
    bucket = storage_client.bucket('aicanvas-public-bucket')

    # todo save image
    
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
            steps=STEPS
            )[0]

    # save to cloud
    storage_client = storage.Client()
    bucket = storage_client.bucket('aicanvas-public-bucket')

    # todo save image

    buffered = BytesIO()
    generated.save(buffered, format="JPEG")
    generated.save('tmp.jpeg')

    img_str = base64.b64encode(buffered.getvalue())

    return Response(img_str, status=200)