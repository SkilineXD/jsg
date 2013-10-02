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
		self.normalList = []
		self.max = 65535
		self.sum = 0
		self.infGroups = [] #influence groups		

	def addIndexValue(self, model, idx, te, tn):
		vertices = model.vertices
		texVertices = model.texVertices
		normalVertices = model.normalVertices
		n = len(self.vertexList)/3
		if (idx in self.map.keys()):
			n = self.map[idx]
			self.indexList.append(n)
		else:
			v = vertices[idx]
			vt = None
			vn = None
			if (tn != None):
				if (len(normalVertices) > 0):
					vn = normalVertices[tn];
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
			if (vn != None):
				self.normalList.append(vn.x)
				self.normalList.append(vn.y)
				self.normalList.append(vn.z)
			else:
				self.normalList.append(-2)
				self.normalList.append(-2)
				self.normalList.append(-2)				
			self.indexList.append(n)
			self.sum = self.sum + 3
			if (self.sum >= self.max):
				ig = self.infGroups[len(self.infGroups)-1]
				ig.count = len(self.indexList) - ig.start + 1
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

	def generateJSON4(self):
		k = 0
		print("[", end=''),
		for idx in range(0, len(self.normalList)):
			i = self.normalList[idx]
			if (k > 0):
				print(",", end=' ')
			else:
				k = k + 1
			print(i, end='')
		print("]", end='')

	def generateJSON5(self):
		k = 0
		for idx in range(0, len(self.infGroups)):
			i = self.infGroups[idx]
			if (i.count > 0 or i.count==-1):
				if (k > 0):
					print(",", end=' ')
				else:
					k = k + 1
				print("{", end=''),
				print("\"name\":\"{0}\",".format(i.name), end='')
				print("\"range\":[{0}, {1}],".format(i.start, i.count), end='')
				print("\"material\":\"{0}\"".format(i.material), end='')
				print("}", end='')

#Representa um objeto 3D contendo vértices e/ou grupos de vértices.
class Object3D:
	def __init__(self, name):
		self.name = name
		self.s = ""
		self.group = []
		self.vertices = []
		self.type = "o"
		self.groupName = []
		
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
		#print("\"normal\":[", end=' ')
		#j = 0;	
		#for g in self.group:
		#	if (j > 0):
		#		print(",", end=' ')
		#	else:
		#		j = j + 1
		#	g.generateJSON4()
		#print("],")

		j = 0;	
		print("\"influenceGroups\" : [", end=' ')
		for g in self.group:
			if (j > 0):
				print(",", end=' ')
			else:
				j = j + 1
			g.generateJSON5()
		print("]")
		print("}")

class ModelDescription:
	def __init__(self, name):
		self.mtllib = "";
		self.objects = []
		self.vertices = []
		self.texVertices = []
		self.normalVertices = []
		self.name = name
		self.type = "group"
	
	def addVertex(self, v):
		self.vertices.append(v)

	def addTexVertex(self, v):
		self.texVertices.append(v)
		
	def addNormalVertex(self, v):
		self.normalVertices.append(v)
		
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

class InfGroup: #influence group
	def __init__(self, name, start, qtd):
		self.name = name
		self.start = start
		self.count = qtd
		self.material = "Material"

#main script		
model = None
cvGroupCount = 0
currentObject = None
currentMat = "Material"
cvGroup = None
ciGroup = None

def addNewGroup(obname):
	global cvGroup
	global ciGroup
	global currentObject
	global model
	global currentMat
	if (cvGroup == None):
		if (currentObject == None):
			currentObject = Object3D(obname)
			model.objects.append(currentObject);
			currentObject.type = "object"
		cvGroup = VertexGroup(currentObject.name)
		currentObject.addVertexGroup(cvGroup)
	else:
		if (len(cvGroup.infGroups)==0):
			cvGroup.infGroups.append(InfGroup("default", 0, -1))
	if (ciGroup != None):
		ciGroup.count = len(cvGroup.indexList) - ciGroup.start;
	ciGroup = InfGroup(obname, len(cvGroup.indexList), 0)
	ciGroup.material = currentMat
	cvGroup.infGroups.append(ciGroup)

def closePreviewGroup():
	global cvGroup
	global ciGroup
	global currentObject
	global model
	global currentMat
	if (cvGroup != None):
		if (ciGroup != None):
			if (len(cvGroup.infGroups) == 0):
				cvGroup.infGroups.append(InfGroup("default", 0, -1))
			ciGroup.count  = len(cvGroup.indexList) - ciGroup.start
			
def handleFaceInformation(data):
	global cvGroup
	global ciGroup
	global currentObject
	global model
	global currentMat
	if (cvGroup==None):
		if (ciGroup == None):
			ciGroup = InfGroup("default", 0, -1)
		cvGroup = VertexGroup(currentMat)
		cvGroup.infGroups.append(ciGroup);
		if (currentObject == None):
			currentObject = Object3D("Default")
		currentObject.addVertexGroup(cvGroup)
	for vi in data[1::]:
		vi = vi.strip()
		l = vi
		j = None
		k = None
		i = None
		if (not vi.isdigit()):
			l = vi.split("/")
			i = int(l[0]) - 1
			if (len(l) > 1 and l[1].isdigit()):
				j = int(l[1]) - 1
			if (len(l) > 2 and l[2].isdigit()):
				k = int(l[2]) - 1
		else:
			i = int(l) - 1
		if cvGroup.addIndexValue(model, i, j, k):
			if (len(cvGroup.infGroups) == 0):
				cvGroup.infGroups.append(InfGroup("default", 0, -1))
			ng = VertexGroup(cvGroup.name)
			cvGroup = ng
			ciGroup = InfGroup(ciGroup.name, 0, 0)
			ng.infGroups.apppend(ciGroup)
			currentObject.addVertexGroup(cvGroup)
			cvGroupCount = 0
			
def handleObjectInformation(data):
	global cvGroup
	global ciGroup
	global currentObject
	global model
	global currentMat
	closePreviewGroup()
	obname = data[1];
	currentObject = Object3D(obname)
	currentObject.type = "object";
	model.objects.append(currentObject)	
	cvGroup = None
	ciGroup = None			
			
def makeModelDescription(path, name, options):
	options = options or {}
	useMaterialGroups = "false"
	if ("useMaterialGroup" in options.keys()):
		useMaterialGroups = options["useMaterialGroup"]
	try:
		global cvGroup
		global ciGroup
		global currentObject
		global model
		global currentMat
		source = open(path, 'r')
		model = ModelDescription(name)
		cvGroupCount = 0
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
			elif data[0] == "vn":
				v = Vertex(float(data[1]), float(data[2]),float(data[3]))
				model.addNormalVertex(v)
		for line in lines:
			line = line.strip()
			data = line.split()
			if (len(line) == 0):
				continue
			elif data[0] == "f":
				handleFaceInformation(data)
			elif (data[0] == "o"):
				handleObjectInformation(data)
			elif (data[0] == "g"):
				obname = data[1]
				addNewGroup(obname)
			elif data[0] == "mtllib":
				model.mtllib = data[1]
			elif data[0] == "usemtl":
				currentMat = data[1]
				if (useMaterialGroups in ["true", "yes"]):
					obname = currentMat
					addNewGroup(obname)
				else:
					if (ciGroup != None):
						ciGroup.material = currentMat
		closePreviewGroup()
	except error :
		print(error)
		print('Try again...')
	finally:
		if source:
			source.close()
		return model
