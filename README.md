# ONTO-TRON-5000 - Ontology Mapping System

The ONTO-TRON-500 is a tool for mapping CSV data to ontologies using the Basic Formal Ontology and Common Core Ontologies.
By uploading a CSV file into the program, you will be able to build your ontologies right from your data. From the design patterns you create, you will be able to generate RDF and R2RML to upload right into the graph engine of your choice. You will also be able to generate Mermaid Syntax and further design your model on Mermiads live editor: https://mermaid.live/ Additionally, there is an ontology browser on the right-hand side for you to explore the hierarchy, understand terminology, and the applicability of object properties. Included here are instructions for installation, important things to keep in mind, and screenshots from the program. Stay tuned for updates. 

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

##Screenshots

<img width="1470" height="764" alt="correctmod" src="https://github.com/user-attachments/assets/655ca75b-7a30-4a0a-bf08-756b3aee06ca" />
<img width="488" height="764" alt="objectprop" src="https://github.com/user-attachments/assets/e95f3c97-f588-4672-8cac-919e478b3fbb" />
<img width="664" height="642" alt="mermaidsynt" src="https://github.com/user-attachments/assets/75ba8e41-d988-4e00-aad3-eaaf25e46395" />

## Ontology Files

The application includes:
- **BFO (Basic Formal Ontology)** - Upper-level ontology for general categories
- **CCO (Common Core Ontologies)** - Mid-level ontologies for common domain concepts

Both ontology files are included in the repository.

## Troubleshooting

**Docker Issues:**
- Try `docker-compose down` then `docker-compose up --build`
- Check port 5055 isn't already in use

**Manual Installation Issues:**
- Ensure Python 3.8+ and Node.js 16+ are installed
- Activate venv before running: `source .venv/bin/activate`
- If build fails, try: `rm -rf node_modules && npm install`
- Make sure both ontology files are present in root directory

**Browser Issues:**
If the ontology browser shows no classes or properties, verify that both ontology files are present in the root directory.
Make sure to check that port:5055 is not in use prior to running the application 
Check that flask is activated
Any further problems please create an issue 


## License

MIT

