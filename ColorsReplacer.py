# !/usr/bin/python

import os
import os.path
import sys
import re
import fnmatch
import fileinput

def matchAnyPattern(fileName, patternList):
	for pattern in patternList:
		if fnmatch.fnmatch(fileName, pattern):
			return True
	return False

def replaceCoupleListInFile(rootDirectoryPath, replacementCoupleList=list(), fileFilterList=[u"*"], fileIgnoreList=[], dirIgnoreList=[]):
	if not replacementCoupleList or len(replacementCoupleList) == 0:
		return
	for root, dirs, files in os.walk(top=rootDirectoryPath, topdown=True):
		files = [f for f in files if matchAnyPattern(f,fileFilterList)]
		files = [f for f in files if not matchAnyPattern(f,fileIgnoreList)]
		dirs[:] = [d for d in dirs if not matchAnyPattern(d,dirIgnoreList)]
		for name in files:
			fileName = os.path.join(root, name)
			with fileinput.FileInput(fileName, inplace=True, backup='.bak') as file:
				fileChanged = False
				for line in file:
					lineOut = line
					for couple in replacementCoupleList:
						lineOut = re.sub(u"(?P<prefix>[^0-9A-Fa-f&]|^)("+couple[0]+u")(?P<suffix>([0-9A-Fa-f]{2})?([^0-9A-Za-z]|$))", u"\g<prefix>"+couple[1]+u"\g<suffix>", lineOut, flags=re.IGNORECASE)
					fileChanged = fileChanged or not (lineOut.strip() == line.strip())
					print(lineOut, end='')
			if not fileChanged:
				os.remove(fileName)
				os.rename(fileName+'.bak',fileName)
			else:
				os.remove(fileName+'.bak')
			# SAFE
			# return
	return

if __name__ == '__main__':
	path = u"."
	
	if len(sys.argv) < 3:
		sys.exit("Need at least two argument")
	
	fileFilterList = list()
	fileIgnoreList = list()
	dirIgnoreList = list()

	# fileFilterList = [u"*.java",u"*.less",u"*.css"]
	# fileIgnoreList = [u"*.log",u"*.pyc",u"*.png"]
	dirIgnoreList = [u".svn",u".git",u"target",u"sql-archives"]

	if not fileFilterList:
		fileFilterList = [u"*"]
	
	# TODO : get list of replacements
	replacementCoupleList = ()
	with open(sys.argv[1]) as f:
		replacementCoupleList = f.readlines()
	replacementCoupleList = [x.strip() for x in replacementCoupleList if x.strip()]
	replacementCoupleList = [x.split(sep=u" => ") for x in replacementCoupleList]
	ignoredReplacementLineList = [x for x in replacementCoupleList if len(x) <= 1]
	for x in ignoredReplacementLineList:
		print(x)
	replacementCoupleList = [x for x in replacementCoupleList if len(x) > 1]
	replacementCoupleList = [[x[0].strip(),x[1].strip()] for x in replacementCoupleList]
	# for (before,after) in replacementCoupleList:
		# print(before,u"--->",after)
	# sys.exit(u"Stop")
	
	for index in range(2, len(sys.argv)):
		path = sys.argv[index]
		
		fileFilterList = [u"*.java",u"*.less",u"*.css",u"*.jspf",u"*.jsp",u"*.html"]
		
		replaceCoupleListInFile(path, replacementCoupleList=replacementCoupleList, fileFilterList=fileFilterList, fileIgnoreList=fileIgnoreList, dirIgnoreList=dirIgnoreList)
	
