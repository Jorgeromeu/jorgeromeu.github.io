---
title: Home
---

{{< aboutme >}}
I am a Research Engineer at [ALLSIDES](https://www.allsides.tech/) working on physically based inverse rendering for 3D scanning at scale. My research interests lie at the intersection of physically based forward and inverse rendering, and generative AI for 3D applications. 

I completed a M.Sc in computer science at TU Delft where I wrote my thesis on geometry-guided video generation, under the supervision of [Petr Kellnhofer](https://kellnhofer.xyz/). Before this, I obtained a B.Sc in computer science at TU Delft, my thesis was writen under the supervision of [Elmar Eisemann](https://graphics.tudelft.nl/) and was on importance sampling for physically based rendering.

In my free time I enjoy spending time outdoors, hiking, skiing, swimming, scuba diving, and learning something new.
{{< /aboutme >}}

# Projects

Some of the projects I worked on during my studies

{{< project 
    media="/images/projects/stormtrooper.mp4" 
    title="Geometry Guided Video Generation with Diffusion Feature Textures"
    authors="<span class='me'>Jorge Romeu Huidobro</span>, <a href='https://kellnhofer.xyz'>Petr Kellnhofer</a>, <a href='https://lukas.uzolas.com/'>Lukas Uzolas</a>, <a href='https://graphics.tudelft.nl/~marroquim/'>Ricardo Marroquim</a>, <a href='https://graphics.tudelft.nl/~eisemann/'>Elmar Eisemann</a>"
    venue=""
    tag="Master Thesis"
    desc="Propose a method for video generation from an animated 3D mesh with a 2D diffusion model. Our approach first generates a texture for the guidance mesh using [existing methods for multi-view consistent generation](https://arxiv.org/abs/2408.01291) and we extract features from the model while generating the texture. We then generate video frames using depth conditioning from the input 3D animation, to enforce temporal consistency we use the features extracted in the previous stage.  By using this two-stage pipeline, our method gives stronger robustness to occlusions, changes in object scale than [prior work](https://primecai.github.io/generative_rendering/)"
    code="https://github.com/Jorgeromeu/diffusion-feature-textures"
    paper="https://repository.tudelft.nl/record/uuid:2f42fdf6-d988-4096-957a-ab8d1d3bf5f2"
    highlight="true"
>}} 

{{< project 
    media="/images/projects/light_portals.png" 
    tag="Bachelor Thesis"
    title="Efficient Area Light Sampling with Light Portals"
    authors="<span class='me'>Jorge Romeu Huidobro</span>, <a href='https://markvanderuit.nl/'>Mark van de Ruit</a>, <a href='https://graphics.tudelft.nl/~eisemann/'>Elmar Eisemann</a>"
    venue=""
    desc="In physically based rendering, sampling light sources is challenging when they are partially occluded (e.g., a bulb inside a lampshade). We propose using artist specified portals which indicate openings to a light. Our key insight, is that the regions of visibility of a light through a portal correspond exactly to the regions of the imaginary shadow cast by the portal. We can then re-use existing shadow volume algorithms to determine the optimal sampling strategy for the portal depending on the location of the shading point. "
    paper="https://repository.tudelft.nl/file/File_cba11b10-ea54-4806-b4e8-ec215b5a8c73?preview=1"
    code="https://github.com/Jorgeromeu/bsc-thesis"
>}} 

{{< project 
    media="/images/projects/nerf2d_optim.gif" 
    tag=""
    title="Scaling down NeRF with NeRF2D"
    authors="<span class='me'>Jorge Romeu Huidobro</span>, Chrysanthos Kindinis, Roy Katz"
    venue=""
    desc="NeRFs learn to represent a 3D scene from posed 2D Images using differentiable volume rendering, but training and rendreing NeRFs remains costly, making it difficult to perform small scale experimentation. We propose a 2D analogue, reconstructing 2D shapes from 1D renders as a proxy task. This simplified setting enables us to replicate results from various NeRF follow-ups using an order of magnitude less compute."
    links=""
    blog="https://hackmd.io/@WdAcp83GSrSWsVvpRJWJ2w/SkPKXfsS0"
    code="https://github.com/Jorgeromeu/NeRF2D"
>}} 


{{< project 
    media="/images/projects/pathguiding_2d.png" 
    tag=""
    title="Visualizing Practical Path Guiding"
    authors="<span class='me'>Jorge Romeu Huidobro</span>, <a href='https://pavlosmak.github.io/'>Pavlos Makridis</a>"
    venue=""
    desc="[Practical Path Guiding](https://tom94.net/data/publications/mueller17practical/mueller17practical.pdf) uses a 5D spatio-directional octree to represent the light field for the purpose of path guiding, but unfortunately this data structure is difficult to visualize for a 3D scene. Our key observation, is that if we consider the toy task of rendering a 2D scene, this 5D tree becomes 3D, which we can easily visualize. To this end we implement a custom 2D path tracer, and an interactive tool where you can trace rays and visualize how the SD tree learns to represent the light field."
    code="https://github.com/PavlosMak/Visualizing-Practical-Path-Guiding"
>}} 

{{< project 
    media="/images/projects/teapot_interactive.gif" 
    tag=""
    title="The Unnamed Game Engine"
    authors="<span class='me'>Jorge Romeu Huidobro</span>, <a href='https://pavlosmak.github.io/'>Pavlos Makridis</a>"
    venue=""
    desc="OpenGL game engine built from scratch. Includes an entity component system, shadow mapping, PBR shaders, SDF Glyph Rendering, Bézier curve animation and more!"
    code="https://github.com/PavlosMak/UnnamedGameEngine"
>}} 

{{< project 
    media="/images/projects/blender_gdp.gif" 
    tag=""
    title="Blender Geometry Processing Addon"
    authors="<span class='me'>Jorge Romeu Huidobro</span>, <a href='https://pavlosmak.github.io/'>Pavlos Makridis</a>, Rodrigo Álvarez Lucendo"
    venue=""
    desc="A [blender](https://www.blender.org/) plugin implementing various geometry processing algorithms. Includes several variants of [Iterative Closest Point](https://ieeexplore.ieee.org/abstract/document/924423) for mesh registration, and a number of mesh editing tools and brushes based on Laplacian and Gradient Transformations."
    links=""
    code="https://github.com/Jorgeromeu/blender-geometry-processing"
>}} 

{{< project 
    media="https://raw.githubusercontent.com/SERG-Delft/testknight/master/screenshots/duplicate-test.gif" 
    tag=""
    title="TestKnight: An Interactive Assistant for Test Engineering"
    authors="Cristian-Alexandru Botocan*, Piyush Deshmukh*, <a href='https://pavlosmak.github.io/'>Pavlos Makridis</a>*, <span class='me'>Jorge Romeu Huidobro</span>*, Mathanrajan Sundarrajan*, <a href='https://mauricioaniche.com/'>Mauricio Aniche</a>, <a href='https://azaidman.github.io/'>Andy Zaidman</a> (* Joint First Authorship)"
    venue="International Conference on Software Testing [ICSE 2022]"
    desc="An IntelliJ plugin for creating unit tests for Java. Includes automatic assertion suggestion, MCDC flow analysis, enhanced code coverage and more."
    links=""
    code="https://github.com/SERG-Delft/testknight"
    paper="https://ieeexplore.ieee.org/document/9793793"
>}} 


# Experience

{{< experience 
    media="https://media.licdn.com/dms/image/v2/D4D0BAQE4yA6UXaVBuA/company-logo_200_200/B4DZdELoeFHMAM-/0/1749195590343/covision_media_logo?e=1759968000&v=beta&t=gU2nXuD558-_NmzEESZ6359i0KLZLif9D_onB96gPII" 
    title="Research Engineer"
    dates="2025-present"
    desc="ALLSIDES"
    links=""
>}} 


{{< experience 
    media="https://media.licdn.com/dms/image/v2/C4E0BAQFwaGpwaod9mQ/company-logo_200_200/company-logo_200_200/0/1670699852672?e=1759968000&v=beta&t=KhHdITmdIZyVjHH9Y3ZMKfvP86WowywUq_3UfVwFysE" 
    title="Teaching Assistant"
    dates="2022-2025"
    desc="Delft University of Technology"
    links=""
>}} 

{{< experience 
    media="https://media.licdn.com/dms/image/v2/C4E0BAQFwaGpwaod9mQ/company-logo_200_200/company-logo_200_200/0/1670699852672?e=1759968000&v=beta&t=KhHdITmdIZyVjHH9Y3ZMKfvP86WowywUq_3UfVwFysE" 
    title="Student Software Engineer"
    dates="2021"
    desc="Delft University of Technology"
    links=""
>}} 



# Education

{{< experience 
    img="https://media.licdn.com/dms/image/v2/C4E0BAQFwaGpwaod9mQ/company-logo_200_200/company-logo_200_200/0/1670699852672?e=1759968000&v=beta&t=KhHdITmdIZyVjHH9Y3ZMKfvP86WowywUq_3UfVwFysE" 
    tag=""
    title="MSc Computer Science"
    dates="2022-2025"
    desc="Delft University of Technology"
    links=""
>}} 

{{< experience 
    img="https://media.licdn.com/dms/image/v2/C4E0BAQFwaGpwaod9mQ/company-logo_200_200/company-logo_200_200/0/1670699852672?e=1759968000&v=beta&t=KhHdITmdIZyVjHH9Y3ZMKfvP86WowywUq_3UfVwFysE" 
    title="BSc Computer Science"
    dates="2019-2022"
    desc="Delft University of Technology"
    links=""
>}} 


{{< experience 
    img="https://media.licdn.com/dms/image/v2/C4E0BAQFwaGpwaod9mQ/company-logo_200_200/company-logo_200_200/0/1670699852672?e=1759968000&v=beta&t=KhHdITmdIZyVjHH9Y3ZMKfvP86WowywUq_3UfVwFysE" 
    title="Minor in Computational Science"
    dates="2022"
    desc="Delft University of Technology"
    links=""
>}} 

