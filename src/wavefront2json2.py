#!/usr/bin/python3
#Filename: wavefront2json.py
#Author: Gilzamir F. Gomes (gilzamir@gmail.com) at five of march from 2013

class Vertex:
	def __init__(self, x, y, z):
		self.x = x
		self.y = y
		self.z = z

	def generateJSON(self):
		print(self.x),
		print(", "),
		print(self.y),
		print(", "),
		print(self.x),

	def toArray(self):
		return [self.x, self.y, self.z]

class VertexGroup:
	def __init__(self, group):
		self.group = group
		self.indexList = []
		self.map = {}
		self.vertexList = []
		self.max = 65535
		self.sum = 0

	def addIndexValue(self, vertices, idx):
		v = vertices[idx]
		n = len(self.vertexList)/3
		if (self.map.has_key(idx)):
			n = self.map[idx]
			self.indexList.append(n)
		else:
			self.map[idx] = n
			self.vertexList.append(v.x)
			self.vertexList.append(v.y)
			self.vertexList.append(v.z)
			self.indexList.append(n)
			self.sum = self.sum + 3
			if (self.sum >= self.max):
				self.sum = 0
				return True			
		return False

	def generateJSON(self):
		k = 0
		print("["),
		for i in self.indexList:
			if (k > 0):
				print(", "),
			else:
				k = k + 1
			print(i),
		print("]"),

	def generateJSON2(self):
		k = 0
		print("["),
		for i in self.vertexList:
			if (k > 0):
				print(", "),
			else:
				k = k + 1
			print(i),
		print("]"),

class Object3D:
	def __init__(self, name):
		self.name = name
		self.s = ""
		self.faces = []
		self.vertices = []
		self.groups = []
		
	def addVertexGroup(self, f):
		self.groups.append(f.group)
		self.faces.append(f)		
		
	def generateJSON(self):
		print("{")
		print("\"s\":\"{0}\",".format(self.s))
		print("\"name\":\"{0}\",".format(self.name))
		print("\"indices\":["),
		j = 0;
		for f in self.faces:
			if (j > 0):
				print(", "),
			else:
				j = j + 1
			f.generateJSON()
		print("],")

		print("\"vertices\":["),
		j = 0;	

		for f in self.faces:
			if (j > 0):
				print(", "),
			else:
				j = j + 1
			f.generateJSON2()
		print("],")

		j = 0
		print("\"groupName\":["),
		for str in self.groups:
			if (j > 0):
				print (","),
			else:
				j = j + 1
			print("\"" + str + "\""),
		print("]}"),

class ModelDescription:
	def __init__(self, name):
		self.mtllib = "";
		self.objects = []
		self.vertices = []
		self.name = name
	
	def addVertex(self, v):
		self.vertices.append(v)

	def generateJSON(self):
		print("var {0} = {1}".format(self.name,"{"))
		print("\"mtllib\":\"{0}\",".format(self.mtllib))
		i = 0
		
		print("\"objectList\":["),
		for obj in self.objects:
			if i > 0:
				print(", ")
			else:
				i = i  + 1
			obj.generateJSON()
			
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
				v = Vertex(float(data[1]), float(data[2]),float(data[3]))
				model.addVertex(v)
			elif data[0] == "f":
				if (cvGroup==None):
					cvGroup = VertexGroup("Material")
					currentObject.addVertexGroup(cvGroup)			
				for i in data[1::]:
					if cvGroup.addIndexValue(model.vertices, int(i)-1):
						currentObject.addVertexGroup(cvGroup)
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
