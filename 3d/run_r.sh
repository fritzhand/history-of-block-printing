#!/bin/bash
# run_r.sh NAME [views] [W H] [samples] — full pipeline at preview res: base -> detail -> render -> montage
cd "$(dirname "$0")/.."
N=${1:-r}; V=${2:-front,three,side,back}; W=${3:-560}; H=${4:-720}; S=${5:-24}
python3 3d/pk_base.py 256 320 >/dev/null && python3 3d/pk_detail.py 3d/work/base_256x320.npz 1024 640 3d/work/d_$N 240 320 >/dev/null
/opt/homebrew/bin/blender -b --factory-startup --python-exit-code 1 --python 3d/bl_build.py -- --prefix 3d/work/d_$N --out 3d/work/$N --views $V --size $W $H --samples $S 2>&1 | grep -E "Error|Traceback|rror:"
python3 3d/montage.py 3d/work/$N 3d/work/$N.png ${V//,/ }
