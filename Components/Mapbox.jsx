import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css"; // Import the CSS

mapboxgl.accessToken =
  "pk.eyJ1IjoiamltbXk5NiIsImEiOiJja3k1NTd6cjYwaWd2Mm5wdm9ydndtbmY2In0.I8ineDR8DIBU-Igc6eUVig"; // Your Mapbox access token

const Mapbox = () => {
  const mapContainerRef = useRef(null);
  const hoveredFeatureId = useRef(null); // Use useRef here
  const [geojsonData, setGeojsonData] = useState(null);

  const classifyData = (data) => {
    data.features.forEach((feature) => {
      // Example classification: Add a 'color' property based on 'zoning_code'
      feature.properties.color = getColorByZoningCode(
        feature.properties.zoning_code
      );
    });
    return data;
  };

  const getColorByZoningCode = (zoningCode) => {
    switch (zoningCode) {
      case "P":
        return "#00FF00"; // Green for Public
      case "RH-1":
      case "RH-1(D)":
      case "RH-1(S)":
        return "#0000FF"; // Blue for Residential - House
      case "RM-1":
      case "RM-2":
        return "#FFFF00";
      default:
        return "#888888"; // Default color
    }
  };
  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [-122.4194, 37.7749],
      zoom: 12,
    });

    map.on("load", () => {
      fetch("/all.geojson")
        .then((response) => response.json())
        .then((data) => {
          // Ensure each feature has a unique `id`
          const classifiedData = classifyData(data);
          setGeojsonData(classifiedData);

          console.log(data);
          console.log(geojsonData);

          data.features.forEach((feature, index) => {
            if (!feature.id) {
              feature.id = index.toString(); // Assigning a unique ID to each feature if it doesn't have one
            }
          });

          // Add the processed data as a source to the map
          map.addSource("boundaries", {
            type: "geojson",
            data: data,
          });

          map.addLayer({
            id: "plot-boundary",
            type: "fill",
            source: "boundaries",
            paint: {
              "fill-color": [
                "case",
                ["boolean", ["feature-state", "hover"], false],
                "#FF0000", // Color when hovered
                ["get", "color"], // Use the 'color' property from the feature's properties object
              ],
              "fill-opacity": 0.4,
            },
            filter: ["==", "$type", "Polygon"],
          });

          const popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
          });

          map.on("mouseenter", "plot-boundary", (e) => {
            map.getCanvas().style.cursor = "pointer";
            if (hoveredFeatureId.current) {
              map.setFeatureState(
                { source: "boundaries", id: hoveredFeatureId.current },
                { hover: false }
              );
            }
            hoveredFeatureId.current = e.features[0].id;
            map.setFeatureState(
              { source: "boundaries", id: hoveredFeatureId.current },
              { hover: true }
            );

            const coordinates = e.lngLat;
            const properties = e.features[0].properties;

            // Extract and format the desired properties
            const description = `
    <strong>Plot Name:</strong> ${properties.name || "N/A"}<br>
    <strong>Zoning Code:</strong> ${properties.zoning_code || "N/A"}<br>
    <strong>Zoning District:</strong> ${properties.zoning_district || "N/A"}<br>
    <strong>Block Number:</strong> ${properties.block_num || "N/A"}<br>
    <strong>Lot Number:</strong> ${properties.lot_num || "N/A"}
`;

            popup.setLngLat(coordinates).setHTML(description).addTo(map);
          });

          map.on("mouseleave", "plot-boundary", () => {
            map.getCanvas().style.cursor = "";
            if (hoveredFeatureId.current) {
              map.setFeatureState(
                { source: "boundaries", id: hoveredFeatureId.current },
                { hover: false }
              );
              hoveredFeatureId.current = null;
            }
            popup.remove();
          });
        })
        .catch((error) => {
          console.error("Error fetching GeoJSON data:", error);
        });
    });

    return () => map.remove();
  }, []);

  return (
    <div ref={mapContainerRef} style={{ width: "100vw", height: "100vh" }} />
  );
};

export default Mapbox;
