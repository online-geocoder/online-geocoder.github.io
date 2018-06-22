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

    const requestUrl = 'https://maps.googleapis.com/maps/api/geocode/json?address='
    let key = '&key=' + $('#api-in').val();

    $('#api-in').on('input', function() {
        key = '&key=' + $('#api-in').val()
        //console.log(key);
    });

    // Handles map logic that shows lat, lon and address on click in map
    view.on('click', function(e) {
        // prevents event bubbling
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

    const submitButton = $('#submit-button');
    submitButton.on('click', function(e) {
        //console.log(key);

        let geocodeSpeed = 0;
        if ($('#showOnMapBox').is(":checked")) {
            geocodeSpeed = 2000;
        }
        //console.log(geocodeSpeed);

        $('#latlon-out').val("");
        let addressList = $('#address-in').val();

        //console.log(view.graphics.items);
        if (view.graphics) view.graphics.items = [];

        let length = addressList.split('\n').length;
        if (addressList.split('\n')[addressList.split('\n').length - 1].length == 0) {
            length--;
        }
        //console.log(length);
        let currentNum = 1;
        addressList.split('\n').forEach(function(item, index) {
            if (item.length > 0) {              
                let address = requestUrl + item + key;
                
                $.ajax({url: address, async: false, success: data => {
                    setTimeout( () => { 
                        $('#complete').text(`${currentNum} / ${length} Complete`);
                        currentNum += 1;
                        //console.log(currentNum);

                        let output = '';

                        if (data.status == "OVER_QUERY_LIMIT") {
                            let outText = $('#latlon-out');
                            outText.val(outText.val() + 'OVER_QUERY_LIMIT' + ',' + item + '\n');
                        } else {
                            output += data.results[0].geometry.location.lat + ',';
                            output += data.results[0].geometry.location.lng + ',';
                            output += data.results[0].geometry.location_type + ',';
                            output += data.results[0].formatted_address;
                            //output += data.results[0].formatted_address.split(',').join(' ');

                            let outText = $('#latlon-out');
                            outText.val(outText.val() + output + '\n');
                        }            

                        //let point = {type: 'point', latitude: data.results[0].geometry.location.lat, longitude: data.results[0].geometry.location.lng};
                        if ($('#showOnMapBox').is(":checked")) {
                            const point = {
                                type: "point",
                                longitude: data.results[0].geometry.location.lng,
                                latitude: data.results[0].geometry.location.lat
                            };
                        
                            const markerSymbol = {
                                type: "simple-marker",
                                outline: {
                                    style: "none"
                                },
                                size: 12,
                                color: [255, 0, 0, 1]
                            };
                        
                            const pointGraphic = new Graphic({
                                geometry: point,
                                symbol: markerSymbol
                            });
                        
                            view.graphics.add(pointGraphic)
                            view.goTo({target: pointGraphic, zoom: 15});
                        }
                        }, index * geocodeSpeed);
                    }
                });
            }
        });
    });
});