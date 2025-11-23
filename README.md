# ONTO-TRON-5000 - Ontology Mapping System

A tool for mapping CSV data to ontologies using BFO and CCO.

## Prerequisites

### Option 1: Docker (Recommended - Easiest)
- [Docker Desktop](https://www.docker.com/products/docker-desktop) for Mac, Windows, or Linux

### Option 2: Manual Installation
- Python 3.8 or higher
- Node.js 16 or higher
- npm

## Installation & Running

### Option 1: Docker (Recommended)

1. **Clone the repository**
```bash
git clone https://github.com/Jlbillig/onto-tron-5000.git
cd onto-tron-5000
```

2. **Start the application**
```bash
docker-compose up
```

3. **Open in browser**
```
http://localhost:5055
```


**To rebuild after changes:** `docker-compose up --build`

---

### Option 2: Manual Installation

1. **Clone the repository**
```bash
git clone https://github.com/Jlbillig/onto-tron-5000.git
cd onto-tron-5000
```

2. **Set up Python environment**
```bash
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install flask flask-cors rdflib openpyxl
```

3. **Install Node dependencies and build frontend**
```bash
npm install
npm run build
```

4. **Run the application**
```bash
python3 app.py
```

5. **Open in browser**
```
http://127.0.0.1:5055
```

## Usage

1. **Upload CSV** - Click "Load CSV" to upload your data file
2. **Set Semantic Types** - Click "Set Type" on column headers to assign ontology classes
3. **Browse Ontology** - Use "Browse Ontology" to explore BFO and CCO classes and properties
4. **Create Relationships** - Drag from column headers or nodes to create relationships
5. **Choose Properties** - Select from Data Properties (for values) or Object Properties (for relationships)
6. **Generate Mappings** - Export as R2RML mappings or Mermaid diagrams
7. **Export RDF** - Generate RDF output in Turtle format

## Features

- **CSV Data Import** - Upload and visualize CSV data in an interactive table
- **Ontology Browser** - Browse BFO and CCO classes, object properties, and data properties
- **Visual Mapping Editor** - Drag-and-drop interface for creating ontology mappings
- **Dual Property Support** - Data properties for literal values, object properties for relationships
- **Smart Edge Directions** - Correct logical flow (e.g., Person → has_name → "John")
- **R2RML Generation** - Export mappings in R2RML format
- **RDF Export** - Generate RDF triples in Turtle format
- **Mermaid Diagrams** - Create visual documentation of your mappings

## Project Structure
```
onto-tron-5000/
├── app.py                          # Flask backend server
├── csvui/                          # React frontend application
│   ├── src/
│   │   └── App.jsx                # Main React component
│   ├── package.json               # Frontend dependencies
│   └── vite.config.js             # Build configuration
├── bfo-core.ttl                   # Basic Formal Ontology
├── CommonCoreOntologiesMerged.ttl # Common Core Ontologies
├── Dockerfile                     # Docker container configuration
├── docker-compose.yml             # Docker Compose configuration
├── requirements.txt               # Python dependencies
└── README.md                      # This file
```

## Ontology Files

The application includes:
- **BFO (Basic Formal Ontology)** - Upper-level ontology for general categories
- **CCO (Common Core Ontologies)** - Mid-level ontologies for common domain concepts

Both ontology files are included in the repository.

## Troubleshooting

**Docker Issues:**
- Make sure Docker Desktop is running
- Try `docker-compose down` then `docker-compose up --build`
- Check port 5055 isn't already in use

**Manual Installation Issues:**
- Ensure Python 3.8+ and Node.js 16+ are installed
- Activate virtual environment before running: `source .venv/bin/activate`
- If build fails, try: `rm -rf node_modules && npm install`
- Make sure both ontology files are present in root directory

**Browser Issues:**
- Clear browser cache and reload
- Try in incognito/private mode
- Check browser console for errors (F12 → Console tab)

## Contributing

Issues and pull requests are welcome! Please ensure Docker build succeeds before submitting.

## License

MIT

## Support

For questions or issues, please open an issue on GitHub.
