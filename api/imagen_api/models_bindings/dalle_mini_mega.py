from min_dalle import MinDalle
import torch 
from os.path import exists
import os

class DalleGenerator:

    def __init__ (self):

        self.model = MinDalle(
            models_root='/home/filou/LDM-canvas/api/imagen_api/models_bindings/models/dalle-mini-mega',
            dtype=torch.float16,
            device='cuda',
            is_mega=True, 
            is_reusable=True
        )

        

    
    def imagine(self, prompt):

        with torch.no_grad():
            prompt = str(prompt)
            image = self.model.generate_image(
                text=prompt,
                seed=-1,
                grid_size=1,
                is_seamless=False,
                temperature=1,
                top_k=256,
                supercondition_factor=32,
                is_verbose=False
            )


            return image

        