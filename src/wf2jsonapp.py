#!/usr/bin/python
import wavefront2json1
import wavefront2json2
import sys

path = "default.obj"
name = "default"
n = len(sys.argv)
if (n >= 2):
	path = sys.argv[1]
if (n >=3):
	name = sys.argv[2]

model = wavefront2json2.makeModelDescription(path, name)
model.generateJSON()

model2 = wavefront2json1.makeModelDescription(model.mtllib, name + "mtl")
model2.generateJSON()
