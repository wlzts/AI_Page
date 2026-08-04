# 好像有用网页实验室

这是一个适合 GitHub Pages 的纯静态集成网站模板。

## 目录结构

```text
仓库根目录/
├── index.html
├── .nojekyll
└── projects/
    ├── wash-hair/
    │   └── index.html
    └── 下一个项目英文目录名/
        └── index.html
```

## 发布到 GitHub Pages

1. 将本目录内的全部文件上传到 GitHub 仓库根目录。
2. 打开仓库的 `Settings` → `Pages`。
3. `Source` 选择 `Deploy from a branch`。
4. 分支选择 `main`，文件夹选择 `/(root)`，点击 `Save`。
5. 等待部署完成后，访问：
   `https://你的用户名.github.io/仓库名/`

## 新增网页

1. 在 `projects` 中新建一个只使用英文、数字和连字符的目录，例如：
   `projects/social-battery/`
2. 将网页文件命名为 `index.html`，放入该目录。
3. 打开根目录的 `index.html`，在 `projects` 数组增加一项：

```js
{
  title: "社交电量检测站",
  description: "检测今天还能进行多少低强度社交活动。",
  category: "社交",
  date: "2026.08.05",
  href: "./projects/social-battery/",
  accent: "#73539a",
  keywords: "社交 电量 聊天"
}
```

## 路径注意事项

请使用相对路径：

```js
href: "./projects/social-battery/"
```

不要使用以 `/` 开头的绝对路径，否则仓库型 GitHub Pages 在
`用户名.github.io/仓库名/` 下可能找不到文件。
