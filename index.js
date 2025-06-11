import * as THREE from "three";
import { OrbitControls } from "jsm/controls/OrbitControls.js";
import getStarfield from "./src/getStarfield.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(0, 0, 3.5);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const orbitCtrl = new OrbitControls(camera, renderer.domElement);
orbitCtrl.enableDamping = true;

const textureLoader = new THREE.TextureLoader();
const starSprite = textureLoader.load("./src/circle.png");
const colorMap = textureLoader.load("./src/00_earthmap1k.jpg");
const elevMap = textureLoader.load("./src/01_earthbump1k.jpg");
const alphaMap = textureLoader.load("./src/02_earthspec1k.jpg");

const globeGroup = new THREE.Group();
scene.add(globeGroup);

const geo = new THREE.IcosahedronGeometry(1, 10);
const mat = new THREE.MeshBasicMaterial({ 
  color: 0x202020,
  wireframe: true,
 });
const cube = new THREE.Mesh(geo, mat);
globeGroup.add(cube);

const detail = 120;
const pointsGeo = new THREE.IcosahedronGeometry(1, detail);

const vertexShader = `
  uniform float size;
  uniform sampler2D elevTexture;

  varying vec2 vUv;
  varying float vVisible;

  void main() {
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    float elv = texture2D(elevTexture, vUv).r;
    vec3 vNormal = normalMatrix * normal;
    vVisible = step(0.0, dot( -normalize(mvPosition.xyz), normalize(vNormal)));
    mvPosition.z += 0.35 * elv;
    gl_PointSize = size;
    gl_Position = projectionMatrix * mvPosition;
  }
`;
const fragmentShader = `
  uniform sampler2D colorTexture;
  uniform sampler2D alphaTexture;

  varying vec2 vUv;
  varying float vVisible;

  void main() {
    if (floor(vVisible + 0.1) == 0.0) discard;
    float alpha = 1.0 - texture2D(alphaTexture, vUv).r;
    vec3 color = texture2D(colorTexture, vUv).rgb;
    gl_FragColor = vec4(color, alpha);
  }
`;
// vec3 color = texture2D(colorTexture, vUv).rgb;
const uniforms = {
  size: { type: "f", value: 4.0 },
  colorTexture: { type: "t", value: colorMap },
  elevTexture: { type: "t", value: elevMap },
  alphaTexture: { type: "t", value: alphaMap }
};
const pointsMat = new THREE.ShaderMaterial({
  uniforms: uniforms,
  vertexShader,
  fragmentShader,
  transparent: true
});

const points = new THREE.Points(pointsGeo, pointsMat);
globeGroup.add(points);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x080820, 3);
scene.add(hemiLight);

const stars = getStarfield({ numStars:4500, sprite: starSprite });
scene.add(stars);

const redPointGeo = new THREE.BufferGeometry();
const redPointMaterial = new THREE.ShaderMaterial({
  uniforms: {
    size: { value: 24.0 },
    sprite: { value: starSprite },
  },
  vertexShader: `
    uniform float size;
    varying float vVisible;
    void main() {
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vec3 viewDir = -normalize(mvPosition.xyz);
      vec3 transformedNormal = normalize(normalMatrix * normal);
      vVisible = step(0.0, dot(viewDir, transformedNormal));
      gl_PointSize = size;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform sampler2D sprite;
    varying float vVisible;
    void main() {
      if (floor(vVisible + 0.1) == 0.0) discard;
      vec4 tex = texture2D(sprite, gl_PointCoord);
      if (tex.a < 0.1) discard;
      gl_FragColor = vec4(1.0, 0.0, 0.0, tex.a);
    }
  `,
  transparent: true,
  depthWrite: false
});


// Set red point position (lat/lon or manual)
// const radius = 1.02;
// const lat = 0;
// const lon = 0;

// const phi = (90 - lat) * (Math.PI / 180);
// const theta = (lon + 180) * (Math.PI / 180);
// const x = radius * Math.sin(phi) * Math.cos(theta);
// const y = radius * Math.cos(phi);
// const z = radius * Math.sin(phi) * Math.sin(theta);

// const pos = new Float32Array([x, y, z]);
// const norm = new Float32Array([x, y, z]); // approximate normal

// redPointGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
// redPointGeo.setAttribute('normal', new THREE.BufferAttribute(norm, 3));

// const redPoint = new THREE.Points(redPointGeo, redPointMaterial);
// globeGroup.add(redPoint);


// const radius = 1.02;
// let lat = 0;
// let lon = 0;

// let phi = (90 - lat) * (Math.PI / 180);
// let theta = (lon + 180) * (Math.PI / 180);
// let x = radius * Math.sin(phi) * Math.cos(theta);
// let y = radius * Math.cos(phi);
// let z = radius * Math.sin(phi) * Math.sin(theta);

// const pos = new Float32Array([x, y, z]);
// const norm = new Float32Array([x, y, z]); // approximate normal

// redPointGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
// redPointGeo.setAttribute('normal', new THREE.BufferAttribute(norm, 3));

// const redPoint = new THREE.Points(redPointGeo, redPointMaterial);
// globeGroup.add(redPoint);

// lat = 20;
// lon = 20;

// phi = (90 - lat) * (Math.PI / 180);
// theta = (lon + 180) * (Math.PI / 180);
// x = radius * Math.sin(phi) * Math.cos(theta);
// y = radius * Math.cos(phi);
// z = radius * Math.sin(phi) * Math.sin(theta);

// const pos2 = new Float32Array([x, y, z]);
// const norm2 = new Float32Array([x, y, z]); // approximate normal

// redPointGeo.setAttribute('position', new THREE.BufferAttribute(pos2, 3));
// redPointGeo.setAttribute('normal', new THREE.BufferAttribute(norm2, 3));

// const redPoint2 = new THREE.Points(redPointGeo, redPointMaterial);
// globeGroup.add(redPoint2);

function createCountry(lat, lon) {
  const radius = 1.02;
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array([x, y, z]);
  const norm = new Float32Array([x, y, z]); // approximate normal
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(norm, 3));

  const point = new THREE.Points(geo, redPointMaterial);
  globeGroup.add(point);
}

// Call it twice




function animate() {
  renderer.render(scene, camera);
  // globeGroup.rotation.y += 0.002;

  requestAnimationFrame(animate);
  orbitCtrl.update();
};
animate();

window.addEventListener('resize', function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}, false);

// https://discourse.threejs.org/t/earth-point-vertex-elevation/62689







// distance function - what actually works
// import math
// import random

let countries = [["Andorra", 1.601554, 42.546245],
    ["United Arab Emirates", 53.847818, 23.424076],
    ["Afghanistan", 67.709953, 33.93911],
    ["Antigua and Barbuda", -61.796428, 17.060816],
    ["Anguilla", -63.068615, 18.220554],
    ["Albania", 20.168331, 41.153332],
    ["Armenia", 45.038189, 40.069099],
    ["Angola", 17.873887, -11.202692],
    ["Argentina", -63.616672, -38.416097],
    ["American Samoa", -170.132217, -14.270972],
    ["Austria", 14.550072, 47.516231],
    ["Australia", 133.775136, -25.274398],
    ["Aruba", -69.968338, 12.52111],
    ["Azerbaijan", 47.576927, 40.143105],
    ["Bosnia and Herzegovina", 17.679076, 43.915886],
    ["Barbados", -59.543198, 13.193887],
    ["Bangladesh", 90.356331, 23.684994],
    ["Belgium", 4.469936, 50.503887],
    ["Burkina Faso", -1.561593, 12.238333],
    ["Bulgaria", 25.48583, 42.733883],
    ["Bahrain", 50.637772, 25.930414],
    ["Burundi", 29.918886, -3.373056],
    ["Benin", 2.315834, 9.30769],
    ["Bermuda", -64.75737, 32.321384],
    ["Brunei", 114.727669, 4.535277],
    ["Bolivia", -63.588653, -16.290154],
    ["Brazil", -51.92528, -14.235004],
    ["Bahamas", -77.39628, 25.03428],
    ["Bhutan", 90.433601, 27.514162],
    ["Botswana", 24.684866, -22.328474],
    ["Belarus", 27.953389, 53.709807],
    ["Belize", -88.49765, 17.189877],
    ["Canada", -106.346771, 56.130366],
    ["Democratic Republic of Congo", 21.758664, -4.038333],
    ["Central African Republic", 20.939444, 6.611111],
    ["Republic of Congo", 15.827659, -0.228021],
    ["Switzerland", 8.227512, 46.818188],
    ["Côte d'Ivoire", -5.54708, 7.539989],
    ["Cook Islands", -159.777671, -21.236736],
    ["Chile", -71.542969, -35.675147],
    ["Cameroon", 12.354722, 7.369722],
    ["China", 104.195397, 35.86166],
    ["Colombia", -74.297333, 4.570868],
    ["Costa Rica", -83.753428, 9.748917],
    ["Cuba", -77.781167, 21.521757],
    ["Cape Verde", -24.013197, 16.002082],
    ["Christmas Island", 105.690449, -10.447525],
    ["Cyprus", 33.429859, 35.126413],
    ["Czech Republic", 15.472962, 49.817492],
    ["Germany", 10.451526, 51.165691],
    ["Djibouti", 42.590275, 11.825138],
    ["Denmark", 9.501785, 56.26392],
    ["Dominica", -61.370976, 15.414999],
    ["Dominican Republic", -70.162651, 18.735693],
    ["Algeria", 1.659626, 28.033886],
    ["Ecuador", -78.183406, -1.831239],
    ["Estonia", 25.013607, 58.595272],
    ["Egypt", 30.802498, 26.820553],
    ["Eritrea", 39.782334, 15.179384],
    ["Spain", -3.74922, 40.463667],
    ["Ethiopia", 40.489673, 9.145],
    ["Finland", 25.748151, 61.92411],
    ["Fiji", 179.414413, -16.578193],
    ["Micronesia", 150.550812, 7.425554],
    ["France", 2.213749, 46.227638],
    ["Gabon", 11.609444, -0.803689],
    ["United Kingdom", -3.435973, 55.378051],
    ["Grenada", -61.604171, 12.262776],
    ["Georgia", 43.356892, 42.315407],
    ["French Guiana", -53.125782, 3.933889],
    ["Ghana", -1.023194, 7.946527],
    ["Gambia", -15.310139, 13.443182],
    ["Guinea", -9.696645, 9.945587],
    ["Equatorial Guinea", 10.267895, 1.650801],
    ["Greece", 21.824312, 39.074208],
    ["Guatemala", -90.230759, 15.783471],
    ["Guinea-Bissau", -15.180413, 11.803749],
    ["Guyana", -58.93018, 4.860416],
    ["Honduras", -86.241905, 15.199999],
    ["Croatia", 15.2, 45.1],
    ["Haiti", -72.285215, 18.971187],
    ["Hungary", 19.503304, 47.162494],
    ["Indonesia", 113.921327, -0.789275],
    ["Ireland", -8.24389, 53.41291],
    ["Israel", 34.851612, 31.046051],
    ["India", 78.96288, 20.593684],
    ["Iraq", 43.679291, 33.223191],
    ["Iran", 53.688046, 32.427908],
    ["Iceland", -19.020835, 64.963051],
    ["Italy", 12.56738, 41.87194],
    ["Jersey", -2.13125, 49.214439],
    ["Jamaica", -77.297508, 18.109581],
    ["Jordan", 36.238414, 30.585164],
    ["Japan", 138.252924, 36.204824], ["Kenya", 37.906193, -0.023559],
    ["Kyrgyzstan", 74.766098, 41.20438],
    ["Cambodia", 104.990963, 12.565679],
    ["Kiribati", -168.734039, -3.370417],
    ["Comoros", 43.872219, -11.875001],
    ["Saint Kitts and Nevis", -62.782998, 17.357822],
    ["North Korea", 127.510093, 40.339852],
    ["South Korea", 127.766922, 35.907757],
    ["Kuwait", 47.481766, 29.31166],
    ["Cayman Islands", -80.566956, 19.513469],
    ["Kazakhstan", 66.923684, 48.019573],
    ["Laos", 102.495496, 19.85627],
    ["Lebanon", 35.862285, 33.854721],
    ["Saint Lucia", -60.978893, 13.909444],
    ["Liechtenstein", 9.555373, 47.166],
    ["Sri Lanka", 80.771797, 7.873054],
    ["Liberia", -9.429499, 6.428055],
    ["Lesotho", 28.233608, -29.609988],
    ["Lithuania", 23.881275, 55.169438],
    ["Luxembourg", 6.129583, 49.815273],
    ["Latvia", 24.603189, 56.879635],
    ["Libya", 17.228331, 26.3351],
    ["Morocco", -7.09262, 31.791702],
    ["Monaco", 7.412841, 43.750298],
    ["Moldova", 28.369885, 47.411631],
    ["Montenegro", 19.37439, 42.708678],
    ["Madagascar", 46.869107, -18.766947],
    ["Marshall Islands", 171.184478, 7.131474],
    ["Macedonia", 21.745275, 41.608635],
    ["Mali", -3.996166, 17.570692],
    ["Myanmar", 95.956223, 21.913965],
    ["Mongolia", 103.846656, 46.862496],
    ["Mauritania", -10.940835, 21.00789],
    ["Malta", 14.375416, 35.937496],
    ["Mauritius", 57.552152, -20.348404],
    ["Maldives", 73.22068, 3.202778],
    ["Malawi", 34.301525, -13.254308],
    ["Mexico", -102.552784, 23.634501],
    ["Malaysia", 101.975766, 4.210484],
    ["Mozambique", 35.529562, -18.665695],
    ["Namibia", 18.49041, -22.95764],
    ["Niger", 8.081666, 17.607789],
    ["Nigeria", 8.675277, 9.081999],
    ["Nicaragua", -85.207229, 12.865416],
    ["Netherlands", 5.291266, 52.132633],
    ["Norway", 8.468946, 60.472024],
    ["Nepal", 84.124008, 28.394857],
    ["Nauru", 166.931503, -0.522778],
    ["Niue", -169.867233, -19.054445],
    ["New Zealand", 174.885971, -40.900557],
    ["Oman", 55.923255, 21.512583],
    ["Panama", -80.782127, 8.537981],
    ["Peru", -75.015152, -9.189967],
    ["French Polynesia", -149.406843, -17.679742],
    ["Papua New Guinea", 143.95555, -6.314993],
    ["Philippines", 121.774017, 12.879721],
    ["Pakistan", 69.345116, 30.375321],
    ["Poland", 19.145136, 51.919438],
    ["Pitcairn Islands", -127.439308, -24.703615],
    ["Puerto Rico", -66.590149, 18.220833],
    ["Portugal", -8.224454, 39.399872],
    ["Palau", 134.58252, 7.51498],
    ["Paraguay", -58.443832, -23.442503],
    ["Qatar", 51.183884, 25.354826],
    ["Romania", 24.96676, 45.943161],
    ["Serbia", 21.005859, 44.016521],
    ["Russia", 105.318756, 61.52401],
    ["Rwanda", 29.873888, -1.940278],
    ["Saudi Arabia", 45.079162, 23.885942],
    ["Solomon Islands", 160.156194, -9.64571],
    ["Seychelles", 55.491977, -4.679574],
    ["Sudan", 30.217636, 12.862807],
    ["Sweden", 18.643501, 60.128161],
    ["Singapore", 103.819836, 1.352083],
    ["Slovenia", 14.995463, 46.151241],
    ["Slovakia", 19.699024, 48.669026],
    ["Sierra Leone", -11.779889, 8.460555],
    ["San Marino", 12.457777, 43.94236],
    ["Senegal", -14.452362, 14.497401],
    ["Somalia", 46.199616, 5.152149],
    ["Suriname", -56.027783, 3.919305],
    ["São Tomé and Príncipe", 6.613081, 0.18636],
    ["El Salvador", -88.89653, 13.794185],
    ["Syria", 38.996815, 34.802075],
    ["Swaziland", 31.465866, -26.522503],
    ["Turks and Caicos Islands", -71.797928, 21.694025],
    ["Chad", 18.732207, 15.454166],
    ["Togo", 0.824782, 8.619543],
    ["Thailand", 100.992541, 15.870032],
    ["Tajikistan", 71.276093, 38.861034],
    ["Timor-Leste", 125.727539, -8.874217],
    ["Turkmenistan", 59.556278, 38.969719],
    ["Tunisia", 9.537499, 33.886917],
    ["Tonga", -175.198242, -21.178986],
    ["Turkey", 35.243322, 38.963745],
    ["Trinidad and Tobago", -61.222503, 10.691803],
    ["Tuvalu", 177.64933, -7.109535],
    ["Taiwan", 120.960515, 23.69781],
    ["Tanzania", 34.888822, -6.369028],
    ["Ukraine", 31.16558, 48.379433],
    ["Uganda", 32.290275, 1.373333],
    ["United States", -95.712891, 37.09024], ["Uruguay", -55.765835, -32.522779],
    ["Uzbekistan", 64.585262, 41.377491],
    ["Vatican City", 12.453389, 41.902916],
    ["Saint Vincent and the Grenadines", -61.287228, 12.984305],
    ["Venezuela", -66.58973, 6.42375],
    ["Vietnam", 108.277199, 14.058324],
    ["Vanuatu", 166.959158, -15.376706],
    ["Samoa", -172.104629, -13.759029],
    ["Kosovo", 20.902977, 42.602636],
    ["Yemen", 48.516388, 15.552727],
    ["South Africa", 22.937506, -30.559482],
    ["Zambia", 27.849332, -13.133897],
    ["Zimbabwe", 29.154857, -19.015438]
]

let randcountry = countries[parseInt(Math.random() * 249)][0]
console.log(randcountry)

let countryradians = countries
// for(let countryset of countryradians){
//     countryset[1] = Math.radians(countryset[1])
//     countryset[2] = Math.radians(countryset[2])
// }
for(let countryset of countryradians){
  countryset[1] = countryset[1] * (Math.PI / 180)
  countryset[2] = countryset[2] * (Math.PI / 180)
}

let guess = ""

let play = true
let country1longitude = 0
let country1latitude = 0
let country2longitude = 0
let country2latitude = 0 

let latitudedifference = 0
let longitudedifference = 0

let a = 0
let c = 0
let d = 0
let score = 0
let guesses = []
let used = false

function distance(country1, country2){
    country1longitude = 0
    country1latitude = 0
    country2longitude = 0
    country2latitude = 0    

    for(let country = 0; country < countryradians.length; country++) {
        if(countryradians[country][0].toUpperCase() == country1.toUpperCase()) {
            country1longitude = countryradians[country][1]
            country1latitude = countryradians[country][2]
        }
        if(countryradians[country][0].toUpperCase() == country2.toUpperCase()) {
            country2longitude = countryradians[country][1]
            country2latitude = countryradians[country][2]
        }
    }

    latitudedifference = country1latitude - country2latitude
    longitudedifference = country1longitude - country2longitude
    

    a = (Math.sin(latitudedifference/2)*Math.sin(latitudedifference/2)) + (Math.cos(country1latitude) * Math.cos(country2latitude) * Math.sin(longitudedifference/2)*Math.sin(longitudedifference/2))
    c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    d = 6371 * c

    if(d == 0) {
        play = false
        score++
        alert("Nice job! Your score was " + score)
    } else {
        for(let k = 0; k < guesses.length; k++) {
          if(guesses[k].toUpperCase() == guess.toUpperCase()) {
            used = true
            alert("Already guessed.")
          }
        }
        if(used == false) {
            const newcountry = document.createElement('div')
            newcountry.innerText = guess + " is about " + String(d) + " kilometers away. "
            newcountry.id = "country"
            document.getElementById('guessed').append(newcountry)
            let mynum = d/30
            let r = Math.round(mynum);
            let g = Math.round(255 - mynum);
            newcountry.style.color = "rgb(" + r + "," + g + ",0)";

            guesses.push(guess)
            score++
        }

        used = false

        // newcountry.style.color = "rgb(mynum, 255-mynum, 0)"
        // rgb(255-d/50, d/50, 10)
        // document.getElementById("guessed").innerText = document.getElementById("guessed").innerText + (guess + " is about " + String(d) + " kilometers away. ")
    }
    createCountry(country1latitude/(Math.PI / 180), -country1longitude/(Math.PI / 180))
}

// while play == true:
let works = false
function playing() {
    works = false
    for(let j = 0; j < countryradians.length; j++) {
        if (guess.toUpperCase() == countryradians[j][0].toUpperCase()) {
            works = true
        }
    }
    if(works == false) {
        alert("not a valid country")
    } else {
        distance(guess, randcountry)
        document.getElementById('inputbox').value = ""
    }
}

document.addEventListener('keydown', function(event) {
  if (event.key === 'Enter') {
    guess = document.getElementById('inputbox').value
    playing()
  }
});