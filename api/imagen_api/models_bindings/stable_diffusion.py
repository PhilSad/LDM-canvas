import os
from omegaconf import OmegaConf
import torch
from torch import autocast
from einops import rearrange
from PIL import Image
from tqdm import tqdm, trange

from ldm.util import instantiate_from_config
from ldm.models.diffusion.ddim import DDIMSampler
from ldm.models.diffusion.plms import PLMSSampler

import numpy as np
from contextlib import contextmanager, nullcontext


def load_model_from_config(config, ckpt, verbose=False):
    print(f"Loading model from {ckpt}")
    pl_sd = torch.load(ckpt, map_location="cpu")
    if "global_step" in pl_sd:
        print(f"Global Step: {pl_sd['global_step']}")
    sd = pl_sd["state_dict"]
    model = instantiate_from_config(config.model)
    m, u = model.load_state_dict(sd, strict=False)
    if len(m) > 0 and verbose:
        print("missing keys:")
        print(m)
    if len(u) > 0 and verbose:
        print("unexpected keys:")
        print(u)

    model.cuda()
    model.eval()
    return model


class StableDiffusionGenerator:
    params = type('params', (object,), dict(
        ddim_steps=25,
        ddim_eta=0,
        n_iter=1,
        width=512,
        height=512,
        n_samples=1,
        scale=7.5,
        seed=-1,
        precision='autocast',
        C=4,
        f=8,
        plms=True,
        laion400m=False,
    ))
    
    def __init__ (self):
        # C: latent channels
        # f: downsampling factor 
        
        config = OmegaConf.load("/home/kollai/LDM-canvas/api/imagen_api/models_bindings/models/stable-diffusion/stable-diffusion-v1/v1-inference.yaml")
        ckpt = "/home/kollai/LDM-canvas/api/imagen_api/models_bindings/models/stable-diffusion/stable-diffusion-v1/model.ckpt"
        model = load_model_from_config(config, ckpt)
        
        device = torch.device("cuda") if torch.cuda.is_available() else torch.device("cpu")
        self.model = model.to(device)

        if self.params.plms:
            self.sampler = PLMSSampler(model)
        else:
            self.sampler = DDIMSampler(model)
    
    def imagine(self, prompt, width, height):
        batch_size = self.params.n_samples
        data = [batch_size * [prompt]]
        precision_scope = autocast if self.params.precision=="autocast" else nullcontext

        with torch.no_grad():
            with precision_scope("cuda"):
                with self.model.ema_scope():

                    all_images = list()
                    for n in trange(self.params.n_iter, desc="Sampling"):
                        for prompts in tqdm(data, desc="data"):
                            uc = None

                            if self.params.scale != 1.0:
                                uc = self.model.get_learned_conditioning(batch_size * [""])

                            if isinstance(prompts, tuple):
                                prompts = list(prompts)

                            c = self.model.get_learned_conditioning(prompts)
                            shape = [self.params.C, height // self.params.f, width // self.params.f]
                            samples_ddim, _ = self.sampler.sample(S=self.params.ddim_steps,
                                                            conditioning=c,
                                                            batch_size=self.params.n_samples,
                                                            shape=shape,
                                                            verbose=False,
                                                            unconditional_guidance_scale=self.params.scale,
                                                            unconditional_conditioning=uc,
                                                            eta=self.params.ddim_eta,
                                                            x_T=None)

                            x_samples_ddim = self.model.decode_first_stage(samples_ddim)
                            x_samples_ddim = torch.clamp((x_samples_ddim + 1.0) / 2.0, min=0.0, max=1.0)

                            # TODO add later before release
                            #x_samples_ddim = x_samples_ddim.cpu().permute(0, 2, 3, 1).numpy()
                            #x_checked_image, has_nsfw_concept = check_safety(x_samples_ddim)
                            #x_checked_image_torch = torch.from_numpy(x_checked_image).permute(0, 3, 1, 2)

                            x_checked_image_torch = x_samples_ddim
                            for x_sample in x_checked_image_torch:
                                x_sample = 255. * rearrange(x_sample.cpu().numpy(), 'c h w -> h w c')
                                img = Image.fromarray(x_sample.astype(np.uint8))
                                all_images.append(img)

                            return all_images[0]
