document.addEventListener('DOMContentLoaded', function () {
    // Initialize the map
    const dayLayer = new ol.layer.Tile({
        source: new ol.source.OSM()
    });

    // Night map (Dark style)
    const nightLayer = new ol.layer.Tile({
        source: new ol.source.XYZ({
            url: 'https://api.maptiler.com/maps/basic-v2-dark/{z}/{x}/{y}.png?key=o9vtWR6YLIyqpNKuSpkH' // Stamen Toner dark map style
        })
    });

    const map = new ol.Map({
        target: 'map',
        layers: [dayLayer], // Default to day map
        view: new ol.View({
            center: ol.proj.fromLonLat([35.0, 39.0]), // Center of Turkey
            zoom: 6.5
        })
    });

    // Vector layer for markers
    var markersLayer = new ol.layer.Vector({
        source: new ol.source.Vector(),
        id: 'markersLayer'
    });
    map.addLayer(markersLayer);

    // Create a pop-up overlay
    var popup = new ol.Overlay({
        element: document.getElementById('popup'),
        positioning: 'bottom-center',
        stopEvent: false,
        offset: [0, -15]
    });
    map.addOverlay(popup);

    // Default black and white styles
    const blackMarkerStyle = new ol.style.Style({
        image: new ol.style.Icon({
            anchor: [0.5, 1],
            anchorXUnits: 'fraction',
            anchorYUnits: 'fraction',
            src: 'pics/BlackMarker.png',
            scale: 0.2
        })
    });

    const whiteMarkerStyle = new ol.style.Style({
        image: new ol.style.Icon({
            anchor: [0.5, 1],
            anchorXUnits: 'fraction',
            anchorYUnits: 'fraction',
            src: 'pics/WhiteMarker.png',
            scale: 0.1
        })
    });

    // Default line and polygon styles
    const blackLineStyle = new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: '#2d2d2d',
            width: 2
        })
    });

    const whiteLineStyle = new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: '#ffffff',
            width: 2
        })
    });

    const blackPolygonStyle = new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: '#2d2d2d',
            width: 2
        }),
        fill: new ol.style.Fill({
            color: 'rgba(210, 210, 210, 0.4)' // Semi-transparent fill
        })
    });

    const whitePolygonStyle = new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: '#ffffff',
            width: 2
        }),
        fill: new ol.style.Fill({
            color: 'rgba(0, 0, 0, 0.4)' // Semi-transparent fill
        })
    });

    // Current theme (default to day)
    let currentTheme = 'day';

    // Function to add markers and other geometries
    function addFeature(coordinates, name, id, type) {
        let feature;

        if (type === 'Point') {
            feature = new ol.Feature({
                geometry: new ol.geom.Point(ol.proj.fromLonLat(coordinates)),
                name: name,
                id: id
            });
            feature.set('wkt', `POINT (${coordinates[0]} ${coordinates[1]})`);
            const featureStyle = currentTheme === 'day' ? blackMarkerStyle : whiteMarkerStyle;
            feature.setStyle(featureStyle);
            markersLayer.getSource().addFeature(feature);

        } else if (type === 'LineString') {
            feature = new ol.Feature({
                geometry: new ol.geom.LineString(coordinates.map(coord => ol.proj.fromLonLat(coord))),
                name: name,
                id: id
            });
            feature.set('wkt', `LINESTRING (${coordinates.map(coord => coord.join(' ')).join(', ')})`);
            const lineStringStyle = currentTheme === 'day' ? blackLineStyle : whiteLineStyle;
            feature.setStyle(lineStringStyle);
            markersLayer.getSource().addFeature(feature);

        } else if (type === 'Polygon') {
            feature = new ol.Feature({
                geometry: new ol.geom.Polygon([coordinates.map(coord => ol.proj.fromLonLat(coord))]),
                name: name,
                id: id
            });
            feature.set('wkt', `POLYGON ((${coordinates.map(coord => coord.join(' ')).join(', ')}))`);
            const polygonStyle = currentTheme === 'day' ? blackPolygonStyle : whitePolygonStyle;
            feature.setStyle(polygonStyle);
            markersLayer.getSource().addFeature(feature);
        }
    }

    // Function to switch themes (day/night)
    document.getElementById('toggleThemeBtn').addEventListener('click', function () {
        const currentLayer = map.getLayers().getArray()[0];

        if (currentLayer === dayLayer) {
            // Switch to night mode
            map.getLayers().setAt(0, nightLayer);
            currentTheme = 'night';  // Update theme
            document.getElementById('toggleThemeBtn').textContent = 'Day Mode';

        } else {
            // Switch to day mode
            map.getLayers().setAt(0, dayLayer);
            currentTheme = 'day';  // Update theme
            document.getElementById('toggleThemeBtn').textContent = 'Night Mode';
        }

        // Update the style of markers and other geometries based on the theme
        updateFeaturesStyle();
    });

    // Update the style of all existing features
    function updateFeaturesStyle() {
        const features = markersLayer.getSource().getFeatures();
        features.forEach(feature => {
            let newStyle;

            switch (feature.getGeometry().getType()) {
                case 'Point':
                    newStyle = currentTheme === 'day' ? blackMarkerStyle : whiteMarkerStyle;
                    break;
                case 'LineString':
                    newStyle = currentTheme === 'day' ? blackLineStyle : whiteLineStyle;
                    break;
                case 'Polygon':
                    newStyle = currentTheme === 'day' ? blackPolygonStyle : whitePolygonStyle;
                    break;
            }

            feature.setStyle(newStyle);
        });
    }

    function deleteFeature(id) {
        const source = markersLayer.getSource();
        const features = source.getFeatures();
        const idStr = String(id);
    
        // Find and remove the feature by ID
        const featureToRemove = features.find(feature => String(feature.get('id')) === idStr);
    
        if (featureToRemove) {
            source.removeFeature(featureToRemove);
            
            source.clear();
            loadGeometries();
            loadPoints();

            // Optionally, refresh the layer or the map if needed
            // For example, if you use `ol.layer.Vector`, you might need to call `source.refresh()` or similar methods depending on the setup.
        } else {
            console.error(`Feature with ID ${id} not found.`);
        }
    }

    // Create Select interaction
    const selectInteraction = new ol.interaction.Select({
        layers: [markersLayer]  // Selection can only be made on markersLayer.
    });

    // Add interaction to the map
    map.addInteraction(selectInteraction);

    // Event triggered when a feature is selected
    selectInteraction.on('select', function (event) {
        const selectedFeatures = event.selected;

        if (selectedFeatures.length > 0) {
            const feature = selectedFeatures[0]; // The first selected feature
            const wkt = feature.get('wkt'); // Get WKT format
            const id = feature.get('id');
            const name = feature.get('name');
            const geometry = feature.getGeometry();
            const geometryType = geometry.getType(); // Get geometry type

            // Function to truncate WKT
            function truncateWKT(wkt, maxLength = 100) {
                if (wkt.length > maxLength) {
                    return wkt.slice(0, maxLength - 3) + '...'; // Truncate by adding '...'
                }
                return wkt;
            }

            // Show WKT in the popup
            document.getElementById('wkt').textContent = truncateWKT(wkt || 'N/A');
            document.getElementById('name').textContent = name || 'Unknown';
            document.getElementById('popup-id').textContent = id || 'N/A';

            // Show coordinates only for Point geometry
            if (geometryType === 'Point') {
                const coords = wkt.match(/POINT\s*\(\s*([\d.]+)\s+([\d.]+)\s*\)/);
                if (coords) {
                    const pointX = parseFloat(coords[1]);
                    const pointY = parseFloat(coords[2]);

                    // Show X and Y coordinates in the popup
                    document.getElementById('x-coord').textContent = pointX.toFixed(4);
                    document.getElementById('y-coord').textContent = pointY.toFixed(4);
                    document.getElementById('x-coord-container').style.display = 'block';
                    document.getElementById('y-coord-container').style.display = 'block';

                } else {
                    console.error('Invalid WKT format for POINT geometry.');
                    document.getElementById('x-coord-container').style.display = 'none';
                    document.getElementById('y-coord-container').style.display = 'none';
                }
            } else {
                // Hide X and Y for other geometries
                document.getElementById('x-coord-container').style.display = 'none';
                document.getElementById('y-coord-container').style.display = 'none';
            }

            // Show popup at an appropriate location
            let popupPosition;

            if (geometryType === 'Point') {
                popupPosition = geometry.getCoordinates();
            } else if (geometryType === 'LineString') {
                const coords = geometry.getCoordinates();
                const numCoords = coords.length;
                const avgX = coords.reduce((sum, coord) => sum + coord[0], 0) / numCoords;
                const avgY = coords.reduce((sum, coord) => sum + coord[1], 0) / numCoords;
                popupPosition = [avgX, avgY];
            } else if (geometryType === 'Polygon') {
                const coords = geometry.getCoordinates()[0]; // Outer ring
                const numCoords = coords.length;
                const avgX = coords.reduce((sum, coord) => sum + coord[0], 0) / numCoords;
                const avgY = coords.reduce((sum, coord) => sum + coord[1], 0) / numCoords;
                popupPosition = [avgX, avgY];
            } else {
                console.error('Unsupported geometry type.');
                return;
            }

            // Show the popup
            popup.setPosition(popupPosition);
            loadPoints();
            loadGeometries();
        } else {
            // Hide the popup if no selection
            popup.setPosition(undefined);
        }
    });

    

    // Modal functionality
    var modal = document.getElementById('updateModal');
    var updateBtn = document.getElementById('updateBtn');
    var span = document.getElementsByClassName('close')[0];
    var updateFromMap = document.getElementById('updateFromMap');
    
    updateBtn.addEventListener('click', function() {
        modal.style.display = 'block'; // Show the modal
    });
    
    span.addEventListener('click', function() {
        modal.style.display = 'none'; // Close the modal
    });
    
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none'; // Close the modal
        }
    });

    document.getElementById('updateFromPanel').addEventListener('click', function () {
        const id = document.getElementById('popup-id').textContent; // Get the feature ID
    
        if (id) {
            // Close the modal
            modal.style.display = 'none';
    
            // Call updateFeature function to open the update panel
            updateGeometries(id, null);  // Passing null for the panel argument for now
        } else {
            console.error('No ID found.');
        }
    });
    
    document.getElementById('deleteBtn').addEventListener('click',function(){
        const id = document.getElementById('popup-id').textContent;

        if (id) {
            // Close the modal
            modal.style.display = 'none';
    
            // Call updateFeature function to open the update panel
            deleteFeature(id);  // Delete the feature
            deleteGeometries(id);
            
        } else {
            console.error('No ID found.');
        }
    });
    
    let selectedFeature = null; // Variable to hold the selected marker

    // Click event for the update button
    updateFromMap.addEventListener('click', function() {
        console.log('Update from map selected');
        modal.style.display = 'none'; // Close the modal
    
        // Remove existing interaction if any
        const existingTranslate = map.getInteractions().getArray().find(interaction => interaction instanceof ol.interaction.Translate);
        if (existingTranslate) {
            map.removeInteraction(existingTranslate);
        }
    
        // Create a collection of features and set up the translate interaction to work only with the selected feature
        const featuresCollection = new ol.Collection(); // Create an empty collection
        const translateInteraction = new ol.interaction.Translate({
            features: featuresCollection // Add the collection to the translate interaction
        });
    
        translateInteraction.on('translateend', function () {
            if (selectedFeature) {
                const newGeometry = selectedFeature.getGeometry();
                const newCoordinates = newGeometry.getCoordinates();
                const coords = ol.proj.toLonLat(newCoordinates);
                const id = selectedFeature.get('id');
                const updatedName = document.getElementById('name').textContent; // Or get from another source
    
                // Get coordinates and geometry type, and combine into WKT format
                let wkt;
                const geometryType = selectedFeature.getGeometry().getType();
    
                if (geometryType === 'Point') {
                    const pointX = coords[0];
                    const pointY = coords[1];
                    wkt = `POINT (${pointX} ${pointY})`;
                } else if (geometryType === 'LineString') {
                    const lineCoords = newCoordinates.map(coord => ol.proj.toLonLat(coord));
                    wkt = `LINESTRING (${lineCoords.map(coord => `${coord[0]} ${coord[1]}`).join(', ')})`;
                } else if (geometryType === 'Polygon') {
                    const ring = newCoordinates[0]; // Assuming the first ring is the outer ring
                    const polygonCoords = ring.map(coord => ol.proj.toLonLat(coord));
                    wkt = `POLYGON ((${polygonCoords.map(coord => `${coord[0]} ${coord[1]}`).join(', ')}))`;
                } else {
                    console.error('Unsupported geometry type.');
                    return;
                }
    
                // Update process with fetch
                fetch('https://localhost:7052/api/Geometry/Update', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        Id: id,
                        Wkt: wkt,          // New coordinates in WKT format
                        Name: updatedName   // Send the updated name
                    })
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok ' + response.statusText);
                        }
                        return response.json();
                    })
                    .then(data => {
                        Swal.fire({
                            icon: 'success',
                            title: 'The Geometry Updated Successfully!',
                            showConfirmButton: true,
                            timer: 1500
                        });
    
                        // Clear the map and reload geometries
                        markersLayer.getSource().clear();
                        loadGeometries();
                        loadPoints();
                    })
                    .catch(error => {
                        Swal.fire({
                            icon: 'error',
                            title: 'An Error occurred!',
                            text: error.message
                        });
                    });
            } else {
                console.error('No feature selected for update.');
            }
    
            // Remove the interaction when translation is complete
            map.removeInteraction(translateInteraction);
            selectedFeature = null; // Reset the selected feature
        });
    
        map.addInteraction(translateInteraction);
    
        // Add click functionality to features
        map.on('click', function(event) {
            const pixel = map.getEventPixel(event.originalEvent);
            const features = map.getFeaturesAtPixel(pixel); // Get the features
    
            if (features.length > 0) {
                const feature = features[0]; // Get the first feature
    
                if (feature && feature.get('id')) {
                    selectedFeature = feature; // Set the selected feature
                    featuresCollection.clear(); // Clear previous features
                    featuresCollection.push(selectedFeature); // Add the selected feature to the collection
                }
            }
        });
    });
    


        // Listen for the form to add a marker
    document.getElementById('saveBtn').addEventListener('click', function () {
        const name = document.getElementById('nameInput').value;
        const id = document.getElementById('idInput').value;
        const x = parseFloat(document.getElementById('xInput').value);
        const y = parseFloat(document.getElementById('yInput').value);
        
        if (!isNaN(x) && !isNaN(y)) {
            addFeature([x, y], name, id, "Point"); // Add new marker
            loadGeometries();
            loadPoints();
        } else {
            console.error('Invalid coordinates.');
        }
    });



    function loadPoints(){
        // Fetch previously marked points
        fetch('https://localhost:7052/api/Geometry/GetAll')
        .then(response => response.json())
        .then(data => {
            if (data.status) {
                data.value.forEach(geometry => {
                    // Convert from WKT format to OpenLayers coordinates
                    const wkt = new ol.format.WKT();
                    const feature = wkt.readFeature(geometry.wkt, {
                        dataProjection: 'EPSG:4326',
                        featureProjection: map.getView().getProjection()
                    });

                    feature.set('wkt', geometry.Wkt); // Add WKT to feature here
                    feature.set('name', geometry.name);
                    feature.set('id', geometry.id);

                    // Add marker to the map
                    const coordinates = ol.proj.toLonLat(feature.getGeometry().getCoordinates());
                    addFeature(coordinates, geometry.name, geometry.id, "Point");
                    
                });
            } else {
                console.error('Failed to retrieve data:', data.message);
            }
        })
        .catch(error => console.error('Error fetching data:', error));
    }
    loadPoints();

    function loadGeometries() {
        // Fetch previously marked geometries
        fetch('https://localhost:7052/api/Geometry/GetAll')
        .then(response => response.json())
        .then(data => {
            if (data.status) {
                data.value.forEach(geometry => {
                    // Convert from WKT format to OpenLayers coordinates
                    const wkt = new ol.format.WKT();
                    const feature = wkt.readFeature(geometry.wkt, {
                        dataProjection: 'EPSG:4326',
                        featureProjection: map.getView().getProjection()
                    });

                    feature.set('wkt', geometry.wkt); // Add WKT to feature here
                    feature.set('name', geometry.name);
                    feature.set('id', geometry.id);

                    // Add geometric shape to the map
                    addFeatureFromGeometry(feature, geometry.name, geometry.id);
                    
                });
            } else {
                console.error('Failed to retrieve data:', data.message);
            }
        })
        .catch(error => console.error('Error fetching data:', error));
    }

    function addFeatureFromGeometry(feature, name, id) {
        const type = feature.getGeometry().getType();
        let coordinates = feature.getGeometry().getCoordinates();

        // Convert coordinates to LonLat format for compatibility
        try {
            if (type === 'Point') {
                coordinates = ol.proj.toLonLat(coordinates);
            } else if (type === 'LineString') {
                coordinates = coordinates.map(coord => ol.proj.toLonLat(coord));
            } else if (type === 'Polygon') {
                coordinates = coordinates[0].map(coord => ol.proj.toLonLat(coord));
            }
        } catch (error) {
            console.error('Error converting coordinates:', error);
            return; // Exit if there's an error
        }

        if (type === 'Point') {
            addFeature(coordinates, name, id, 'Point');
        } else if (type === 'LineString') {
            addFeature(coordinates, name, id, 'LineString');
        } else if (type === 'Polygon') {
            addFeature(coordinates, name, id, 'Polygon');
        }
    }

    loadGeometries();

    // Add Button - Open Geometry Type Modal
    document.getElementById('addBtn').addEventListener('click', function () {
        var modal = document.getElementById('addGeometryModal');
        modal.style.display = 'block';
    });

    // Close Modal
    document.querySelector('.close').addEventListener('click', function () {
        var modal = document.getElementById('addGeometryModal');
        modal.style.display = 'none';
    });

    // Close Modal by clicking outside
    window.onclick = function (event) {
        var modal = document.getElementById('addGeometryModal');
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };

    // Select Point - Start Point Interaction
    document.getElementById('selectPoint').addEventListener('click', function () {
        var modal = document.getElementById('addGeometryModal');
        modal.style.display = 'none'; // Close the modal
        addPointInteraction(); // Start point interaction
    });

    // Select Line String (Currently a placeholder)
    document.getElementById('selectLineString').addEventListener('click', function () {
        var modal = document.getElementById('addGeometryModal');
        modal.style.display = 'none'; // Close the modal
        addLineStringInteraction(); // Start LineString interaction
    });

    // Select Polygon (Currently a placeholder)
    document.getElementById('selectPolygon').addEventListener('click', function () {
        var modal = document.getElementById('addGeometryModal');
        modal.style.display = 'none';
        addPolygonInteraction();
    });

    function addLineStringInteraction() {
        addInteractionActive = true;

        const source = new ol.source.Vector();
        const draw = new ol.interaction.Draw({
            source: source,
            type: 'LineString'
        });

        map.addInteraction(draw);

        // Listen for right-click event
        map.getViewport().addEventListener('contextmenu', function (event) {
            event.preventDefault();  // Prevent browser's right-click menu
            if (addInteractionActive) {
                draw.finishDrawing();  // Complete drawing on right-click
            }
        });

        draw.on('drawend', function (event) {
            addInteractionActive = false;
            map.removeInteraction(draw);

            const coordinates = event.feature.getGeometry().getCoordinates();
            
            // Convert coordinates to correct projection
            const lonLatCoords = coordinates.map(coord => ol.proj.transform(coord, 'EPSG:3857', 'EPSG:4326'));

            // Create WKT format
            const wkt = `LINESTRING (${lonLatCoords.map(coord => coord.join(' ')).join(', ')})`;

            // Create panel
            jsPanel.create({
                headerTitle: 'Add LineString',
                content: `
                    <div class="panel-content">
                        <form id="lineStringForm">
                            <div class="form-group">
                                <label for="wkt">WKT:</label>
                                <textarea id="wkt" name="wkt" readonly>${wkt}</textarea>
                            </div>
                            <div class="form-group">
                                <label for="name">Name:</label>
                                <input type="text" id="name" name="name">
                            </div>
                            <button type="button" id="saveBtn">
                                <i class="fas fa-save"></i> Save
                            </button>
                        </form>
                    </div>
                `,
                headerControls: {
                    close: 'normal',
                    maximize: 'normal',
                    minimize: 'normal', 
                    smallify: 'remove' // Remove smallify button
                },
                callback: function (panel) {
                    panel.querySelector('#saveBtn').addEventListener('click', function () {
                        const name = panel.querySelector('#name').value;

                        fetch('https://localhost:7052/api/Geometry/Add', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                Wkt: wkt,
                                Name: name
                            })
                        })
                        .then(response => response.json())
                        .then(data => {
                            if (data.status) {

                                Swal.fire({
                                    icon: 'success',
                                    title: 'The LineString Added Successfully!',
                                    showConfirmButton: true,
                                    timer: 1500
                                });

                                addFeature(lonLatCoords, name, data.value.id, "LineString");
                                panel.close();
                                resetLSAddInteraction();  // Reset interaction
                                loadGeometries();
                            } else {
                                console.error('Failed to add geometry:', data.message);
                            }
                        })
                        .catch(error => {
                            Swal.fire({
                                icon: 'error',
                                title: 'An Error occurred!',
                                text: error.message
                            });
                        });
                    });

                    panel.querySelector('.jsPanel-btn-maximize')?.addEventListener('click', function () {
                        panel.style.position = 'fixed';
                        panel.style.top = '60px'; // Leave 60px space from top
                        panel.style.left = '0';
                        panel.style.width = 'calc(100vw - 15px)'; // Width of panel excluding right margin
                        panel.style.height = 'calc(100vh - 60px)';
                        panel.style.right = '15px'; // 15px space from right
                        panel.style.overflow = 'hidden'; // Handle overflow with scroll
                    });

                    // Close button functionality
                    panel.querySelector('.jsPanel-btn-close')?.addEventListener('click', function () {
                        panel.close();
                    });
                }
            });
        });
    }

    
    function resetLSAddInteraction() {
        addInteractionActive = false;
        map.getInteractions().forEach(function (interaction) {
            if (interaction instanceof ol.interaction.Draw) {
                map.removeInteraction(interaction);
            }
        });
        map.getTargetElement().style.cursor = ''; // Restore default cursor
    }
    
    function addPolygonInteraction() {
        addInteractionActive = true;
    
        const source = new ol.source.Vector();
        const draw = new ol.interaction.Draw({
            source: source,
            type: 'Polygon'
        });
    
        map.addInteraction(draw);
    
        // Listen for right-click event
        map.getViewport().addEventListener('contextmenu', function (event) {
            event.preventDefault();  // Prevent browser's right-click menu
            if (addInteractionActive) {
                draw.finishDrawing();  // Complete drawing on right-click
            }
        });
    
        draw.on('drawend', function (event) {
            addInteractionActive = false;
            map.removeInteraction(draw);
    
            const coordinates = event.feature.getGeometry().getCoordinates()[0];
            
            // Convert coordinates to the correct projection
            const lonLatCoords = coordinates.map(coord => ol.proj.transform(coord, 'EPSG:3857', 'EPSG:4326'));
    
            // Create WKT format
            const wkt = `POLYGON ((${lonLatCoords.map(coord => coord.join(' ')).join(', ')}))`;
    
            // Create panel
            jsPanel.create({
                headerTitle: 'Add Polygon',
                content: `
                    <div class="panel-content">
                        <form id="polygonForm">
                            <div class="form-group">
                                <label for="wkt">WKT:</label>
                                <textarea id="wkt" name="wkt" readonly>${wkt}</textarea>
                            </div>
                            <div class="form-group">
                                <label for="name">Name:</label>
                                <input type="text" id="name" name="name">
                            </div>
                            <button type="button" id="saveBtn">
                                <i class="fas fa-save"></i> Save
                            </button>
                        </form>
                    </div>
                `,
                headerControls: {
                    close: 'normal',
                    maximize: 'normal',
                    minimize: 'normal',
                    smallify: 'remove' // Remove the smallify button
                },
                callback: function (panel) {
                    panel.querySelector('#saveBtn').addEventListener('click', function () {
                        const name = panel.querySelector('#name').value;
    
                        fetch('https://localhost:7052/api/Geometry/Add', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                Wkt: wkt,
                                Name: name
                            })
                        })
                        .then(response => response.json())
                        .then(data => {
                            if (data.status) {
                                Swal.fire({
                                    icon: 'success',
                                    title: 'The Polygon Added Successfully!',
                                    showConfirmButton: true,
                                    timer: 1500
                                });
    
                                addFeature(lonLatCoords, name, data.value.id, "Polygon");
                                panel.close();
                                resetPolygonAddInteraction();  // Reset interaction
                                loadGeometries();
                            } else {
                                console.error('Failed to add geometry:', data.message);
                            }
                        })
                        .catch(error => {
                            Swal.fire({
                                icon: 'error',
                                title: 'An Error occurred!',
                                text: error.message
                            });
                        });
                    });
                    panel.querySelector('.jsPanel-btn-maximize')?.addEventListener('click', function () {
                        panel.style.position = 'fixed';
                        panel.style.top = '60px'; // Leave 60px space from the top
                        panel.style.left = '0';
                        panel.style.width = 'calc(100vw - 15px)'; // Full width minus right margin
                        panel.style.height = 'calc(100vh - 60px)';
                        panel.style.right = '15px'; // 15px space from the right
                        panel.style.overflow = 'hidden'; // Handle overflow with hidden scroll
                    });
    
                    // Close button functionality
                    panel.querySelector('.jsPanel-btn-close')?.addEventListener('click', function () {
                        panel.close();
                    });
                }
            });
        });
    }
    
    function resetPolygonAddInteraction() {
        addInteractionActive = false;
        map.getInteractions().forEach(function (interaction) {
            if (interaction instanceof ol.interaction.Draw) {
                map.removeInteraction(interaction);
            }
        });
        map.getTargetElement().style.cursor = ''; // Restore default cursor
    }
    
    function addPointInteraction() {
        let addInteractionActive = true;
    
        const source = new ol.source.Vector();
        const draw = new ol.interaction.Draw({
            source: source,
            type: 'Point'
        });
    
        map.addInteraction(draw);
    
        draw.on('drawend', function (event) {
            addInteractionActive = false;
            map.removeInteraction(draw);
    
            const coordinates = ol.proj.toLonLat(event.feature.getGeometry().getCoordinates());
            const xCoord = coordinates[0];
            const yCoord = coordinates[1];
    
            const wkt = `POINT (${xCoord} ${yCoord})`;
    
            jsPanel.create({
                headerTitle: 'Add Point',
                content: `
                    <div class="panel-content">
                        <form id="pointForm">
                            <div class="form-group">
                                <label for="xCoord">X Coordinate:</label>
                                <input type="text" id="xCoord" name="xCoord" value="${xCoord}" readonly>
                            </div>
                            <div class="form-group">
                                <label for="yCoord">Y Coordinate:</label>
                                <input type="text" id="yCoord" name="yCoord" value="${yCoord}" readonly>
                            </div>
                            <div class="form-group">
                                <label for="name">Name:</label>
                                <input type="text" id="name" name="name">
                            </div>
                            <button type="button" id="saveBtn">
                                <i class="fas fa-save"></i> Save
                            </button>
                        </form>
                    </div>
                `,
                headerControls: {
                    close: 'normal',
                    maximize: 'normal',
                    minimize: 'normal', 
                    smallify: 'remove' // Remove the smallify button
                },
                callback: function (panel) {
                    panel.querySelector('#saveBtn').addEventListener('click', function () {
                        const name = panel.querySelector('#name').value;
    
                        fetch('https://localhost:7052/api/Geometry/Add', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                Wkt: wkt,
                                Name: name
                            })
                        })
                        .then(response => response.json())
                        .then(data => {
                            if (data.status) {
                                
                                Swal.fire({
                                    icon: 'success',
                                    title: 'The Point Added Successfully!',
                                    showConfirmButton: true,
                                    timer: 1500
                                });
    
                                addFeature([xCoord, yCoord], name, data.value.id, "Point");
                                panel.close();
                                resetAddInteraction();
                                loadPoints();
                            } else {
                                console.error('Failed to add Point:', data.message);
                            }
                        })
                        .catch(error => {
                            Swal.fire({
                                icon: 'error',
                                title: 'An Error occurred!',
                                text: error.message
                            });
                        });
                        
                    });
                    panel.querySelector('.jsPanel-btn-maximize')?.addEventListener('click', function () {
                        panel.style.position = 'fixed';
                        panel.style.top = '60px'; // Leave 60px space from the top
                        panel.style.left = '0';
                        panel.style.width = 'calc(100vw - 15px)'; // Width is all available width minus right margin
                        panel.style.height = 'calc(100vh - 60px)';
                        panel.style.right = '15px'; // Leave 15px space from the right
                        panel.style.overflow = 'hidden'; // Hide content overflow
                    });
    
                    // Close button functionality
                    panel.querySelector('.jsPanel-btn-close')?.addEventListener('click', function () {
                        panel.close();
                    });
                }
            });
        });
    }
    
    function resetAddInteraction() {
        addInteractionActive = false;
        map.getTargetElement().style.cursor = '';
    }
    
    document.getElementById('queryBtn').addEventListener('click', function () {
        jsPanel.create({
            headerTitle: 'Query Results',
            content: `
                <div class="panel-content">
                    <div class="search-container">
                        <input type="text" id="searchInput" placeholder="Search...">
                    </div>
                    <table id="pointsTable">
                        <thead>
                            <tr>
                                <th>WKT</th>
                                <th>Name</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="tableBody">
                        </tbody>
                    </table>
                </div>
            `,
            headerControls: {
                close: 'normal',
                maximize: 'normal',
                minimize: 'normal',
                smallify: 'remove'
            },
            callback: function (panel) {
                // Fetch data and populate the table
                fetch('https://localhost:7052/api/Geometry/GetAll')
                    .then(response => response.json())
                    .then(data => {
                        if (data.status) {
                            populateTable(data.value, panel);
                        } else {
                            console.error('Failed to retrieve data:', data.message);
                        }
                    })
                    .catch(error => console.error('Error fetching data:', error));
    
    
                panel.style.position = 'fixed';
                panel.style.top = '50%';
                panel.style.left = '50%';
                panel.style.transform = 'translate(-50%, -50%)';
    
                // Make the panel fullscreen
                panel.style.width = '50vw'; // Set panel width to 50% of the viewport width
                panel.style.maxWidth = '100vw'; // Set maximum width to viewport width
                panel.style.maxHeight = '100vh'; // Set maximum height to viewport height
                panel.style.height = '70vh';
                panel.style.overflow = 'hidden'; // Hide scrollbars in the panel
    
                // Search functionality
                const searchInput = panel.querySelector('#searchInput');
                searchInput.addEventListener('input', function () {
                    const searchTerm = searchInput.value.toLowerCase();
                    filterTable(searchTerm, panel);
                });
    
                // Close button functionality
                panel.querySelector('.jsPanel-btn-close')?.addEventListener('click', function () {
                    panel.close();
                });
    
                // Fullscreen functionality
                panel.querySelector('.jsPanel-btn-maximize')?.addEventListener('click', function () {
                    panel.style.position = 'fixed';
                    panel.style.top = '60px'; // Leave 60px space from the top
                    panel.style.left = '0';
                    panel.style.width = 'calc(100vw - 15px)'; // Width is all available width minus right margin
                    panel.style.height = 'calc(100vh - 60px)';
                    panel.style.right = '15px'; // Leave 15px space from the right
                });
            }
        });
    });
    
        // Function to filter the table
    function filterTable(searchTerm, panel) {
        const tableBody = panel.querySelector('#tableBody');
        const rows = tableBody.getElementsByTagName('tr');
        for (let i = 0; i < rows.length; i++) {
            const nameCell = rows[i].getElementsByTagName('td')[1];
            if (nameCell) {
                const name = nameCell.textContent.toLowerCase();
                if (name.includes(searchTerm)) {
                    rows[i].style.display = ''; // Show if search term is found
                } else {
                    rows[i].style.display = 'none'; // Hide if search term is not found
                }
            }
        }
    }

    function populateTable(points, panel) {
        const tableBody = panel.querySelector('#tableBody');
        tableBody.innerHTML = '';

        points.forEach(point => {
            // Shorten the WKT format
            let wkt = point.wkt;  // Get the WKT data from point.wkt field
            if (wkt.length > 103) {  // Desired maximum length
                wkt = wkt.substring(0, 100) + '...';  // Shorten and add ellipsis
            }

            const row = document.createElement('tr');

            row.innerHTML = `
                <td class="table-cell">${wkt}</td>
                <td>${point.name}</td>
                <td>
                    <button class="updateBtn" data-id="${point.id}">Update</button>
                    <button class="showBtn" data-id="${point.id}">Show</button>
                    <button class="deleteBtn" data-id="${point.id}">Delete</button>
                </td>
            `;

            tableBody.appendChild(row);
        });

        // Add functionality to buttons
        panel.querySelectorAll('.deleteBtn').forEach(button => {
            button.addEventListener('click', function () {
                const id = this.getAttribute('data-id');
                deleteFeature(id);
                deleteGeometries(id, panel);
                loadGeometries();
                loadPoints();
            });
        });

        panel.querySelectorAll('.updateBtn').forEach(button => {
            button.addEventListener('click', function () {
                const id = this.getAttribute('data-id');
                updateGeometries(id, panel);
            });
        });

        panel.querySelectorAll('.showBtn').forEach(button => {
            button.addEventListener('click', function () {
                const id = this.getAttribute('data-id');
                showGeometries(id, panel);
            });
        });
    }

    function deleteGeometries(id, panel) {
        fetch(`https://localhost:7052/api/Geometry/Delete/${id}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            Swal.fire({
                icon: 'success',
                title: 'The Geometry Deleted Successfully!',
                showConfirmButton: true,
                timer: 1500
            });
            deleteFeature(id);
            loadGeometries();
            loadPoints();
            // Close the panel
            if (panel) {
                panel.close();
            }
            
        })
        .catch(error => {
            Swal.fire({
                icon: 'error',
                title: 'An Error occurred!',
                text: error.message
            });
        });
    }

    function updateGeometries(id, panel) {
        // Close existing panel if any
        if (panel) {
            panel.close();
        }

        // Get the point with the relevant ID
        fetch(`https://localhost:7052/api/Geometry/GetById/${id}`)
            .then(response => response.json())
            .then(data => {
                if (data.status) {
                    const point = data.value;

                    // Get the data in WKT format
                    const wkt = point.wkt;

                    // Create a new panel and fill in the update form
                    jsPanel.create({
                        headerTitle: 'Update Geometry',
                        content: `
                            <div class="panel-content">
                                <form id="updateForm">
                                    <div class="form-group">
                                        <label for="updateWKT">WKT:</label>
                                        <textarea id="updateWKT" name="updateWKT" readonly class="form-control">${wkt}</textarea>
                                    </div>
                                    <div class="form-group">
                                        <label for="updateName">Name:</label>
                                        <input type="text" id="updateName" name="updateName" value="${point.name}">
                                    </div>
                                    <button type="button" id="updateSaveBtn">
                                        <i class="fas fa-save"></i> Update
                                    </button>
                                </form>
                            </div>
                        `,
                        headerControls: {
                            close: 'normal',
                            maximize: 'normal',
                            minimize: 'normal',
                            smallify: 'remove'
                        },
                        callback: function (newPanel) {
                            newPanel.querySelector('#updateSaveBtn').addEventListener('click', function () {
                                const updatedName = newPanel.querySelector('#updateName').value;
                                const updatedWKT = newPanel.querySelector('#updateWKT').value;  // Get the WKT format

                                // Send request to update the data
                                fetch('https://localhost:7052/api/Geometry/Update', {
                                    method: 'PUT',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                        Id: id,
                                        WKT: updatedWKT, // Send updated data in WKT format
                                        Name: updatedName
                                    })
                                })
                                .then(response => response.json())
                                .then(data => {
                                    Swal.fire({
                                        icon: 'success',
                                        title: 'The Geometry Updated Successfully!',
                                        showConfirmButton: true,
                                        timer: 1500
                                    });
                                    newPanel.close(); // Close the panel after update
                                    loadGeometries();
                                    loadPoints();
                                })
                                .catch(error => {
                                    Swal.fire({
                                        icon: 'error',
                                        title: 'An Error occurred!',
                                        text: error.message
                                    });
                                });
                            });

                            // Perform action if the panel is closed
                            newPanel.querySelector('.jsPanel-btn-maximize')?.addEventListener('click', function () {
                                newPanel.style.position = 'fixed';
                                newPanel.style.top = '60px'; // Leave 60px space from the top
                                newPanel.style.left = '0';
                                newPanel.style.width = 'calc(100vw - 15px)'; // Width excluding the right margin
                                newPanel.style.height = 'calc(100vh - 60px)';
                                newPanel.style.right = '15px'; // 15px space from the right
                                newPanel.style.overflow = 'hidden'; // Handle content overflow
                            });
                        }
                    });
                } else {
                    console.error('Failed to fetch point data:', data.message);
                }
            })
            .catch(error => console.error('Error fetching point data:', error));
    }

    function showGeometries(id, panel) {
        fetch(`https://localhost:7052/api/Geometry/GetById/${id}`)
            .then(response => response.json())
            .then(point => {
                if (point.status) {
                    const wkt = point.value.wkt;
                    const type = wkt.split(' ')[0]; // The first word of the WKT is the geometry type

                    if (type === 'POINT') {
                        // Process for POINT geometry
                        const coords = wkt.match(/\(([^)]+)\)/)[1].split(' ');
                        const xCoord = parseFloat(coords[0]);
                        const yCoord = parseFloat(coords[1]);

                        // Convert to appropriate map projection and display
                        const coordinates = ol.proj.fromLonLat([xCoord, yCoord]);
                        map.getView().animate({
                            center: coordinates,
                            duration: 2000, // Animation duration
                            zoom: 11 // Set zoom level
                        });

                    } else if (type === 'LINESTRING') {
                        // Process for LINESTRING geometry
                        const coords = wkt.match(/\(([^)]+)\)/)[1].split(',').map(coord => {
                            const [x, y] = coord.trim().split(' ');
                            return [parseFloat(x), parseFloat(y)];
                        });

                        // Find the average of X and Y coordinates (true geometric center)
                        const centerX = coords.reduce((sum, coord) => sum + coord[0], 0) / coords.length;
                        const centerY = coords.reduce((sum, coord) => sum + coord[1], 0) / coords.length;

                        // Convert the center point to projection and focus on the map
                        const middleLonLat = ol.proj.fromLonLat([centerX, centerY]);
                        map.getView().animate({
                            center: middleLonLat,
                            duration: 2000,
                            zoom: 7.5 // Set zoom level
                        });

                    } else if (type === 'POLYGON') {
                        // Process for POLYGON geometry
                        const coords = wkt.match(/\(\(([^)]+)\)\)/)[1].split(',').map(coord => {
                            const [x, y] = coord.trim().split(' ');
                            return [parseFloat(x), parseFloat(y)];
                        });

                        // Find the center of the polygon (average coordinates)
                        const centerX = coords.reduce((sum, coord) => sum + coord[0], 0) / coords.length;
                        const centerY = coords.reduce((sum, coord) => sum + coord[1], 0) / coords.length;

                        // Convert the center point to projection and focus on the map
                        const centerLonLat = ol.proj.fromLonLat([centerX, centerY]);
                        map.getView().animate({
                            center: centerLonLat,
                            duration: 2000,
                            zoom: 8 // Set zoom level
                        });
                    }
                } else {
                    console.error('Failed to fetch point data:', point.message);
                }
            })
            .catch(error => console.error('Error fetching point data:', error));
    }

});
