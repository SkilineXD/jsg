#!/usr/bin/python
import wavefront2json1
import wavefront2json2
import sys, os, glob

path = ""
name = "default"
mtype = "object"
useMaterialGroup = False
options = {}

n = len(sys.argv)
if (n >= 3):
	path = sys.argv[1]
	name = sys.argv[2]
else:
	print("Error: invalid argument list.")
for i in range(3, n):
	option = sys.argv[i]
	params = option.split('=')
	options[params[0]] = params[1]
	
if "modelType" in options.keys():
	model.type = options["modelType"]

dirname = os.path.dirname(path)

if (not dirname.endswith(os.sep)):
		dirname = dirname + os.sep	
	
model = wavefront2json2.makeModelDescription(path, name, options)
model.type = mtype
model.generateJSON()

model2 = wavefront2json1.makeModelDescription(dirname+model.mtllib, name + "mtl")
if (model2):
	model2.generateJSON()
