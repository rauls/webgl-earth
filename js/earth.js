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
var current_edit = 0;
var edit_speed = 1000;

var antarctica_pos = 89.9;			// lat offset
var antarctica_len = 50.59;			// zoom level

var textureLoader = new THREE.TextureLoader();;

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

App =
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
	this.scene = scene;
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
	clouds.material.opacity = 0.50;
	clouds.visible = false;
	earth.rotation.y = rotation;
	earth.add(clouds)

	this.grid = create_grid(0x609060);
	this.grid.visible = false;
	earth.add( grid )
	this.antarctica = ContinentGeometry( 90, 52, Texture( "sp/Antarctica_4k.png" ) )
	// created at the equator, now reposition it 90deg south, and rotate -90 on surface
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
				bumpScale:   0.0003,
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
		var Start = deg(pos-(len/2)),  Length = (len)*Math.PI/180;
		return ( new THREE.Mesh(
			new THREE.SphereGeometry(
				radius+0.0001, segments,segments, Start, Length, Start, Length
			),
			new THREE.MeshPhongMaterial( {
				map: 		 texture,
				color: 		 0xFFFFFF,
				side: 		 THREE.DoubleSide,
				transparent: true,
				opacity: 	 1.00,
				specular:    0xCDCDCD
				//flatShading: true
			} )

		) );
	}
	
	function UpdateSphere( pos=90, len=52 ) {
	    var Start = deg(pos-(len/2)),  Length = (len)*Math.PI/180;
        this.geometry.dispose();
        this.geometry =
        new THREE.SphereGeometry(
           radius+0.0001, segments,segments, Start, Length, Start, Length
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

	window.planes = create_overlays(scene,overlays,antarctica);

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
var bookmarks = {
	antarctica: {
			eye: 	  {x: -0.05969718844791062, y: -0.7101112444150364, z: -0.05715790655759058},
			position: {x: -0.05969718844791062, y: -0.7101112444150364, z: -0.05715790655759058},
			target:   {x: 0, y: 0, z: 0}
	}
}

function reset_camera() {
	controls.setState( window.saved );
}

window.saved_points = [];

function save_camera() {
	window.saved = controls.saveState();
	window.saved_points.push( saved );
}

function key_handler(event) {
    var overlay = window.overlays[ window.current_edit ];
    var spd = window.edit_speed;
    var update = false;
    if( event.ctrlKey ) {
	    if( event.keyCode == 37 ) {     antarctica_pos -= 0.1; antarctica.update( antarctica_pos, antarctica_len ) }
	    if( event.keyCode == 38 ) {     antarctica_len += 0.1; antarctica.update( antarctica_pos, antarctica_len ) ;    }
	    if( event.keyCode == 39 ) {     antarctica_pos += 0.1; antarctica.update( antarctica_pos, antarctica_len ) ;    }
	    if( event.keyCode == 40 ) {     antarctica_len -= 0.1; antarctica.update( antarctica_pos, antarctica_len ) ;    }
		
    } else {
	    if( event.keyCode == 37 ) {     overlay.long -= spd/(m_radius*1); update=true;    }
	    if( event.keyCode == 38 ) {     overlay.lat  += spd/(m_radius*1000); update=true;    }
	    if( event.keyCode == 39 ) {     overlay.long += spd/(m_radius*1); update=true;    }
	    if( event.keyCode == 40 ) {     overlay.lat  -= spd/(m_radius*1000); update=true;    }
	    if( event.keyCode == 33 ) {     overlay.scale  += spd/(m_radius*10); update=true;    }
	    if( event.keyCode == 34 ) {     overlay.scale  -= spd/(m_radius*10); update=true;    }
	    if( event.key == ',' ) {        overlay.rotation-=1; update=true;    }
	    if( event.key == '.' ) {        overlay.rotation+=1; update=true;    }
	    if( event.key == 's' ) {        save_camera();    }
	    if( event.key == 'r' ) {        reset_camera();    }
	}

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


function create_line(p,len,rot) {
	var geometry = new THREE.Geometry()	
	geometry.vertices.push( new THREE.Vector3(0, len, 0) );
	geometry.vertices.push( new THREE.Vector3(0, 0, 0) );
	var material = new THREE.LineBasicMaterial( { color: 0x00ff00, linewidth: 30 } );
	var line = new THREE.Line(geometry, material);
	line.position.copy(p)
	line.rotation.copy(rot)
	return line;
}

function create_helper(p) {
	var h = 1000/(m_radius*1000.0);
	var o = new THREE.Mesh( new THREE.BoxBufferGeometry( h/10, h/10, h/10 ), new THREE.MeshNormalMaterial() );
	o.position.copy(p)
	return o
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

function create_overlay_old( item,i ) {
	var overlay = createPlane('sp/'+item.image, item.long, item.lat, item.rotation, item.width, item.height, item.opacity, item.scale )
	overlay.name = 'Image-'+item.image;
	overlay_pos( overlay, item.long, item.lat, item.rotation, item.scale, i );
	overlay.border = createBorder( item.width, item.height, item.scale );
	overlay.border.visible = (i==current_edit);
	overlay_pos( overlay.border, item.long, item.lat, item.rotation, item.scale, i );

	console.log("overlay pos ", overlay.position,overlay.rotation )

	var plane = new THREE.Object3D();
	plane.name = 'Overlay-'+item.image;
	plane.add( overlay );
	plane.add( overlay.border );
	//plane.position = new THREE.Vector3( 0,0,0 );
	//overlay_rotate( plane, item.long*0, item.lat, item.rotation )
	item.object = plane;
	item.overlay = overlay;
	earth.add( plane );
	return plane;
}


var decals = [];

function getDirectionFrom( from, to ) {
	// Normalize vectors to make sure they have a length of 1
	var v1 = from.clone();
	var v2 = to.clone();
	v1.normalize();
	v2.normalize();

	// Create a quaternion, and apply starting, then ending vectors
	var quaternion = new THREE.Quaternion();
	quaternion.setFromUnitVectors(v1, v2);

	// Quaternion now has rotation data within it. 
	// We'll need to get it out with a THREE.Euler()
	var euler = new THREE.Euler();
	euler.setFromQuaternion(quaternion);
	return euler;
}

function createDecalPlane(image_path,mesh,position,rotation,width,height,opacity,scale) {
	var w = width/(m_radius*1000.0);			// scale DIM for 1 pixel of image = 1 meter
	var h = height/(m_radius*1000.0);
	var size = new THREE.Vector3( w*1000,h*1000,1 );
	var geometry = new THREE.DecalGeometry( mesh, position, rotation, size );
	var material = new THREE.MeshPhongMaterial({
            map:   Texture(image_path,true),
			side:  THREE.DoubleSide,
			normalScale: new THREE.Vector2( 1, 1 ),
            transparent: opacity ? true : false,
            opacity: opacity || 1.0,
			transparent: true,
			shininess: 30,
			depthTest: true,
			depthWrite: false,
			polygonOffset: true,
			polygonOffsetFactor: - 4,
			wireframe: false
    })

    var m = new THREE.Mesh( geometry, material );
	m.scale.y =
	m.scale.x = scale;	// this should be total meters of image / pixels
    return m;
}

var raycaster = new THREE.Raycaster();

function create_overlay( item, i, sphere ) {
	return create_overlay_old( item, i )
	var rotation;
	var alt = 1620+(i+1);
	var position = coordinate2_pos( item.long, item.lat, alt )
	var position2 = coordinate2_pos( item.long, item.lat, 1 )
	rotation = getDirectionFrom( position, position2 )

	var overlay = createDecalPlane('sp/'+item.image, antarctica, position, rotation, item.width, item.height, item.opacity, item.scale )
	overlay.name = 'Image-'+item.image;

	overlay.border = createBorder( item.width, item.height, item.scale );
	overlay.border.visible = (i==current_edit);
	overlay_pos( overlay.border, item.long, item.lat, item.rotation, item.scale, alt );

	var plane = new THREE.Object3D();
	plane.name = 'Overlay-'+item.image;
	plane.add( overlay );
	plane.add( overlay.border );

	item.mouseHelper = create_helper(position)
	item.mouseHelper.rotation.copy( overlay.border.rotation )
	plane.add( item.mouseHelper  );	

	item.arrow = create_line(position, 1000/(m_radius*1000), rotation)
	plane.add( item.arrow  );	

	item.position = position;
	item.object = plane;
	item.overlay = overlay;
	earth.add( plane );
	return plane;
}


var intersects = [];

function checkIntersection(x,y) {

	if ( ! mesh ) return;

	var mouse = new THREE.Vector2( x,y );

	raycaster.setFromCamera( mouse, camera );
	raycaster.intersectObject( mesh, false, intersects );

	if ( intersects.length > 0 ) {

		var p = intersects[ 0 ].point;
		mouseHelper.position.copy( p );
		intersection.point.copy( p );

		var n = intersects[ 0 ].face.normal.clone();
		n.transformDirection( mesh.matrixWorld );
		n.multiplyScalar( 10 );
		n.add( intersects[ 0 ].point );

		intersection.normal.copy( intersects[ 0 ].face.normal );
		mouseHelper.lookAt( n );

		var positions = line.geometry.attributes.position;
		positions.setXYZ( 0, p.x, p.y, p.z );
		positions.setXYZ( 1, n.x, n.y, n.z );
		positions.needsUpdate = true;

		intersection.intersects = true;

		intersects.length = 0;

	} else {

		intersection.intersects = false;

	}

}

function create_overlays( scene, items, sphere ) {
	var planes = [];
	var item = items[0];
	items.forEach( function(item,i) {
		planes.push( create_overlay( item,i, sphere ) );
	})

	return planes;
}


function deg(n) { return n * Math.PI / 180.0; }


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

function coordinate2_pos( long, lat, altitude )
{
	plane_height = 10;
    var newpos = lonLatToVector3( deg(long), deg(lat), (typeof(altitude) == 'number') ? plane_height+(altitude*1) : plane_height );
    //newpos.y -= 0.0001;
    return newpos;
}

function coordinate2_rotation( long, lat, rot )
{
	var rotation = new THREE.Euler();
    rotation.set( deg(lat_off-lat)-(lat*lat_adj), deg(180), deg(rot) );
    return rotation;
}


function overlay_pos( m, long, lat, rot, scale, altitude )
{
    if( m ) {
        var newpos = coordinate2_pos( long, lat, altitude );
        // lat/long = planes tilt along its position.
        m.position.copy( newpos );
        m.rotation.copy( coordinate2_rotation( long,lat, rot ) )
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
    var last;
	window.overlays.forEach( function(item,i) {
		var offset = (5*i)+630;
		overlay_pos( item.overlay,        0, item.lat, item.rotation, item.scale, item.altitude+offset );
		overlay_pos( item.overlay.border, 0, item.lat, item.rotation, item.scale, item.altitude+offset );
		item.overlay.material.opacity = item.opacity;
		item.overlay.border.visible = (i==current_edit);
		if( (i==current_edit) ) {
		    item2params( item, app.gui_params );
		}

	    //overlay_rotate( item.object, item.long, 0 );
	    //item.overlay.rotation.z = deg(item.rotation);
	    last = item;
	})
}




