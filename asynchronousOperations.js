
importScripts("labColor.js", "diff.js", 'w3color.js', "customColorOperations.js");

function postInfos(key,message) {
	var obj = {};
	obj[key] = message;
	postMessage(obj);
}

onmessage = function(oEvent) {
	var functionName = oEvent.data["functionName"];
	switch(functionName) {
		case "buildDistanceLabMatrix":
			postMessage({"result":buildDistanceLabMatrix(oEvent.data["parameters"]["colors"],postInfos)});
			break;
		case "buildColorsProximityGroupList":
			postMessage({"result":buildColorsProximityGroupList(
				oEvent.data["parameters"]["originalColorDistanceList"],
				oEvent.data["parameters"]["colorDistanceMatrix"],
				oEvent.data["parameters"]["seuil"],
				postInfos)});
			break;
	}
};
