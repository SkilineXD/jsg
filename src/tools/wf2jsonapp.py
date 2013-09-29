#!/usr/bin/python
import wavefront2json1
import wavefront2json2
import sys, os, glob

path = ""
name = "default"
mtype = "object"

n = len(sys.argv)
if (n >= 2):
	path = sys.argv[1]
if (n >=3):
	name = sys.argv[2]
if (n >= 4):
	mtype = sys.argv[3]

if (not path.endswith(os.sep)):
		path = path + os.sep	

model = wavefront2json2.makeModelDescription(path+name+".obj", name)
model.type = mtype
model.generateJSON()

model2 = wavefront2json1.makeModelDescription(path+model.mtllib, name + "mtl")
if (model2):
	model2.generateJSON()
