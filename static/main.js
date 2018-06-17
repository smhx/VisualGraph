class Vertex {
    constructor(id, graph, color) {
        this.id = id;
        this.graph = graph;
        this.properties = {color: 'orange'};
    }

    setProperty(name, value){
        this.properties[name] = value;
    }

    printProperties(position) {
        var text = new paper.PointText(position);
        text.justification = "center";
        text.fillColor = 'black';
        text.fontSize = '20px';
        text.content = JSON.stringify(this.properties);
    }
}

class Graph {
    constructor(n, directed, weighted){
        this.n = n;
        this.directed = directed;
        this.weighted = weighted;
        this.vertices = {};
        this.adj = {};
        for (var i = 1; i <= this.n; i++){
            this.vertices[i] = new Vertex(i, this);
            this.adj[i] = {};
        }
    }

    // TODO: add_vertex with id
    add_vertex(){
        this.n++;
        this.adj[this.n] = {};
        this.vertices[this.n] = new Vertex(this.n, this);
    }

    add_edge(u, v, w) {
        if (u > 0 && u <= this.n && v > 0 && v <= this.n){
            this.adj[u][v] = w;
            if (!this.directed){
                this.adj[v][u] = w;
            }
        }
        else {
            alert("Error: Attempted to create invalid edge");
            return;
        }
    }

    displayVis(){
        var nodeArray = new Array();
        var edgeArray = new Array();
        for (var i = 1; i <= this.n; i++){
            nodeArray.push({
                id: this.vertices[i].id,
                label: this.vertices[i].id.toString(),
                color: this.vertices[i].properties['color']
            });
            for (var j in this.adj[i]){
                if (!this.directed && j < i) // in undirected graphs, make sure each edge is just displayed once
                    continue;
                edgeArray.push({from: i, to: j});
            }
        }
        var nodes = new vis.DataSet(nodeArray);
	    var edges = new vis.DataSet(edgeArray);

        var container = document.getElementById('mynetwork');
	    var data = {
	        nodes: nodes,
	        edges: edges
	    };
	    var options = {};

	    var network = new vis.Network(container, data, options);
    }

    // display(){
    //     alert("Display called");
    //     var pos = {}; // positions of the vertices
    //     var bigR = 150;
    //     var smallR = 40;
    //     var center = new paper.Point(300, 300);
    //     for (var i = 1; i <= this.n; i++){ // Assumes vertices are labelled with numbers
    //         var angle = 2*i*Math.PI/this.n;
    //         var shift = new paper.Point(bigR*Math.cos(angle), bigR*Math.sin(angle));
    //         pos[i] = center.add(shift);
    //         var vertex = new paper.Path.Circle(pos[i], smallR);
    //         vertex.fillColor = 'blue';
    //         // vertex label
    //         var text = new paper.PointText(pos[i].add(new paper.Point(0,10)));
    //         text.justification = 'center';
    //         text.fillColor = 'white';
    //         text.fontSize = '30px';
    //         text.content = i;
    //         this.vertices[i].printProperties(pos[i].add(new paper.Point(bigR*Math.cos(angle)/2, bigR*Math.sin(angle)/2)));
    //     }
    //     for (var i = 1; i <= this.n; i++){
    //         for (var j in this.adj[i]){
    //             var edge = new paper.Path.Line(pos[i], pos[j]);
    //             edge.strokeColor = 'black';
    //             edge.strokeWidth = 10;
    //             edge.sendToBack();
    //         }
    //     }
    // }
}

class GraphManager {
    constructor() {
        this.graphs = {};
    }

    CallFunction(trace){
        // alert("In CallFunction");
        if (trace["error"]){
            return;
        }
        var name = trace["command_name"];
        var args = trace["args"];
        var id = trace["graph_id"];
        var retVal = trace["rturn_value"];
        var line = trace["line_number"];
        if (name == "construct"){
            if (args.length != 3){
                alert("Error: Wrong number of arguments for graph constructor");
                return;
            }
            this.graphs[id] = new Graph(args[0], args[1], args[2]);
        }
        else if (name == "add_vertex"){
            this.graphs[id].add_vertex();
        }
        else if (name == "add_edge") {
            if (args.length != 3){
                alert("Error: Wrong number of arguments for add_edge");
                return;
            }
            this.graphs[id].add_edge(args[0], args[1], args[2]);
        }
        else if (name == "set_vertex_property") {
            if (args.length != 3){
                alert("Error: Wrong number of arguments for setting vertex prooperty");
                return;
            }
            this.graphs[id].vertices[args[0]].setProperty(args[1], args[2]);
        }
        else {
            alert("Error: Invalid command name: "+command_name);
            return;
        }
    }

    displayAll(){
        var canvas = document.getElementById("Display");
        paper.setup(canvas);
        paper.project.activeLayer.removeChildren();
        for (var id in this.graphs){
            this.graphs[id].displayVis();
        }
        paper.view.draw();
    }
}

var graphManager = new GraphManager();

function Visualize() {
    // alert("Visualize called");
    var text = $("#textbox").val();
    var dat = {code : text}
    if (text.length == 0) {
        document.getElementById("output").innerHTML = "You didn't enter anything!";
        return;
    }
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            document.getElementById("output").innerHTML = "Traces:<br>";
            var str = this.responseText;
            var traces = JSON.parse(str);
            console.log(traces);
            // alert(traces.length);
            traces.forEach(function(trace){
                document.getElementById("output").innerHTML += JSON.stringify(trace) + "<br>";
                graphManager.CallFunction(trace);
            });
            document.getElementById("output").innerHTML += "Finished printing traces";
            graphManager.displayAll();
        }
    };
    xhttp.open("POST", "/trace", true);
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.send(JSON.stringify(dat));
}
