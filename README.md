# Route Planner Frontend

## Overview

The Route Planner Frontend is a web application that enables users to calculate routes between a starting point and a destination, displaying points of interest (POIs) along the way. Users can also listen to audio descriptions of select locations.

## Features

- **Route Calculation:** Input a starting location and destination to compute the optimal route.
- **Points of Interest Display:** View notable locations along the route with relevant details.
- **Audio Playback:** Listen to descriptions of select POIs.
- **Interactive Map:** Visual representation of routes and POIs using a mapping service.
- **Responsive Design:** Optimized for various devices and screen sizes.

## Technologies Used

- **Frontend Framework:** Next.js (React-based framework)
- **TypeScript:** For type-safe JavaScript development
- **Styling:** Tailwind CSS
- **Mapping Library:** (Specify the mapping service used, e.g., Google Maps API or Mapbox)
- **State Management:** (Specify if using Context API, Redux, or other state management libraries)
- **API Integration:** Communication with the backend Flask API

## Demo

1. Add the start and end destination:

![2025-03-0122-32-34-ezgif com-video-to-gif-converter](https://github.com/user-attachments/assets/9a5b24cf-6ac5-4a90-9aec-33201e65470a)

2. Choose which landmarks/point of interests you want to learn more about

![2025-03-0122-32-34-ezgif com-video-to-gif-converter (1)](https://github.com/user-attachments/assets/2cb695d5-f352-40cb-a025-ebf6dbb3c42d)

3. Listen about the historical impact and description of the landmark/point of interests

![2025-03-0122-32-34-ezgif com-video-to-gif-converter (2)](https://github.com/user-attachments/assets/430db20f-4e26-49bf-9757-fc549f9ee701)

## Installation & Setup

### Prerequisites

- Node.js (v14 or later)
- npm
- API keys for mapping services (if applicable)

### Steps

1. **Clone the repository:**

   ```bash
   git clone https://github.com/craftingweb/Buildathon.git
   cd Buildathon
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   Create a `.env.local` file in the project root with the following variables:

   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=xxxxx
   ```

4. **Run the development server:**

   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000/`.

5. **Run the backend server:**

The repo is available at: [BuildathonBackend](https://github.com/chitangchin/BuildathonBackend)

## Project Structure

```
Buildathon/
├── app/                     # Application-specific configurations
├── components/              # Reusable UI components
├── hooks/                   # Custom React hooks
├── lib/                     # Library utilities
├── public/                  # Static assets
├── styles/                  # Styling files (CSS, Tailwind configurations)
├── types/                   # TypeScript type definitions
├── .gitignore               # Git ignore file
├── components.json          # (Specify the purpose of this file)
├── flatiron_building_.mp3   # Sample audio file
├── next.config.mjs          # Next.js configuration
├── package-lock.json        # Lockfile for npm
├── package.json             # Project dependencies and scripts
├── postcss.config.mjs       # PostCSS configuration
├── tailwind.config.js       # Tailwind CSS configuration
└── tsconfig.json            # TypeScript configuration
```

## API Integration

The frontend interacts with the backend Flask API to fetch route details and audio descriptions.

### Checking the health of the backend server

- **Endpoint:** `/health`
- **Method:** `GET`
- **Response:**

  ```json
  {
    "status": "healthy"
  }
  ```

### Fetching Location Information (Text Only)

- **Endpoint:** `/get-location-info`
- **Method:** `GET`
- **Query Parameters:**
  - `place`: Name of the location (e.g., `?place=Flatiron`)
- **Response:**

  ```json
  {
    "place": "Flatiron",
    "description": "Now approaching the Flatiron Building, an iconic triangular skyscraper..."
  }
  ```

### Fetching Points of Interest & Audio

- **Endpoint:** `/get-location-audio`
- **Method:** `GET`
- **Query Parameters:**
  - `place`: Name of the location (e.g., `?place=Flatiron`)
- **Response:** Returns an MP3 file for audio playback.

## Deployment

### Running in Production

1. **Build the project:**

   ```bash
   npm run build
   ```

2. **Start the production server:**

   ```bash
   npm start
   ```

   Ensure that the environment variables are set appropriately for production.

### Docker Deployment

1. **Create a `Dockerfile`:**

   (Provide the Dockerfile content if available)

2. **Build and run the Docker container:**

   ```bash
   docker build -t route-planner-frontend .
   docker run -p 3000:3000 route-planner-frontend
   ```

## Contributing

1. Fork the repository
2. Create a new feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

---
