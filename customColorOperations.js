
function w3colorDistance(colorA, colorB) {
	var aArrayLab = RGBtoLAB(colorA.red, colorA.green, colorA.blue);
	var bArrayLab = RGBtoLAB(colorB.red, colorB.green, colorB.blue);
	return ciede2000(
		{
			L:aArrayLab[0],
			a:aArrayLab[1],
			b:aArrayLab[2]
		},
		{
			L:bArrayLab[0],
			a:bArrayLab[1],
			b:bArrayLab[2]
		}
	);
}

function sortColorsByDistanceToRef(colors, referenceW3Color, sortedAsReferenceGroup, postInfosFunction) {
	var sortedColorList = [];
	for( var colorIndex in colors ) {
		var color = colors[colorIndex];
		color.distanceToRef = w3colorDistance(w3color(color.before), referenceW3Color);
		color.distanceCumulatedToPrev = color.distanceToRef;
		if(postInfosFunction) {
			postInfosFunction("progress","Distance to ref calculated for color " + color.before + ' (' + colorIndex + '/' + colors.length + ')');
		}
	}
	colors = colors.sort(function(a, b){
		return (a.distanceToRef - b.distanceToRef);
	});
	if(sortedAsReferenceGroup) {
		var colorsToSort = colors.slice();
		var lastReferenceColor = colorsToSort.shift();
		// console.log("lastReferenceColor",lastReferenceColor);
		sortedColorList.push(lastReferenceColor);
		var lastReferenceW3Color = w3color(lastReferenceColor.before);
		// console.log("lastReferenceW3Color",lastReferenceW3Color);
		while(colorsToSort.length > 0) {
			// console.log("lastReferenceW3Color",lastReferenceW3Color);
			for( var colorIndex in colorsToSort ) {
				var color = colorsToSort[colorIndex];
				color.distanceCumulatedToPrev = color.distanceCumulatedToPrev + w3colorDistance(w3color(color.before), lastReferenceW3Color);
			}
			colorsToSort = colorsToSort.sort(function(a, b){
				return (a.distanceCumulatedToPrev - b.distanceCumulatedToPrev);
			});
			lastReferenceColor = colorsToSort.shift();
			// console.log("lastReferenceColor",lastReferenceColor);
			sortedColorList.push(lastReferenceColor);
			lastReferenceW3Color = w3color(lastReferenceColor.before);
			// console.log("lastReferenceW3Color",lastReferenceW3Color);
			if(postInfosFunction) {
				postInfosFunction("progress","Remaining colors to sort grouping : " + colorsToSort.length);
			}
		}
	} else {
		sortedColorList = colors;
	}
	return sortedColorList;
}

function buildDistanceLabMatrix(colors,postInfosFunction){
	var distanceGrid = {};
	var distanceList = [];
	for (var colorIndex1 = 0; colorIndex1 < colors.length; colorIndex1++) {
		var color1 = colors[colorIndex1];
		if(!(color1.before in distanceGrid)) {
			distanceGrid[color1.before] = {};
		}
		for (var colorIndex2 = colorIndex1; colorIndex2 < colors.length; colorIndex2++) {
			var color2 = colors[colorIndex2];
			if(!(color2.before in distanceGrid)) {
				distanceGrid[color2.before] = {};
			}
			if(postInfosFunction) {
				postInfosFunction("progress","BuildDistanceLabMatrix progress : " + colorIndex1 + '/' + colorIndex2 + '/' + colors.length);
			}
			var distance = w3colorDistance(w3color(color1.before), w3color(color2.before));
			distanceGrid[color1.before][color2.before] = distance;
			distanceGrid[color2.before][color1.before] = distance;
			distanceList[color1.before+"-"+color2.before] = distance;
		}
	}
	return {"grid":distanceGrid,"list":distanceList};
}

function buildColorsConvertionMap(colors, sourceW3Color, targetW3Color, findConvertionOnlyInExistingColors, postInfosFunction) {
	var transformVector = {};
	transformVector.hue = targetW3Color.hue - sourceW3Color.hue;
	transformVector.sat = targetW3Color.sat - sourceW3Color.sat;
	transformVector.lightness = targetW3Color.lightness - sourceW3Color.lightness;
	var conversionMap = {};
	var colorCompleteList = colors.slice();
	for( var colorMainLoopIndex in colorCompleteList ) {
		var messageForColorAtIndex = "buildColorsConvertionMap for color at index : " + colorMainLoopIndex + '/' + colorCompleteList.length;
		var colorBeforeCode = colorCompleteList[colorMainLoopIndex].before;
		var colorBefore = w3color(colorBeforeCode);
		colorBefore.hue = (colorBefore.hue + transformVector.hue + 360) % 360;
		colorBefore.sat = Math.max(Math.min(colorBefore.sat + transformVector.sat, 1.0), 0.0);
		colorBefore.lightness = Math.max(Math.min(colorBefore.lightness + transformVector.lightness, 1.0), 0.0);
		var newColorAfter = w3color(colorBefore.toHslString());
		if( findConvertionOnlyInExistingColors ) {
			var sortedColors = sortColorsByDistanceToRef(
				colors,
				newColorAfter,
				false,
				function(key,message){
					if(postInfosFunction) {
						postInfosFunction(key,messageForColorAtIndex + ' => ' + message);
					}
				}
			);
			newColorAfter = w3color(sortedColors[0].before);
		}
		conversionMap[colorBeforeCode] = newColorAfter.toHexString();
		if(postInfosFunction) {
			postInfosFunction("progress",messageForColorAtIndex + ' : DONE ');
		}
	}
	return conversionMap;
}

function buildColorsProximityGroupList(originalColorDistanceList, colorDistanceMatrix, seuil, postInfosFunction) {
	var colorDistanceList = [];
	for(var key in originalColorDistanceList) {
		colorDistanceList.push(key);
	}
	colorDistanceList = colorDistanceList.sort(function(key1, key2){
		return originalColorDistanceList[key1] - originalColorDistanceList[key2];
	});
	var colorGroups = [];
	var classedColorSet = new Set();
	
	// Build groups as first pass
	for( var colorDistanceIndex in colorDistanceList ) {
		var keys = colorDistanceList[colorDistanceIndex];
		if(postInfosFunction) {
			postInfosFunction("progress","buildColorsProximityGroupList initial progress : " + colorDistanceIndex + '/' + colorDistanceList.length);
		}
		
		keys = keys.split('-');
		
		var color1 = keys[0];
		var color2 = keys[1];
		
		var distance = colorDistanceMatrix[color1][color2];
		if( 0 < distance && distance <= seuil ) {
			var found = false;
			for( var colorGroupIndex in colorGroups ) {
				var colorGroupSet = colorGroups[colorGroupIndex];
				if( colorGroupSet.has(color1) || colorGroupSet.has(color2) ) {
					found = true;
					
					var isCloseEnoughFromEveryOtherColorInGroup = true;
					for( var colorInSet of colorGroupSet ) {
						var distanceToColorInSet = colorDistanceMatrix[color1][colorInSet];
						isCloseEnoughFromEveryOtherColorInGroup = isCloseEnoughFromEveryOtherColorInGroup && ( 0 <= distanceToColorInSet && distanceToColorInSet <= seuil );
						if(!isCloseEnoughFromEveryOtherColorInGroup){break;}
					}
					for( var colorInSet of colorGroupSet ) {
						var distanceToColorInSet = colorDistanceMatrix[color2][colorInSet];
						isCloseEnoughFromEveryOtherColorInGroup = isCloseEnoughFromEveryOtherColorInGroup && ( 0 <= distanceToColorInSet && distanceToColorInSet <= seuil );
						if(!isCloseEnoughFromEveryOtherColorInGroup){break;}
					}
					if(isCloseEnoughFromEveryOtherColorInGroup) {
						if(!classedColorSet.has(color1)) {
							colorGroupSet.add(color1);
							classedColorSet.add(color1);
						}
						if(!classedColorSet.has(color2)) {
							colorGroupSet.add(color2);
							classedColorSet.add(color2);
						}
					}
					break;
				}
			}
			if(!found) {
				classedColorSet.add(color1);
				classedColorSet.add(color2);
				colorGroups.push(new Set([color1,color2]));
			}
		}
	}
	
	// Merge groups
	var noMergeDone = true;
	var safeCounter = 0;
	var safeCounterLimit = colorGroups.length;
	do{
		var mergedGroups = [];
		var mergedGroupIndexes = new Set();
		for( var colorGroupToMergeIndex = 0 ; colorGroupToMergeIndex < colorGroups.length ; colorGroupToMergeIndex++ ) {
			if(postInfosFunction) {
				postInfosFunction("progress","buildColorsProximityGroupList merging(" + safeCounter + ") progress : " + colorGroupToMergeIndex + '/' + colorGroups.length);
			}
			if(!mergedGroupIndexes.has(colorGroupToMergeIndex)) {
				mergedGroupIndexes.add(colorGroupToMergeIndex);
				var colorGroupSetToMerge = colorGroups[colorGroupToMergeIndex];
				var newMergedSet = new Set(colorGroupSetToMerge);
				for( var colorGroupIndex = colorGroupToMergeIndex + 1 ; colorGroupIndex < colorGroups.length ; colorGroupIndex++ ) {
					if(!mergedGroupIndexes.has(colorGroupIndex)) {
						var colorGroupSet = colorGroups[colorGroupIndex];
						var canMerge = true;
						for( var colorInSetToMerge of newMergedSet ) {
							for( var colorInSet of colorGroupSet ) {
								var distanceToColorInSet = colorDistanceMatrix[colorInSetToMerge][colorInSet];
								canMerge = canMerge && ( distanceToColorInSet <= seuil );
								if(!canMerge){break;}
							}
						}
						if(canMerge) {
							mergedGroupIndexes.add(colorGroupIndex);
							for (var newColor of colorGroupSet) {
								newMergedSet.add(newColor);
							}
						}
					}
				}
				mergedGroups.push(newMergedSet);
			}
		}
		noMergeDone = (colorGroups.length == mergedGroups.length);
		colorGroups = mergedGroups;
		
		safeCounter++;
	} while(!noMergeDone && safeCounter < safeCounterLimit);
	
	return colorGroups;
}