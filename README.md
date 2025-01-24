# Mini Amsterdam 3D Digital Twin

## Introduction
Welcome to the Mini Amsterdam 3D Digital Twin project! This project is inspired by [Mini Tokyo 3D](https://minitokyo3d.com/) and aims to visualize real-time fleet management in a 3D digital twin of Amsterdam.

## Technical Setup
We used the following technologies to build this project:
- **Google Maps API**: For map rendering
- **Deck.gl**: For 3D visualization
- **ScenegraphLayer**: For rendering 3D models
- **PathLayer**: For route visualization
- **Google Maps Directions API**: For fetching transit routes

## Features
- **Real-time Animation**: Vehicles follow predefined and transit routes, with dynamic camera tracking.
- **Layer Control**: Toggle visibility of paths, transit, and traffic layers.
- **Model Customization**: Different 3D models for trucks, trams, buses, and metro, with manual size control.

## Setup Instructions
1. Clone the repository:
   ```bash
   git clone https://github.com/AzyAli/mini-amsterdam-3d.git
   cd mini-amsterdam-3d/APP/website/google-3d
   ```

Note that this example demonstrates using deck.gl with Google Maps. For other base map options, visit the project templates in [get-started](/examples/get-started).


### Usage

To run this example, you need a [Google Maps API key](https://developers.google.com/maps/documentation/javascript/get-api-key) and a [Google Maps Map ID](https://developers.google.com/maps/documentation/javascript/webgl) for a map that is configured to use the Vector rendering mode. You can either set an environment variables:

```bash
export GoogleMapsAPIKey=<google_maps_api_key>
export GoogleMapsMapId=<google_maps_map_id>
```

Or set the `GOOGLE_MAPS_API_KEY` and `GOOGLE_MAPS_MAP_ID` variables in `app.js`.

```bash
# install dependencies
npm install
# or
yarn
# bundle and serve the app with vite
npm start
```

### Data Source

3D model is based on "Low Poly Truck" (https://sketchfab.com/3d-models/low-poly-truck-98826ebd44e2492298ac925461509216) by Arifido._ (https://sketchfab.com/Arifido._) licensed under CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/).


To build your own application with deck.gl and Google Maps, check out the [documentation of @deck.gl/google-maps module](../../../docs/api-reference/google-maps/overview.md)
