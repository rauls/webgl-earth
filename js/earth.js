// Original Created by Bjorn Sandvik - thematicmapping.org
// This version : Raul Sobon

/*
Mean radius			6371.0 km (3958.8 mi)[6]
Equatorial radius	6378.1 km (3963.2 mi)[7][8]
Polar radius		6356.8 km (3949.9 mi)[9]
Flattening 			0.0033528[10]
1/298.257222101 (ETRS89)
Circumference 	    40075.017 km equatorial (24901.461 mi)[8]
    				40007.86 km meridional (24859.73 mi)[11][12]


file://///192.168.1.2/stuff/projects/earth/webgl-earth/index.html

*/

var e_radius	= 6378.1; // km (3963.2 mi)[7][8]
var p_radius	= 6356.8; // km (3949.9 mi)[9]
var m_radius    = 6371.0;

var lat_adj = 0;
var lat_off = 180;
var plane_height = 5100;
var current_edit = 1;
var edit_speed = 1000;



function item2params(item,params) {
	var item = overlays[ current_edit ];
	params.longitude = item.long;
	params.latitude = item.lat;
	params.rotation = item.rotation;
	params.scale = item.scale;
	params.opacity = item.opacity;
}

var GuiParams = function() {
	this.current_edit = window.current_edit;
	this.rotate_speed = window.rotate_speed;
	item2params( overlays[ current_edit ], this );
	this.South_Pole = function() {
		camera.position.copy( new THREE.Vector3( -0.0007532996302339945,-0.5029778573090454,-0.00047011971273784 ) );
	};
}

function init_datgui()
{
	var gui = new dat.gui.GUI();
	var params = new GuiParams();
	gui.remember(params);

	gui.add(params, 'rotate_speed', 0, 10).onChange( function(v) {
		window.rotate_speed = parseFloat(v);
	} ).onFinishChange( function() { console.log("DONE") });
	gui.add(params, 'current_edit', 0, overlays.length ).onChange( function(v) {
		current_edit = parseInt(v);
		item2params( overlays[ current_edit ], params );
	} );
	gui.add(params, 'longitude', 0, 360 ).step(0.02).onChange( function(v) {
		overlays[ current_edit ].long = parseFloat(v);
	} ).listen();
	gui.add(params, 'latitude', 0, 360 ).step(0.02).onChange( function(v) {
		overlays[ current_edit ].lat = parseFloat(v);
	} ).listen();
	gui.add(params, 'rotation', 0, 360 ).step(1).onChange( function(v) {
		overlays[ current_edit ].rotation = parseFloat(v);
	} ).listen();
	gui.add(params, 'scale', 0, 32 ).step(0.2).onChange( function(v) {
		overlays[ current_edit ].scale = parseFloat(v);
	} ).listen();
	gui.add(params, 'South_Pole');
}


(function () {

	var webglEl = document.getElementById('webgl');

	if (!Detector.webgl) {
		Detector.addGetWebGLMessage(webglEl);
		return;
	}

	var width  = window.innerWidth,
		height = window.innerHeight;

	// Earth params
	var radius   = 0.5,
		segments = 36*2,
		rotation = 0;

	var scene = new THREE.Scene();

	var camera = window.camera = new THREE.PerspectiveCamera(45, width / height, 0.0001, 91*13);
	camera.position.z = 2 * radius;

	var renderer = new THREE.WebGLRenderer();
	renderer.setSize(width, height);

	scene.add(new THREE.AmbientLight(0x333333));

	var light = new THREE.DirectionalLight(0xfffef9, .6);
	light.position.set(5,-13,135);
	scene.add(light);

	var earth = window.earth = new THREE.Object3D();
    var sphere = createSphere(radius, segments);
	earth.add(sphere)
    var clouds = window.clouds = createClouds(radius, segments);
	clouds.material.opacity = 0.25;
	earth.rotation.y = rotation;
	earth.add(clouds)
//	earth.add( create_grid(0x606060) )
	scene.add(earth)

	window.stars = createStars(90*13, 64*2);
	scene.add(window.stars);

	//var controls = new THREE.OrbitControls(camera);
	var controls = new THREE.TrackballControls(camera);

	webglEl.appendChild(renderer.domElement);
	
	window.angle = 0;
	window.rotate_speed = 0.10;

	function render() {
		controls.update();
		window.angle += rotate_speed;
		if( window.angle > 360 ) {
		    window.angle -= 360;
        }
		earth.rotation.y = deg(window.angle);
		overlays_spin( (window.angle) );
		requestAnimationFrame(render);
		renderer.render(scene, camera);
	}

	function createSphere(radius, segments) {
		return new THREE.Mesh(
			new THREE.SphereGeometry(radius, segments, segments),
			new THREE.MeshPhongMaterial({
				map:         Texture('images/2_no_clouds_4k.png'),
				bumpMap:     Texture('images/elev_bump_4k.jpg'),
				bumpScale:   0.001,
				transparent: true,
				opacity:     0.9,
				specularMap: Texture('images/water_4k.png'),
				specular:    new THREE.Color('grey')								
			})
		);
	}

	function createClouds(radius, segments) {
		var ch = 10/(m_radius*2);
		return new THREE.Mesh(
			new THREE.SphereGeometry(radius + ch, segments, segments),			
			new THREE.MeshPhongMaterial({
				map:         Texture('images/fair_clouds_4k.png'),
				transparent: true
			})
		);		
	}

	function createStars(radius, segments) {
		return new THREE.Mesh(
			new THREE.SphereGeometry(radius, segments, segments), 
			new THREE.MeshBasicMaterial({
				map:  Texture('images/galaxy.jpg'), 
				side: THREE.BackSide,
				//combine: THREE.MixOperation,
				//color: new THREE.Color( 0.6,0.6,0.6 ),
			})
		);
	}

	var sp_images = '1280px-Pole-from-air.jpg 496657main_South_Pole_Station_DMS-orig_full.jpg pole-from-air.jpg South-Pole-26-Oct-2014.jpg'.split(' ');
	// 496657main_South_Pole_Station_DMS = 1500x1095
	window.overlays = [ {
			image: 		"sp-icecore_01b.jpg",
			lat:   		-89.979,
			opacity:    1.0,
			long:  		0.0,
			rotation: 	0,
			scale: 		15,
			altitude:   0,
			width:  	1800,
			height: 	1350
		}, {
			image: 		"pole-from-air.jpg",
			lat:   		-89.988,
			long:  		0.0,
			rotation: 	230,
			opacity:    0.7,
			scale: 		1.0,
			altitude:   0,
			width:  	2048,
			height: 	1380
		}, {
			image: 		"abovedomes1.jpg",
			lat:   		-89.998,
			long:  		0.0,
			rotation: 	0,
			opacity:    0.7,
			scale: 		1,
			altitude:   0,
			width:  	1369,
			height: 	1073
		}
	]

	window.planes = create_overlays(scene,overlays);

	window.addEventListener( 'keydown', key_handler, false );

	init_datgui();

	render();

	window.app = this;	
	return this;

}());



/*
escape 	27
page up 	33
page down 	34
end 	35
home 	36
left arrow 	37
up arrow 	38
right arrow 	39
down arrow 	40 

numpad 8 	104
numpad 9 	105
multiply 	106
add 	107
subtract 	109
decimal point 	110
divide 	111 
*/
function key_handler(event) {
    var overlay = window.overlays[ window.current_edit ];
    var spd = window.edit_speed;
    if( event.keyCode == 37 ) {     overlay.long -= spd/(m_radius*1);     }
    if( event.keyCode == 38 ) {     overlay.lat  += spd/(m_radius*1000);     }
    if( event.keyCode == 39 ) {     overlay.long += spd/(m_radius*1);     }
    if( event.keyCode == 40 ) {     overlay.lat  -= spd/(m_radius*1000);     }
    if( event.keyCode == 33 ) {     overlay.scale  += spd/(m_radius*1000);     }
    if( event.keyCode == 34 ) {     overlay.scale  -= spd/(m_radius*1000);     }
    if( event.key == ',' ) {        overlay.rotation-=1;     }
    if( event.key == '.' ) {        overlay.rotation+=1;     }

    if( event.keyCode == 9 ) {
    	window.current_edit++;
    	if( window.current_edit == overlays.length ) {
    		window.current_edit = 0;
    	}
    }
    console.log("overlay : ", overlay )
}



function Texture( filename ) {
	return new THREE.TextureLoader().load( filename );
}


function create_grid(color) {
	color = typeof(color)=='undefined' ? 0x00ff00 : color;
	var geometry = new THREE.SphereBufferGeometry( 0.502, 360/10, 360/10 );
	var material = new THREE.MeshBasicMaterial( {color: color, wireframe: true} );
	var sphere = new THREE.Mesh( geometry, material );
	return sphere;
}
// 1deg = 111.11 km.
// 0.001 = 111meters

function createBorder(width,height) {
	var w = width/(m_radius*1000.0);
	var h = height/(m_radius*1000.0);
	var geometry = new THREE.Geometry()	
	var x = -w/2,  y = -h/2;
	geometry.vertices.push( new THREE.Vector3(x, y, 0) );	x+=w;
	geometry.vertices.push( new THREE.Vector3(x, y, 0) );	y+=h;
	geometry.vertices.push( new THREE.Vector3(x, y, 0) );	x-=w;
	geometry.vertices.push( new THREE.Vector3(x, y, 0) );	y-=h;
	geometry.vertices.push( new THREE.Vector3(x, y, 0) );

	var material = new THREE.LineBasicMaterial( { color: 0x00ff00, linewidth: 3 } );

	var line = new THREE.Line(geometry, material);

	return line;
}

function createPlane(image_path,long,lat,rotation,width,height,opacity) {
	var w = width/(m_radius*1000.0);
	var h = height/(m_radius*1000.0);
    var m = new THREE.Mesh(
        new THREE.PlaneGeometry( w, h, 1 ),
        new THREE.MeshBasicMaterial({
            map:   Texture(image_path),
			side:  THREE.DoubleSide,
            transparent: opacity ? true : false,
            opacity: opacity || 1.0
        })
    );
    return m;
}

function create_overlays( scene, items ) {
	var planes = [];
	var item = items[0];
	items.forEach( function(item,i) {
		var overlay = createPlane('sp/'+item.image, item.long, item.lat, item.rotation, item.width, item.height, item.opacity) 
		overlay.name = 'Image-'+item.image;
		overlay.scale.y =
		overlay.scale.x = item.scale;
		overlay_pos( overlay, 0, item.lat, item.rotation, i );
		overlay.border = createBorder( item.width, item.height );
		overlay.border.visible = (i==current_edit);
		overlay_pos( overlay.border, 0, item.lat, item.rotation, i );

		console.log("overlay pos ", overlay.position,overlay.rotation )

		var plane = new THREE.Object3D();
		plane.name = 'Overlay-'+item.image;
		plane.add( overlay );
		plane.add( overlay.border );
		//plane.position = new THREE.Vector3( 0,0,0 );
		overlay_rotate( plane, item.long, 0, item.rotation )

		item.object = plane;
		item.overlay = overlay;
		planes.push( plane );
		earth.add( plane );
	})

	return planes;
}


function deg(n) { return n * Math.PI / 180.0; }

function overlay_pos( m, long, lat, rot, altitude )
{
    if( m ) {
        var newpos = lonLatToVector3( deg(long), deg(lat), (typeof(altitude) == 'number') ? plane_height+(altitude*5) : plane_height );
        // lat/long = planes tilt along its position.
        m.position.copy( newpos );
        m.rotation.x = deg(lat_off-lat)-(lat*lat_adj);
        m.rotation.y = deg(180);
        m.rotation.z = deg(rot);
        return m.rotation;
    }
}

function overlay_rotate( m, long, lat )
{
    if( m ) {
        // lat/long = planes tilt along its position.
        m.rotation.x = -deg(lat);
        m.rotation.y = deg(long);
        return m.rotation;
    }
}


function overlays_spin( a ) {
    var item = window.overlays[0];
	window.overlays.forEach( function(item,i) {
		overlay_pos( item.overlay, 0, item.lat, item.rotation, i );
		overlay_pos( item.overlay.border, 0, item.lat, item.rotation, i );

	    overlay_rotate( item.object, item.long, 0 );
	    item.overlay.rotation.z = deg(item.rotation);
	})
}




function lonLatToVector3( lng, lat, height, out )
{
    out = out || new THREE.Vector3();
    height = height || 0;
    var h = 0.5 + (height/(m_radius*1000.0));
    //flips the Y axis
    lat = Math.PI / 2 - lat;
    //distribute to sphere
    out.set(    h * Math.sin( lat ) * Math.sin( lng ),
                h * Math.cos( lat ),
                h * Math.sin( lat ) * Math.cos( lng )
    );
    return out;
}

