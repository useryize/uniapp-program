"""
生成 tabBar 图标：街头潮流实心几何风格
- 4 个 tab × 2 状态（未选 #8C8C8C / 选中 #0A0A0A）
- 微信小程序 tabBar 推荐 81×81 PNG
设计稿 14-交互流程图 / 15-设计系统板 中的图标语言：实心、硬边、无圆角曲线
"""
from PIL import Image, ImageDraw
import os

S = 81          # 画布边长
OUT = "E:/github/uniapp-program/static/mall/tabbar"
GREY = (140, 140, 140, 255)
BLACK = (10, 10, 10, 255)

os.makedirs(OUT, exist_ok=True)


def new():
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    return im, ImageDraw.Draw(im)


def home(c):
    """首页：实心房子 + 门洞镂空"""
    im, d = new()
    d.polygon([(40.5, 12), (70, 36), (11, 36)], fill=c)          # 屋顶
    d.rectangle([20, 36, 61, 69], fill=c)                        # 房身
    d.rectangle([34, 48, 47, 69], fill=(0, 0, 0, 0))              # 门
    d.rectangle([20, 36, 61, 41], fill=(0, 0, 0, 0))              # 腰线镂空
    im.save(f"{OUT}/home_{'on' if c == BLACK else 'off'}.png")


def grid(c):
    """分类：四宫格方块（硬边，呼应 brutalism）"""
    im, d = new()
    for x in (12, 45):
        for y in (12, 45):
            d.rectangle([x, y, x + 24, y + 24], fill=c)
    im.save(f"{OUT}/category_{'on' if c == BLACK else 'off'}.png")


def cart(c):
    """购物车：实心车斗 + 车轮"""
    im, d = new()
    d.polygon([(10, 20), (22, 20), (31, 56), (64, 56), (72, 31), (26, 31)], fill=c)
    d.rectangle([28, 60, 38, 70], fill=c)   # 左轮
    d.rectangle([55, 60, 65, 70], fill=c)   # 右轮
    im.save(f"{OUT}/cart_{'on' if c == BLACK else 'off'}.png")


def user(c):
    """我的：实心头 + 肩部块"""
    im, d = new()
    d.ellipse([29, 12, 52, 35], fill=c)
    d.pieslice([18, 38, 63, 76], 180, 360, fill=c)
    d.rectangle([18, 55, 63, 72], fill=c)
    im.save(f"{OUT}/user_{'on' if c == BLACK else 'off'}.png")


for color in (GREY, BLACK):
    home(color)
    grid(color)
    cart(color)
    user(color)

print("tabBar 图标已生成：", os.listdir(OUT))
