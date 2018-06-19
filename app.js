require([
    "esri/tasks/Locator",
    "esri/Map",
    "esri/views/MapView",
    "esri/widgets/BasemapToggle",
    "esri/Graphic",
    "esri/layers/GraphicsLayer",
    "dojo/domReady!"
  ], function(Locator, Map, MapView, BasemapToggle, Graphic, GraphicsLayer) {

    // Create a locator task using the world geocoding service
    const locatorTask = new Locator({
       url: "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer"
    });

    // Create the Map
    let map = new Map({
       basemap: "streets-navigation-vector"
    });

    // Create the MapView
    const view = new MapView({
        container: "viewDiv",
        map: map,
        center: [-75.163780, 39.952488],
        zoom: 10
    });

    // Create basemap toggle
    const toggle = new BasemapToggle({
        view: view,
        nextBasemap: 'streets-night-vector'
    });

    // Add basemap toggle to map
    view.ui.add(toggle, 'top-right');

    // Handles map logic that shows lat, lon and address on click in map
    view.on('click', function(e) {
        e.stopPropagation();

        const lat = Math.round(e.mapPoint.latitude * 1000) / 1000;
        const lon = Math.round(e.mapPoint.longitude * 1000) / 1000;

        locatorTask.locationToAddress(e.mapPoint).then(function(response) {
            view.popup.content = response.address;
        }).catch(function(error) {
            view.popup.content = "No address found for this location";
        });
        
        view.popup.open({
            title: `${lat}, ${lon}`,
            location: e.mapPoint
        });
    });

    // https://maps.googleapis.com/maps/api/geocode/json?address=4730 Crystal Springs Dr, Los Angeles, CA&key=AIzaSyAf-6tsTGCPib1xkDgVkTcZp_G6uSMHBCg
    const requestUrl = 'https://maps.googleapis.com/maps/api/geocode/json?address='
    const key = '&key=' + $('#api-in').val();

    // 

    const submitButton = $('#submit-button');
    submitButton.on('click', function(e) {

        
    $('#latlon-out').val("");
    let addressList = $('#address-in').val();

    addressList.split('\n').forEach(function(item) {
        if (item.length > 0) {              
            console.log(requestUrl + encodeURI(item) + key)
            let address = requestUrl + item + key;
            $.ajax({url: address, async: false, success: data => {
                let output = '';

                console.log(data.results);

                
                output += data.results[0].geometry.location.lat + ',';
                output += data.results[0].geometry.location.lng + ',';
                output += data.results[0].geometry.location_type + ',';
                output += data.results[0].formatted_address;
                //output += data.results[0].formatted_address;

                //console.log(output);

                let outText = $('#latlon-out');
                outText.val(outText.val() + output + '\n');            

                //let point = {type: 'point', latitude: data.results[0].geometry.location.lat, longitude: data.results[0].geometry.location.lng};
                var point = {
                    type: "point",
                    longitude: data.results[0].geometry.location.lng,
                    latitude: data.results[0].geometry.location.lat
                  };
            
                var markerSymbol = {
                    type: "simple-marker",
                    outline: {
                        style: "none"
                    },
                    size: 12,
                    color: [255, 0, 0, 1]
                };
            
                var pointGraphic = new Graphic({
                    geometry: point,
                    symbol: markerSymbol
                  });
            
                
                view.graphics.add(pointGraphic)

                

                // view.goTo(pointGraphic);
                // view.zoom = 15;
                // console.log(view.zoom);
                // view.zoom = 2;
                // console.log(view.zoom);

                view.goTo({target: pointGraphic, zoom: 16});
                
                }
                });
            }
        });
    });
});