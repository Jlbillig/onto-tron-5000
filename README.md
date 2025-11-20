 ONTO-TRON-5000 
 
Welcome. The ONTO-TRON-500 is a tool for mapping CSV data to ontologies using the Basic Formal Ontology and Common Core Ontologies.
By uploading a CSV file into the program, you will be able to build your ontologies right from your data. From the design patterns you create, you will be able to generate RDF and R2RML to upload right into the graph engine of your choice. You will also be able to generate Mermaid Syntax
and further design your model on Mermiads live editor: https://mermaid.live/ Additionally, there is an ontology browser on the right-hand side for you to explore the hierarchy, understand terminology, and the applicability of object properties. below are instructions for installation and important things to keep in mind. Stay tuned for updates. 

#Prerequisits
- Python 3.8 or higher
- Node.js 16 or higher
- npm

# Installation

### 1. Clone the repository
```bash
git clone https://github.com/Jlbillig/onto-tron-5000.git
cd onto-tron-5000
```

### 2. Set up Python environment
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install flask flask-cors rdflib openpyxl
```

On Windows, use `.venv\Scripts\activate` instead of `source .venv/bin/activate`.

### 3. Install Node dependencies and build frontend
```bash
npm install
npm run build
```

### 4. Run the application
```bash
python3 app.py
```

Open http://127.0.0.1:5055 in your browser.


## Project Structure

- `app.py` - Flask backend server
- `csvui/` - React frontend application
- `bfo-core.ttl` - Basic Formal Ontology file
- `CommonCoreOntologiesMerged.ttl` - Common Core Ontologies file

## Troubleshooting

If the ontology browser shows no classes or properties, verify that both ontology files are present in the root directory.
Make sure to check that port:5055 is not in use prior to running the application 
Check that flask is activated
Any further problems please create an issue 

## License

MIT
