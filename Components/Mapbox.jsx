import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken =
  "pk.eyJ1IjoiamltbXk5NiIsImEiOiJja3k1NTd6cjYwaWd2Mm5wdm9ydndtbmY2In0.I8ineDR8DIBU-Igc6eUVig";

const Mapbox = () => {
  const mapContainerRef = useRef(null);
  const hoveredFeatureId = useRef(null);
  const [geojsonData, setGeojsonData] = useState(null);

  const classifyData = (data) => {
    data.features.forEach((feature) => {
      feature.properties.color = getColorByZoningCode(
        feature.properties.zoning_code
      );
    });
    return data;
  };

  const getColorByZoningCode = (zoningCode) => {
    switch (zoningCode) {
      case "P":
        return "#00FF00";
      case "RH-1":
      case "RH-1(D)":
      case "RH-1(S)":
        return "#0000FF";
      case "RM-1":
      case "RM-2":
        return "#FFFF00";
      default:
        return "#888888";
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
          const classifiedData = classifyData(data);
          setGeojsonData(classifiedData);

          data.features.forEach((feature, index) => {
            if (!feature.id) {
              feature.id = index.toString();
            }
          });

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
                "#FF0000",
                ["get", "color"],
              ],
              "fill-opacity": 0.4,
            },
            filter: ["==", "$type", "Polygon"],
          });

          const popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
          });

          let clickedFeatureId = null;

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
            console.log(properties);

            const description = `
              <div class="p-2 bg-black text-white">
                <strong class="p-2 mt-2">Plot Name:</strong> ${
                  properties.name || "N/A"
                }<br>
                <strong class="p-2 mt-2">Zoning Code:</strong> ${
                  properties.zoning_code || "N/A"
                }<br>
                <strong class="p-2 mt-2">Zoning District:</strong> ${
                  properties.zoning_district || "N/A"
                }<br>
                <strong class="p-2 mt-2">Block Number:</strong> ${
                  properties.block_num || "N/A"
                }<br>
                <strong class="p-2 mt-2">Lot Number:</strong> ${
                  properties.lot_num || "N/A"
                }<br>
                <strong class="p-2 mt-2">property value:</strong> ${
                  properties.property_value || "N/A"
                }

    <button class="p-2 mt-4 text-blue-400" onclick="window.open('/property/${
      properties.id
    }', '_blank')">
    go to page</button> 
              </div>
            `;

            popup.setLngLat(coordinates).setHTML(description).addTo(map);
          });

          map.on("click", "plot-boundary", (e) => {
            if (clickedFeatureId !== null) {
              map.setFeatureState(
                { source: "boundaries", id: clickedFeatureId },
                { hover: false }
              );
            }

            clickedFeatureId = e.features[0].id;
            map.setFeatureState(
              { source: "boundaries", id: clickedFeatureId },
              { hover: true }
            );

            const coordinates = e.lngLat;
            const properties = e.features[0].properties;

            const description = `
            <div class="p-2 bg-black text-white">
    <strong class="p-2 mt-2">Plot Name:</strong> ${properties.name || "N/A"}<br>
    <strong class="p-2 mt-2">Zoning Code:</strong> ${
      properties.zoning_code || "N/A"
    }<br>
    <strong class="p-2 mt-2">Zoning District:</strong> ${
      properties.zoning_district || "N/A"
    }<br>
    <strong class="p-2 mt-2">Block Number:</strong> ${
      properties.block_num || "N/A"
    }<br>
    <strong class="p-2 mt-2">Lot Number:</strong> ${
      properties.lot_num || "N/A"
    }<br>
    <strong class="p-2 mt-2">property value:</strong> ${
      properties.property_value || "N/A"
    }<br>

    <button class="p-2 mt-4 text-blue-400" onclick="window.open('/property/${
      properties.id
    }', '_blank')">
 go to page</button> 
    <br>
      </div>
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
          });

          map.on("click", (e) => {
            const features = map.queryRenderedFeatures(e.point, {
              layers: ["plot-boundary"],
            });

            if (!features.length && clickedFeatureId !== null) {
              map.setFeatureState(
                { source: "boundaries", id: clickedFeatureId },
                { hover: false }
              );
              clickedFeatureId = null;
              popup.remove();
            }
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
