#!/bin/bash
# run_prev.sh NPZ NAME [views] — render previews and tile them
cd "$(dirname "$0")/.."
/opt/homebrew/bin/blender -b --factory-startup --python-exit-code 1 --python 3d/bl_preview.py -- "$1" 3d/work/$2 ${3:-front,three,side,back} ${4:-560} ${5:-720} 2>&1 | grep -E "Error|Traceback|rror:" 
python3 3d/montage.py 3d/work/$2 3d/work/$2.png ${3//,/ }
