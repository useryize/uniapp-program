"""
把设计稿素材压缩进小程序 static 目录
- 750px 宽（2x @375px 基准），JPEG 质量 80
- 原图在 pages/mall/design/assets/（12M），小程序主包限制 2M，必须压缩
"""
from PIL import Image
import os

SRC = "E:/github/uniapp-program/pages/mall/design/assets"
DST = "E:/github/uniapp-program/static/mall"

# 源图 -> 小程序内文件名（与 mock db 的 cover 字段对应）
MAP = {
    "hero.png":     "hero.jpg",
    "lookbook.png": "lookbook.jpg",
    "hoodie.png":   "hoodie.jpg",
    "tee.png":      "tee.jpg",
    "denim.png":    "denim.jpg",
    "sneaker.png":  "sneaker.jpg",
    "cargo.png":    "cargo.jpg",
}

os.makedirs(DST, exist_ok=True)
total = 0
for src, dst in MAP.items():
    s = os.path.join(SRC, src)
    if not os.path.exists(s):
        print("缺失:", src)
        continue
    im = Image.open(s).convert("RGB")
    if im.width > 750:
        im = im.resize((750, round(im.height * 750 / im.width)), Image.LANCZOS)
    p = os.path.join(DST, dst)
    im.save(p, "JPEG", quality=80, optimize=True)
    kb = os.path.getsize(p) // 1024
    total += kb
    print(f"{dst:16s} {im.size[0]}x{im.size[1]}  {kb}KB")

print(f"合计 {total}KB（原 12M → 压缩后 {total}KB）")
