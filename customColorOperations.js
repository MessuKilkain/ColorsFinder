
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

function sortColorsByDistanceToRef(colors, referenceW3Color) {
	for( var colorIndex in colors ) {
		var color = colors[colorIndex];
		color.distanceToRef = w3colorDistance(w3color(color.before), referenceW3Color);
		//console.log(color.distanceToRef);
	}
	colors = colors.sort(function(a, b){
		return (a.distanceToRef - b.distanceToRef);
	});
	return colors;
}

function buildColorsConvertionMap(colors, sourceW3Color, targetW3Color, findConvertionOnlyInExistingColors) {
	var transformVector = {};
	transformVector.hue = targetW3Color.hue - sourceW3Color.hue;
	transformVector.sat = targetW3Color.sat - sourceW3Color.sat;
	transformVector.lightness = targetW3Color.lightness - sourceW3Color.lightness;
	var conversionMap = {};
	for( var colorIndex in colors ) {
		var colorBeforeCode = colors[colorIndex].before;
		var colorBefore = w3color(colorBeforeCode);
		colorBefore.hue = (colorBefore.hue + transformVector.hue + 360) % 360;
		colorBefore.sat = Math.max(Math.min(colorBefore.sat + transformVector.sat, 1.0), 0.0);
		colorBefore.lightness = Math.max(Math.min(colorBefore.lightness + transformVector.lightness, 1.0), 0.0);
		var newColorAfter = w3color(colorBefore.toHslString());
		if( findConvertionOnlyInExistingColors ) {
			for( var colorIndex in colors ) {
				var color = colors[colorIndex];
				color.distanceToRef = w3colorDistance(w3color(color.before), newColorAfter);
				//console.log(color.distanceToRef);
			}
			var sortedColors = colors.sort(function(a, b){
				return (a.distanceToRef - b.distanceToRef);
			});
			newColorAfter = w3color(sortedColors[0].before);
		}
		conversionMap[colorBeforeCode] = newColorAfter.toHexString();
	}
	return conversionMap;
}