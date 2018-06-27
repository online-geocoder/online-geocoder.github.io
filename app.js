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

    //const requestUrl = 'https://maps.googleapis.com/maps/api/geocode/json?';
    const requestUrl = 'https://maps.googleapis.com/maps/api/place/textsearch/json?';
    let key = 'key=' + $('#api-in').val();

    $('#api-in').on('input', function() {
        key = 'key=' + $('#api-in').val()
        $('#gmaps').attr('src', `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`);
        //console.log($('#gmaps').attr('src'));
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
        let index = 0;
        let currentNum = 1;
        let outputList = {};
        addressList.split('\n').forEach(function(item, index) {
            if (item.length > 0) {         

                index += 1;
                let address = encodeURI(requestUrl + key + '&query=' + (item).replace('&', '%26'));
                //let address = encodeURI(requestUrl + key + '&address=' + (item).replace('&', '%26'));
                
                //console.log(address);

                //console.log($('#service-helper'))
                service = new google.maps.places.PlacesService($('#service-helper').get(0));
                service.findPlaceFromQuery({query: item, fields: ['formatted_address', 'geometry']}, (results, status) => {
                    //console.log(results);
                    console.log(status);

                    //console.log(results[0]);
                    let good = false;
                    let data = '';
                    console.log(results !== null, item);
                    if (results !== null) {
                        good = true;
                        data = results[0]; 
                        console.log(data);
                    }

                    
                
                // $.ajax({url: address, crossDomain: true, xhrFields: {withCredentials: true}, headers: {"Access-Control-Allow-Origin": true}, async: false, success: data => {
                    setTimeout( () => { 
                        $('#complete').text(`${currentNum} / ${length} Complete`);
                        currentNum += 1;
                        //console.log(currentNum);

                        let output = '';

                        if (!good) {
                            let outText = $('#latlon-out');
                            outputList[index] = good + ',' + 'ERROR' + ',' + item;
                            //outText.val(outText.val() + 'ERROR' + ',' + item + '\n');
                        }
                        else if (status == "OVER_QUERY_LIMIT") {
                            let outText = $('#latlon-out');
                            outputList[index] = good + ',' + 'OVER_QUERY_LIMIT' + ',' + item;
                            //outText.val(outText.val() + 'OVER_QUERY_LIMIT' + ',' + item + '\n');
                        } 
                        else {
                            //console.log(data);
                            output += data.geometry.location.lat() + ',';
                            output += data.geometry.location.lng() + ',';
                            //output += data.geometry.location_type + ',';
                            output += data.formatted_address.split(',').join(' ');

                            let outText = $('#latlon-out');
                            outputList[index] = good + ',' + output;
                            //outText.val(outText.val() + output + '\n');
                        }            

                        //let point = {type: 'point', latitude: data.results[0].geometry.location.lat, longitude: data.results[0].geometry.location.lng};
                        if ($('#showOnMapBox').is(":checked")) {
                            const point = {
                                type: "point",
                                longitude: data.geometry.location.lng(),
                                latitude: data.geometry.location.lat()
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
                   // }
                });
            }
        });
        //console.log(outputList);
    });
});