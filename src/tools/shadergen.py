#!/usr/bin/python
import string
import sys

def parseLine(line, shaderType, tabs):
	line = line.strip()
	oline = line + ""
	tpl = string.Template(line)
	line  = tpl.substitute({"JSG_POSITIONAL_LIGTH_QTD":"\"+ jsg.positionalLightQtd + \"",
					 "JSG_DIRECTIONAL_LIGTH_QTD" : "\" + jsg.directionalLightQtd + \"",
					 "JSG_MAX_SHADOWS" : "\" + jsg.shadowCount + \"",
					 "IF_POSITIVE_POS_LIGHT_QTD" : "if (jsg.positionalLightQtd > 0)",
					 "IF_POSITIVE_DIR_LIGHT_QTD" : "if (jsg.directionalLightQtd > 0)",
					 "IF_SHADOWMAP_ON" : "if (jsg.shadowCount > 0)",
					 });				
	if (oline.find("$IF_POSITIVE_DIR_LIGHT_QTD") != -1 or oline.find("$IF_POSITIVE_POS_LIGHT_QTD") != -1 or oline.find("$IF_SHADOWMAP_ON") != -1): 
		return tabs + line + " ";
	elif (len(line) > 0):
		return tabs + "this.{0}.text.push(\"{1}\");\n".format(shaderType, line)
	else:
		return False

def generateShaders(ss, vsp, fsp):
		sst = open(ss, 'r')
		vspt = open(vsp, 'r');
		fspt = open(fsp, 'r');
		out = open("../api/jsgwebgl_shader.js", "w");
		
		for sline in sst:
			if (sline.find("//LOAD_SHADERS") != -1):
				args = sline.split(",")
				tabs = int(args[1].strip())
				tabStr = ""
				for i in range(0, tabs):
					tabStr = tabStr + "\t";
				for line in vspt:
					line = line.strip()
					oline = line + ""
					l  = parseLine(line, "vertexShader", tabStr)
					if (l):
						out.write(l)
				for line in fspt:
					line = line.strip()
					l = parseLine(line, "fragShader", tabStr)
					if (l):
						out.write(l);
			else:
				out.write(sline);
		out.close();
		sst.close();
		vspt.close();
		fspt.close();
shaderScript = "../templates/shaderscript.tpl"
vertexShader = "../templates/shadervs.txt"
fragShader = "../templates/shaderfs.txt"

n = len(sys.argv)
if (n == 3):
	shaderScript = sys.argv[1]
	vertexShader = sys.argv[2]
	fragShader = sys.argv[3];
generateShaders(shaderScript, vertexShader, fragShader);

