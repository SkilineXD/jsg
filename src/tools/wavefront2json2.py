#!/usr/bin/python3
#Filename: wavefront2json2.py
#Author: Gilzamir F. Gomes (gilzamir@gmail.com) at five of march from 2013
#Este aquivo contém métodos e objetos para extração de informações de arquivos no formato wavefront (*.obj).
#Apenas um subconjunto da  sintaxe do formato *.obj é suportada, notadamente, aquele subconjunto gerado pelo
#Blender quando exportamos modelos gerados no software Blender.

#Representa um vértice em um objeto 3D. Guarda coordenadas x, y e z.
class Vertex:
	def __init__(self, x, y, z):
		self.x = x
		self.y = y
		self.z = z

	#Gera os valores das coordenadas de modo que a string gerada possa ser incluida numa lista no formato JSON de coordenadas de vértices.
	def generateJSON(self):
		print(self.x),
		print(", ", end=' ')
		print(self.y),
		print(", "),
		print(self.x),

	#Gera um array contento os valores das coordenadas.
	def toArray(self):
		return [self.x, self.y, self.z]

#Um grupo de vertices ou eh um grupo definindo um conjunto de vértices que recebem a aplicação de um material específico
#ou é um grupo formato por uma quantidade máxima de vértices. No último caso, quando o objeto representado possui mais do
#65535 vértices, este objeto é dividido em grupos, cada um dos grupos possuindo no máximo 65535 vértices. Isso é importante
#WebGL que permite apenas que o valor de um índice do tipo short, que limita os valores de indices a 65535.
class VertexGroup:
	def __init__(self, group):
		self.group = group
		self.indexList = []
		self.map = {}
		self.vertexList = []
		self.texList = []
		self.max = 65535
		self.sum = 0
	def addIndexValue(self, model, idx, te): 
		vertices = model.vertices
		texVertices = model.texVertices
		n = len(self.vertexList)/3
		if (idx in self.map.keys()):
			n = self.map[idx]
			self.indexList.append(n)
		else:
			v = vertices[idx]
			vt = None
			if (te != None):
				vt =  texVertices[te]
			self.map[idx] = n
			self.vertexList.append(v.x)
			self.vertexList.append(v.y)
			self.vertexList.append(v.z)
			if (vt != None):
				self.texList.append(vt.x)
				self.texList.append(vt.y)
				self.texList.append(vt.z)
			else:
				self.texList.append(-2)
				self.texList.append(-2)
				self.texList.append(-2)
			self.indexList.append(n)
			self.sum = self.sum + 3
			if (self.sum >= self.max):
				self.sum = 0
				return True
		return False

	def generateJSON(self):
		k = 0
		print("[", end='')
		for idx in range(0, len(self.indexList)):
			i = self.indexList[idx]
			if (k > 0):
				print(",", end='')
			else:
				k = k + 1
			print(i, end='')
		print("]", end=''),

	def generateJSON2(self):
		k = 0
		print("[", end=''),
		for idx in range(0, len(self.vertexList)):
			i = self.vertexList[idx]
			if (k > 0):
				print(",", end=' ')
			else:
				k = k + 1
			print(i, end=' ')
		print("]", end=''),
		
	def generateJSON3(self):
		k = 0
		print("[", end=''),
		for idx in range(0, len(self.texList)):
			i = self.texList[idx]
			if (k > 0):
				print(",", end=' ')
			else:
				k = k + 1
			print(i, end='')
		print("]", end='')

#Representa um objeto 3D contendo vértices e/ou grupos de vértices.
class Object3D:
	def __init__(self, name):
		self.name = name
		self.s = ""
		self.group = []
		self.vertices = []
		self.groupName = []
		self.material = "Material"
		self.groupMaterial = []
		self.type = "o"
		
	def addVertexGroup(self, f):
		self.groupName.append(f.group)
		self.group.append(f)		
		
	def generateJSON(self):
		print("{")
		print("\"s\":\"{0}\",".format(self.s))
		print("\"name\":\"{0}\",".format(self.name))
		print("\"indices\":[", end=' ')
		j = 0;
		for g in self.group:
			if (j > 0):
				print(",", end=' ')
			else:
				j = j + 1
			g.generateJSON()
		print("],")

		print("\"vertices\":[", end=' ')
		j = 0;	

		for g in self.group:
			if (j > 0):
				print(",", end=' ')
			else:
				j = j + 1
			g.generateJSON2()
		print("],", end='')

		print("\"textmap\":[", end=' ')
		j = 0;	
		for g in self.group:
			if (j > 0):
				print(",", end=' ')
			else:
				j = j + 1
			g.generateJSON3()
		print("],")

		j = 0
		print("\"groupName\":[", end=' ')
		for str in self.groupName:
			if (j > 0):
				print (",", end=' ')
			else:
				j = j + 1
			print("\"" + str + "\"", end=' ')
		print("],")
		j = 0
		print("\"groupMaterial\":[", end=' ')
		for str in self.groupMaterial:
			if (j > 0):
				print (",", end=' ')
			else:
				j = j + 1
			print("\"" + str + "\"", end=' ')
		print("]")
		print("}", end='')

class ModelDescription:
	def __init__(self, name):
		self.mtllib = "";
		self.objects = []
		self.vertices = []
		self.texVertices = []
		self.name = name
		self.type = "group"
	
	def addVertex(self, v):
		self.vertices.append(v)

	def addTexVertex(self, v):
		self.texVertices.append(v)
		
	def generateJSON(self):
		print("var {0} = {1}".format(self.name,"{"))
		print("\"mtllib\":\"{0}\",".format(self.mtllib))
		print("\"type\":\"{0}\",".format(self.type))
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
	groups = {}
	cvGroupCount = 0
	try:
		source = open(path, 'r')
		model = ModelDescription(name)
		currentObject = None
		currentMat = None
		cvGroup = None
		lines = source.readlines()
		for line in lines:
			line = line.strip()
			data = line.split()
			if (len(line) == 0):
				continue
			if data[0] == "v":
				v = Vertex(float(data[1]), float(data[2]),float(data[3]))
				model.addVertex(v)
			elif data[0] == "vt":
				v = Vertex(float(data[1]), float(data[2]),float(data[3]))
				model.addTexVertex(v)
		for line in lines:
			line = line.strip()
			data = line.split()
			if (len(line) == 0):
				continue
			elif data[0] == "f":
				if (cvGroup==None):
					cvGroup = VertexGroup(currentObject.material)
					currentObject.addVertexGroup(cvGroup)
					cvGroupCount = cvGroupCount + 1
				for vi in data[1::]:
					vi = vi.strip()
					l = vi
					j = None
					k = None
					i = None
					#print(":) " + l);
					if (not vi.isdigit()):
						l = vi.split("/")
						i = int(l[0]) - 1
						if (len(l) > 1 and l[1].isdigit()):
							j = int(l[1]) - 1
					else:
						i = int(l) - 1
					if cvGroup.addIndexValue(model, i, j):
						ng = VertexGroup(cvGroup.name)
						cvGroup = ng
						currentObject.groupMaterial.append(currentMat)
						currentObject.addVertexGroup(cvGroup)
						cvGroupCount = 0
			elif (data[0] == "o"):
				obname = data[1];
				currentObject = Object3D(obname)
				currentObject.type = data[0];
				model.objects.append(currentObject)
			elif (data[0] == "g"):
				obname = data[1];
				if currentObject == None:
					currentObject = Object3D(obname)
					currentObject.type = data[0]
					model.objects.append(currentObject)
				if (obname in currentObject.groupName):
					idx = currentObject.groupName.index(obname)
					cvGroup = currentObject.group[idx]
				else:
					cvGroup = VertexGroup(data[1])
					currentObject.addVertexGroup(cvGroup)
					cvGroupCount = cvGroupCount + 1
			elif data[0] == "mtllib":
				model.mtllib = data[1]
			elif data[0] == "usemtl":
				currentMat = data[1]
				for g in range(cvGroupCount):
					currentObject.groupMaterial.append(currentMat)
				cvGroupCount = 0
		for g in range(cvGroupCount):
			currentObject.groupMaterial.append(currentMat)
	except error :
		print(error)
		print('Try again...')
	finally:
		if source:
			source.close()
		return model
