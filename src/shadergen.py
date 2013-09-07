#!/usr/bin/python
import string
import sys

def generateShaders(ss, vsp, fsp):
		sst = open(ss, 'r')
		vspt = open(vsp, 'r');
		fspt = open(fsp, 'r');
		out = open("jsgwebgl_shader.js", "w");
		
		for sline in sst:
			if (sline.find("//LOAD_SHADERS") != -1):
				args = sline.split(",")
				tabs = int(args[1].strip())
				tabStr = ""
				for i in range(0, tabs):
					tabStr = tabStr + "\t";
				for line in vspt:
					line = line.strip()
					tpl = string.Template(line)
					line  = tpl.substitute({"JSG_POSITIONAL_LIGTH_QTD":"\"+ jsg.positionalLightQtd + \"",
									 "JSG_DIRECTIONAL_LIGTH_QTD" : "\" + jsg.directionalLightQtd + \""});
					if (len(line) > 0):
						out.write(tabStr + "this.vertexShader.text.push(\"{0}\");\n".format(line))
				
				for line in fspt:
					line = line.strip();
					tpl = string.Template(line);
					line  = tpl.substitute({"JSG_POSITIONAL_LIGTH_QTD":"\"+ jsg.positionalLightQtd + \"",
									 "JSG_DIRECTIONAL_LIGTH_QTD" : "\" + jsg.directionalLightQtd + \""});
					if (len(line) > 0):
						out.write(tabStr + "this.fragShader.text.push(\"{0}\");\n".format(line))
			else:
				out.write(sline);
		out.close();
		sst.close();
		vspt.close();
		fspt.close();
shaderScript = "shaderscript.tpl"
vertexShader = "shadervs.txt"
fragShader = "shaderfs.txt"

n = len(sys.argv)
if (n == 3):
	shaderScript = sys.argv[1]
	vertexShader = sys.argv[2]
	fragShader = sys.argv[3];
generateShaders(shaderScript, vertexShader, fragShader);

