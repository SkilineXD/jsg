#!/usr/bin/python3
#Filename: wavefront2json.py
#Author: Gilzamir F. Gomes (gilzamir@gmail.com) at five of march from 2013

class Vertex:
	def __init__(self, x, y, z):
		self.x = x
		self.y = y
		self.z = z
	
	def generateJSON(self):
		print("{0}, {1}, {2}".format(self.x, self.y, self.z)),

class VertexGroup:
	def __init__(self, group):
		self.group = group
		self.vertexIndexList = []
	
	def generateJSON(self):
		k = 0
		for i in self.vertexIndexList:
			if (k > 0):
				print(", "),
			k = k + 1
			print(i),

class Object3D:
	def __init__(self, name):
		self.name = name
		self.s = ""
		self.idx = 0
		self.faceTable = [[]]
		self.groups = []
	
	def addVertexGroup(self, f):
		n = len(self.faceTable[self.idx])*3
		if (n < 65535):
			self.groups.append(f.group)
			self.faceTable[self.idx].append(f)		
		else:
			self.idx = self.idx + 1;
			self.addVertexGroup(f)

	def generateJSON(self):
		print("{")
		print("\"s\":\"{0}\",".format(self.s))
		print("\"idx\":{0},".format(self.idx))
		print("\"name\":\"{0}\",".format(self.name))
		print("\"data\":["),
		j = 0;
		for faceList in self.faceTable:
			i = 0
			print("["),	
			if (j > 0):
				print(", ")
			j = j + 1

			for f in faceList:
				if (i > 0):
					print(", "),
				f.generateJSON()
				i = i + 1
			print("]"),
		print("],")
		j = 0
		print("\"groupName\":["),
		for str in self.groups:
			if (j > 0):
				print (",")
			print("\"" + str + "\""),
		print("]}"),

class ModelDescription:
	def __init__(self, name):
		self.mtllib = "";
		self.objects = []
		self.vertexTable = []
		self.name = name

	def generateJSON(self):
		print("var {0} = {1}".format(self.name,"{"))
		print("\"mtllib\":\"{0}\",".format(self.mtllib))
		i = 0
		print("\"vertexList\":["),
		for v in self.vertexTable:
			if i > 0:
				print(", "),
			v.generateJSON()
			i = i + 1
		print("], ")
		
		i = 0
		print("\"objectList\":["),
		for obj in self.objects:
			if i > 0:
				print(", ")
			obj.generateJSON()
			i = i  + 1
		print("]")
		print("};")

def makeModelDescription(path, name):
	source = None
	model = None
	try:
		source = open(path, 'r')
		model = ModelDescription(name)
		currentObject = None
		currentMat = None
		cvGroup = None
		while True:
			line = source.readline()
			line = line.strip()
			if (len(line) == 0):
				if (currentObject):			
					model.objects.append(currentObject)
				break
			data = line.split()
			if data[0] == "v":
				v = Vertex(float(data[1]), float(data[2]), float(data[3]))
				model.vertexTable.append(v)
			elif data[0] == "f":
				if (cvGroup==None):
					cvGroup = VertexGroup("Material")
					currentObject.addVertexGroup(cvGroup) 			
				for i in data[1::]:
					cvGroup.vertexIndexList.append(int(i)-1)
			elif (data[0] == "o"):
				if currentObject:
					model.objects.append(currentObject)
				currentObject = Object3D(data[1])
			elif data[0] == "mtllib":
				model.mtllib = data[1]
			elif data[0] == "usemtl":
				cvGroup = VertexGroup(data[1])
				currentObject.addVertexGroup(cvGroup)
				

	except IOError:
		print('Input/Output error: no open file default.obj')
		print('Try again...')
	finally:
		if source:
			source.close()
		return model
