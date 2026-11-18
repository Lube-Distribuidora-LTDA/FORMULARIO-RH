import math, sys
from PIL import Image, ImageDraw, ImageFilter

destino = sys.argv[1]
logo_origem = r"C:\Users\gti.julio.alves\Desktop\BI\15. PROPOSTA ECOMMERCE B2B\assets\logo-lube.png"

AZUL = (13, 23, 110)       # #0D176E
AZUL_ESCURO = (6, 12, 64)
AZUL_MEDIO = (42, 55, 150) # #2A3796
VERMELHO = (229, 16, 31)   # #E5101F

# Fundo 1920x1080: azul-marinho com degrade, faixas inclinadas (14 graus) azul medio e vermelha
W, H = 1920, 1080
fundo = Image.new('RGB', (W, H), AZUL)
px = fundo.load()
for y in range(H):
    for x in range(0, W):
        t = (x / W) * 0.55 + (y / H) * 0.45
        r = int(AZUL[0] * (1 - t) + AZUL_ESCURO[0] * t)
        g = int(AZUL[1] * (1 - t) + AZUL_ESCURO[1] * t)
        b = int(AZUL[2] * (1 - t) + AZUL_ESCURO[2] * t)
        px[x, y] = (r, g, b)

camada = Image.new('RGBA', (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(camada)
inc = math.tan(math.radians(14))

def faixa(y_base, altura, cor, alpha):
    # paralelogramo horizontal inclinado em 14 graus, de ponta a ponta
    deslocamento = H * inc
    pts = [(-200, y_base), (W + 200, y_base - (W + 400) * inc),
           (W + 200, y_base - (W + 400) * inc + altura), (-200, y_base + altura)]
    d.polygon(pts, fill=cor + (alpha,))

faixa(1060, 80, AZUL_MEDIO, 150)
faixa(1160, 30, VERMELHO, 255)
faixa(1212, 12, VERMELHO, 120)
# brilho suave no canto superior esquerdo
brilho = Image.new('RGBA', (W, H), (0, 0, 0, 0))
db = ImageDraw.Draw(brilho)
db.ellipse((-500, -600, 900, 500), fill=(60, 80, 200, 70))
brilho = brilho.filter(ImageFilter.GaussianBlur(160))

fundo = Image.alpha_composite(fundo.convert('RGBA'), brilho)
fundo = Image.alpha_composite(fundo, camada).convert('RGB')
fundo.save(destino + r"\fundo-lube-forms.jpg", quality=92)

# Logo reduzida, com transparencia, para o topo do formulario (fundo branco)
logo = Image.open(logo_origem).convert('RGBA')
alvo_w = 900
logo = logo.resize((alvo_w, round(logo.height * alvo_w / logo.width)), Image.LANCZOS)
logo.save(destino + r"\logo-lube-forms.png", optimize=True)
print('ok', fundo.size, logo.size)
