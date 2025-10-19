<div align="center">

[English](README.md) | 中文



<img src="./logo.png" width="1000px"></img>

  **Turn arXiv Papers into Multilingual Masterpieces**
#
<!-- <p align="center">
  <a href="https://arxiv.org/abs/2503.06594" alt="paper"><img src="https://img.shields.io/badge/Paper-LaTeXTrans-blue?logo=arxiv&logoColor=white"/></a>
</p> -->

</div>

<div align="center">
<p dir="auto">

• 📖 [介绍](#-介绍) 
• 🛠️ [安装指南](#️-安装指南) 
• ⚙️ [配置说明](#️-配置说明)
• 🐳 [Docker](#-docker)
• 📚 [使用方式](#-使用方式)
• 🖼️ [翻译样例](#️-翻译样例) 

</p>
</div>

 从 arXiv 论文 ID 到译文 PDF 的端到端翻译。LaTeXTrans 有如下的特点和优势 :
 - **🌟 保持公式、排版和交叉引用的完整性**
 - **🌟 保证术语翻译的一致性**
 - **🌟 支持从原文 LaTeX 源码（通过提供的 arXiv 论文 id 自动下载）到译文 PDF 的端到端翻译**

借助 LaTeXTrans，研究人员和学生可以得到更高质量的论文翻译而无需担心格式混乱或内容缺失，从而更高效地阅读和理解 arXiv 论文。

# 📖 介绍

LaTeXTrans 是一个基于多智能体协作的结构化 LaTeX 文档翻译系统. 该系统能够直接翻译 LaTeX 代码，并生成与原文排版高度一致的译文 PDF。 不同于传统文档翻译方法（例如 PDF 翻译）容易破坏公式和格式，该系统使用大模型直接翻译预处理过的论文 LaTeX 源码，并通过由 Parser, Translator, Validator, Summarizer, Terminology Extractor, Generator 这六个智能体组成的工作流实现了排版一致和格式保持. 

 
# 🛠️ 安装指南

#### 1. 克隆仓库

```bash
git clone https://github.com/PolarisZZM/LaTeXTrans.git
cd LaTeXTrans
pip install -r requirements.txt
```

#### 2. 安装MikTex（推荐, 更轻量）或TeXLive

如需编译LaTeX文件（例如生成PDF输出），需要安装 [MikTex](https://miktex.org/download) 或 [TeXLive](https://www.tug.org/texlive/) !

 > [!IMPORTANT]
*对于 MikTex，安装时请务必选择 “install on the fly”，此外，您需要额外安装 [Strawberry Perl](http://strawberryperl.com/) 支持编译。


# ⚙️ 配置说明

项目已移除 `config/default.toml`，全部配置通过环境变量提供。

必填（LLM）:

- `LTX_BASE_URL` 或 `BASE_URL`：LLM 接口地址（如 `https://api.deepseek.com/v1/chat/completions`）
- `LTX_API_KEY` 或 `API_KEY`：LLM API Key
- `LTX_MODEL` 或 `MODEL`：模型名称（如 `deepseek-chat`）

可选：

- `LTX_CONCURRENCY` 或 `CONCURRENCY`：并发请求数（默认 `10`）
- `ARXIV_BASE_URL`：arXiv 基础域名（默认 `https://arxiv.org`），如使用镜像可设置
- `LTX_TARGET_LANGUAGE`（默认 `ch`）、`LTX_SOURCE_LANGUAGE`（默认 `en`）
- `LTX_MODE`（默认 `0`）、`LTX_USER_TERM`（术语表路径或空）
- `APP_PASSWORD`：Web UI 登录密码（使用容器服务时必填）
- `JWT_SECRET`（默认 `dev-secret`）、`TOKEN_TTL_SECONDS`（默认 `604800`）

推荐 base_url 样例：

| Model | base_url |
|:-|:-|
| deepseek-chat | https://api.deepseek.com/v1/chat/completions |
| gpt-4o | https://api.openai.com/v1/chat/completions |
| gemini-2.5-pro | https://generativelanguage.googleapis.com/v1beta/openai/chat/completions |

# 🐳 Docker

构建前后端一体镜像：

```bash
docker build -t latextrans .
```

运行并通过环境变量配置：

```bash
docker run -p 8000:8000 \
  -e APP_PASSWORD=your_password \
  -e LTX_BASE_URL=https://api.deepseek.com/v1/chat/completions \
  -e LTX_API_KEY=sk-xxx \
  -e LTX_MODEL=deepseek-chat \
  -e LTX_CONCURRENCY=16 \
  -e ARXIV_BASE_URL=https://arxiv.org \
  latextrans
```

浏览器打开 `http://localhost:8000`，使用 `APP_PASSWORD` 登录后提交 arXiv ID 即可。


# 📚 使用方式

### 通过 ArXiv ID 翻译
只需提供 arXiv 论文 ID 即可完成翻译：

```bash
# 本地 CLI 使用前设置环境变量
export LTX_BASE_URL=...
export LTX_API_KEY=...
export LTX_MODEL=...
export LTX_CONCURRENCY=10

python main.py --arxiv 2508.18791
```

该命令将：

1. 从 arXiv 下载 LaTeX 源码并解压
2. 执行由解析、翻译、重构和编译组成的工作流
3. 在 outputs 文件夹保存翻译后的 LaTeX 项目和编译生成的译文 PDF

 > [!NOTE]
尽管 LaTeXTrans 支持任意语言到任意语言的翻译，但是目前版本仅对英文到中文的翻译做了相对完善的编译适配。翻译到其他语言时，最终输出的 pdf 可能会有错误，欢迎提出 issue 来描述您遇到的问题，我们会逐个解决。

# 🖼️ 翻译样例

以下是 **LaTeXTrans** 生成的三个真实翻译样例，左侧为原文，右侧为译文。

### 📄 样例 1 ( 英文->中文 ) :

<table>
  <tr>
    <td align="center"><b>原文</b></td>
    <td align="center"><b>译文</b></td>
  </tr>
  <tr>
    <td><img src="examples/case1src.png" width="100%"></td>
    <td><img src="examples/case1ch.png" width="100%"></td>
  </tr>
</table>

### 📄 样例 2 ( 英文->中文 ):

<table>
  <tr>
    <td align="center"><b>原文</b></td>
    <td align="center"><b>译文</b></td>
  </tr>
  <tr>
    <td><img src="examples/case3src.png" width="100%"></td>
    <td><img src="examples/case3ch.png" width="100%"></td>
  </tr>
</table>

### 📄 样例 3 ( 英文->日文 ):

<table>
  <tr>
    <td align="center"><b>原文</b></td>
    <td align="center"><b>译文</b></td>
  </tr>
  <tr>
    <td><img src="examples\case-en.png" width="100%"></td>
    <td><img src="examples\case-jp.png" width="100%"></td>
  </tr>
</table>

### 📄 样例 4 ( 英文->日文 ):

<table>
  <tr>
    <td align="center"><b>原文</b></td>
    <td align="center"><b>译文</b></td>
  </tr>
  <tr>
    <td><img src="examples\case5a-1-en.png" width="100%"></td>
    <td><img src="examples\case5b-1-jp.png" width="100%"></td>
  </tr>
</table>

📂 **更多样例请查看[`examples/`](examples/) 文件夹**, 包含每个样例的完整翻译 PDF。

---

## Citation
```bash
@article{zhu2025latextrans,
  title={LaTeXTrans: Structured LaTeX Translation with Multi-Agent Coordination},
  author={Zhu, Ziming and Wang, Chenglong and Xing, Shunjie and Huo, Yifu and Tian, Fengning and Du, Quan and Yang, Di and Zhang, Chunliang and Xiao, Tong and Zhu, Jingbo},
  journal={arXiv preprint arXiv:2508.18791},
  year={2025}
}
