# Mini Amsterdam 3D

Mini Amsterdam 3D is a 3D visualization project that displays real-time data for trains, buses, and flights in Amsterdam. This project uses Mapbox GL JS for rendering the map and Three.js for rendering 3D objects.

## Features

- Real-time train, bus, and flight data visualization
- Interactive 3D map of Amsterdam
- Weather data integration from KNMI
- Search functionality for stations and bus stops
- Customizable map controls

## Getting Started

### Prerequisites

- Node.js
- npm (Node Package Manager)
- Mapbox access token
- KNMI API key

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/mini-amsterdam-3d.git
   cd mini-amsterdam-3d
   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your Mapbox access token and KNMI API key:

   ```env
   MAPBOX_ACCESS_TOKEN=your-mapbox-access-token
   KNMI_API_KEY=your-knmi-api-key
   ```

4. Start the development server:

   ```bash
   npm start
   ```

5. Open your browser and navigate to `http://localhost:3000`.

## Usage

### Map Controls

- **Zoom In/Out**: Use the zoom controls on the map or scroll with your mouse.
- **Fullscreen**: Toggle fullscreen mode using the fullscreen control.
- **Search**: Use the search control to find stations and bus stops.
- **Underground Mode**: Toggle underground mode to view underground train lines.
- **Real-time Mode**: Toggle real-time mode to switch between real-time and static data.
- **Weather**: Toggle weather data visualization.

### Data Sources

- **Train Data**: Real-time train data is fetched from the 9292 API.
- **Bus Data**: Real-time bus data is fetched from the 9292 API.
- **Flight Data**: Real-time flight data is fetched from the KNMI API.
- **Weather Data**: Weather data is fetched from the KNMI API.

## Contributing

Contributions are welcome! Please read the [contributing guidelines](CONTRIBUTING.md) for more information.

## License

This project is licensed under the Apache License, Version 2.0. See the [LICENSE](LICENSE) file for details.

## Acknowledgements

- [Mapbox GL JS](https://www.mapbox.com/mapbox-gl-js)
- [Three.js](https://threejs.org)
- [KNMI](https://www.knmi.nl)
- [9292 API](https://9292.nl)
