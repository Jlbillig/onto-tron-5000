print("[DEBUG] Running app from:", __file__)

from flask import Flask, request, jsonify, send_from_directory
from rdflib import Graph, Namespace, RDF, RDFS, OWL
from rdflib import URIRef, Literal 
from flask_cors import CORS
import os


# Flask initialization

app = Flask(__name__, static_folder="static", static_url_path="/static")
CORS(app)
os.makedirs("uploads", exist_ok=True)


# ontology references 

ONTOLOGY_DIR = os.path.dirname(__file__)
BFO_PATH = os.path.join(ONTOLOGY_DIR, "bfo-core.ttl")
CCO_PATH = os.path.join(ONTOLOGY_DIR, "CommonCoreOntologiesMerged.ttl")

graph = Graph()
try:
    graph.parse(BFO_PATH, format="turtle")
    graph.parse(CCO_PATH, format="turtle")
    print("[INFO] Ontologies loaded successfully.")
    print(f"[INFO] Total triples in graph: {len(graph)}")
except Exception as e:
    print(f"[WARN] Failed to load ontology: {e}")

# Namespaces
BFO = Namespace("http://purl.obolibrary.org/obo/BFO_")
CCO = Namespace("http://www.ontologyrepository.com/CommonCoreOntologies/")



# GLOBAL CACHE DISABLE

@app.after_request
def disable_cache(resp):
    resp.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    resp.headers["Pragma"] = "no-cache"
    resp.headers["Expires"] = "0"
    return resp


# ROUTES


@app.route("/static/<path:filename>")
def serve_static(filename):
    return send_from_directory("static", filename)

@app.route("/assets/<path:filename>")
def serve_assets(filename):
    return send_from_directory("static/dist/assets", filename)

@app.route('/')
def index():
    return send_from_directory("static/dist", "index.html")

# Classes endpoint

@app.route("/classes")
def get_classes():
    """Get all OWL classes with parent relationships"""
    print("[INFO] /classes endpoint called")
    
    classes = []
    parent_count = 0
    
    for cls in graph.subjects(RDF.type, OWL.Class):
        if isinstance(cls, URIRef):
            uri = str(cls)
            
            # Get label
            label = None
            for lbl in graph.objects(cls, RDFS.label):
                label = str(lbl)
                break
            
            # Get parent
            parent = None
            for sc in graph.objects(cls, RDFS.subClassOf):
                if isinstance(sc, URIRef):
                    parent = str(sc)
                    parent_count += 1
                    break
            
            classes.append({
                'uri': uri,
                'label': label or uri.split('/')[-1].split('#')[-1],
                'parent': parent
            })
    
    print(f"[INFO] Total classes: {len(classes)}, Classes with parents: {parent_count}")
    
    if parent_count > 0:
        sample = next(c for c in classes if c['parent'])
        print(f"[INFO] Sample: {sample['label']} -> {sample['parent']}")
    
    return jsonify(classes)

@app.route('/class_details')
def class_details():
    """Get detailed information about a specific class"""
    uri = request.args.get('uri')
    if not uri:
        return jsonify({'error': 'URI parameter required'}), 400
    
    print(f"[INFO] Fetching class details for: {uri}")
    
    try:
        uri_ref = URIRef(uri)
        details = {
            'uri': uri,
            'label': None,
            'definition': None,
            'parents': [],
            'equivalentClasses': [],
            'disjointWith': []
        }
        
        # Get label
        for label in graph.objects(uri_ref, RDFS.label):
            details['label'] = str(label)
            break
        
        # Get definition (try multiple predicates)
        definition_predicates = [
            URIRef("http://purl.obolibrary.org/obo/IAO_0000115"),  # IAO definition
            URIRef("http://www.w3.org/2004/02/skos/core#definition"),  # SKOS definition
            RDFS.comment,
            URIRef("http://purl.org/dc/terms/description")
        ]
        for pred in definition_predicates:
            for defn in graph.objects(uri_ref, pred):
                details['definition'] = str(defn)
                break
            if details['definition']:
                break
        
        # Get parent classes (superclasses) - only URIRefs
        for parent in graph.objects(uri_ref, RDFS.subClassOf):
            if isinstance(parent, URIRef):
                parent_label = None
                for lbl in graph.objects(parent, RDFS.label):
                    parent_label = str(lbl)
                    break
                details['parents'].append({
                    'uri': str(parent),
                    'label': parent_label or str(parent).split('/')[-1].split('#')[-1]
                })
        
        # Get equivalent classes
        OWL_equivalentClass = URIRef("http://www.w3.org/2002/07/owl#equivalentClass")
        for equiv in graph.objects(uri_ref, OWL_equivalentClass):
            if isinstance(equiv, URIRef):
                equiv_label = None
                for lbl in graph.objects(equiv, RDFS.label):
                    equiv_label = str(lbl)
                    break
                details['equivalentClasses'].append({
                    'uri': str(equiv),
                    'label': equiv_label or str(equiv).split('/')[-1].split('#')[-1]
                })
        
        # Get disjoint classes
        OWL_disjointWith = URIRef("http://www.w3.org/2002/07/owl#disjointWith")
        for disj in graph.objects(uri_ref, OWL_disjointWith):
            if isinstance(disj, URIRef):
                disj_label = None
                for lbl in graph.objects(disj, RDFS.label):
                    disj_label = str(lbl)
                    break
                details['disjointWith'].append({
                    'uri': str(disj),
                    'label': disj_label or str(disj).split('/')[-1].split('#')[-1]
                })
        
        print(f"[INFO] Returning class details with {len(details['parents'])} parents, definition: {bool(details['definition'])}")
        return jsonify(details)
    
    except Exception as e:
        print(f"[ERROR] Failed to fetch class details: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# PROPERTY DETAILS ENDPOINT
# ───────────────────────────────────────────────
@app.route('/property_details')
def property_details():
    """Get detailed information about a specific object property"""
    uri = request.args.get('uri')
    if not uri:
        return jsonify({'error': 'URI parameter required'}), 400
    
    print(f"[INFO] Fetching property details for: {uri}")
    
    try:
        uri_ref = URIRef(uri)
        details = {
            'uri': uri,
            'label': None,
            'definition': None,
            'domain': [],
            'range': [],
            'inverse': []
        }
        
        # Get label
        for label in graph.objects(uri_ref, RDFS.label):
            details['label'] = str(label)
            break
        
        # Get definition
        definition_predicates = [
            URIRef("http://purl.obolibrary.org/obo/IAO_0000115"),
            URIRef("http://www.w3.org/2004/02/skos/core#definition"),
            RDFS.comment,
            URIRef("http://purl.org/dc/terms/description")
        ]
        for pred in definition_predicates:
            for defn in graph.objects(uri_ref, pred):
                details['definition'] = str(defn)
                break
            if details['definition']:
                break
        
        # Get domain
        for domain in graph.objects(uri_ref, RDFS.domain):
            if isinstance(domain, URIRef):
                domain_label = None
                for lbl in graph.objects(domain, RDFS.label):
                    domain_label = str(lbl)
                    break
                details['domain'].append({
                    'uri': str(domain),
                    'label': domain_label or str(domain).split('/')[-1].split('#')[-1]
                })
        
        # Get range
        for rng in graph.objects(uri_ref, RDFS.range):
            if isinstance(rng, URIRef):
                range_label = None
                for lbl in graph.objects(rng, RDFS.label):
                    range_label = str(lbl)
                    break
                details['range'].append({
                    'uri': str(rng),
                    'label': range_label or str(rng).split('/')[-1].split('#')[-1]
                })
        
        # Get inverse properties
        OWL_inverseOf = URIRef("http://www.w3.org/2002/07/owl#inverseOf")
        for inv in graph.objects(uri_ref, OWL_inverseOf):
            if isinstance(inv, URIRef):
                inv_label = None
                for lbl in graph.objects(inv, RDFS.label):
                    inv_label = str(lbl)
                    break
                details['inverse'].append({
                    'uri': str(inv),
                    'label': inv_label or str(inv).split('/')[-1].split('#')[-1]
                })
        
        # Also check reverse direction (if this property is inverse of something)
        for subj in graph.subjects(OWL_inverseOf, uri_ref):
            if isinstance(subj, URIRef):
                inv_label = None
                for lbl in graph.objects(subj, RDFS.label):
                    inv_label = str(lbl)
                    break
                details['inverse'].append({
                    'uri': str(subj),
                    'label': inv_label or str(subj).split('/')[-1].split('#')[-1]
                })
        
        print(f"[INFO] Returning property details")
        return jsonify(details)
    
    except Exception as e:
        print(f"[ERROR] Failed to fetch property details: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# OTHER ENDPOINTS


@app.route("/upload", methods=["POST"])
def upload_csv():
    file = request.files["file"]
    path = os.path.join("uploads", file.filename)
    file.save(path)
    return jsonify({"message": f"{file.filename} received"})

@app.route("/object_properties")
def object_properties():
    """Get all object properties with parent relationships"""
    print("[INFO] /object_properties endpoint called")
    
    props = []
    parent_count = 0
    
    for prop in graph.subjects(RDF.type, OWL.ObjectProperty):
        if isinstance(prop, URIRef):
            uri = str(prop)
            
            # Get label
            label = None
            for lbl in graph.objects(prop, RDFS.label):
                label = str(lbl)
                break
            
            # Get parent property
            parent = None
            for sp in graph.objects(prop, RDFS.subPropertyOf):
                if isinstance(sp, URIRef):
                    parent = str(sp)
                    parent_count += 1
                    break
            
            props.append({
                'uri': uri,
                'label': label or uri.split('/')[-1].split('#')[-1],
                'parent': parent
            })
    
    print(f"[INFO] Total properties: {len(props)}, With parents: {parent_count}")
    
    if parent_count > 0:
        sample = next(p for p in props if p['parent'])
        print(f"[INFO] Sample property: {sample['label']} -> {sample['parent']}")
    
    return jsonify(props)

@app.route("/data_properties")
def data_properties():
    """Get all data properties with parent relationships, domain, and range"""
    print("[INFO] /data_properties endpoint called")
    
    props = []
    parent_count = 0
    
    for prop in graph.subjects(RDF.type, OWL.DatatypeProperty):
        if isinstance(prop, URIRef):
            uri = str(prop)
            
            # Get label
            label = None
            for lbl in graph.objects(prop, RDFS.label):
                label = str(lbl)
                break
            
            # Get parent property
            parent = None
            for sp in graph.objects(prop, RDFS.subPropertyOf):
                if isinstance(sp, URIRef):
                    parent = str(sp)
                    parent_count += 1
                    break
            
            # Get domain (classes this property can be used with)
            domains = []
            for dom in graph.objects(prop, RDFS.domain):
                if isinstance(dom, URIRef):
                    domains.append(str(dom))
            
            # Get range (datatype like xsd:string, xsd:integer)
            ranges = []
            for rng in graph.objects(prop, RDFS.range):
                if isinstance(rng, URIRef):
                    ranges.append(str(rng))
            
            props.append({
                'uri': uri,
                'label': label or uri.split('/')[-1].split('#')[-1],
                'parent': parent,
                'domain': domains,
                'range': ranges
            })
    
    print(f"[INFO] Total data properties: {len(props)}, With parents: {parent_count}")
    
    return jsonify(props)

@app.route("/ontology_search")
def ontology_search():
    term = request.args.get("term", "").lower()
    results = []
    for s in graph.subjects(RDF.type, OWL.Class):
        label = next(graph.objects(s, RDFS.label), None)
        if not label:
            continue
        if term in str(label).lower():
            results.append({"uri": str(s), "label": str(label)})
        if len(results) > 25:
            break
    return jsonify(results)

@app.route("/validate_property", methods=["POST"])
def validate_property():
    data = request.get_json(force=True)
    prop = data.get("property")
    domain = data.get("domain")
    range_ = data.get("range")

    print(f"[DEBUG] validate_property called → prop={prop}, domain={domain}, range_={range_}")

    valid = True if prop else False
    return jsonify({"valid": valid}), 200


# R2RML GENERATOR

@app.route("/generate_r2rml", methods=["POST"])
def generate_r2rml():
    data = request.get_json(force=True)
    nodes = data.get("nodes", [])
    edges = data.get("edges", [])
    header_links = data.get("headerLinks", [])
    mappings = data.get("mappings", {})

    ttl = [
        "@prefix rr: <http://www.w3.org/ns/r2rml#> .",
        "@prefix ex: <http://example.org/> .",
        "",
    ]

    # TriplesMaps for nodes
    for n in nodes:
        node_id = n["id"]
        label = n.get("label", node_id)
        uri = n.get("uri", f"http://example.org/{label}")
        ttl.append(f"ex:TriplesMap_{node_id} a rr:TriplesMap ;")
        ttl.append('  rr:logicalTable [ rr:tableName "UploadedCSV" ];')
        ttl.append(f'  rr:subjectMap [ rr:template "http://example.org/resource/{{{label}}}" ;')
        ttl.append(f"                  rr:class <{uri}> ] .\n")

    # Object property relationships
    for e in edges:
        src = e.get("source")
        tgt = e.get("target")
        prop_uri = e.get("propertyUri") or "http://www.w3.org/1999/02/22-rdf-syntax-ns#relatedTo"
        if not src or not tgt:
            continue
        ttl.append(f"# Relationship between {src} and {tgt}")
        ttl.append(f"<{prop_uri}> a rr:ObjectMap ;")
        ttl.append(f"  rr:parentTriplesMap ex:TriplesMap_{tgt} .\n")

    for hl in header_links:
        ttl.append(f"# Header link: {hl.get('header')}")
        p_uri = hl.get("propertyUri") or "http://example.org/relatedTo"
        ttl.append(f"<{p_uri}> a rr:ObjectMap .\n")

    return "\n".join(ttl), 200, {"Content-Type": "text/turtle; charset=utf-8"}


# RDF GENERATOR

@app.route("/generate_rdf", methods=["POST"])
def generate_rdf():
    data = request.get_json(force=True)
    nodes = data.get("nodes", [])
    edges = data.get("edges", [])
    
    ttl = [
        "@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .",
        "@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .",
        "@prefix ex: <http://example.org/> .",
        "",
    ]
    
    # Generate triples for nodes
    for node in nodes:
        node_uri = node.get('uri', f"http://example.org/{node['id']}")
        ttl.append(f"<{node_uri}> a rdf:Resource ;")
        ttl.append(f'    rdfs:label "{node.get("label", node["id"])}" .')
        ttl.append("")
    
    # Generate triples for edges
    for edge in edges:
        source_node = next((n for n in nodes if n['id'] == edge['source']), None)
        target_node = next((n for n in nodes if n['id'] == edge['target']), None)
        
        if source_node and target_node:
            source_uri = source_node.get('uri', f"http://example.org/{edge['source']}")
            target_uri = target_node.get('uri', f"http://example.org/{edge['target']}")
            prop_uri = edge.get('propertyUri', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#relatedTo')
            
            ttl.append(f"<{source_uri}> <{prop_uri}> <{target_uri}> .")
    
    return "\n".join(ttl), 200, {"Content-Type": "text/turtle; charset=utf-8"}

@app.route("/generate_mermaid", methods=["POST"])
def generate_mermaid():
    """Generate Mermaid diagram syntax from the current model"""
    data = request.get_json(force=True)
    nodes = data.get("nodes", [])
    edges = data.get("edges", [])
    header_links = data.get("headerLinks", [])
    
    # Track class counts for disambiguation
    class_counts = {}
    node_ids = {}
    
    mermaid_lines = ["graph TD"]
    
    # Process regular nodes (not anchor nodes)
    for node in nodes:
        if node.get('id', '').startswith('anchor-'):
            continue
            
        node_data = node.get('data', {})
        label = node_data.get('label', node.get('id', 'Unknown'))
        
        # Create unique ID for this node
        base_id = ''.join([c for c in label if c.isalnum()])[:3].upper()
        if not base_id:
            base_id = "NODE"
        
        if base_id not in class_counts:
            class_counts[base_id] = 0
        class_counts[base_id] += 1
        
        unique_id = f"{base_id}{class_counts[base_id]}"
        node_ids[node['id']] = unique_id
        
        # Add node to diagram
        mermaid_lines.append(f'    {unique_id}["{label}"]')
    
    # Process header links (columns with semantic types)
    for hl in header_links:
        header = hl.get('header', '')
        target_id = hl.get('target', '')
        property_label = hl.get('propertyLabel', 'has semantic type')
        
        if target_id in node_ids:
            # Get the target node's label
            target_node = next((n for n in nodes if n.get('id') == target_id), None)
            target_label = target_node.get('data', {}).get('label', 'Unknown') if target_node else 'Unknown'
            
            # Create column node with semantic type in label
            col_id = header.replace(' ', '_').replace(':', '').upper() + "_COL"
            mermaid_lines.append(f'    {col_id}["Column: {header}<br/>Type: {target_label}"]')
            
            # Link column to its semantic type
            mermaid_lines.append(f'    {col_id} -->|{property_label}| {node_ids[target_id]}')
    
    # Process edges between nodes
    for edge in edges:
        source_id = edge.get('source', '')
        target_id = edge.get('target', '')
        edge_data = edge.get('data', {})
        property_label = edge_data.get('label', edge.get('label', 'related to'))
        
        if source_id in node_ids and target_id in node_ids:
            mermaid_lines.append(f'    {node_ids[source_id]} -->|{property_label}| {node_ids[target_id]}')
    
    mermaid_syntax = '\n'.join(mermaid_lines)
    
    return jsonify({
        'mermaid': mermaid_syntax,
        'success': True
    })


# ENTRY POINT

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5055, debug=True)
