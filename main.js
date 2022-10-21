// 一、初始化地图
mapboxgl.accessToken = 'pk.eyJ1Ijoiem91c2wiLCJhIjoiY2w4aWV3cGQ0MTgwbjN3cWhhbHNxZ2dwdyJ9.2wI-vUjIAyHwHvgCY_ljdQ';
const map = new mapboxgl.Map({
    container: 'map', // container ID
    // Choose from Mapbox's core styles, or make your own style with Mapbox Studio
    style: 'mapbox://styles/mapbox/satellite-v9', // style URL
    center: [114, 22.5], // starting position [lng, lat]
    zoom: 1.5, // starting zoom
    projection: 'globe' // display the map as a 3D globe
});

map.on('style.load', () => {
    map.setFog({}); // Set the default atmosphere style
});

// 二、添加导航按钮
var nav = new mapboxgl.NavigationControl({
    "showCompass": true,
    showZoom: true
})
map.addControl(nav, 'top-right')

// 三、控制地球旋转

// 控制相机旋转速度的参数
// 每两分钟旋转完一圈
const secondsPerRevolution = 120
// 高于5缩放级时，不旋转
const maxSpinZoom = 5
// 在3-5缩放级时，旋转速度发生变化
const slowSpinZoom = 3

let userInteraction = false // 判断是否发生交互 true 不发生  false 发生
let spinEnabled = true // 控制是否旋转 true旋转  false不旋转

function globeSpin() {
    // 控制相机旋转
    const zoom = map.getZoom() // 获取相机缩放等级
    if (spinEnabled && !userInteraction && zoom < maxSpinZoom) {
        let distancePerSecond = 360 / secondsPerRevolution
        if (zoom > slowSpinZoom) {
            let zoomDif = (maxSpinZoom - zoom) / (maxSpinZoom - slowSpinZoom)
            distancePerSecond *= zoomDif
        }
        const center = map.getCenter()
        center.lng -= distancePerSecond

        map.easeTo({ center, duration: 1000, easing: (n) => n })
    }
}

// 按下鼠标时暂停
map.on('mousedown', () => {
    userInteraction = true
})
// 松开鼠标时恢复旋转
map.on('mouseup', () => {
    userInteraction = false
    globeSpin()
})
// 相机移动结束后继续触发
map.on('moveend', () => {
    globeSpin()
})
// 相机缩放时读取缩放等级
map.on('zoom', () => {
    zoomValue.innerHTML = map.getZoom().toFixed(1)
    zoomInput.value = map.getZoom()
})

globeSpin()

document.querySelector('.spin').addEventListener('click', (e) => {
    spinEnabled = !spinEnabled
    if (spinEnabled) {
        userInteraction = false
        globeSpin()
        e.target.innerHTML = '暂停旋转'
    } else {
        map.stop()
        e.target.innerHTML = '继续旋转'
    }
})

// 四、设置飞行目的地按钮
const end = {
    center: [114.03, 22.547], // 终点的经纬度坐标
    zoom: 15, // 终点处缩放等级
    bearing: 0, // 相机方向角
    pitch: 75 // 相机俯仰角
}
let isAtStart = true // 判断此时是否为起始位置
let origin = null // 存储起始点位置

const flyBtn = document.querySelector('.fly')

flyBtn.addEventListener('click', () => {
    if (isAtStart) {
        origin = {
            center: map.getCenter(),
            zoom: map.getZoom(),
            pitch: 0,
            bearing: 0
        }
        console.log(origin);
        console.log(end);
        map.flyTo({
            ...end,
            duration: 5000,
            essential: true
        })
    } else {
        map.flyTo({
            ...origin,
            duration: 5000,
            essential: true
        })
        globeSpin()
    }
    isAtStart = !isAtStart
    // 
})

// 五、设置缩放按钮
const zoomInput = document.querySelector('.zoom-input')
const zoomValue = document.querySelector('.zoom-value')

zoomInput.addEventListener('input', (e) => {
    const value = e.target.value
    console.log(value);
    zoomValue.innerHTML = value
    map.setZoom(value)
})

// 六、加载建筑白模
map.on('load', () => {
    const layers = map.getStyle().layers;
    for (const layer of layers) {
        if (layer.type === 'symbol' && layer.layout['text-field']) {
            // remove text labels
            map.removeLayer(layer.id);
        }
    }

    map.addSource('my_building', {
        'type': 'geojson',
        'data': '../data/futian_buildings_1.json'
    })
    map.addLayer({
        'id': 'buildinglayer',
        'source': 'my_building',
        'type': 'fill-extrusion',
        'paint': {
            'fill-extrusion-color': '#eee',
            'fill-extrusion-height': ['get', 'heightnum'],
            'fill-extrusion-opacity': 0.9
        }

    })
})