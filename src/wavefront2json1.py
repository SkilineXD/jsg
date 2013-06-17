#!/usr/bin/python3
#Filename: wavefront2json1.py
#Author: Gilzamir F. Gomes (gilzamir@gmail.com) at five of march from 2013

class Material:
	def __init__(self, name, ambColor, diffColor, specColor, shininess, transparence, opticalDensity):
		self.name = name
		self.ambient = ambColor
		self.diffuse = diffColor
		self.specular = specColor
		self.shininess = shininess
		self.transparence = transparence
		self.opticalDensity = opticalDensity
	def generateJSON(self):
		print("{"),
		print("\"name\":\"{0}\",".format(self.name)),
		print("\"ambient\":[{0}, {1}, {2}, {3}],".format(self.ambient[0], self.ambient[1], self.ambient[2], self.ambient[3])),
		print("\"diffuse\":[{0}, {1}, {2}, {3}],".format(self.diffuse[0], self.diffuse[1], self.diffuse[2], self.diffuse[3])),
		print("\"specular\":[{0}, {1}, {2}, {3}],".format(self.specular[0], self.specular[1], self.specular[2], self.specular[3])),
		print("\"shininess\":{0},".format(self.shininess)),
		print("\"transparence\":{0},".format(self.transparence)),
		print("\"opticalDensity\":{0}".format(self.opticalDensity)),
		print("}"),


class ModelDescription:
	def __init__(self, name):
		self.materials = []
		self.name = name
	
	def addMaterial(self, m):
		self.materials.append(m)

	def generateJSON(self):
		print("var {0} = {1}".format(self.name,"{"))
		print("\"materialList\":["),
		i = 0
		for mat in self.materials:
			if i > 0:
				print(", ")
			else:
				i = i  + 1
			mat.generateJSON()
			
		print("]")
		print("};")

def makeModelDescription(path, name):
	source = None
	model = None
	try:
		source = open(path, 'r')
		model = ModelDescription(name)
		mat = None
		lines = source.readlines()

		for line in lines:
			line = line.strip()
			data = line.split()
			if (len(line) == 0):
				continue
			elif data[0] == "newmtl":
				mat = Material(data[1], [], [], [], 0, 0, 0)
				model.addMaterial(mat)
			elif (data[0] == "Ka"):
				mat.ambient = [data[1], data[2], data[3], 1.0]
			elif data[0] == "Kd":
				mat.diffuse = [data[1], data[2], data[3], 1.0]
			elif data[0] == "Ks":
				mat.specular = [data[1], data[2], data[3], 1.0]
			elif data[0] == "d" or data[0] == "Tr":
				mat.transparence = data[1]
			elif data[0] == "Ns":
				mat.shininess = data[1]
			elif data[0] == "Ni":
				mat.opticalDensity = data[1]
	finally:
		if source:
			source.close()
		return model
