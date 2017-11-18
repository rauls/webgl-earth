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
var plane_height = 22000; //5100;
var current_edit = 1;
var edit_speed = 1000;



function item2params(item,params) {
	params.longitude = item.long;
	params.latitude = item.lat;
	params.rotation = item.rotation;
	params.scale = item.scale;
	params.opacity = item.opacity;
	params.name = item.image;
}

var GuiParams = function() {
	this.current_edit = window.current_edit;
	this.rotate_speed = window.rotate_speed;
	this.grid = false;
	item2params( overlays[ current_edit ], this );
	this.South_Pole = function() {
		app.controls.set_position( new THREE.Vector3( -0.0007532996302339945,-0.5047897776433968,-0.00047011971273784 ) );
	};
	this.Add_Image_Tile = function() {
		var newitem = Object.assign( {}, overlays[ current_edit ] );
		newitem.image = this.new_url || "";
		newitem.width = this.width;
		newitem.height = this.height;
		overlays.push( newitem );
		planes.push( create_overlay( newitem,overlays.length ) );
	};
	this.new_url = "";
	this.width = 1024;
	this.height = 1024;
	this.altitude = 10000;
}

function init_datgui()
{
	var gui = new dat.gui.GUI({ load: JSON });
	var params = new GuiParams();
	gui.remember(params);

	var names_list = [];
	overlays.forEach( function(item) {
		names_list.push( item.image );
	})
	params.names_list = names_list;

	gui.add(params, 'altitude').listen();
	gui.add(params, 'grid').onChange( function(v) {
		window.app.grid.visible = v;
	} ).listen();
	gui.add(params, 'rotate_speed', 0, 10).onChange( function(v) {
		window.rotate_speed = parseFloat(v);
	} ).onFinishChange( function() { console.log("DONE") });

	gui.add(params, 'names_list', names_list ).listen();

	gui.add(params, 'name').listen();
	gui.add(params, 'current_edit' ).listen();

	gui.add(params, 'longitude', -360, 360 ).step(0.0201).onChange( function(v) {
		overlays[ current_edit ].long = parseFloat(v);
	} ).listen();
	gui.add(params, 'latitude', -90, +90 ).step(0.0201).onChange( function(v) {
		overlays[ current_edit ].lat = parseFloat(v);
	} ).listen();
	gui.add(params, 'rotation', 0, 360 ).step(1).onChange( function(v) {
		overlays[ current_edit ].rotation = parseFloat(v);
	} ).listen();
	gui.add(params, 'scale', 0, 32 ).step(0.02).onChange( function(v) {
		overlays[ current_edit ].scale = parseFloat(v);
	} ).listen();
	gui.add(params, 'opacity', 0, 1 ).step(0.05).onChange( function(v) {
		overlays[ current_edit ].opacity = parseFloat(v);
	} ).listen();

	gui.add(params, 'South_Pole');
	gui.add(params, 'Add_Image_Tile');
	var f2 = gui.addFolder('    New Image Location');
	f2.add( params, 'new_url' );
	f2.add( params, 'width' );
	f2.add( params, 'height' );

	return params;
}


(function () {
	window.app = this;
	this.assets = {
		local: {
			base:   'images/',
		},
		online: {
			base: 	'http://users.on.net/~rsobon/earth/images/'
		},
		earth:  '2_no_clouds_4k.png',
		elev:   'elev_bump_4k.jpg',
		water:  'water_4k.png',
		clouds: 'fair_clouds_4k.png',
		current: this.local
	};
	var width  = window.innerWidth,
		height = window.innerHeight;

	// Earth params
	var radius   = 0.5,
		segments = 36*2,
		rotation = 0;

	if( window.location.href.match( /192.168.|^file:/ ) ) {
		assets.current = assets.local;
	} else {
		assets.current = assets.online;
		assets.current = assets.local;
		assets.earth.replace('.png','.jpg');
	}

	var webglEl = document.getElementById('webgl');

	if (!Detector.webgl) {
		Detector.addGetWebGLMessage(webglEl);
		return;
	}

	var scene = new THREE.Scene();
	this.camera = window.camera = new THREE.PerspectiveCamera(45, width / height, 0.0001, 91*13);
	camera.position.z = 2 * radius;

	var renderer = new THREE.WebGLRenderer();
	renderer.setSize(width, height);

	scene.add(new THREE.AmbientLight(0x333333));

	this.Texture = Texture;
	this.light = new THREE.DirectionalLight(0xfffef9, .6);
	light.position.set(5,-13,13);
	scene.add(light);
	
	this.light_pos = 0;
	light.timer = setInterval( function() {
	    light_pos += 0.1;
	    light.position.set( Math.sin( deg(light_pos) ) * 20, -10,  Math.cos( deg(light_pos) ) * 30 );
	}, 1000 );

	var earth = window.earth = new THREE.Object3D();
    var sphere = createSphere(radius, segments);
	earth.add(sphere)
    var clouds = window.clouds = createClouds(radius, segments);
	clouds.material.opacity = 0.40;
	earth.rotation.y = rotation;
	earth.add(clouds)
	this.grid = create_grid(0x609060);
	this.grid.visible = false;
	earth.add( grid )
	this.antarctica = ContinentGeometry( 65, 65, Texture( "sp/Antarctica_4k.jpg" ) )
	this.antarctica.rotation.x = deg(90)
    this.antarctica.rotation.y = deg(0);
    this.antarctica.rotation.z = deg(-90)
    this.antarctica.update = UpdateSphere;

	earth.add( antarctica )
	scene.add( earth )

	window.stars = createStars(90*13, 64*2);
	scene.add(window.stars);

	//var controls = new THREE.OrbitControls(camera);
	this.controls = new THREE.TrackballControls(camera);

	webglEl.appendChild(renderer.domElement);
	
	window.angle = 0;
	window.rotate_speed = 0.10;

	function render() {
		this.controls.update();
		window.angle += rotate_speed;
		if( window.angle > 360 ) {
		    window.angle -= 360;
        }
		earth.rotation.y = deg(window.angle);
		overlays_spin( (window.angle) );
		requestAnimationFrame(render);
		renderer.render(scene, camera);
	}


	function Texture( name, is_url ) {
		var assets = window.app.assets;
		var loader = new THREE.TextureLoader();
		loader.setCrossOrigin("*");
		if( name.match(/^(images|sp)/) || name.match(/^http/i) || typeof(is_url) != 'undefined' )  {
			return loader.load( name );
		} else {
			var src = assets.current.base + assets[ name ];
			return loader.load( src );
		}
	}

	function createSphere(radius, segments) {
		return new THREE.Mesh(
			new THREE.SphereGeometry(radius, segments, segments),
			new THREE.MeshPhongMaterial({
				map:         Texture('earth'),
				//bumpMap:     Texture('elev'),
				bumpScale:   0.001,
				transparent: true,
				opacity:     1.0,
				specularMap: Texture('water'),
				specular:    new THREE.Color('grey')								
			})
		);
	}

	function createClouds(radius, segments) {
		var ch = 44/(m_radius*2);
		return new THREE.Mesh(
			new THREE.SphereGeometry(radius + ch, segments, segments),			
			new THREE.MeshPhongMaterial({
				map:         Texture('clouds'),
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


	function ContinentGeometry( pos, len, texture ) {
		var Start = (pos)*Math.PI/180,  Length = (90-len)*2*Math.PI/180;
		return ( new THREE.Mesh(
			new THREE.SphereGeometry(
				0.503, 36,36, Start, Length, Start, Length
			),
			new THREE.MeshPhongMaterial( {
				map: texture,
				color: 0xFFFFFF,
				side: THREE.DoubleSide,
				specular:    0xCDCDCD
				//flatShading: true
			} )

		) );
	}
	
	function UpdateSphere( pos, len ) {
	    var Start = (pos)*Math.PI/180,  Length = (90-len)*2*Math.PI/180;
        this.geometry.dispose();
        this.geometry =
        new THREE.SphereGeometry(
           0.503, 36,36, Start, Length, Start, Length
        );
	}


	// 496657main_South_Pole_Station_DMS = 1500x1095
			//Object { image: "sp-icecore_01b.jpg", lat: -89.97182524091974, long: -289.4208061528802, opacity: 0.8, rotation: 62, scale: 6.666666666666667, altitude: 0, width: 1800, height: 1350, object: {…}, … }
	window.overlays = [ {
			image: 		"sp-icecore_01b.jpg",
			lat:   		-89.971825,
			long:  		70.5791939999,
			opacity:    0.8,
			rotation: 	62,
			scale: 		12000/1800,
			altitude:   0,
			width:  	1800,
			height: 	1350
		}, {	// { image: "496657main_South_Pole_Station_DMS-orig_full.jpg", lat: -89.9851667045987, long: 7.32381807775355, opacity: 0.5, rotation: 153, scale: 3.07141735991201, altitude: 0, width: 1500, height: 1095, object: {…}, … }
			image: 		"496657main_South_Pole_Station_DMS-orig_full.jpg",
			lat:   		-89.985166704,
			long:  		7.3238180777,
			opacity:    0.5,
			rotation: 	153,
			scale: 		3.0714173,
			altitude:   0,
			width:  	1500,
			height: 	1095
		}, {	//Object { image: "pole-from-air.jpg", lat: -89.9963741955718, long: 409.1078388792802, rotation: 268, opacity: 0.35000000000000003, scale: 
			image: 		"pole-from-air.jpg",
			lat:   		-89.99637419,
			long:  		49.1078388792802,
			rotation: 	268,
			opacity:    0.4,
			scale: 		0.4444,
			altitude:   0,
			width:  	2048,
			height: 	1380
		}, {		//Object { image: "abovedomes1.jpg", lat: -89.9736710092612, long: 40.339036258044125, rotation: 88, opacity: 0.55, scale: 0.3694116308271857, altitude: 0, width: 1369, height: 1073, object: {…}, … }
			image: 		"abovedomes1.jpg",
			lat:   		-89.97367100,
			long:  		40.3390362580,
			rotation: 	88,
			opacity:    0.55,
			scale: 		0.36941,
			altitude:   0,
			width:  	1369,
			height: 	1073
		},
		{// Object { image: "orangeroof1.jpg", lat: -89.9979999907388, long: 54.01977711500789, rotation: -164, opacity: 0.8, scale: 0.10662550776958094, altitude: 0, width: 2048, height: 1365, object: {…}, … }
			image: 		"orangeroof1.jpg",
			lat:   		-89.99799999,
			long:  		54.01977711,
			rotation: 	-164,
			opacity:    0.8,
			scale: 		0.10662,
			altitude:   0, 
			width:  	2048,
			height: 	1365
		}
	]

	window.planes = create_overlays(scene,overlays);

	window.addEventListener( 'keydown', key_handler, false );

	this.gui_params = init_datgui();
	this.controls.zoom_callback = function() {
		app.gui_params.altitude = this.altitude * m_radius * 1000;
	}



	render();

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
    var update = false;
    if( event.keyCode == 37 ) {     overlay.long -= spd/(m_radius*1); update=true;    }
    if( event.keyCode == 38 ) {     overlay.lat  += spd/(m_radius*1000); update=true;    }
    if( event.keyCode == 39 ) {     overlay.long += spd/(m_radius*1); update=true;    }
    if( event.keyCode == 40 ) {     overlay.lat  -= spd/(m_radius*1000); update=true;    }
    if( event.keyCode == 33 ) {     overlay.scale  += spd/(m_radius*10); update=true;    }
    if( event.keyCode == 34 ) {     overlay.scale  -= spd/(m_radius*10); update=true;    }
    if( event.key == ',' ) {        overlay.rotation-=1; update=true;    }
    if( event.key == '.' ) {        overlay.rotation+=1; update=true;    }

    if( event.keyCode == 9 ) {
    	window.current_edit++;
    	if( window.current_edit == overlays.length ) {
    		window.current_edit = 0;
    	}
    	overlay = window.overlays[ current_edit ];
    	app.gui_params.current_edit = current_edit;
    	update=true;
    }
    if( update ) {
    	item2params( overlay, app.gui_params );
    }
}



function create_grid(color) {
	color = typeof(color)=='undefined' ? 0x00ff00 : color;
	var geometry = new THREE.SphereBufferGeometry( 0.50500, 360/5, 360/5 );
	var material = new THREE.LineBasicMaterial( {color: color, wireframe: true, transparent: true, opacity: 0.10 } );
	var sphere = new THREE.LineSegments( geometry, material );
	return sphere;
}
// 1deg = 111.11 km.
// 0.001 = 111meters

function createBorder(width,height,scale) {
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
	line.scale.y =
	line.scale.x = scale;

	return line;
}

function createPlane(image_path,long,lat,rotation,width,height,opacity,scale) {
	var w = width/(m_radius*1000.0);			// scale DIM for 1 pixel of image = 1 meter
	var h = height/(m_radius*1000.0);
    var m = new THREE.Mesh(
        new THREE.PlaneGeometry( w, h, 1 ),
        new THREE.MeshBasicMaterial({
            map:   Texture(image_path,true),
			side:  THREE.DoubleSide,
            transparent: opacity ? true : false,
            opacity: opacity || 1.0
        })
    );
	m.scale.y =
	m.scale.x = scale;	// this should be total meters of image / pixels
    return m;
}

function create_overlay( item,i ) {
	var overlay = createPlane('sp/'+item.image, item.long, item.lat, item.rotation, item.width, item.height, item.opacity, item.scale )
	overlay.name = 'Image-'+item.image;
	overlay_pos( overlay, 0, item.lat, item.rotation, item.scale, i );
	overlay.border = createBorder( item.width, item.height, item.scale );
	overlay.border.visible = (i==current_edit);
	overlay_pos( overlay.border, 0, item.lat, item.rotation, item.scale, i );

	console.log("overlay pos ", overlay.position,overlay.rotation )

	var plane = new THREE.Object3D();
	plane.name = 'Overlay-'+item.image;
	plane.add( overlay );
	plane.add( overlay.border );
	//plane.position = new THREE.Vector3( 0,0,0 );
	overlay_rotate( plane, item.long, 0, item.rotation )

	item.object = plane;
	item.overlay = overlay;
	earth.add( plane );
	return plane;
}

function create_overlays( scene, items ) {
	var planes = [];
	var item = items[0];
	items.forEach( function(item,i) {
		planes.push( create_overlay( item,i ) );
	})

	return planes;
}


function deg(n) { return n * Math.PI / 180.0; }

function overlay_pos( m, long, lat, rot, scale, altitude )
{
    if( m ) {
        var newpos = lonLatToVector3( deg(long), deg(lat), (typeof(altitude) == 'number') ? plane_height+(altitude*5) : plane_height );
        // lat/long = planes tilt along its position.
        m.position.copy( newpos );
        m.rotation.x = deg(lat_off-lat)-(lat*lat_adj);
        m.rotation.y = deg(180);
        m.rotation.z = deg(rot);
		m.scale.y =
		m.scale.x = scale;
        return m;
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
		overlay_pos( item.overlay, 0, item.lat, item.rotation, item.scale, i );
		overlay_pos( item.overlay.border, 0, item.lat, item.rotation, item.scale, i );
		item.overlay.material.opacity = item.opacity;
		item.overlay.border.visible = (i==current_edit);
		if( (i==current_edit) ) {
		    item2params( item, app.gui_params );
		}

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

