# Geometry-Guided Video Generation with Diffusion Feature Textures

`M.Sc. Thesis` `2025`

**Jorge Romeu Huidobro**, [Petr Kellnhofer](https://kellnhofer.xyz), [Lukas Uzolas](https://lukas.uzolas.com/), [Ricardo Marroquim](https://graphics.tudelft.nl/~marroquim/), [Elmar Eisemann](https://graphics.tudelft.nl/~eisemann/)

[Thesis](https://repository.tudelft.nl/record/uuid:2f42fdf6-d988-4096-957a-ab8d1d3bf5f2) · [Code](https://github.com/Jorgeromeu/diffusion-feature-textures)

![](stormtrooper_thesis.mp4)

We propose a method for video generation from an animated 3D mesh with a 2D diffusion model. Our approach first generates a texture for the guidance mesh using [existing methods for multi-view consistent generation](https://arxiv.org/abs/2408.01291), and we extract features from the model while generating the texture. We then generate video frames using depth conditioning from the input 3D animation. To enforce temporal consistency we use the features extracted in the previous stage. This two-stage pipeline is more robust to occlusions and changes in object scale than [prior work](https://primecai.github.io/generative_rendering/).
