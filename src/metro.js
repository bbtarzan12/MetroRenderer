const MetroColors = Object.freeze({
    "1호선": "#0D3692",
    "2호선": "#33A23D",
    "3호선": "#FE5B10",
    "4호선": "#32A1C8",
    "5호선": "#8B50A4",
    "6호선": "#C55C1D",
    "7호선": "#54640D",
    "8호선": "#F51361",
    "9호선": "#AA9872"
});

class Random {
    static generate() {
        return Math.random();
    }

    static rangeInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static range(min, max) {
        return Math.random() * (max - min) + min;
    }
}

class Index {
    static convert1DTo2D(index, width) {
        return [parseInt(index % width), parseInt(index / width)]
    }

    static convert2Dto1D(x, y, width) {
        return y * width + x;
    }

    static isInBound(x, y, height, width) {
        return x >= 0 && y >= 0 && y < height && x < width;
    }
}

class Node {
    constructor(name, id = undefined, metroLine = undefined, coord = { x: 0, y: 0 }, pathCoord = { x: 0, y: 0 }) {
        this._name = name;
        this._coord = coord;
        this._pathCoord = pathCoord;
        this._id = id;
        this._metroLine = metroLine;
        this._jam = Random.rangeInt(0, 30);
        this._neighbors = [];
        this._gScore = 0;
        this._hScore = 0;
        this._parent;
    }

    get name() {
        return this._name;
    }

    set name(newName) {
        this._name = newName;
    }

    get id() {
        return this._id;
    }

    set id(newId) {
        this._id = newId;
    }

    get coord() {
        return this._coord;
    }

    set coord(newCoord) {
        this._coord.x = newCoord[0];
        this._coord.y = newCoord[1];
    }

    get pathCoord() {
        return this._pathCoord;
    }

    get metroLine() {
        return this._metroLine;
    }

    set metroLine(newMetroLine) {
        this._metroLine = newMetroLine;
    }

    get metroColor() {
        return MetroColors[this._metroLine];
    }

    get jam() {
        return this._jam;
    }

    set jam(newJam) {
        this._jam = newJam;
    }

    get neighbors() {
        return this._neighbors;
    }

    addNeighbor(newNeighborObj) {
        this._neighbors.push(newNeighborObj);
    }

    get gScore() {
        return this._gScore;
    }

    set gScore(newGScore) {
        this._gScore = newGScore;
    }

    get hScore() {
        return this._hScore;
    }

    set hScore(newHScore) {
        this._hScore = newHScore;
    }

    get fScore() {
        return this._gScore + this._hScore;
    }

    get parent() {
        return this._parent;
    }

    set parent(newParent) {
        this._parent = newParent;
    }
}

class Renderer {
    static instance;

    constructor() {
        if (Renderer.instance) return Renderer.instance;
        let self = this;
        this._gridSize = 50;
        this._nodes = [];
        this._gridData = [];
        this._isEditMode = false;
        this._isPathMode = false;
        this._neighborsOfNodes = [];
        this._zoom = d3.zoom().scaleExtent([0.3, 4]).translateExtent([[0, 0], [5000, 3500]]);
        this._lineGenerator = d3
            .line()
            .x(function (d) { return d.x * self._gridSize; })
            .y(function (d) { return d.y * self._gridSize; })
            .curve(d3.curveBundle.beta(1));
        this._congestionColors = d3.scaleLinear()
            .range(["#247BA0", "#70C1B3", "#B2DBBF", "#F3FFBD", "#FF1654"])
            .domain([0.0, 0.1, 0.2, 0.4, 1.0])
        this._svgContainer = d3
            .select("#metro")
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .call(this._zoom.transform, d3.zoomIdentity.translate(0, 0).scale(0.4))
            .call(this._zoom.on("zoom", function () { self._svgContainer.attr("transform", d3.event.transform) }))
            .on("contextmenu", function (d) { d3.event.preventDefault(); })
            .append("g")

        this._svgContainer.call(this._zoom.transform, d3.zoomIdentity.translate(0, 0).scale(0.4))

        this._svgCoordSelectorGroup = this._svgContainer.append("g");
        this._svgGridGroup = this._svgContainer.append("g");
        this._svgLineJamGroup = this._svgContainer.append("g");
        this._svgLineGroup = this._svgContainer.append("g");
        this._svgNodeGroup = this._svgContainer.append("g");
        this._svgInsideNodeGroup = this._svgContainer.append("g");
        this._svgNodeNameBackgroundGroup = this._svgContainer.append("g");
        this._svgNodeNameGroup = this._svgContainer.append("g");
        this._svgLineOverGroup = this._svgContainer.append("g");
        this._svgCoordSelectorGroup
            .append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 100 * self._gridSize)
            .attr("height", 70 * self._gridSize)
            .attr("fill-opacity", "0")
            .on("contextmenu", function (d) {
                if (self._isEditMode) {
                    let mouseCoord = d3.mouse(this);
                    let gridCoord = {
                        x: Math.round(mouseCoord[0] / self._gridSize),
                        y: Math.round(mouseCoord[1] / self._gridSize)
                    }

                    let param_xy = {};
                    let currentConfig = selected[selected.length - 1];

                    if (selected[selected.length - 1]) {
                        param_xy.column = "coord";
                        param_xy.id = currentConfig.id;
                        param_xy.coord_x = gridCoord.x;
                        param_xy.coord_y = gridCoord.y;
                        axios.post("http://ec2-54-180-115-171.ap-northeast-2.compute.amazonaws.com:3000/editor", param_xy)
                            .then(function (response) {
                                if (response.status === 200) {
                                    currentConfig.coord.x = gridCoord.x;
                                    currentConfig.coord.y = gridCoord.y;
                                    displayConfig(currentConfig);
                                    selected = []
                                    render(selectedAll)
                                    console.log(response);
                                }
                            })
                            .catch(function (error) {
                                console.log(error);
                            });
                    }
                }
                else if (self._isPathMode) {
                    let mouseCoord = d3.mouse(this);
                    let gridCoord = {
                        x: Math.round(mouseCoord[0] / self._gridSize),
                        y: Math.round(mouseCoord[1] / self._gridSize)
                    }

                    let param_xy = {};
                    let currentConfig = selected[selected.length - 1];

                    if (selected[selected.length - 1]) {
                        param_xy.column = "coord2";
                        param_xy.id = currentConfig.id;
                        param_xy.coord_x = gridCoord.x;
                        param_xy.coord_y = gridCoord.y;
                        axios.post("http://ec2-54-180-115-171.ap-northeast-2.compute.amazonaws.com:3000/editor", param_xy)
                            .then(function (response) {
                                if (response.status === 200) {
                                    currentConfig.pathCoord.x = gridCoord.x;
                                    currentConfig.pathCoord.y = gridCoord.y;
                                    displayConfig(currentConfig);
                                    selected = []
                                    render(selectedAll)
                                    console.log(response);
                                }
                            })
                            .catch(function (error) {
                                console.log(error);
                            });
                    }
                }
                else {
                    self._isPathMode = false;
                    self._isEditMode = false;
                    displayConfig(null);
                }
            })

        Renderer.instance = this;
    }

    get nodes() {
        return this._nodes;
    }

    set nodes(newNodes) {
        this._nodes = newNodes;
        this._neighborsOfNodes = [];
        for (let i = 0; i < newNodes.length; i++) {
            for (let j = 0; j < newNodes[i].neighbors.length; j++) {

                if (this._neighborsOfNodes.find(pair => pair[0] === newNodes[i].neighbors[j].node && pair[1] === newNodes[i]))
                    continue;

                if (newNodes[i].name == newNodes[i].neighbors[j].node.name)
                    continue;

                if (!this._nodes.find(node => node === newNodes[i].neighbors[j].node))
                    continue;

                this._neighborsOfNodes.push([newNodes[i], newNodes[i].neighbors[j].node]);
            }
        }
    }

    get gridSize() {
        return this._gridSize;
    }

    set gridSize(newGridSize) {
        this._gridSize = newGridSize;
    }

    renderGrid(width, height) {
        let self = this;

        if (!this._gridData.length) {
            this._gridData = [];
            for (let x = 0; x < width; x += 1) {
                this._gridData.push([
                    { x: x, y: 0 },
                    { x: x, y: height }
                ]);
            }
            for (let y = 0; y < height; y += 1) {
                this._gridData.push([
                    { x: 0, y: y },
                    { x: width, y: y }
                ]);
            }
        }

        let svgGrids = this._svgGridGroup
            .selectAll("path")
            .data(this._gridData)

        svgGrids.exit().remove();

        svgGrids
            .enter()
            .append("path")
            .attr("d", function (grid) { return self._lineGenerator([grid[0], grid[1]]); })
            .classed("grid", true)
    }

    renderMetroLines() {
        let self = this;
        let svgLines = this._svgLineGroup
            .selectAll("path")
            .data(this._neighborsOfNodes)

        svgLines
            .exit()
            .style("opacity", 1)
            .transition()
            .duration(500)
            .delay(function (d, i) { return 3 * i })
            .attr("d", function (neighborsOfNode) {
                let lineCoords = JSON.parse(JSON.stringify([neighborsOfNode[0].coord, neighborsOfNode[0].pathCoord, neighborsOfNode[1].coord]));
                for (let i = 0; i < lineCoords.length; i++) {
                    lineCoords[i].y = lineCoords[i].y + 1;
                }
                return self._lineGenerator(lineCoords);
            })
            .style("opacity", 0)
            .remove();

        svgLines
            .transition()
            .duration(500)
            .attr("d", function (neighborsOfNode) { return self._lineGenerator([neighborsOfNode[0].coord, neighborsOfNode[0].pathCoord, neighborsOfNode[1].coord]); })
            .attr("stroke", function (neighborsOfNode) { return neighborsOfNode[0].metroColor; })

        svgLines
            .enter()
            .append("path")
            .classed("line", true)
            .attr("stroke", function (neighborsOfNode) { return neighborsOfNode[0].metroColor; })
            .attr("d", function (neighborsOfNode) {
                let lineCoords = JSON.parse(JSON.stringify([neighborsOfNode[0].coord, neighborsOfNode[0].pathCoord, neighborsOfNode[1].coord]));
                for (let i = 0; i < lineCoords.length; i++) {
                    lineCoords[i].y = lineCoords[i].y - 1;
                }
                return self._lineGenerator(lineCoords);
            })
            .style("opacity", 0)
            .transition()
            .duration(500)
            .delay(function (d, i) { return 3 * i })
            .attr("d", function (neighborsOfNode) { return self._lineGenerator([neighborsOfNode[0].coord, neighborsOfNode[0].pathCoord, neighborsOfNode[1].coord]); })
            .style("opacity", 1)
    }

    renderMetroNodes() {
        let self = this;
        let svgNodes = this._svgNodeGroup
            .selectAll("circle")
            .data(this._nodes)

        svgNodes
            .exit()
            .style("opacity", 1)
            .transition()
            .duration(500)
            .delay(function (d, i) { return 3 * i })
            .attr("cx", function (node) { return node.coord.x * self._gridSize; })
            .attr("cy", function (node) { return (node.coord.y + 1) * self._gridSize; })
            .style("opacity", 0)
            .remove();

        svgNodes
            .transition()
            .duration(500)
            .attr("cx", function (node) { return node.coord.x * self._gridSize; })
            .attr("cy", function (node) { return node.coord.y * self._gridSize; })
            .attr("fill", function (node) { return node.metroColor; })

        svgNodes
            .enter()
            .append("circle")
            .classed("node", true)
            .attr("cx", function (node) { return node.coord.x * self._gridSize; })
            .attr("cy", function (node) { return (node.coord.y - 1) * self._gridSize; })
            .transition()
            .duration(500)
            .delay(function (d, i) { return 3 * i })
            .attr("cx", function (node) { return node.coord.x * self._gridSize; })
            .attr("cy", function (node) { return node.coord.y * self._gridSize; })
            .attr("fill", function (node) { return node.metroColor; })

        let svgInsideNodes = this._svgInsideNodeGroup
            .selectAll("circle")
            .data(this._nodes)

        svgInsideNodes
            .exit()
            .style("opacity", 0)
            .transition()
            .duration(500)
            .delay(function (d, i) { return 3 * i })
            .attr("cx", function (node) { return node.coord.x * self._gridSize; })
            .attr("cy", function (node) { return (node.coord.y + 1) * self._gridSize; })
            .style("opacity", 1)
            .remove();

        svgInsideNodes
            .classed("node-inside", true)
            .classed("node-select", false)
            .transition()
            .duration(500)
            .attr("cx", function (node) { return node.coord.x * self._gridSize; })
            .attr("cy", function (node) { return node.coord.y * self._gridSize; })

        svgInsideNodes
            .enter()
            .append("circle")
            .classed("node-inside", true)
            .on("click", function (d, i) {
                if (self._isEditMode && selected[selected.length - 1] === self._nodes[i]) {
                    d3.select(this)
                        .classed("node-inside", true)
                        .classed("node-select", false)

                    self._isEditMode = false;
                    self._isPathMode = false;
                    selected = []
                    displayConfig(null);
                }
                else {
                    d3.select(this)
                        .classed("node-inside", false)
                        .classed("node-select", true)

                    selected = []
                    selected.push(self._nodes[i])
                    let lastSelected = selected[selected.length - 1];
                    displayConfig(lastSelected);
                    self._isEditMode = true;
                    self._isPathMode = false;
                }
            })
            .on("contextmenu", function (d, i) {
                if (self._isPathMode) {
                    d3.select(this)
                        .classed("node-inside", true)
                        .classed("node-select", false)

                    displayConfig(null);
                    selected = []
                    self._isPathMode = false;
                    self._isEditMode = false;
                } else {
                    d3.select(this)
                        .attr("cx", function (node) { return node.pathCoord.x * self._gridSize; })
                        .attr("cy", function (node) { return node.pathCoord.y * self._gridSize; })
                        .classed("node-inside", false)
                        .classed("node-select", true)

                    selected = []
                    selected.push(self._nodes[i])
                    let lastSelected = selected[selected.length - 1];
                    displayConfig(lastSelected);
                    self._isEditMode = false;
                    self._isPathMode = true;
                }
            })
            .attr("cx", function (node) { return node.coord.x * self._gridSize; })
            .attr("cy", function (node) { return (node.coord.y - 1) * self._gridSize; })
            .style("opacity", 0)
            .transition()
            .duration(500)
            .delay(function (d, i) { return 3 * i })
            .attr("cx", function (node) { return node.coord.x * self._gridSize; })
            .attr("cy", function (node) { return node.coord.y * self._gridSize; })
            .style("opacity", 1)
    }

    renderMetroNames() {
        let self = this;

        let svgNodeNames = this._svgNodeNameGroup
            .selectAll("text")
            .data(this._nodes)

        svgNodeNames
            .exit()
            .style("opacity", 1)
            .transition()
            .duration(500)
            .delay(function (d, i) { return 3 * i })
            .attr("x", function (node) { return node.coord.x * self._gridSize; })
            .attr("y", function (node) { return (node.coord.y + 1.4) * self._gridSize; })
            .style("opacity", 0)
            .remove();

        svgNodeNames
            .transition()
            .duration(500)
            .text(function (node) { return node.name; })
            .attr("x", function (node) { return node.coord.x * self._gridSize; })
            .attr("y", function (node) { return (node.coord.y - 0.4) * self._gridSize; })
            .attr("fill", function (node) { return node.metroColor; })

        svgNodeNames
            .enter()
            .append("text")
            .attr("class", "node-name")
            .text(function (node) { return node.name; })
            .attr("fill", function (node) { return node.metroColor; })
            .attr("x", function (node) { return node.coord.x * self._gridSize; })
            .attr("y", function (node) { return (node.coord.y - 1.4) * self._gridSize; })
            .style("opacity", 0)
            .transition()
            .duration(500)
            .delay(function (d, i) { return 3 * i })
            .attr("x", function (node) { return node.coord.x * self._gridSize; })
            .attr("y", function (node) { return (node.coord.y - 0.4) * self._gridSize; })
            .style("opacity", 1)

        let svgNodeNameBackgrounds = self._svgNodeNameBackgroundGroup
            .selectAll("rect")
            .data(self._svgNodeNameGroup.selectAll("text").nodes())

        svgNodeNameBackgrounds
            .exit()
            .transition()
            .duration(500)
            .delay(function (d, i) { return 3 * i })
            .attr("x", function (node) { return node.__data__.coord.x * self._gridSize - node.getBBox().width / 2 - 3; })
            .attr("y", function (node) { return (node.__data__.coord.y + 1.4) * self._gridSize - node.getBBox().height + 1; })
            .remove();

        svgNodeNameBackgrounds
            .transition()
            .duration(500)
            .attr("x", function (node) { return node.__data__.coord.x * self._gridSize - node.getBBox().width / 2 - 3; })
            .attr("y", function (node) { return (node.__data__.coord.y - 0.4) * self._gridSize - node.getBBox().height + 1; })
            .attr("width", function (node) { return node.getBBox().width + 6; })
            .attr("height", function (node) { return node.getBBox().height + 2; })
            .attr("stroke", function (node) { return node.__data__.metroColor; })

        svgNodeNameBackgrounds
            .enter()
            .append("rect")
            .classed("node-name-background", true)
            .attr("width", 0)
            .attr("height", 0)
            .attr("x", function (node) { return node.__data__.coord.x * self._gridSize - node.getBBox().width / 2; })
            .attr("y", function (node) { return (node.__data__.coord.y - 1.4) * self._gridSize - node.getBBox().height; })
            .transition()
            .duration(500)
            .delay(function (d, i) { return 3 * i })
            .attr("x", function (node) { return node.__data__.coord.x * self._gridSize - node.getBBox().width / 2 - 3; })
            .attr("y", function (node) { return (node.__data__.coord.y - 0.4) * self._gridSize - node.getBBox().height + 1; })
            .attr("width", function (node) { return node.getBBox().width + 6; })
            .attr("height", function (node) { return node.getBBox().height + 2; })
            .attr("stroke", function (node) { return node.__data__.metroColor; })
    }

    renderPath(startNode, endNode) {
        let self = this;
        let rawPaths = findPath(startNode, endNode)
        let paths = [];

        // neighbor의 cost로 바꾸어야함
        for (let i = 0; i < rawPaths.length; i++) {
            for (let jam = 0; jam < rawPaths[i].jam; jam++) {
                paths.push(rawPaths[i]);
            }
        }

        let svgJams = this._svgLineJamGroup
            .selectAll("path")
            .data(paths)

        svgJams.exit().remove()

        svgJams
            .attr("d", function (node) {
                if (!node.parent)
                    return;

                let reversePath;
                let originalLine = self._svgLineGroup.selectAll("path").filter(d => {
                    if ((d[0] === node.parent && d[1] === node)) {
                        reversePath = false;
                        return true;
                    }
                    else if (d[1] === node.parent && d[0] === node) {
                        reversePath = true;
                        return true;
                    }
                    else return false;
                }).nodes()[0]

                if (!originalLine)
                    return;

                let distance = Math.hypot(node.coord.x - node.parent.coord.x, node.coord.y - node.parent.coord.y);
                let noiseAmount = distance * 2;

                let lineLength = originalLine.getTotalLength();
                let interval = lineLength / (noiseAmount - 1);
                let lineData = d3.range(noiseAmount).map(function (d) {
                    let point = originalLine.getPointAtLength(reversePath ? (noiseAmount - d) * interval : d * interval);
                    point.x = Math.round(point.x / self._gridSize)
                    point.y = Math.round(point.y / self._gridSize)
                    if (!(d == 0 || d == noiseAmount - 1)) {
                        point.x += Random.range(-0.3, 0.3);
                        point.y += Random.range(-0.3, 0.3);
                    }
                    return point;
                });;
                return self._lineGenerator(lineData);
            })
            .attr("stroke-width", 0.6)
            .attr("stroke", function (node) { return node.metroColor; })
            .attr("fill", "none")
            .style("stroke-opacity", 0.9)
            .transition()
            .ease(d3.easePolyIn)
            .duration(0)
            .attrTween("stroke-dashoffset", tweenDashOffset)
            .attrTween("stroke-dasharray", tweenDash)
            .on("start", function repeat() {
                d3.active(this)
                    .transition()
                    .duration(Random.rangeInt(750, 3000))
                    .attrTween("stroke-dasharray", tweenDash)
                    .on("start", repeat);
            })

        svgJams
            .enter()
            .append("path")
            .attr("d", function (node) {
                if (!node.parent)
                    return;

                let reversePath;
                let originalLine = self._svgLineGroup.selectAll("path").filter(d => {
                    if ((d[0] === node.parent && d[1] === node)) {
                        reversePath = false;
                        return true;
                    }
                    else if (d[1] === node.parent && d[0] === node) {
                        reversePath = true;
                        return true;
                    }
                    else return false;
                }).nodes()[0]

                if (!originalLine)
                    return;

                let distance = Math.hypot(node.coord.x - node.parent.coord.x, node.coord.y - node.parent.coord.y);
                let noiseAmount = distance * 2;

                let lineLength = originalLine.getTotalLength();
                let interval = lineLength / (noiseAmount - 1);
                let lineData = d3.range(noiseAmount).map(function (d) {
                    let point = originalLine.getPointAtLength(reversePath ? (noiseAmount - d - 1) * interval : d * interval);
                    point.x = Math.round(point.x / self._gridSize)
                    point.y = Math.round(point.y / self._gridSize)
                    if (!(d == 0 || d == noiseAmount - 1)) {
                        point.x += Random.range(-0.3, 0.3);
                        point.y += Random.range(-0.3, 0.3);
                    }
                    return point;
                });;
                return self._lineGenerator(lineData);
            })
            .attr("stroke-width", 0.6)
            .attr("stroke", function (node) { return node.metroColor; })
            .attr("fill", "none")
            .style("stroke-opacity", 0.9)
            .transition()
            .ease(d3.easePolyIn)
            .duration(0)
            .attrTween("stroke-dashoffset", tweenDashOffset)
            .attrTween("stroke-dasharray", tweenDash)
            .on("start", function repeat() {
                d3.active(this)
                    .transition()
                    .duration(Random.rangeInt(750, 3000))
                    .attrTween("stroke-dasharray", tweenDash)
                    .on("start", repeat);
            })

        function tweenDash() {
            let l = this.getTotalLength(),
                i = d3.interpolateString("0," + l, l + "," + l);
            return function (t) {
                return i(t);
            };
        }

        function tweenDashOffset() {
            let l = this.getTotalLength(),
                i = d3.interpolateString(0, l);
            return function (t) {
                return i(t);
            };
        }

        focusNodes(rawPaths);

        // let svgPathNotInPath = this._svgLineGroup.selectAll("path").filter(function (neighborsOfNode) { return !rawPaths.includes(neighborsOfNode[0]) || !rawPaths.includes(neighborsOfNode[1]) });
        // //let svgPathInPath = this._svgLineGroup.selectAll("path").filter(function (neighborsOfNode) { return rawPaths.includes(neighborsOfNode[0]) && rawPaths.includes(neighborsOfNode[1]) });
        // let svgNodeNotInPath = this._svgNodeGroup.selectAll("circle").filter(function (node) { return !rawPaths.includes(node) });
        // let svgNameNotInPath = this._svgNodeNameGroup.selectAll("text").filter(function (node) { return !rawPaths.includes(node) });

        // svgPathNotInPath.classed("fade-out", true).classed("fade-in", false);
        // svgNodeNotInPath.classed("fade-out", true).classed("fade-in", false);
        // svgNameNotInPath.classed("fade-out", true).classed("fade-in", false);

        // let congestionDomain = [0, 1.0];
        // svgPathInPath.nodes().forEach(n => {
        //     let startNode = n.__data__[0];
        //     let endNode = n.__data__[1];

        //     let neighbor = startNode.neighbors.find(neighbor => { return neighbor.node === endNode; })
        //     congestionDomain.push(neighbor.congestion);
        // })
        // congestionDomain.sort();

        // let congestionColors = d3.scaleLinear()
        //     .range(["#247BA0", "#70C1B3", "#B2DBBF", "#F3FFBD", "#FF1654"])
        //     .domain(congestionDomain)

        // svgPathInPath.attr("stroke", function (neighborsOfNode) {
        //     let node = self.nodes.find((node) => { return node === neighborsOfNode[0] });
        //     let neighbor = node.neighbors.find((neighbor) => { return neighbor.node === neighborsOfNode[1] })
        //     const congestion = neighbor.congestion;
        //     return congestionColors(congestion);
        // });
    }

    disablePath() {
        this._svgLineJamGroup
            .selectAll("path")
            .remove()
        disableFocus();
    }

    renderCongestion() {
        let self = this;

        this._svgLineGroup
            .selectAll("path")
            .transition()
            .duration(500)
            .attr("stroke", function (neighborsOfNode) {
                let node = self.nodes.find((node) => { return node === neighborsOfNode[0] });
                let neighbor = node.neighbors.find((neighbor) => { return neighbor.node === neighborsOfNode[1] })
                const congestion = neighbor.congestion;
                return self._congestionColors(congestion);
            });
    }

    disableCongestion() {
        let self = this;

        this._svgLineGroup
            .selectAll("path")
            .transition()
            .duration(500)
            .attr("stroke", function (neighborsOfNode) { return neighborsOfNode[0].metroColor; })
    }

    focusNodes(nodes) {
        let svgPathNotInNodes = this._svgLineGroup.selectAll("path").filter(function (neighborsOfNode) { return !nodes.includes(neighborsOfNode[0]) || !nodes.includes(neighborsOfNode[1]) });
        let svgNodeNotInNodes = this._svgNodeGroup.selectAll("circle").filter(function (node) { return !nodes.includes(node) });
        let svgNameNotInNodes = this._svgNodeNameGroup.selectAll("text").filter(function (node) { return !nodes.includes(node) });

        svgPathNotInNodes.classed("fade-out", true).classed("fade-in", false);
        svgNodeNotInNodes.classed("fade-out", true).classed("fade-in", false);
        svgNameNotInNodes.classed("fade-out", true).classed("fade-in", false);
    }

    disableFocus() {
        this._svgLineGroup.selectAll("path").classed("fade-out", false).classed("fade-in", true);
        this._svgNodeGroup.selectAll("circle").classed("fade-out", false).classed("fade-in", true);
        this._svgNodeNameGroup.selectAll("text").classed("fade-out", false).classed("fade-in", true);
    }
}

function render(nodes) {
    let renderer = new Renderer();

    renderer.nodes = nodes;
    renderer.renderGrid(100, 70);
    renderer.renderMetroLines();
    renderer.renderMetroNodes();
    renderer.renderMetroNames();
}

function focusNodes(nodes) {
    let renderer = new Renderer();
    renderer.focusNodes(nodes);
}

function disableFocus() {
    let renderer = new Renderer();
    renderer.disableFocus();
}

function renderCongestion() {
    let renderer = new Renderer();
    renderer.renderCongestion();
}

function disableCongestion() {
    let renderer = new Renderer();
    renderer.disableCongestion();
}

function renderPath(startNode, endNode) {
    let renderer = new Renderer();

    renderer.renderPath(startNode, endNode);
}

function disablePath() {
    let renderer = new Renderer();

    renderer.disablePath();
}

function findPath(startNode, endNode) {

    function manhattanDistance(coord0, coord1) {
        var d1 = Math.abs(coord1.x - coord0.x);
        var d2 = Math.abs(coord1.y - coord0.x);
        return d1 + d2;
    }

    let openList = [];
    let closeList = []

    startNode.parent = null;
    openList.push(startNode);

    while (openList.length > 0) {

        let currentNode = openList[0];
        for (let i = 0; i < openList.length; i++) {
            let openNode = openList[i];
            if (openNode.fScore < currentNode.fScore)
                currentNode = openNode;
        }

        if (currentNode === endNode) {
            let pathCurrent = currentNode;
            let path = [];

            while (pathCurrent.parent) {
                path.push(pathCurrent);
                pathCurrent = pathCurrent.parent;
            }
            path.push(startNode);
            return path.reverse();
        }

        openList = openList.filter(node => node !== currentNode);
        closeList.push(currentNode);
        let neighbors = currentNode.neighbors;

        for (let i = 0; i < neighbors.length; i++) {
            let neighborNode = neighbors[i].node;
            let neighborcost = neighbors[i].cost * 10;

            if (closeList.includes(neighborNode))
                continue;

            let gScore = currentNode.gScore + neighborcost;
            let gScoreIsBest = false;

            if (!openList.includes(neighborNode)) {
                gScoreIsBest = true;
                neighborNode.hScore = manhattanDistance(neighborNode.coord, endNode.coord);
                openList.push(neighborNode);
            }
            else if (gScore < neighborNode.gScore) {
                gScoreIsBest = true;
            }

            if (gScoreIsBest) {
                neighborNode.parent = currentNode;
                neighborNode.gScore = gScore;
            }
        }
    }
}