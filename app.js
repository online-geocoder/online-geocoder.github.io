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

    // Request URLS
    //const requestUrl = 'https://maps.googleapis.com/maps/api/geocode/json?';
    const requestUrl = 'https://maps.googleapis.com/maps/api/place/textsearch/json?';

    // sets key variable from api key input
    let key = 'key=' + $('#api-in').val();

    // updates key variable when new api key is entered in input
    $('#api-in').on('input', function() {
        key = 'key=' + $('#api-in').val()
        $('#gmaps').attr('src', `https://maps.googleapis.com/maps/api/js?${key}&libraries=places`);
        console.log('API ' + key);
    });

    function scrollToBottom() {
        const $textarea = $('#latlon-out');
        $textarea.scrollTop($textarea[0].scrollHeight);
    }

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

    // event listener for submit button
    const submitButton = $('#submit-button');
    submitButton.on('click', function(e) {
        if (key === 'key=') {
            alert("Please enter a valid Google Places API key");
            return;
        }

        let geocodeSpeed = 1000;
        if ($('#showOnMapBox').is(":checked")) {
            geocodeSpeed = 2500;
        }

        $('#latlon-out').val("");
        let addressList = $('#address-in').val();
        let splitAddressList = addressList.split('\n')

        if (view.graphics) view.graphics.items = [];

        let length = addressList.split('\n').length;
        if (addressList.split('\n')[addressList.split('\n').length - 1].length == 0) {
            length--;
        }

        let outputList = [];

        for (let index = 0; index < length; index++) {
            (function (index) {
                setTimeout(function () {

                    if (index > 250) geocodeSpeed = 3000;

                    if (index % 50 == 0) {
                        console.log(`Geocode speed: ${geocodeSpeed / 1000} second(s)`)
                        //console.log(geocodeSpeed * (index * 2))
                    }

                    let item = splitAddressList[index];
                    if (item.length > 0) {
                        service = new google.maps.places.PlacesService($('#service-helper').get(0));
                        service.findPlaceFromQuery({query: item, fields: ['formatted_address', 'geometry']}, callback)

                        function callback(results, status) { 
                            let good = false;
                            let data = '';
                            if (status == 'OK') {
                                good = true;
                                data = results[0]; 
                            }

                                $('#complete').text(`${index + 1} / ${length} Complete`);

                                let output = '';

                                if (status == "OVER_QUERY_LIMIT") {
                                    let outText = $('#latlon-out');
                                    outputList[index] = 'OVER_QUERY_LIMIT' + ',' + item;
                                    //outText.val(outText.val() + 'OVER_QUERY_LIMIT' + ',' + item + '\n');
                                } 
                                else if (!good) {
                                    let outText = $('#latlon-out');
                                    outputList[index] = 'ERROR' + ',' + item;
                                    //outText.val(outText.val() + 'ERROR' + ',' + item + '\n');
                                }
                                else {
                                    output += data.geometry.location.lat() + ',';
                                    output += data.geometry.location.lng() + ',';
                                    //output += data.geometry.location_type + ',';
                                    output += data.formatted_address.split(',').join(' ');

                                    let outText = $('#latlon-out');
                                    outputList[index] = output;
                                }            

                                $('#latlon-out').val(outputList.join('\n').trim());
                                scrollToBottom();
            
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

                                    if (index + 1 == length && $('#showOnMapBox').is(":checked")) {
                                        setTimeout(function() {
                                            view.goTo({target: view.graphics}, {duration: 3000}).then(function(){
                                                view.zoom -= 1
                                            });
                                        }, 2000)
                                    }
                                }
                            }
                        } 
                        //console.log(geocodeSpeed * index);
                }, geocodeSpeed * index);
                        //}, geocodeSpeed * (index * 2));
                    })(index);
                };
    });
});