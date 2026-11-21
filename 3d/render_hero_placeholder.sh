#!/bin/bash
# Placeholder hero: a 12 s sweep around the model, stone then printed cloth, EEVEE, 1280x720.
cd "$(dirname "$0")/.."
for v in stone printed; do
  /opt/homebrew/bin/blender -b --factory-startup --python-exit-code 1 --python 3d/bl_build.py -- \
    --prefix 3d/work/final --variant $v --bg dark --engine EEVEE --size 1280 720 --ortho 0.34 --shiftx -0.2 \
    --sweep -50 70 --turntable 288 3d/work/hero_$v 2>&1 | grep -E "^turn|rror:|Traceback|Terminating"
done
echo ALLDONE
