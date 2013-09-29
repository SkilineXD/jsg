#!/usr/bin/python
import string
import sys


modules = ("CORE", "CAMERA", "LIGHT", "EXTRAS", "MATERIAL", "OBJECTS", "SCENE", "SHADERS", "COLLECTIONS", "UTILS");
modules_path = {"CORE": "../api/jsgwebgl.js", "CAMERA": "../api/jsgwebgl_cam.js", "LIGHT": "../api/jsgwebgl_light.js", "EXTRAS": "../api/jsgwebgl_extras.js", "MATERIAL":"../api/jsgwebgl_material.js", "OBJECTS":"../api/jsgwebgl_obj.js", "SCENE":"../api/jsgwebgl_scene.js", "SHADERS": "../api/jsgwebgl_shader.js","COLLECTIONS":"../api/jsg_collections.js", "UTILS":"../api/jsgutils.js"}

def pack(outpath):
	out = open(outpath, "w")
	for m in modules:
		script = open(modules_path[m], "r");
		lines = script.readlines()
		for line in lines:
			out.write(line)
		script.close();
	out.close()

n = len(sys.argv)
path = "../dist/jsg3d.js"
if (n > 1):
	path = sys.argv[1]
pack(path);