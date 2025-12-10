# Noxtools

**Noxtools** is a simplified hub designed to centralize all my future personal tools in a single interface.

## Requirements

Before starting, ensure your environment matches these versions.

### Required versions
- **Python** : *3.12.x* ➜ `python --version`
- **pip** : *25.x* ➜ `pip --version`
- **Node.js** : *22.12.x* ➜ `node -v`
- **npm** : *11.x* ➜ `npm -v`
- **nvm** : *0.39.x* ➜ `nvm -v`

Then, install the necessary dependencies.

```bash
sudo apt update
sudo apt install ffmpeg

sudo apt-get install -y \
  build-essential \
  libeigen3-dev \
  libyaml-dev \
  libfftw3-dev \
  libavcodec-dev \
  libavformat-dev \
  libavutil-dev \
  libswresample-dev \
  libsamplerate0-dev \
  libtag1-dev \
  libchromaprint-dev \
  python3-dev
  git clone https://github.com/MTG/essentia.git
  cd essentia
  python3 waf configure --with-examples --mode=release
  python3 waf
  sudo python3 waf install
  sudo ldconfig
  which essentia_streaming_extractor_music
```

## Getting Started

### Backend (FastAPI)

Create and activate a virtual environment
```
cd backend
python -m venv .venv
source .venv/bin/activate
```

Install backend dependencies
```
pip install -r requirements.txt
```

Run the development server
```
uvicorn app.main:app --reload
```

---

### Frontend (React + Vite)

Install Node dependencies:
```
cd frontend
npm install
```

Start the development server:
```
npm run dev
```
