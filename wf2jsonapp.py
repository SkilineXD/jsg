#!/usr/bin/python
import wavefront2json1
import wavefront2json2
import sys

path = "default.obj"
name = "default"
mtype = "object"

n = len(sys.argv)
if (n >= 2):
	path = sys.argv[1]
if (n >=3):
	name = sys.argv[2]
if (n >=4):
	mtype = sys.argv[3]

model = wavefront2json2.makeModelDescription(path, name)
model.type = mtype
model.generateJSON()

model2 = wavefront2json1.makeModelDescription(model.mtllib, name + "mtl")
if (model2):
	model2.generateJSON()
