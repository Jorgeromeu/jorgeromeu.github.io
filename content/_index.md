---
title: Home
---

{{< aboutme >}}
I am a Research Engineer at [ALLSIDES](https://www.allsides.tech/) working on physically based inverse rendering for 3D scanning at scale

I completed a M.Sc in computer science at TU Delft where I wrote my thesis on geometry-guided video generation, under the supervision of [Petr Kellnhofer](https://kellnhofer.xyz/). Before this, I obtained a B.Sc in computer science at TU Delft, my thesis was writen under the supervision of [Elmar Eisemann](https://graphics.tudelft.nl/) and was on importance sampling for physically based rendering.

In my free time I enjoy spending time outdoors, hiking, skiing, swimming, scuba diving, and learning something new.
{{< /aboutme >}}

# Projects

Overview of some of the projects I worked on during my studies

{{< project 
    img="/images/projects/stormtrooper_thesis.gif" 
    title="Geometry Guided Video Generation with Diffusion Feature Textures"
    authors="<span class='me'>Jorge Romeu Huidobro</span>, <a href='https://kellnhofer.xyz'>Petr Kellnhofer</a>, <a href='https://lukas.uzolas.com/'>Lukas Uzolas</a>, <a href='https://graphics.tudelft.nl/~marroquim/'>Ricardo Marroquim</a>, <a href='https://graphics.tudelft.nl/~eisemann/'>Elmar Eisemann</a>"
    venue=""
    tag="Master Thesis"
    desc="We propose a method for generating videos conditioned on an animated 3D mesh with an image diffusion model. Our approach works in two stages, firstly we generate a texture for the input mesh using [existing techniques for multi-view consistent generation](https://arxiv.org/abs/2408.01291), and extract intermediate features from the network while generating these views. We then render depth-maps of the target animation which we use as conditioning to generate the video frames, enforcing consistency between frames using these extracted diffusion features. By using this two-stage pipeline we get stronger robustness to occlusion and camera zoom than [prior work](https://primecai.github.io/generative_rendering/)"
    code="https://github.com/Jorgeromeu/diffusion-feature-textures"
    paper="https://repository.tudelft.nl/record/uuid:2f42fdf6-d988-4096-957a-ab8d1d3bf5f2"
    highlight="true"
>}} 

{{< project 
    img="/images/projects/light_portals.png" 
    tag="Bachelor Thesis"
    title="Efficient Area Light Sampling with Light Portals"
    authors="<span class='me'>Jorge Romeu Huidobro</span>, <a href='https://markvanderuit.nl/'>Mark van de Ruit</a>, <a href='https://graphics.tudelft.nl/~eisemann/'>Elmar Eisemann</a>"
    venue=""
    desc="In physically based rendering, a common operation is sampling light sources, however we are only interested in sampling directions to the light which are not occluded which can cause issues with partially occluded light sources such as a lightbulb inside a lampshade. We propose utilizing artist provided portals which specify the openings to a light source. We can then sample only the directions facing the light. Our key finding is that the geometry of the visibility regions, is dual to the geometry of shadow regions if we were to treat the portals as occluders. We can then repurpose algorithms from shadow volumes to determine the optimal way to sample the light from any shading point."
    paper="https://repository.tudelft.nl/file/File_cba11b10-ea54-4806-b4e8-ec215b5a8c73?preview=1"
    code="https://github.com/Jorgeromeu/bsc-thesis"
>}} 

<!-- MAKE GIF! -->
<!-- https://wandb.ai/romeu/NeRF2D/runs/hhb765bv?nw=nwuserromeu -->

{{< project 
    img="/images/projects/nerf2d_tud.png" 
    tag=""
    title="Scaling down NeRF with NeRF2D"
    authors="<span class='me'>Jorge Romeu Huidobro</span>, Chrysanthos Kindinis, Roy Katz"
    venue=""
    desc="[Neural Radiance Fields (NeRF)](https://www.matthewtancik.com/nerf) represent a 3D scene as a 5D view-dependent volume which is optimized with differentiable volume rendering using posed 2D images. Since its introduction, many follow ups suggest modifications to the base architecture, but training and rendering NeRFs remains expensive. We observe, that the radiance field reconstruction with differentiable rendering can be analogously framed in a 2D world, where we instead aim to reconstruct a 2D object, using 1D renders. While this task is not useful, we hypothesize it to be a good proxy task for small scale experimentation. To this end we implement a reduced version of NeRF in 2D, construct synthetic 2D novel view synthesis datasets and reproduce the results from various NeRF follow ups in our framework, but using an order of magnitude less compute in our experiments."
    links=""
    blog="https://hackmd.io/@WdAcp83GSrSWsVvpRJWJ2w/SkPKXfsS0"
    code="https://github.com/Jorgeromeu/NeRF2D"
>}} 


{{< project 
    img="/images/projects/pathguiding_2d.png" 
    tag=""
    title="Visualizing Practical Path Guiding"
    authors="<span class='me'>Jorge Romeu Huidobro</span>, <a href='https://pavlosmak.github.io/'>Pavlos Makridis</a>"
    venue=""
    desc="Practical Path Guiding in Production uses a 5D spatio-directional octree to represent the light field for the purpose of path guiding, but unfortunately, visualizing a 5D structure is quite difficult. Our key observation, is that if we consider the toy task of rendering a 2D scene, this 5D tree becomes 3D tree, which we can easily visualize. To this end we implement a custom 2D path tracer, and an interactive tool where you can trace rays and visualize how the SD tree learns to represent the radiance field."
    code="https://github.com/PavlosMak/Visualizing-Practical-Path-Guiding"
>}} 

{{< project 
    img="/images/projects/teapot_interactive.gif" 
    tag=""
    title="The Unnamed Game Engine"
    authors="<span class='me'>Jorge Romeu Huidobro</span>, <a href='https://pavlosmak.github.io/'>Pavlos Makridis</a>"
    venue=""
    desc="OpenGL game engine built from scratch. Includes an entity component system, shadow mapping, PBR shaders, SDF Glyph Rendering, Bézier curve animation and more!"
    links=""
    code="https://github.com/PavlosMak/UnnamedGameEngine"
>}} 

{{< project 
    img="/images/projects/blender_gdp.gif" 
    tag=""
    title="Blender Geometry Processing Addon"
    authors="<span class='me'>Jorge Romeu Huidobro</span>, <a href='https://pavlosmak.github.io/'>Pavlos Makridis</a>, Rodrigo Álvarez Lucendo"
    venue=""
    desc="A [blender](https://www.blender.org/) plugin implementing various geometry processing algorithms. Includes several variants of the [Iterative Closest Point](https://ieeexplore.ieee.org/abstract/document/924423) algorithm for mesh registration, and a number of mesh editing tools based on Laplacian and Gradient Transformations."
    links=""
    code="https://github.com/Jorgeromeu/blender-geometry-processing"
>}} 

{{< project 
    img="https://raw.githubusercontent.com/SERG-Delft/testknight/master/screenshots/duplicate-test.gif" 
    tag=""
    title="TestKnight: An Interactive Assistant for Test Engineering"
    authors="Cristian-Alexandru Botocan*, Piyush Deshmukh*, <a href='https://pavlosmak.github.io/'>Pavlos Makridis</a>*, <span class='me'>Jorge Romeu Huidobro</span>*, Mathanrajan Sundarrajan*, Mauricio Aniche, Andy Zaidman (* Joint First Authorship)"
    venue="International Conference on Software Testing [ICSE 2022]"
    desc="An IntelliJ plugin for creating unit tests for python. Includes automatic assertion suggestion, MCDC flow analysis, enhanced code coverage and more."
    links=""
    code="https://github.com/SERG-Delft/testknight"
    paper="https://ieeexplore.ieee.org/document/9793793"
>}} 
