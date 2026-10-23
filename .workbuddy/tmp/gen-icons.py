"""
生成页面用线性图标（PNG）
设计稿 15-设计系统板 的图标规范：2px 描边线性图形、硬边、无 emoji
输出 81×81 透明底 PNG，stroke 色可配（白=深底用 / 黑=浅底用）
"""
from PIL import Image, ImageDraw
import os

S = 81
OUT = "E:/github/uniapp-program/static/mall/icons"
os.makedirs(OUT, exist_ok=True)

WHITE = (255, 255, 255, 255)
BLACK = (10, 10, 10, 255)
W = 6          # 描边宽度


def canvas():
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    return im, ImageDraw.Draw(im)


def save(im, name, color):
    # 统一把描边色替换：先画成白色再按需着色
    im.save(f"{OUT}/{name}.png")


def search(c):
    im, d = canvas()
    d.ellipse([16, 16, 54, 54], outline=c, width=W)
    d.line([54, 54, 66, 66], fill=c, width=W)
    return im


def cart(c):
    im, d = canvas()
    d.line([10, 14, 22, 14], fill=c, width=W)
    d.line([22, 14, 32, 56], fill=c, width=W)
    d.line([32, 56, 62, 56], fill=c, width=W)
    d.line([62, 56, 70, 26], fill=c, width=W)
    d.line([26, 26, 68, 26], fill=c, width=W)
    d.rectangle([28, 60, 38, 70], fill=c)
    d.rectangle([54, 60, 64, 70], fill=c)
    return im


def calendar(c):
    im, d = canvas()
    d.rectangle([12, 16, 68, 66], outline=c, width=W)
    d.line([12, 32, 68, 32], fill=c, width=W)
    d.line([28, 8, 28, 22], fill=c, width=W)
    d.line([52, 8, 52, 22], fill=c, width=W)
    d.rectangle([34, 42, 46, 54], fill=c)
    return im


def ruler(c):
    im, d = canvas()
    d.rectangle([10, 28, 70, 52], outline=c, width=W)
    for x in (22, 34, 46, 58):
        d.line([x, 28, x, 40], fill=c, width=4)
    return im


def grid(c):
    im, d = canvas()
    d.rectangle([12, 12, 36, 36], fill=c)
    d.rectangle([45, 12, 69, 36], fill=c)
    d.rectangle([12, 45, 36, 69], fill=c)
    d.rectangle([45, 45, 69, 69], fill=c)
    return im


def back(c):
    im, d = canvas()
    d.line([50, 14, 26, 40], fill=c, width=W)
    d.line([26, 40, 50, 66], fill=c, width=W)
    return im


def close(c):
    im, d = canvas()
    d.line([22, 22, 58, 58], fill=c, width=W)
    d.line([58, 22, 22, 58], fill=c, width=W)
    return im


def heart(c):
    im, d = canvas()
    d.arc([14, 20, 44, 50], 180, 360, fill=c, width=W)
    d.arc([36, 20, 66, 50], 180, 360, fill=c, width=W)
    d.line([16, 38, 40.5, 64], fill=c, width=W)
    d.line([40.5, 64, 65, 38], fill=c, width=W)
    return im


def share(c):
    im, d = canvas()
    d.ellipse([52, 10, 70, 28], outline=c, width=W)
    d.ellipse([11, 37, 29, 55], outline=c, width=W)
    d.ellipse([52, 52, 70, 70], outline=c, width=W)
    d.line([28, 42, 53, 24], fill=c, width=W)
    d.line([28, 50, 53, 66], fill=c, width=W)
    return im


def service(c):
    im, d = canvas()
    d.ellipse([24, 8, 56, 40], outline=c, width=W)
    d.arc([8, 38, 72, 82], 180, 360, fill=c, width=W)
    return im


def truck(c):
    im, d = canvas()
    # 车厢
    d.rectangle([6, 22, 44, 48], outline=c, width=W)
    # 车头（斜四边形，明确闭合）
    d.polygon([(44, 30), (58, 30), (72, 42), (72, 48), (44, 48)], outline=c, width=W)
    # 前窗
    d.line([52, 34, 52, 42], fill=c, width=4)
    # 轮子
    d.rectangle([16, 48, 26, 58], fill=c)
    d.rectangle([54, 48, 64, 58], fill=c)
    return im


def location(c):
    im, d = canvas()
    # 定位针：圆 + 下方汇聚的尖角
    d.ellipse([22, 8, 58, 44], outline=c, width=W)
    d.line([25, 40, 40, 72], fill=c, width=W)
    d.line([55, 40, 40, 72], fill=c, width=W)
    d.ellipse([34, 20, 46, 32], fill=c)
    return im


def arrow_right(c):
    im, d = canvas()
    d.line([16, 40, 62, 40], fill=c, width=W)
    d.line([46, 24, 62, 40], fill=c, width=W)
    d.line([46, 56, 62, 40], fill=c, width=W)
    return im


def check(c):
    im, d = canvas()
    d.line([14, 42, 30, 58], fill=c, width=W)
    d.line([30, 58, 66, 20], fill=c, width=W)
    return im


def clock(c):
    im, d = canvas()
    d.ellipse([12, 12, 68, 68], outline=c, width=W)
    d.line([40, 24, 40, 42], fill=c, width=W)
    d.line([40, 42, 54, 50], fill=c, width=W)
    return im


def star(c):
    im, d = canvas()
    pts = []
    import math
    for i in range(10):
        r = 26 if i % 2 == 0 else 11
        a = -math.pi / 2 + i * math.pi / 5
        pts.append((40 + r * math.cos(a), 40 + r * math.sin(a)))
    d.polygon(pts, fill=c)
    return im


# 深底用（白）/ 浅底用（黑）
WHITE_ICONS = {
    "search": search, "cart": cart, "calendar": calendar, "ruler": ruler, "grid": grid
}
# 红底容器用：白色版宫格
grid_white = lambda c: grid(c)
WHITE_ICONS["grid_white"] = grid_white
BLACK_ICONS = {
    "back": back, "close": close, "heart": heart, "share": share,
    "service": service, "truck": truck, "location": location,
    "arrow_right": arrow_right, "check": check, "clock": clock, "star": star
}

for name, fn in WHITE_ICONS.items():
    fn(WHITE).save(f"{OUT}/{name}.png")
for name, fn in BLACK_ICONS.items():
    fn(BLACK).save(f"{OUT}/{name}.png")

print("图标已生成:", len(os.listdir(OUT)), "个")
print(sorted(os.listdir(OUT)))


# ---- 追加：订单状态入口与功能宫格所需图标 ----
def coupon(c):
    """优惠券：票券 + 中缝虚线"""
    im, d = canvas()
    d.rectangle([8, 22, 73, 58], outline=c, width=W)
    for x in range(26, 56, 10):
        d.line([x, 22, x, 58], fill=c, width=3)
    d.ellipse([2, 32, 14, 44], fill=(0, 0, 0, 0))
    d.ellipse([67, 32, 79, 44], fill=(0, 0, 0, 0))
    return im


def setting(c):
    """设置：太阳（圆心 + 8 条射线）"""
    im, d = canvas()
    import math
    d.ellipse([28, 28, 53, 53], outline=c, width=W)
    for i in range(8):
        a = i * math.pi / 4
        d.line([40.5 + 15 * math.cos(a), 40.5 + 15 * math.sin(a),
                40.5 + 22 * math.cos(a), 40.5 + 22 * math.sin(a)], fill=c, width=W)
    return im


def slider(c):
    """滑块：三条横线 + 滑块方块"""
    im, d = canvas()
    for y, cx in ((22, 32), (40, 50), (58, 26)):
        d.line([10, y, 71, y], fill=c, width=W)
        d.rectangle([cx - 9, y - 9, cx + 9, y + 9], fill=c)
    return im


def package(c):
    """包裹：箱子 + 标签"""
    im, d = canvas()
    d.rectangle([10, 26, 71, 66], outline=c, width=W)
    d.line([10, 40, 71, 40], fill=c, width=W)
    d.line([40, 40, 40, 66], fill=c, width=W)
    return im


def refund(c):
    """退款售后：回转箭头"""
    im, d = canvas()
    d.arc([16, 18, 66, 68], 40, 320, fill=c, width=W)
    d.polygon([(58, 8), (72, 26), (52, 28)], fill=c)
    return im


for name, fn in (("coupon", coupon), ("setting", setting), ("slider", slider), ("package", package), ("refund", refund)):
    fn(BLACK).save(f"{OUT}/{name}.png")

print("追加图标完成")
