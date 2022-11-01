from io import BytesIO
import base64
import torch
import PIL
import numpy as np
from torch import autocast
import scipy
from scipy.spatial import cKDTree
# pipe initialization
from diffusers import StableDiffusionPipeline

device = "cuda"

pipe = StableDiffusionPipeline.from_pretrained(
    "./models_bindings/models/stable-diffusion-v1-5",
    revision="fp16",
    torch_dtype=torch.float16,
    custom_pipeline="stable_diffusion_mega"
).to(device)
pipe.enable_attention_slicing()

MAX_SIZE = 512
STEPS = 50

def get_img_mask(im):
    im = im.convert('RGBA')
    sel_buffer = np.array(im)
    img = sel_buffer[:, :, 0:3]
    mask = 255 - sel_buffer[:, :, -1]
    return img, mask

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

def generate_image(prompt, w, h, init_image=None, mask=None):
    width, height, round_width, round_height = adjust_size(w, h)

    if(init_image is not None):
        init_image = init_image.crop((0, 0, width, height))
        init_image = init_image.resize((round_width, round_height), PIL.Image.ANTIALIAS)
        init_image = init_image.convert('RGB')

    if(mask is not None):
        mask = mask.crop((0, 0, width, height))
        mask = mask.resize((round_width, round_height), PIL.Image.ANTIALIAS)
        mask = mask.convert('RGB')

    print('=============================')
    print(prompt)
    print(w, h)
    print('=============================')

    generated = diffuse(
            prompt=prompt,
            height=round_height,
            width=round_width,
            init_image=init_image,
            mask_image=mask,
            steps=50
            )[0]

    # add transparency
    if(mask is not None):
        ga = np.array(generated.convert('RGBA'))
        ga[:, :, -1] = np.array(mask)[:, :, -1]
        generated = PIL.Image.fromarray(ga)

    generated = generated.resize((width, height), PIL.Image.ANTIALIAS)
    
    return generated

def new_image(prompt, width, height):
    gen = pipe.text2img(prompt, )
    image = gen.images[0]
    return image

def image_to_image(prompt, width, height, init_image):
    im = PIL.Image.open(BytesIO(base64.b64decode(init_image)))
    gen = pipe.img2img(prompt=prompt, init_image=im, strength=0.75, guidance_scale=7.5).images
    image = gen.images[0]
    return image

def outpainting(prompt, width, height, init_image, strength=0.2):
    im = PIL.Image.open(BytesIO(base64.b64decode(init_image)))

    _, mask = get_img_mask(im)
    mask = PIL.Image.fromarray(mask)

    gen = pipe.inpaint(prompt=prompt, init_image=im, mask_image=mask, strength=0.75)
    image = gen.images[0]

    return image

def inpaint_mask(prompt, width, height, init_image, mask):
    im = PIL.Image.open(BytesIO(base64.b64decode(init_image)))
    mask = PIL.Image.open(BytesIO(base64.b64decode(mask)))

    return generate_image(prompt, width, height, im, mask)

def add_perlin(img, mask, strength=0.1):
    n = np.asarray(diffuse(prompt='', height=img.shape[0], width=img.shape[1], steps=1)[0])
    n = n - 128
    
    n = np.int_(strength*n).astype(np.uint16) + img
    n[n > 255] = 255
    n = n.astype(np.uint8)
    
    bmask = np.array([[[p] * 3 for p in r ] for r in np.int_(mask/255).astype(np.uint8)])

    # add image back in
    i = n * bmask + (1-bmask) * img
    return i


# image inpainting techniques
def edge_pad(img, mask, mode=1):
    mask = 255 - mask
    if mode == 0:
        nmask = mask.copy()
        nmask[nmask > 0] = 1
        res0 = 1 - nmask
        res1 = nmask
        p0 = np.stack(res0.nonzero(), axis=0).transpose()
        p1 = np.stack(res1.nonzero(), axis=0).transpose()
        min_dists, min_dist_idx = cKDTree(p1).query(p0, 1)
        loc = p1[min_dist_idx]
        for (a, b), (c, d) in zip(p0, loc):
            img[a, b] = img[c, d]
    elif mode == 1:
        record = {}
        kernel = [[1] * 3 for _ in range(3)]
        nmask = mask.copy()
        nmask[nmask > 0] = 1
        res = scipy.signal.convolve2d(
            nmask, kernel, mode="same", boundary="fill", fillvalue=1
        )
        res[nmask < 1] = 0
        res[res == 9] = 0
        res[res > 0] = 1
        ylst, xlst = res.nonzero()
        queue = [(y, x) for y, x in zip(ylst, xlst)]
        # bfs here
        cnt = res.astype(np.float32)
        acc = img.astype(np.float32)
        step = 1
        h = acc.shape[0]
        w = acc.shape[1]
        offset = [(1, 0), (-1, 0), (0, 1), (0, -1)]
        while queue:
            target = []
            for y, x in queue:
                val = acc[y][x]
                for yo, xo in offset:
                    yn = y + yo
                    xn = x + xo
                    if 0 <= yn < h and 0 <= xn < w and nmask[yn][xn] < 1:
                        if record.get((yn, xn), step) == step:
                            acc[yn][xn] = acc[yn][xn] * cnt[yn][xn] + val
                            cnt[yn][xn] += 1
                            acc[yn][xn] /= cnt[yn][xn]
                            if (yn, xn) not in record:
                                record[(yn, xn)] = step
                                target.append((yn, xn))
            step += 1
            queue = target
        img = acc.astype(np.uint8)
    else:
        nmask = mask.copy()
        ylst, xlst = nmask.nonzero()
        yt, xt = ylst.min(), xlst.min()
        yb, xb = ylst.max(), xlst.max()
        content = img[yt : yb + 1, xt : xb + 1]
        img = np.pad(
            content,
            ((yt, mask.shape[0] - yb - 1), (xt, mask.shape[1] - xb - 1), (0, 0)),
            mode="edge",
        )
    return img

def mean_fill(img, mask):
    avg = np.int_(img.sum(axis=0).sum(axis=0) / ((img > 0).sum() / 3))
    img[mask < 1] = avg
    return img
