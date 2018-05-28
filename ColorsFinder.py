# !/usr/bin/python

import os
import os.path
import sys
import re
import fnmatch

def matchAnyPattern(fileName, patternList):
	for pattern in patternList:
		if fnmatch.fnmatch(fileName, pattern):
			return True
	return False

def findColorsMatches(rootDirectoryPath, regexPattern=u"(#([0-9A-Fa-f]{8}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{3}))(?:[^0-9A-Fa-f]|$)", fileFilterList=[u"*"], fileIgnoreList=[], dirIgnoreList=[], colorsMatch=dict()):
	for root, dirs, files in os.walk(top=rootDirectoryPath, topdown=True):
		files = [f for f in files if matchAnyPattern(f,fileFilterList)]
		files = [f for f in files if not matchAnyPattern(f,fileIgnoreList)]
		dirs[:] = [d for d in dirs if not matchAnyPattern(d,dirIgnoreList)]
		for name in files:
			fileName = os.path.join(root, name)
			filetext = ""
			with open(fileName, 'r') as textfile:
				filetext = textfile.read()
				textfile.close()
			for groupFound in re.finditer(regexPattern, filetext):
				key = groupFound.group(1).upper()
				if len(key) == 4:
					key = key[0] + key[1] + key[1] + key[2] + key[2] + key[3] + key[3]
				key = key[0:7]
				try:
					colorsMatch[key] = colorsMatch[key] + 1
				except KeyError as e:
					# print("KeyError",str(e))
					colorsMatch[key] = 1
	return colorsMatch

def findExtensionSet(rootDirectoryPath, fileFilterList=[u"*"], fileIgnoreList=[], dirIgnoreList=[]):
	extensionSet = set()
	for root, dirs, files in os.walk(top=rootDirectoryPath, topdown=True):
		files = [f for f in files if matchAnyPattern(f,fileFilterList)]
		files = [f for f in files if not matchAnyPattern(f,fileIgnoreList)]
		dirs[:] = [d for d in dirs if not matchAnyPattern(d,dirIgnoreList)]
		for name in files:
			extensionSet.add(os.path.splitext(name)[1])
	return extensionSet

if __name__ == '__main__':
	path = u"."
	
	# dirIgnoreList = [u".svn",u".git",u"target",u"sql-archives"]
	# for root, dirs, files in os.walk(top=path, topdown=True):
		# for name in dirs:
			# print(name, u"match pattern in",dirIgnoreList,u"?",matchAnyPattern(name,dirIgnoreList))
	# sys.exit(0)
	
	if len(sys.argv) < 2:
		sys.exit("Need at least one argument")
	
	fileFilterList = list()
	fileIgnoreList = list()
	dirIgnoreList = list()

	# fileFilterList = [u"*.java",u"*.less",u"*.css"]
	# fileIgnoreList = [u"*.log",u"*.pyc",u"*.png"]
	dirIgnoreList = [u".svn",u".git",u"target",u"sql-archives"]

	if not fileFilterList:
		fileFilterList = [u"*"]
	
	colorsMatch = dict()
	for index in range(1, len(sys.argv)):
		path = sys.argv[index]
		extensionSet = findExtensionSet(path, fileIgnoreList=fileIgnoreList, dirIgnoreList=dirIgnoreList)
		print(u"Extension")
		for ext in extensionSet:
			print(u'\t',ext)
		
		fileFilterList = [u"*.java",u"*.less",u"*.css",u"*.jspf",u"*.jsp",u"*.html"]
		
		colorsMatch = findColorsMatches(path, fileFilterList=fileFilterList, fileIgnoreList=fileIgnoreList, dirIgnoreList=dirIgnoreList, colorsMatch=colorsMatch)
	print(u"Color Matches number of occurrences")
	for color in colorsMatch:
		print(u'\t',color,":",colorsMatch[color])
	print(u"=== Colors")
	for color in colorsMatch:
		print(color)
