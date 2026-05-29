# image · 图片资源

站点图片统一放在此文件夹。

- `favicon.svg` — 站点图标（金色星芒徽记）

## 用法

在 HTML 中引用：

```html
<img src="image/your-photo.jpg" alt="描述">
```

在 CSS 中引用（注意 `css/style.css` 在 `css/` 子目录，需用 `../` 回到根目录）：

```css
background-image: url("../image/your-photo.jpg");
```

> 主页当前的星空、星云、太阳等视觉效果均由 CSS/Canvas 生成，不依赖图片文件；
> 此文件夹供后续文章配图、封面图、Open Graph 分享图等使用。
