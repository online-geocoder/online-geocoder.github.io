require([
    "esri/tasks/Locator",
    "esri/Map",
    "esri/views/MapView",
    "esri/widgets/BasemapToggle",
    "dojo/domReady!"
  ], function(Locator, Map,MapView, BasemapToggle) {

    // Create a locator task using the world geocoding service
    const locatorTask = new Locator({
       url: "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer"
    });

    // Create the Map
    const map = new Map({
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
            title: `Reverse geocode: [${lat}, ${lon}]`,
            location: e.mapPoint
        });
    });

    const submitButton = $('#submit-button');
    submitButton.on('click', function(e) {
        // console.log('button clicked');
        
        let addressList = $('#address-in').val();
        // console.log(addressList.split('\n'));

        addressList.split('\n').forEach(function(item) {
            if (item.length > 0) {
                console.log(item);
                let address = {"singleLine": item}
                let params = {address: address};
                locatorTask.addressToLocations(params).then(function(response) {
                    console.log(response);
                }).catch(function(error) {
                    console.log("Error geocoding");
                });
            }
        });
    });
 });