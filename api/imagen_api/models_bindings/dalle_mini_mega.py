from min_dalle import MinDalle
import torch 



class DalleGenerator:

    def __init__ (self):
        self.model = MinDalle(
            models_root='./models/dalle-mega-16',
            dtype=torch.float16,
            device='cuda',
            is_mega=True, 
            is_reusable=True
        )

    
    def imagine(self, prompt):
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

        